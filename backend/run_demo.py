"""
Demo script to run the attendance processing system with existing data.
"""

from attendance_processor import AttendanceProcessor

def main():
    print("\n" + "="*80)
    print("ATTENDANCE PROCESSING SYSTEM - DEMO")
    print("="*80)
    print("\nProcessing December 2025 attendance data...")
    print("-" * 80)
    
    # Initialize processor with 8-hour workday configuration
    processor = AttendanceProcessor(max_hours_per_day=8.0)
    
    # Process the existing file
    daily_report, monthly_summary = processor.process(
        input_file=r"C:\Users\A\Desktop\Biometric\DECEMBER_2025.xlsx",
        output_file=r"C:\Users\A\Desktop\Biometric\demo_output_report.xlsx",
        year=2025,
        month=12,
        max_hours=8.0
    )
    
    print("\n" + "="*80)
    print("✓ PROCESSING COMPLETE")
    print("="*80)
    print(f"\n📊 Summary:")
    print(f"  - Daily records processed: {len(daily_report)}")
    print(f"  - Employees in report: {len(monthly_summary)}")
    print(f"  - Total hours tracked: {monthly_summary['total_hours'].sum():.2f}")
    
    print(f"\n📁 Output:")
    print(f"  - Report saved: demo_output_report.xlsx")
    
    print("\n" + "="*80)
    print("MONTHLY SUMMARY BY EMPLOYEE")
    print("="*80)
    print(monthly_summary.to_string())
    
    print("\n" + "="*80)
    print("SAMPLE DAILY RECORDS (First 10)")
    print("="*80)
    print(daily_report.head(10).to_string())
    
    print("\n✅ Demo completed successfully!")

if __name__ == "__main__":
    main()
