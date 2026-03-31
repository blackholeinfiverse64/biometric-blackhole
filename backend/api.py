"""
Flask API Backend for Attendance Processing System
Provides REST API endpoints for the React frontend.
Uses JWT authentication and SQLite for data storage.
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
     resources={
         r"/api/*": {
             "origins": ALLOWED_ORIGINS,
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
             "supports_credentials": False
         }
     })

@app.after_request
def after_request(response):
    if request.path.startswith('/api/'):
        origin = request.headers.get('Origin')
        if origin in ALLOWED_ORIGINS:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Max-Age'] = '3600'
    return response

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

@app.route('/api/process', methods=['OPTIONS'])
def process_attendance_options():
    response = jsonify({})
    origin = request.headers.get('Origin')
    if origin in ALLOWED_ORIGINS:
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        response.headers.add('Access-Control-Max-Age', '3600')
    return response


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


@app.route('/api/download', methods=['OPTIONS'])
def download_file_options():
    response = jsonify({})
    origin = request.headers.get('Origin')
    if origin in ALLOWED_ORIGINS:
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Max-Age', '3600')
    return response


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
# Data CRUD endpoints (replace Supabase client-side queries)
# ---------------------------------------------------------------------------

# --- Attendance Reports ---

@app.route('/api/data/attendance-reports', methods=['POST'])
@jwt_required
def save_attendance_report():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    db = get_db()
    try:
        db.execute("""
            INSERT INTO attendance_reports (user_id, year, month, daily_report, monthly_summary, statistics, output_file, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, year, month) DO UPDATE SET
                daily_report=excluded.daily_report,
                monthly_summary=excluded.monthly_summary,
                statistics=excluded.statistics,
                output_file=excluded.output_file,
                updated_at=excluded.updated_at
        """, (
            g.user_id,
            data.get('year'),
            data.get('month'),
            json.dumps(data.get('daily_report', [])),
            json.dumps(data.get('monthly_summary', [])),
            json.dumps(data.get('statistics', {})),
            data.get('output_file'),
            datetime.utcnow().isoformat(),
        ))
        db.commit()
        return jsonify({'success': True})
    finally:
        db.close()


@app.route('/api/data/attendance-reports', methods=['GET'])
@jwt_required
def get_attendance_report():
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)

    db = get_db()
    try:
        if year and month:
            row = db.execute(
                'SELECT * FROM attendance_reports WHERE user_id=? AND year=? AND month=?',
                (g.user_id, year, month)
            ).fetchone()
            if not row:
                return jsonify(None)
            return jsonify(_report_row_to_dict(row))
        else:
            rows = db.execute(
                'SELECT * FROM attendance_reports WHERE user_id=? ORDER BY updated_at DESC',
                (g.user_id,)
            ).fetchall()
            return jsonify([_report_row_to_dict(r) for r in rows])
    finally:
        db.close()


@app.route('/api/data/last-process-result', methods=['GET'])
@jwt_required
def get_last_process_result():
    db = get_db()
    try:
        row = db.execute(
            'SELECT * FROM attendance_reports WHERE user_id=? ORDER BY updated_at DESC LIMIT 1',
            (g.user_id,)
        ).fetchone()
        if not row:
            return jsonify(None)
        return jsonify({
            'daily_report': json.loads(row['daily_report'] or '[]'),
            'monthly_summary': json.loads(row['monthly_summary'] or '[]'),
            'statistics': json.loads(row['statistics'] or '{}'),
            'year': row['year'],
            'month': row['month'],
        })
    finally:
        db.close()


def _report_row_to_dict(row):
    return {
        'id': row['id'],
        'user_id': row['user_id'],
        'year': row['year'],
        'month': row['month'],
        'daily_report': json.loads(row['daily_report'] or '[]'),
        'monthly_summary': json.loads(row['monthly_summary'] or '[]'),
        'statistics': json.loads(row['statistics'] or '{}'),
        'output_file': row['output_file'],
        'created_at': row['created_at'],
        'updated_at': row['updated_at'],
    }

# --- Manual Users ---

@app.route('/api/data/manual-users', methods=['GET'])
@jwt_required
def get_manual_users():
    db = get_db()
    try:
        rows = db.execute(
            'SELECT * FROM manual_users WHERE user_id=? ORDER BY created_at ASC',
            (g.user_id,)
        ).fetchall()

        result = []
        for row in rows:
            total_hours = row['total_hours'] or 0
            if isinstance(total_hours, (int, float)):
                hours = int(total_hours)
                minutes = round((total_hours - hours) * 60)
                total_hours_str = f"{hours}:{str(minutes).zfill(2)}"
            else:
                total_hours_str = str(total_hours)

            result.append({
                'id': row['id'],
                'employee_id': row['employee_id'],
                'employee_name': row['employee_name'],
                'total_hours': total_hours_str,
                'hour_rate': row['hour_rate'],
                'present_days': row['present_days'],
                'absent_days': row['absent_days'],
                'auto_assigned_days': row['auto_assigned_days'],
                'daily_records': json.loads(row['daily_records'] or '[]'),
                'is_manual': True,
            })
        return jsonify(result)
    finally:
        db.close()


@app.route('/api/data/manual-users', methods=['POST'])
@jwt_required
def save_manual_users():
    users = request.get_json()
    if users is None:
        return jsonify({'error': 'No data provided'}), 400

    db = get_db()
    try:
        db.execute('DELETE FROM manual_users WHERE user_id=?', (g.user_id,))

        for u in users:
            th = u.get('total_hours', 0)
            if isinstance(th, str):
                th = float(th.replace(':', '.')) if th else 0
            db.execute("""
                INSERT INTO manual_users
                    (user_id, employee_id, employee_name, total_hours, hour_rate, present_days, absent_days, auto_assigned_days, daily_records)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                g.user_id,
                u.get('employee_id'),
                u.get('employee_name', ''),
                th,
                float(u['hour_rate']) if u.get('hour_rate') else None,
                u.get('present_days', 0),
                u.get('absent_days', 0),
                u.get('auto_assigned_days', 0),
                json.dumps(u.get('daily_records', [])),
            ))
        db.commit()
        return jsonify({'success': True})
    finally:
        db.close()

