"""
Process StandardReport01.xlsx - October 2025 attendance data
"""

from attendance_processor import AttendanceProcessor

def main():
    print("\n" + "="*80)
    print("PROCESSING STANDARDREPORT01 - OCTOBER 2025")
    print("="*80)
    print("\nProcessing October 2025 attendance data...")
    print("-" * 80)
    
    # Initialize processor with 8-hour workday configuration
    processor = AttendanceProcessor(max_hours_per_day=8.0)
    
    # Process the StandardReport01 file
    daily_report, monthly_summary = processor.process(
        input_file=r"C:\Users\A\Desktop\Biometric\33_StandardReport01.xlsx",
        output_file=r"C:\Users\A\Desktop\Biometric\StandardReport01_Output.xlsx",
        year=2025,
        month=10,
        max_hours=8.0
    )
    
    print("\n" + "="*80)
    print("✓ PROCESSING COMPLETE FOR STANDARDREPORT01")
    print("="*80)
    print(f"\n📊 Summary:")
    print(f"  - Daily records processed: {len(daily_report)}")
    print(f"  - Employees in report: {len(monthly_summary)}")
    print(f"  - Total hours tracked: {monthly_summary['total_hours'].sum():.2f}")
    print(f"  - Total present days: {monthly_summary['present_days'].sum()}")
    print(f"  - Total absent days: {monthly_summary['absent_days'].sum()}")
    
    print(f"\n📁 Output:")
    print(f"  - Report saved: StandardReport01_Output.xlsx")
    
    print("\n" + "="*80)
    print("MONTHLY SUMMARY BY EMPLOYEE")
    print("="*80)
    print(monthly_summary.to_string())
    
    print("\n" + "="*80)
    print("SAMPLE DAILY RECORDS (First 15)")
    print("="*80)
    print(daily_report.head(15).to_string())
    
    print("\n✅ StandardReport01 processing completed successfully!")

if __name__ == "__main__":
    main()
