"""
Advanced Usage Examples - Attendance Processing System
Demonstrates real-world scenarios and customizations.
"""

from attendance_processor import AttendanceProcessor
import pandas as pd
from datetime import datetime


# ============================================================================
# EXAMPLE 1: Basic Monthly Processing (8-hour days)
# ============================================================================
def example_basic_8hour():
    """
    Standard HR processing for 8-hour workday organization.
    """
    print("\n" + "="*80)
    print("EXAMPLE 1: Basic Monthly Processing (8-hour days)")
    print("="*80)

    processor = AttendanceProcessor(max_hours_per_day=8.0)

    daily_report, monthly_summary = processor.process(
        input_file=r"C:\Users\A\Desktop\Biometric\sample_attendance.xlsx",
        output_file=r"C:\Users\A\Desktop\Biometric\attendance_report_8hr.xlsx",
        year=2025,
        month=12,
        max_hours=8.0
    )

    print("\n✓ Processing Complete")
    print(f"  - Daily records: {len(daily_report)}")
    print(f"  - Employees processed: {len(monthly_summary)}")
    print(f"\n{monthly_summary.to_string()}")


# ============================================================================
# EXAMPLE 2: Extended Hours (10-hour days) - IT/Tech Companies
# ============================================================================
def example_extended_hours_10():
    """
    Processing for organizations with 10-hour workdays.
    Useful for tech startups, manufacturing, etc.
    """
    print("\n" + "="*80)
    print("EXAMPLE 2: Extended Hours (10-hour days)")
    print("="*80)

    processor = AttendanceProcessor(max_hours_per_day=10.0)

    daily_report, monthly_summary = processor.process(
        input_file=r"C:\Users\A\Desktop\Biometric\sample_attendance.xlsx",
        output_file=r"C:\Users\A\Desktop\Biometric\attendance_report_10hr.xlsx",
        year=2025,
        month=12,
        max_hours=10.0
    )

    print("\n✓ Processing Complete")
    print(f"  - Daily records: {len(daily_report)}")
    print(f"  - Employees processed: {len(monthly_summary)}")
    print(f"  - Total hours tracked: {monthly_summary['total_hours'].sum():.2f}")


# ============================================================================
# EXAMPLE 3: Multi-Month Batch Processing (Jan-Dec 2025)
# ============================================================================
def example_batch_processing():
    """
    Process entire year in batch.
    """
    print("\n" + "="*80)
    print("EXAMPLE 3: Batch Processing (Multiple Months)")
    print("="*80)

    processor = AttendanceProcessor(max_hours_per_day=8.0)

    # Example for Jan-Mar 2025
    for month in range(1, 4):
        month_name = datetime(2025, month, 1).strftime("%B")

        print(f"\nProcessing {month_name} 2025...")

        input_file = rf"C:\Users\A\Desktop\Biometric\attendance_{month:02d}_2025.xlsx"
        output_file = rf"C:\Users\A\Desktop\Biometric\reports\attendance_report_{month:02d}_2025.xlsx"

        try:
            daily_report, monthly_summary = processor.process(
                input_file=input_file,
                output_file=output_file,
                year=2025,
                month=month,
                max_hours=8.0
            )
            print(f"  ✓ {month_name}: {len(monthly_summary)} employees processed")
        except FileNotFoundError:
            print(f"  ✗ {month_name}: File not found (skipped)")