# --- Manual User Daily Records ---

@app.route('/api/data/manual-user-daily-records', methods=['GET'])
@jwt_required
def get_manual_user_daily_records():
    db = get_db()
    try:
        rows = db.execute(
            'SELECT employee_id, daily_records FROM manual_users WHERE user_id=?',
            (g.user_id,)
        ).fetchall()
        result = {}
        for row in rows:
            emp_id = str(row['employee_id'])
            records = json.loads(row['daily_records'] or '[]')
            result[emp_id] = records if isinstance(records, list) else []
        return jsonify(result)
    finally:
        db.close()


@app.route('/api/data/manual-user-daily-records', methods=['POST'])
@jwt_required
def save_manual_user_daily_records():
    daily_records = request.get_json()
    if daily_records is None:
        return jsonify({'error': 'No data provided'}), 400

    db = get_db()
    try:
        manual_users = db.execute(
            'SELECT id, employee_id FROM manual_users WHERE user_id=?',
            (g.user_id,)
        ).fetchall()

        for emp_id_str, records in daily_records.items():
            emp_id_num = int(emp_id_str)
            mu = next(
                (m for m in manual_users if m['employee_id'] == emp_id_num or str(m['employee_id']) == emp_id_str),
                None
            )
            if mu:
                db.execute(
                    'UPDATE manual_users SET daily_records=?, updated_at=? WHERE id=?',
                    (json.dumps(records), datetime.utcnow().isoformat(), mu['id'])
                )
        db.commit()
        return jsonify({'success': True})
    finally:
        db.close()

# --- Finalized Salaries ---

@app.route('/api/data/finalized-salaries', methods=['GET'])
@jwt_required
def get_finalized_salaries():
    db = get_db()
    try:
        rows = db.execute(
            'SELECT * FROM finalized_salaries WHERE user_id=? ORDER BY finalized_at DESC',
            (g.user_id,)
        ).fetchall()
        result = {}
        for row in rows:
            result[row['month_key']] = {
                'month': row['month'],
                'year': row['year'],
                'finalized_at': row['finalized_at'],
                'employees': json.loads(row['employees'] or '[]'),
                'total_salary': row['total_salary'],
            }
        return jsonify(result)
    finally:
        db.close()


