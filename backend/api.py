"""
Flask API Backend for Attendance Processing System
Provides REST API endpoints for the React frontend.
Uses JWT authentication and MongoDB for data storage.
"""

from flask import Flask, request, jsonify, send_file, g
from flask_cors import CORS
from attendance_processor import AttendanceProcessor
from database import init_db, get_db
from auth import jwt_required, register_user, login_user, get_user_profile
import os
import json
import tempfile
from datetime import datetime
import pandas as pd
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

init_db()

ALLOWED_ORIGINS = [
    "https://biometric-blackhole.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

CORS(app,
     resources={r"/api/*": {"origins": ALLOWED_ORIGINS}},
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     max_age=3600)

UPLOAD_FOLDER = tempfile.mkdtemp()
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------

@app.route('/api/auth/register', methods=['POST'])
def api_register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    result, error = register_user(
        email=data.get('email', ''),
        password=data.get('password', ''),
        full_name=data.get('full_name', ''),
        role=data.get('role', 'employee'),
    )
    if error:
        return jsonify({'error': error}), 400
    return jsonify(result), 201


@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    result, error = login_user(
        email=data.get('email', ''),
        password=data.get('password', ''),
    )
    if error:
        return jsonify({'error': error}), 401
    return jsonify(result)


@app.route('/api/auth/me', methods=['GET'])
@jwt_required
def api_me():
    profile = get_user_profile(g.user_id)
    if not profile:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': profile})

# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "API is running"})

# ---------------------------------------------------------------------------
# Attendance processing (existing endpoints, now JWT-protected)
# ---------------------------------------------------------------------------

@app.route('/api/process', methods=['POST'])
@jwt_required
def process_attendance():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        year = int(request.form.get('year', datetime.now().year))
        month = int(request.form.get('month', datetime.now().month))
        max_hours = float(request.form.get('max_hours', 8.0))

        selected_dates_str = request.form.get('selected_dates', '[]')
        try:
            selected_dates = json.loads(selected_dates_str) if selected_dates_str else []
        except Exception:
            selected_dates = []

        logger.info(f"Processing file: {file.filename}, Year: {year}, Month: {month}, Max Hours: {max_hours}")

        temp_input = os.path.join(UPLOAD_FOLDER, f"input_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx")
        file.save(temp_input)

        processor = AttendanceProcessor(max_hours_per_day=max_hours)
        temp_output = os.path.join(UPLOAD_FOLDER, f"output_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx")

        daily_report, monthly_summary = processor.process(
            input_file=temp_input,
            output_file=temp_output,
            year=year,
            month=month,
            max_hours=max_hours,
            selected_dates=selected_dates
        )

        daily_report_json = daily_report.to_dict('records')
        monthly_summary_json = monthly_summary.to_dict('records')

        total_hours = monthly_summary['total_hours'].sum()
        total_employees = len(monthly_summary)
        total_records = len(daily_report)
        present_days = monthly_summary['present_days'].sum()
        absent_days = monthly_summary['absent_days'].sum()
        auto_assigned_days = monthly_summary['auto_assigned_days'].sum()

        if os.path.exists(temp_input):
            os.remove(temp_input)

        return jsonify({
            "success": True,
            "daily_report": daily_report_json,
            "monthly_summary": monthly_summary_json,
            "statistics": {
                "total_hours": float(total_hours),
                "total_employees": total_employees,
                "total_records": total_records,
                "present_days": int(present_days),
                "absent_days": int(absent_days),
                "auto_assigned_days": int(auto_assigned_days),
                "avg_hours_per_employee": float(monthly_summary['total_hours'].mean()),
                "avg_present_days": float(monthly_summary['present_days'].mean())
            },
            "output_file": temp_output,
            "year": year,
            "month": month
        })

    except Exception as e:
        logger.error(f"Error processing file: {str(e)}", exc_info=True)
        if 'temp_input' in locals() and os.path.exists(temp_input):
            os.remove(temp_input)
        return jsonify({"error": str(e)}), 500


@app.route('/api/download', methods=['GET'])
def download_file():
    try:
        filename = request.args.get('filename')
        if not filename:
            return jsonify({"error": "Filename parameter required"}), 400

        filename = os.path.basename(filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)

        if os.path.exists(file_path):
            return send_file(
                file_path,
                as_attachment=True,
                download_name=f"Attendance_Report_{datetime.now().strftime('%Y%m%d')}.xlsx",
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
        return jsonify({"error": "File not found"}), 404
    except Exception as e:
        logger.error(f"Error downloading file: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/statistics', methods=['POST'])
def get_statistics():
    try:
        data = request.json
        daily_report = pd.DataFrame(data.get('daily_report', []))
        monthly_summary = pd.DataFrame(data.get('monthly_summary', []))

        if daily_report.empty or monthly_summary.empty:
            return jsonify({"error": "No data provided"}), 400

        stats = {
            "top_performer": monthly_summary.loc[monthly_summary['total_hours'].idxmax()].to_dict(),
            "attendance_rate": float((monthly_summary['present_days'].sum() /
                                     (monthly_summary['present_days'].sum() + monthly_summary['absent_days'].sum())) * 100),
            "hours_distribution": {
                "min": float(monthly_summary['total_hours'].min()),
                "max": float(monthly_summary['total_hours'].max()),
                "mean": float(monthly_summary['total_hours'].mean()),
                "median": float(monthly_summary['total_hours'].median())
            }
        }
        return jsonify(stats)
    except Exception as e:
        logger.error(f"Error calculating statistics: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ---------------------------------------------------------------------------
# Data CRUD endpoints (MongoDB)
# ---------------------------------------------------------------------------

# --- Attendance Reports ---

@app.route('/api/data/attendance-reports', methods=['POST'])
@jwt_required
def save_attendance_report():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    db = get_db()
    now = datetime.utcnow().isoformat()

    db.attendance_reports.update_one(
        {'user_id': g.user_id, 'year': data.get('year'), 'month': data.get('month')},
        {'$set': {
            'daily_report': data.get('daily_report', []),
            'monthly_summary': data.get('monthly_summary', []),
            'statistics': data.get('statistics', {}),
            'output_file': data.get('output_file'),
            'updated_at': now,
        },
         '$setOnInsert': {
            'user_id': g.user_id,
            'year': data.get('year'),
            'month': data.get('month'),
            'created_at': now,
        }},
        upsert=True,
    )
    return jsonify({'success': True})


@app.route('/api/data/attendance-reports', methods=['GET'])
@jwt_required
def get_attendance_report():
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)

    db = get_db()

    if year and month:
        doc = db.attendance_reports.find_one(
            {'user_id': g.user_id, 'year': year, 'month': month}
        )
        if not doc:
            return jsonify(None)
        return jsonify(_report_doc_to_dict(doc))
    else:
        docs = db.attendance_reports.find(
            {'user_id': g.user_id}
        ).sort('updated_at', -1)
        return jsonify([_report_doc_to_dict(d) for d in docs])


@app.route('/api/data/last-process-result', methods=['GET'])
@jwt_required
def get_last_process_result():
    db = get_db()
    doc = db.attendance_reports.find_one(
        {'user_id': g.user_id},
        sort=[('updated_at', -1)],
    )
    if not doc:
        return jsonify(None)
    return jsonify({
        'daily_report': doc.get('daily_report', []),
        'monthly_summary': doc.get('monthly_summary', []),
        'statistics': doc.get('statistics', {}),
        'year': doc.get('year'),
        'month': doc.get('month'),
    })


def _report_doc_to_dict(doc):
    return {
        'id': str(doc['_id']),
        'user_id': doc['user_id'],
        'year': doc.get('year'),
        'month': doc.get('month'),
        'daily_report': doc.get('daily_report', []),
        'monthly_summary': doc.get('monthly_summary', []),
        'statistics': doc.get('statistics', {}),
        'output_file': doc.get('output_file'),
        'created_at': doc.get('created_at', ''),
        'updated_at': doc.get('updated_at', ''),
    }

# --- Manual Users ---

@app.route('/api/data/manual-users', methods=['GET'])
@jwt_required
def get_manual_users():
    db = get_db()
    docs = db.manual_users.find({'user_id': g.user_id}).sort('created_at', 1)

    result = []
    for doc in docs:
        total_hours = doc.get('total_hours', 0) or 0
        if isinstance(total_hours, (int, float)):
            hours = int(total_hours)
            minutes = round((total_hours - hours) * 60)
            total_hours_str = f"{hours}:{str(minutes).zfill(2)}"
        else:
            total_hours_str = str(total_hours)

        result.append({
            'id': str(doc['_id']),
            'employee_id': doc.get('employee_id'),
            'employee_name': doc.get('employee_name', ''),
            'total_hours': total_hours_str,
            'hour_rate': doc.get('hour_rate'),
            'present_days': doc.get('present_days', 0),
            'absent_days': doc.get('absent_days', 0),
            'auto_assigned_days': doc.get('auto_assigned_days', 0),
            'daily_records': doc.get('daily_records', []),
            'is_manual': True,
        })
    return jsonify(result)


@app.route('/api/data/manual-users', methods=['POST'])
@jwt_required
def save_manual_users():
    users = request.get_json()
    if users is None:
        return jsonify({'error': 'No data provided'}), 400

    db = get_db()
    db.manual_users.delete_many({'user_id': g.user_id})

    now = datetime.utcnow().isoformat()
    for u in users:
        th = u.get('total_hours', 0)
        if isinstance(th, str):
            th = float(th.replace(':', '.')) if th else 0

        db.manual_users.insert_one({
            'user_id': g.user_id,
            'employee_id': u.get('employee_id'),
            'employee_name': u.get('employee_name', ''),
            'total_hours': th,
            'hour_rate': float(u['hour_rate']) if u.get('hour_rate') else None,
            'present_days': u.get('present_days', 0),
            'absent_days': u.get('absent_days', 0),
            'auto_assigned_days': u.get('auto_assigned_days', 0),
            'daily_records': u.get('daily_records', []),
            'created_at': now,
            'updated_at': now,
        })
    return jsonify({'success': True})

# --- Manual User Daily Records ---

@app.route('/api/data/manual-user-daily-records', methods=['GET'])
@jwt_required
def get_manual_user_daily_records():
    db = get_db()
    docs = db.manual_users.find(
        {'user_id': g.user_id},
        {'employee_id': 1, 'daily_records': 1}
    )
    result = {}
    for doc in docs:
        emp_id = str(doc.get('employee_id', ''))
        records = doc.get('daily_records', [])
        result[emp_id] = records if isinstance(records, list) else []
    return jsonify(result)


@app.route('/api/data/manual-user-daily-records', methods=['POST'])
@jwt_required
def save_manual_user_daily_records():
    daily_records = request.get_json()
    if daily_records is None:
        return jsonify({'error': 'No data provided'}), 400

    db = get_db()
    now = datetime.utcnow().isoformat()

    for emp_id_str, records in daily_records.items():
        try:
            emp_id_num = int(emp_id_str)
        except ValueError:
            emp_id_num = emp_id_str

        db.manual_users.update_one(
            {'user_id': g.user_id, '$or': [
                {'employee_id': emp_id_num},
                {'employee_id': emp_id_str},
            ]},
            {'$set': {'daily_records': records, 'updated_at': now}},
        )
    return jsonify({'success': True})

# --- Finalized Salaries ---

@app.route('/api/data/finalized-salaries', methods=['GET'])
@jwt_required
def get_finalized_salaries():
    db = get_db()
    docs = db.finalized_salaries.find(
        {'user_id': g.user_id}
    ).sort('finalized_at', -1)

    result = {}
    for doc in docs:
        result[doc['month_key']] = {
            'month': doc.get('month'),
            'year': doc.get('year'),
            'finalized_at': doc.get('finalized_at'),
            'employees': doc.get('employees', []),
            'total_salary': doc.get('total_salary', 0),
        }
    return jsonify(result)


@app.route('/api/data/finalized-salaries', methods=['POST'])
@jwt_required
def save_finalized_salaries():
    data = request.get_json()
    if data is None:
        return jsonify({'error': 'No data provided'}), 400

    db = get_db()
    db.finalized_salaries.delete_many({'user_id': g.user_id})

    now = datetime.utcnow().isoformat()
    for month_key, info in data.items():
        db.finalized_salaries.insert_one({
            'user_id': g.user_id,
            'month_key': month_key,
            'month': info.get('month'),
            'year': info.get('year'),
            'employees': info.get('employees', []),
            'total_salary': info.get('total_salary', 0),
            'finalized_at': info.get('finalized_at'),
            'created_at': now,
        })
    return jsonify({'success': True})

# --- Confirmed Salaries ---

@app.route('/api/data/confirmed-salaries', methods=['GET'])
@jwt_required
def get_confirmed_salaries():
    db = get_db()
    docs = db.confirmed_salaries.find(
        {'user_id': g.user_id}
    ).sort('confirmed_at', -1)

    return jsonify([{
        'employee_id': d.get('employee_id'),
        'employee_name': d.get('employee_name'),
        'total_hours': d.get('total_hours'),
        'hour_rate': d.get('hour_rate'),
        'salary': d.get('salary'),
        'confirmed_at': d.get('confirmed_at'),
    } for d in docs])


@app.route('/api/data/confirmed-salaries', methods=['POST'])
@jwt_required
def save_confirmed_salaries():
    salaries = request.get_json()
    if salaries is None:
        return jsonify({'error': 'No data provided'}), 400

    db = get_db()
    db.confirmed_salaries.delete_many({'user_id': g.user_id})

    now = datetime.utcnow().isoformat()
    for s in salaries:
        db.confirmed_salaries.insert_one({
            'user_id': g.user_id,
            'employee_id': s.get('employee_id'),
            'employee_name': s.get('employee_name'),
            'total_hours': s.get('total_hours'),
            'hour_rate': s.get('hour_rate'),
            'salary': s.get('salary'),
            'confirmed_at': s.get('confirmed_at', now),
            'created_at': now,
        })
    return jsonify({'success': True})

# --- Hour Rates ---

@app.route('/api/data/hour-rates', methods=['GET'])
@jwt_required
def get_hour_rates():
    db = get_db()
    docs = db.hour_rates.find({'user_id': g.user_id})

    result = {}
    for d in docs:
        result[str(d['employee_id'])] = d['hour_rate']
    return jsonify(result)


@app.route('/api/data/hour-rates', methods=['POST'])
@jwt_required
def save_hour_rates():
    rates = request.get_json()
    if rates is None:
        return jsonify({'error': 'No data provided'}), 400

    db = get_db()
    now = datetime.utcnow().isoformat()

    for emp_id_str, rate in rates.items():
        db.hour_rates.update_one(
            {'user_id': g.user_id, 'employee_id': int(emp_id_str)},
            {'$set': {
                'hour_rate': float(rate),
                'updated_at': now,
            },
             '$setOnInsert': {
                'user_id': g.user_id,
                'employee_id': int(emp_id_str),
                'created_at': now,
            }},
            upsert=True,
        )
    return jsonify({'success': True})


# --- Clear all user data (used when uploading a new file) ---

@app.route('/api/data/clear-all', methods=['POST'])
@jwt_required
def clear_all_user_data():
    db = get_db()
    db.attendance_reports.delete_many({'user_id': g.user_id})
    db.manual_users.delete_many({'user_id': g.user_id})
    db.confirmed_salaries.delete_many({'user_id': g.user_id})
    db.finalized_salaries.delete_many({'user_id': g.user_id})
    db.hour_rates.delete_many({'user_id': g.user_id})
    return jsonify({'success': True})

# ---------------------------------------------------------------------------

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug, port=port, host='0.0.0.0')
