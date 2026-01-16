"""
Configuration Template - Attendance Processing System
Use this file to configure the processor for your organization.
Copy this file and modify for different scenarios.
"""

from attendance_processor import AttendanceProcessor
from pathlib import Path

# ============================================================================
# CONFIGURATION: Standard 8-Hour Workday
# ============================================================================
CONFIG_8_HOUR = {
    'name': 'Standard 8-Hour Workday',
    'max_hours_per_day': 8.0,
    'description': 'Typical corporate/office environment',
    'use_case': [
        'Banks, IT companies, corporate offices',
        'Standard 9-5 workday with 1-hour lunch',
    ]
}

# ============================================================================
# CONFIGURATION: Extended 10-Hour Workday
# ============================================================================
CONFIG_10_HOUR = {
    'name': 'Extended 10-Hour Workday',
    'max_hours_per_day': 10.0,
    'description': 'Tech startups, consultancies, extended hours',
    'use_case': [
        'Tech startups, management consulting',
        'High-productivity organizations',
    ]
}

# ============================================================================
# CONFIGURATION: Manufacturing/Hospital 12-Hour Workday
# ============================================================================
CONFIG_12_HOUR = {
    'name': 'Manufacturing/Healthcare 12-Hour Shift',
    'max_hours_per_day': 12.0,
    'description': 'Two 12-hour shifts, typical in manufacturing and hospitals',
    'use_case': [
        'Manufacturing plants, hospitals, factories',
        '24/7 operations with shift work',
    ]
}

# ============================================================================
# CONFIGURATION: Intensive 14-Hour Workday
# ============================================================================
CONFIG_14_HOUR = {
    'name': 'Intensive 14-Hour Workday',
    'max_hours_per_day': 14.0,
    'description': 'Specialized roles with extended hours',
    'use_case': [
        'Emergency response teams, intensive care units',
        'Project-based intensive work',
    ]
}

# ============================================================================
# FILE PATHS (Customize here)
# ============================================================================
class FileConfig:
    """Centralized file path management."""

    # Base directory
    BASE_DIR = Path(r"C:\Users\A\Desktop\Biometric")

    # Input files
    INPUT_DIR = BASE_DIR / "input"
    SAMPLE_FILE = BASE_DIR / "sample_attendance.xlsx"
    DECEMBER_2025 = INPUT_DIR / "attendance_december_2025.xlsx"
    JANUARY_2026 = INPUT_DIR / "attendance_january_2026.xlsx"

    # Output files
    OUTPUT_DIR = BASE_DIR / "output"
    REPORT_8_HOUR = OUTPUT_DIR / "attendance_report_8hr.xlsx"
    REPORT_10_HOUR = OUTPUT_DIR / "attendance_report_10hr.xlsx"
    REPORT_MONTHLY = OUTPUT_DIR / "monthly_summary.xlsx"

    # Logs
    LOG_DIR = BASE_DIR / "logs"
    LOG_FILE = LOG_DIR / "processing.log"

    @classmethod
    def create_directories(cls):
        """Create necessary directories if they don't exist."""
        for directory in [cls.INPUT_DIR, cls.OUTPUT_DIR, cls.LOG_DIR]:
            directory.mkdir(parents=True, exist_ok=True)
        print(f"✓ Directories created/verified: {cls.INPUT_DIR}, {cls.OUTPUT_DIR}, {cls.LOG_DIR}")


# ============================================================================
# PROCESSING PROFILES (Reusable combinations)
# ============================================================================
class ProcessingProfile:
    """Pre-configured processing profiles."""

    @staticmethod
    def corporate_8hour(input_file: str, output_file: str, year: int, month: int):
        """Standard corporate 8-hour processing."""
        processor = AttendanceProcessor(max_hours_per_day=8.0)
        return processor.process(
            input_file=input_file,
            output_file=output_file,
            year=year,
            month=month,
            max_hours=8.0
        )

    @staticmethod
    def tech_10hour(input_file: str, output_file: str, year: int, month: int):
        """Tech startup 10-hour processing."""
        processor = AttendanceProcessor(max_hours_per_day=10.0)
        return processor.process(
            input_file=input_file,
            output_file=output_file,
            year=year,
            month=month,
            max_hours=10.0
        )

    @staticmethod
    def manufacturing_12hour(input_file: str, output_file: str, year: int, month: int):
        """Manufacturing 12-hour shift processing."""
        processor = AttendanceProcessor(max_hours_per_day=12.0)
        return processor.process(
            input_file=input_file,
            output_file=output_file,
            year=year,
            month=month,
            max_hours=12.0
        )

    @staticmethod
    def custom(input_file: str, output_file: str, year: int, month: int, max_hours: float):
        """Custom hours configuration."""
        processor = AttendanceProcessor(max_hours_per_day=max_hours)
        return processor.process(
            input_file=input_file,
            output_file=output_file,
            year=year,
            month=month,
            max_hours=max_hours
        )


# ============================================================================
# USAGE FUNCTIONS (Ready-to-use templates)
# ============================================================================

def process_december_2025_corporate():
    """Process December 2025 with 8-hour workday."""
    print("Processing December 2025 (8-hour workday)...")

    daily, summary = ProcessingProfile.corporate_8hour(
        input_file=str(FileConfig.SAMPLE_FILE),
        output_file=str(FileConfig.REPORT_8_HOUR),
        year=2025,
        month=12
    )

    print(f"✓ Processed {len(summary)} employees")
    print(f"✓ Total days tracked: {len(daily)}")
    print(f"\nReport saved to: {FileConfig.REPORT_8_HOUR}")
    return daily, summary