@app.route('/api/data/finalized-salaries', methods=['POST'])
@jwt_required
def save_finalized_salaries():
    data = request.get_json()
    if data is None:
        return jsonify({'error': 'No data provided'}), 400

    db = get_db()
    try:
        db.execute('DELETE FROM finalized_salaries WHERE user_id=?', (g.user_id,))
        for month_key, info in data.items():
            db.execute("""
                INSERT INTO finalized_salaries (user_id, month_key, month, year, employees, total_salary, finalized_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                g.user_id,
                month_key,
                info.get('month'),
                info.get('year'),
                json.dumps(info.get('employees', [])),
                info.get('total_salary', 0),
                info.get('finalized_at'),
            ))
        db.commit()
        return jsonify({'success': True})
    finally:
        db.close()

# --- Confirmed Salaries ---

@app.route('/api/data/confirmed-salaries', methods=['GET'])
@jwt_required
def get_confirmed_salaries():
    db = get_db()
    try:
        rows = db.execute(
            'SELECT * FROM confirmed_salaries WHERE user_id=? ORDER BY confirmed_at DESC',
            (g.user_id,)
        ).fetchall()
        return jsonify([{
            'employee_id': r['employee_id'],
            'employee_name': r['employee_name'],
            'total_hours': r['total_hours'],
            'hour_rate': r['hour_rate'],
            'salary': r['salary'],
            'confirmed_at': r['confirmed_at'],
        } for r in rows])
    finally:
        db.close()


@app.route('/api/data/confirmed-salaries', methods=['POST'])
@jwt_required
def save_confirmed_salaries():
    salaries = request.get_json()
    if salaries is None:
        return jsonify({'error': 'No data provided'}), 400

    db = get_db()
    try:
        db.execute('DELETE FROM confirmed_salaries WHERE user_id=?', (g.user_id,))
        for s in salaries:
            db.execute("""
                INSERT INTO confirmed_salaries (user_id, employee_id, employee_name, total_hours, hour_rate, salary, confirmed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                g.user_id,
                s.get('employee_id'),
                s.get('employee_name'),
                s.get('total_hours'),
                s.get('hour_rate'),
                s.get('salary'),
                s.get('confirmed_at', datetime.utcnow().isoformat()),
            ))
        db.commit()
        return jsonify({'success': True})
    finally:
        db.close()

# --- Hour Rates ---

@app.route('/api/data/hour-rates', methods=['GET'])
@jwt_required
def get_hour_rates():
    db = get_db()
    try:
        rows = db.execute(
            'SELECT employee_id, hour_rate FROM hour_rates WHERE user_id=?',
            (g.user_id,)
        ).fetchall()
        result = {}
        for r in rows:
            result[str(r['employee_id'])] = r['hour_rate']
        return jsonify(result)
    finally:
        db.close()


@app.route('/api/data/hour-rates', methods=['POST'])
@jwt_required
def save_hour_rates():
    rates = request.get_json()
    if rates is None:
        return jsonify({'error': 'No data provided'}), 400

    db = get_db()
    try:
        for emp_id_str, rate in rates.items():
            db.execute("""
                INSERT INTO hour_rates (user_id, employee_id, hour_rate, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(user_id, employee_id) DO UPDATE SET
                    hour_rate=excluded.hour_rate,
                    updated_at=excluded.updated_at
            """, (g.user_id, int(emp_id_str), float(rate), datetime.utcnow().isoformat()))
        db.commit()
        return jsonify({'success': True})
    finally:
        db.close()


# --- Clear all user data (used when uploading a new file) ---

@app.route('/api/data/clear-all', methods=['POST'])
@jwt_required
def clear_all_user_data():
    db = get_db()
    try:
        db.execute('DELETE FROM attendance_reports WHERE user_id=?', (g.user_id,))
        db.execute('DELETE FROM manual_users WHERE user_id=?', (g.user_id,))
        db.execute('DELETE FROM confirmed_salaries WHERE user_id=?', (g.user_id,))
        db.execute('DELETE FROM finalized_salaries WHERE user_id=?', (g.user_id,))
        db.execute('DELETE FROM hour_rates WHERE user_id=?', (g.user_id,))
        db.commit()
        return jsonify({'success': True})
    finally:
        db.close()

# ---------------------------------------------------------------------------

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug, port=port, host='0.0.0.0')