# ============================================================================
# EXAMPLE 4: Custom Analysis - Attendance Anomalies
# ============================================================================
def example_custom_analysis():
    """
    Post-processing analysis for HR insights.
    """
    print("\n" + "="*80)
    print("EXAMPLE 4: Custom Analysis - Attendance Insights")
    print("="*80)

    processor = AttendanceProcessor(max_hours_per_day=8.0)

    daily_report, monthly_summary = processor.process(
        input_file=r"C:\Users\A\Desktop\Biometric\sample_attendance.xlsx",
        output_file=r"C:\Users\A\Desktop\Biometric\attendance_analysis.xlsx",
        year=2025,
        month=12,
        max_hours=8.0
    )

    # Analysis 1: Employees with highest absences
    print("\n📊 Top Absent Employees (December 2025)")
    print("-" * 50)
    absent_ranking = monthly_summary.nlargest(5, 'absent_days')[['employee_name', 'absent_days', 'present_days']]
    print(absent_ranking.to_string(index=False))

    # Analysis 2: Total hours worked vs expected
    print("\n📊 Hours vs Expected (8 hours/day)")
    print("-" * 50)
    monthly_summary['expected_hours'] = monthly_summary['present_days'] * 8.0
    monthly_summary['variance'] = monthly_summary['total_hours'] - monthly_summary['expected_hours']
    variance_report = monthly_summary[['employee_name', 'total_hours', 'expected_hours', 'variance']].copy()
    print(variance_report.to_string(index=False))

    # Analysis 3: System-assigned days (potential issues)
    print("\n⚠️  Employees with Auto-Assigned Days")
    print("-" * 50)
    auto_assigned = monthly_summary[monthly_summary['auto_assigned_days'] > 0][
        ['employee_name', 'auto_assigned_days', 'total_hours']
    ]
    if not auto_assigned.empty:
        print(auto_assigned.to_string(index=False))
    else:
        print("None - All punch data is clean!")

    # Analysis 4: Daily patterns
    print("\n📅 Daily Attendance Summary (December 2025)")
    print("-" * 50)
    daily_summary = daily_report.groupby('status').size().sort_values(ascending=False)
    for status, count in daily_summary.items():
        print(f"  {status}: {count} records")


# ============================================================================
# EXAMPLE 5: Custom Filtering & Export
# ============================================================================
def example_custom_export():
    """
    Generate department-specific or custom filtered reports.
    """
    print("\n" + "="*80)
    print("EXAMPLE 5: Custom Filtering & Department Reports")
    print("="*80)

    processor = AttendanceProcessor(max_hours_per_day=8.0)

    daily_report, monthly_summary = processor.process(
        input_file=r"C:\Users\A\Desktop\Biometric\sample_attendance.xlsx",
        output_file=r"C:\Users\A\Desktop\Biometric\attendance_raw.xlsx",
        year=2025,
        month=12,
        max_hours=8.0
    )

    # Example: Export only "Present" records
    print("\n📋 Present Days Only (for payroll calculation)")
    print("-" * 50)
    present_only = daily_report[daily_report['status'] == 'Present'].copy()
    print(f"Total present records: {len(present_only)}")
    print(present_only[['employee_name', 'date', 'worked_hours', 'hours_hm']].head(10).to_string(index=False))

    # Example: Export absent days for follow-up
    print("\n📋 Absent Days Report (for HR follow-up)")
    print("-" * 50)
    absent_report = daily_report[daily_report['status'] == 'Absent'].copy()
    absent_report.to_excel(
        r"C:\Users\A\Desktop\Biometric\absent_days_report.xlsx",
        index=False,
        sheet_name='Absent Days'
    )
    print(f"✓ Exported {len(absent_report)} absent day records")

    # Example: Export problem cases
    print("\n⚠️  Problem Cases Report (for data review)")
    print("-" * 50)
    problem_statuses = ['System Assigned – Missing Punch-Out', 'Punch Error – Auto Assigned']
    problem_cases = daily_report[daily_report['status'].isin(problem_statuses)].copy()
    problem_cases.to_excel(
        r"C:\Users\A\Desktop\Biometric\problem_cases.xlsx",
        index=False,
        sheet_name='Review Required'
    )
    print(f"✓ Exported {len(problem_cases)} problem cases for review")