def process_december_2025_tech():
    """Process December 2025 with 10-hour workday."""
    print("Processing December 2025 (10-hour workday)...")

    daily, summary = ProcessingProfile.tech_10hour(
        input_file=str(FileConfig.SAMPLE_FILE),
        output_file=str(FileConfig.REPORT_10_HOUR),
        year=2025,
        month=12
    )

    print(f"✓ Processed {len(summary)} employees")
    print(f"✓ Report saved to: {FileConfig.REPORT_10_HOUR}")
    return daily, summary


def process_custom_configuration(year: int, month: int, max_hours: float, input_file: str, output_file: str):
    """
    Process with custom configuration.

    Args:
        year: Year (2025, 2026, etc.)
        month: Month (1-12)
        max_hours: Hours per day (8, 10, 12, 14, etc.)
        input_file: Path to input Excel file
        output_file: Path to output Excel file
    """
    print(f"\nProcessing {year}-{month:02d} with {max_hours} hours/day...")

    daily, summary = ProcessingProfile.custom(
        input_file=input_file,
        output_file=output_file,
        year=year,
        month=month,
        max_hours=max_hours
    )

    print(f"✓ Processed {len(summary)} employees")
    print(f"✓ Total hours: {summary['total_hours'].sum():.2f}")
    print(f"✓ Report saved to: {output_file}")
    return daily, summary


def batch_process_year_2025(max_hours: float = 8.0):
    """
    Process all months of 2025.

    Args:
        max_hours: Hours per day (8, 10, 12, 14, etc.)
    """
    print(f"\nBatch processing entire year 2025 ({max_hours} hours/day)...")

    month_names = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    results = {}

    for month in range(1, 13):
        month_name = month_names[month - 1]
        print(f"  Processing {month_name} 2025...")

        input_file = FileConfig.INPUT_DIR / f"attendance_{month:02d}_2025.xlsx"
        output_file = FileConfig.OUTPUT_DIR / f"report_{month:02d}_2025_{max_hours:.0f}hr.xlsx"

        try:
            daily, summary = ProcessingProfile.custom(
                input_file=str(input_file),
                output_file=str(output_file),
                year=2025,
                month=month,
                max_hours=max_hours
            )
            results[month_name] = {
                'status': 'Success',
                'employees': len(summary),
                'total_hours': summary['total_hours'].sum()
            }
            print(f"    ✓ {month_name}: {len(summary)} employees processed")
        except FileNotFoundError:
            results[month_name] = {'status': 'File not found', 'employees': 0, 'total_hours': 0}
            print(f"    ✗ {month_name}: Input file not found")

    # Summary
    print("\n" + "="*60)
    print("BATCH PROCESSING SUMMARY")
    print("="*60)
    for month_name, result in results.items():
        status = result['status']
        if status == 'Success':
            print(f"{month_name:12} ✓ {result['employees']} employees, {result['total_hours']:.0f} hours")
        else:
            print(f"{month_name:12} ✗ {status}")

    return results


# ============================================================================
# CONFIGURATION VALIDATOR
# ============================================================================
def validate_configuration():
    """Validate that all necessary files and directories exist."""
    print("\n" + "="*60)
    print("CONFIGURATION VALIDATION")
    print("="*60)

    # Check base directory
    if FileConfig.BASE_DIR.exists():
        print(f"✓ Base directory exists: {FileConfig.BASE_DIR}")
    else:
        print(f"✗ Base directory missing: {FileConfig.BASE_DIR}")
        return False

    # Create required directories
    FileConfig.create_directories()

    # Check sample file
    if FileConfig.SAMPLE_FILE.exists():
        print(f"✓ Sample file exists: {FileConfig.SAMPLE_FILE}")
    else:
        print(f"⚠ Sample file missing: {FileConfig.SAMPLE_FILE} (create using create_sample.py)")

    # Check processor
    try:
        processor = AttendanceProcessor()
        print(f"✓ Processor module loaded successfully")
    except Exception as e:
        print(f"✗ Processor module error: {e}")
        return False

    print("\n✓ Configuration validation complete")
    return True


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================
def main():
    """Main configuration demonstration."""
    print("\n" + "="*80)
    print("ATTENDANCE PROCESSING SYSTEM - CONFIGURATION TEMPLATES")
    print("="*80)

    # Validate configuration
    if not validate_configuration():
        print("✗ Configuration validation failed. Please check file paths.")
        return

    print("\n" + "="*80)
    print("AVAILABLE PROFILES")
    print("="*80)
    print("""
1. Corporate (8-hour):      process_december_2025_corporate()
2. Tech Startup (10-hour):  process_december_2025_tech()
3. Custom Configuration:    process_custom_configuration(year, month, hours, input, output)
4. Batch Process Year:      batch_process_year_2025(max_hours=8.0)

Example usage:
    daily, summary = process_december_2025_corporate()
    print(summary)
    """)

    # Run example
    print("\n" + "="*80)
    print("RUNNING EXAMPLE: Corporate 8-Hour Processing")
    print("="*80)

    try:
        daily, summary = process_december_2025_corporate()
        print("\n✓ Sample Report (First 3 employees):")
        print(summary.head(3).to_string(index=False))
    except FileNotFoundError:
        print("\n⚠ Sample file not found. Create it using: python create_sample.py")
    except Exception as e:
        print(f"\n✗ Error: {e}")


if __name__ == "__main__":
    main()
