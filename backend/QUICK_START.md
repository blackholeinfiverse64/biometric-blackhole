"""
QUICK START GUIDE - Attendance Processing System
Follow these steps to process your first attendance file in 5 minutes.
"""

# ============================================================================
# STEP 1: INSTALL DEPENDENCIES (Run in PowerShell/CMD)
# ============================================================================
"""
pip install pandas openpyxl

Expected output:
Successfully installed pandas-X.X.X openpyxl-X.X.X
"""

# ============================================================================
# STEP 2: PREPARE YOUR EXCEL FILE
# ============================================================================
"""
Your Excel file must have this structure:

Row 1:  Attendance Record Report
Row 2:  Att. Time
Row 3:  Date Range: 2025-12-01 ~ 2025-12-31
Row 4:  Column Headers
        A: Employee ID
        B: Employee Name
        C: 1 (for Dec 1)
        D: 2 (for Dec 2)
        ... up to column AF for day 31

Row 5+: Employee data
        A: 35
        B: Rishabh
        C: 09:35 18:10
        D: 09:00 18:00
        ... etc

Cell Format Rules:
- Two timestamps (normal):        "09:35 18:10"
- Multiple timestamps:             "09:10 13:00 14:00 18:30"
- Single timestamp:                "10:05"
- Absent (blank):                  (leave empty)

Time Format: Always HH:MM (24-hour)
"""

# ============================================================================
# STEP 3: RUN THE PROCESSOR
# ============================================================================
"""
Open PowerShell/CMD in your workspace folder and run:

python attendance_processor.py
"""

# ============================================================================
# STEP 4: CUSTOMIZE FOR YOUR NEEDS
# ============================================================================
"""
Open attendance_processor.py and edit the main() function:

Find this section:
-------
INPUT_FILE = r"C:\Users\A\Desktop\Biometric\sample_attendance.xlsx"
OUTPUT_FILE = r"C:\Users\A\Desktop\Biometric\attendance_report.xlsx"
YEAR = 2025
MONTH = 12
MAX_HOURS_PER_DAY = 8.0
-------

Change to your values:
- INPUT_FILE: Path to your attendance Excel file
- OUTPUT_FILE: Where to save the report
- YEAR: Year (2025, 2026, etc.)
- MONTH: Month (1-12)
- MAX_HOURS_PER_DAY: 8, 10, 12, 14, etc. (for auto-assignment)

Then save and run: python attendance_processor.py
"""

# ============================================================================
# STEP 5: REVIEW OUTPUT
# ============================================================================
"""
Two Excel sheets are generated:

Sheet 1: Daily Attendance
- Shows punch times and calculated hours for each employee per day
- Status indicates: Present, Absent, System Assigned, or Punch Error
- Use for detailed verification

Sheet 2: Monthly Summary
- Shows total hours and day counts per employee
- Ready for payroll processing
- Use for official HR records

Both sheets are formatted with:
✓ Professional colors and borders
✓ Auto-width columns
✓ Clear headers
✓ Center-aligned data
"""

# ============================================================================
# ADVANCED: BATCH PROCESSING MULTIPLE MONTHS
# ============================================================================
"""
Create a Python script called batch_process.py:

---CODE START---
from attendance_processor import AttendanceProcessor

processor = AttendanceProcessor(max_hours_per_day=8.0)

for month in range(1, 13):  # Jan to Dec
    input_file = f"C:\\path\\to\\attendance_2025_{month:02d}.xlsx"
    output_file = f"C:\\path\\to\\reports\\report_2025_{month:02d}.xlsx"
    
    try:
        processor.process(
            input_file=input_file,
            output_file=output_file,
            year=2025,
            month=month,
            max_hours=8.0
        )
        print(f"✓ Month {month} processed")
    except FileNotFoundError:
        print(f"✗ Month {month} file not found")

---CODE END---

Run: python batch_process.py
"""