# ============================================================================
# EXAMPLE 6: Direct DataFrame Processing (Programmatic)
# ============================================================================
def example_programmatic_api():
    """
    Use the processor API directly with DataFrames for custom workflows.
    """
    print("\n" + "="*80)
    print("EXAMPLE 6: Programmatic API Usage")
    print("="*80)

    processor = AttendanceProcessor(max_hours_per_day=8.0)

    # Step 1: Read and extract
    df_raw = processor.read_attendance_excel(
        r"C:\Users\A\Desktop\Biometric\sample_attendance.xlsx"
    )
    employees = processor.extract_employee_data(df_raw)

    print(f"✓ Extracted {len(employees)} employees")

    # Step 2: Normalize
    df_normalized = processor.normalize_data(employees, year=2025, month=12)
    print(f"✓ Normalized {len(df_normalized)} records")

    # Step 3: Process with custom filtering
    df_daily = processor.generate_daily_report(df_normalized)

    # Custom: Filter specific employee
    employee_id = 35
    emp_records = df_daily[df_daily['employee_id'] == employee_id]

    print(f"\n✓ December 2025 records for Employee {employee_id}:")
    print(emp_records[['date', 'punches', 'worked_hours', 'status']].to_string(index=False))

    # Custom: Calculate metrics
    print(f"\n✓ Monthly Metrics (Employee {employee_id}):")
    print(f"  - Total hours: {emp_records['worked_hours'].sum():.2f}")
    print(f"  - Present days: {(emp_records['status'] == 'Present').sum()}")
    print(f"  - Absent days: {(emp_records['status'] == 'Absent').sum()}")


# ============================================================================
# EXAMPLE 7: Error Handling & Validation
# ============================================================================
def example_error_handling():
    """
    Demonstrate robust error handling.
    """
    print("\n" + "="*80)
    print("EXAMPLE 7: Error Handling & Validation")
    print("="*80)

    processor = AttendanceProcessor(max_hours_per_day=8.0)

    # Example: Invalid time format
    print("\n🔍 Testing invalid time formats:")
    test_times = ["09:35", "9:35", "25:00", "09:60", "invalid"]
    for time_str in test_times:
        result = processor.parse_time(time_str)
        status = "✓" if result else "✗"
        print(f"  {status} '{time_str}' → {result}")

    # Example: Invalid punch data
    print("\n🔍 Testing punch data parsing:")
    test_punch_data = [
        "09:35 18:10",           # Normal
        "09:10 13:00 14:00",     # Multiple (odd)
        "10:05",                 # Single
        "",                      # Empty
        None,                    # None
        "09:35 18:10 19:00",     # Multiple (even)
    ]
    for punch_str in test_punch_data:
        result = processor.parse_punch_data(punch_str)
        print(f"  '{punch_str}' → {len(result)} timestamps: {result}")


# ============================================================================
# EXAMPLE 8: Shift Work & Night Shifts
# ============================================================================
def example_night_shifts():
    """
    Handle night shifts where punch-out is after midnight.
    """
    print("\n" + "="*80)
    print("EXAMPLE 8: Night Shift Processing")
    print("="*80)

    processor = AttendanceProcessor(max_hours_per_day=8.0)

    # Example: 22:00 punch-in, 06:00 punch-out (next day)
    print("\n🌙 Night Shift Test Cases:")
    from datetime import time
    test_cases = [
        (time(22, 0), time(6, 0), "22:00 - 06:00 (Night shift, 8 hours)"),
        (time(20, 0), time(4, 0), "20:00 - 04:00 (Night shift, 8 hours)"),
        (time(23, 30), time(7, 30), "23:30 - 07:30 (Night shift, 8 hours)"),
    ]

    for punch_in, punch_out, description in test_cases:
        hours = processor.calculate_hours(punch_in, punch_out)
        hours_hm = processor.time_to_decimal(hours)
        print(f"  ✓ {description} = {hours:.2f}h ({hours_hm})")


# ============================================================================
# ENTRY POINT
# ============================================================================
def main():
    """
    Run all examples (choose which ones to execute).
    """
    print("\n" + "="*80)
    print("ATTENDANCE PROCESSING SYSTEM - ADVANCED EXAMPLES")
    print("="*80)

    # Uncomment the examples you want to run:

    example_basic_8hour()
    example_extended_hours_10()
    # example_batch_processing()  # Requires multiple files
    example_custom_analysis()
    example_custom_export()
    example_programmatic_api()
    example_error_handling()
    example_night_shifts()

    print("\n" + "="*80)
    print("ALL EXAMPLES COMPLETED")
    print("="*80)


if __name__ == "__main__":
    main()
