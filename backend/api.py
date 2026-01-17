"""
Flask API Backend for Attendance Processing System
Provides REST API endpoints for the React frontend
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from attendance_processor import AttendanceProcessor
import os
import tempfile
from datetime import datetime
import pandas as pd
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configure CORS to allow requests from Vercel frontend and localhost for development
# Get allowed origins from environment variable or use defaults
allowed_origins = os.environ.get('ALLOWED_ORIGINS', '').split(',') if os.environ.get('ALLOWED_ORIGINS') else [
    "https://biometric-blackhole.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
]

# Remove empty strings from list
allowed_origins = [origin.strip() for origin in allowed_origins if origin.strip()]

CORS(app, resources={
    r"/api/*": {
        "origins": allowed_origins,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
}, supports_credentials=True)

# Create temp directory for file uploads
UPLOAD_FOLDER = tempfile.mkdtemp()
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "API is running"})


@app.route('/api/process', methods=['POST'])
def process_attendance():
    """
    Process attendance file and return results
    Expected form data:
    - file: Excel file
    - year: int
    - month: int
    - max_hours: float
    """
    try:
        # Validate request
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Get parameters
        year = int(request.form.get('year', datetime.now().year))
        month = int(request.form.get('month', datetime.now().month))
        max_hours = float(request.form.get('max_hours', 8.0))  # Default to 8.0 if not provided
        
        # Get selected dates (dates that should be 8 hours for all)
        selected_dates_str = request.form.get('selected_dates', '[]')
        try:
            import json
            selected_dates = json.loads(selected_dates_str) if selected_dates_str else []
        except:
            selected_dates = []
        
        logger.info(f"Processing file: {file.filename}, Year: {year}, Month: {month}, Max Hours: {max_hours}")
        logger.info(f"Selected dates (8 hours for all): {selected_dates}")
        
        # Save uploaded file temporarily
        temp_input = os.path.join(UPLOAD_FOLDER, f"input_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx")
        file.save(temp_input)
        
        # Process the file
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
        
        # Convert DataFrames to JSON
        daily_report_json = daily_report.to_dict('records')
        monthly_summary_json = monthly_summary.to_dict('records')
        
        # Calculate summary statistics
        total_hours = monthly_summary['total_hours'].sum()
        total_employees = len(monthly_summary)
        total_records = len(daily_report)
        present_days = monthly_summary['present_days'].sum()
        absent_days = monthly_summary['absent_days'].sum()
        auto_assigned_days = monthly_summary['auto_assigned_days'].sum()
        
        # Clean up input file
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
            "output_file": temp_output  # Store path for download
        })
        
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}", exc_info=True)
        # Clean up on error
        if 'temp_input' in locals() and os.path.exists(temp_input):
            os.remove(temp_input)
        return jsonify({"error": str(e)}), 500


@app.route('/api/download', methods=['GET'])
def download_file():
    """Download processed Excel file"""
    try:
        filename = request.args.get('filename')
        if not filename:
            return jsonify({"error": "Filename parameter required"}), 400
        
        # Extract just the filename if full path provided
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
    """Get additional statistics from processed data"""
    try:
        data = request.json
        daily_report = pd.DataFrame(data.get('daily_report', []))
        monthly_summary = pd.DataFrame(data.get('monthly_summary', []))
        
        if daily_report.empty or monthly_summary.empty:
            return jsonify({"error": "No data provided"}), 400
        
        # Calculate additional statistics
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


if __name__ == '__main__':
    # Get port from environment variable (for Render deployment) or default to 5000
    port = int(os.environ.get('PORT', 5000))
    # Debug mode only in development (not in production)
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug, port=port, host='0.0.0.0')