# ============================================================================
# TROUBLESHOOTING
# ============================================================================
"""
Problem: ImportError: No module named 'pandas'
Solution: pip install pandas openpyxl

Problem: FileNotFoundError: Excel file not found
Solution: Check the file path is correct (use absolute path with r"" prefix)

Problem: ValueError: time data '9:35' does not match format '%H:%M'
Solution: Times must be padded (09:35, not 9:35)

Problem: No employees found in output
Solution: 
  - Employee ID must be numeric (column A)
  - Employee Name must be text (column B)
  - Date columns must be numeric 1-31 (columns C onwards)

Problem: Incorrect hours calculation
Solution:
  - Check time format (24-hour, no AM/PM)
  - Check for extra spaces in punch data
  - Hours are rounded to nearest 5 minutes (intentional)

Problem: Status shows "Punch Error – Auto Assigned"
Solution:
  - This occurs when odd number of timestamps (3, 5, 7, etc.)
  - Mark as corrupted, 8 hours auto-assigned
  - Review the raw punch data in daily report
"""

# ============================================================================
# BUSINESS LOGIC REFERENCE
# ============================================================================
"""
This system implements these rules:

1. TWO TIMESTAMPS (Normal)
   - Calculate hours between punch-in and punch-out
   - Round to nearest 5 minutes
   - Status: Present

2. ONE TIMESTAMP (Missing Punch-Out)
   - Automatically assign 8/10/12/14 hours (configurable)
   - Status: System Assigned – Missing Punch-Out
   - Flag for manual review

3. FOUR+ TIMESTAMPS (Even count)
   - Pair sequentially: 1→2, 3→4, 5→6, etc.
   - Calculate hours for each pair
   - Sum total hours
   - Status: Present

4. THREE+ TIMESTAMPS (Odd count)
   - Treat as corrupted/erroneous data
   - Automatically assign 8/10/12/14 hours
   - Status: Punch Error – Auto Assigned
   - Flag for manual review

5. BLANK CELL (Absent)
   - 0 hours worked
   - Status: Absent

All decisions are logged to console for audit trail.
"""

# ============================================================================
# COMMON CONFIGURATIONS
# ============================================================================
"""
8-Hour Workday (Standard):
MAX_HOURS_PER_DAY = 8.0

10-Hour Workday (Tech/IT):
MAX_HOURS_PER_DAY = 10.0

12-Hour Workday (Manufacturing/Hospitals):
MAX_HOURS_PER_DAY = 12.0

14-Hour Workday (Intensive roles):
MAX_HOURS_PER_DAY = 14.0
"""

# ============================================================================
# PAYROLL INTEGRATION
# ============================================================================
"""
The Monthly Summary sheet contains:
- employee_id
- employee_name
- present_days
- absent_days
- auto_assigned_days
- total_hours
- total_hours_hm

This is payroll-ready. Simply:
1. Open the report
2. Copy employee_name and total_hours columns
3. Import into payroll system
4. Multiply by hourly rate to calculate salary

No manual hour calculations needed!
"""

# ============================================================================
# FILE STRUCTURE
# ============================================================================
"""
Your workspace should contain:

c:\Users\A\Desktop\Biometric\
├── attendance_processor.py      (Main system - REQUIRED)
├── sample_attendance.xlsx        (Sample data for testing)
├── attendance_report.xlsx        (Output generated by system)
├── create_sample.py              (Optional - generates sample data)
├── examples.py                   (Optional - advanced examples)
├── README.md                     (Full documentation)
└── QUICK_START.md               (This file)
"""

# ============================================================================
# NEXT STEPS
# ============================================================================
"""
1. Install dependencies:
   pip install pandas openpyxl

2. Create sample data (optional):
   python create_sample.py

3. Test with sample data:
   python attendance_processor.py

4. Review output files:
   - attendance_report.xlsx (2 sheets: Daily + Summary)

5. Customize for your data:
   - Edit INPUT_FILE, OUTPUT_FILE, YEAR, MONTH in main()
   - Adjust MAX_HOURS_PER_DAY for your organization
   - Save and run

6. Integrate with your HR system:
   - Use monthly summary sheet for payroll
   - Use daily sheet for verification
   - Archive for audit trail

7. Advanced usage:
   - See examples.py for batch processing
   - See README.md for full API reference
"""

# ============================================================================
# SUPPORT
# ============================================================================
"""
For questions or modifications:

1. Check README.md for comprehensive documentation
2. Review examples.py for real-world scenarios
3. Check console output (logs) for data processing decisions
4. Verify input file format matches specification
5. Enable file logging for detailed audit trail

All code is well-commented. Feel free to customize!
"""

print(__doc__)
