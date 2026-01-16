"""
Validation & Testing Script - Attendance Processing System
Run this to verify everything is working correctly.
"""

import sys
import os
from pathlib import Path

def test_dependencies():
    """Test if required packages are installed."""
    print("\n" + "="*80)
    print("TEST 1: Checking Dependencies")
    print("="*80)

    dependencies = {
        'pandas': 'pd',
        'openpyxl': 'openpyxl',
    }

    all_ok = True
    for package, import_name in dependencies.items():
        try:
            __import__(import_name)
            print(f"✅ {package:20} - Installed")
        except ImportError:
            print(f"❌ {package:20} - NOT INSTALLED")
            all_ok = False

    if all_ok:
        print("\n✓ All dependencies are installed!")
    else:
        print("\n✗ Missing dependencies. Install with:")
        print("  pip install pandas openpyxl")
        return False

    return True


def test_files():
    """Test if all required files exist."""
    print("\n" + "="*80)
    print("TEST 2: Checking Project Files")
    print("="*80)

    base_dir = Path(__file__).parent
    required_files = {
        'attendance_processor.py': 'Core system',
        'create_sample.py': 'Sample data generator',
        'examples.py': 'Usage examples',
        'config.py': 'Configuration templates',
        'README.md': 'Documentation',
        'QUICK_START.md': 'Quick start guide',
        'START_HERE.md': 'Navigation guide',
        'requirements.txt': 'Dependencies list',
    }

    all_ok = True
    for filename, description in required_files.items():
        filepath = base_dir / filename
        if filepath.exists():
            print(f"✅ {filename:30} - {description}")
        else:
            print(f"❌ {filename:30} - NOT FOUND")
            all_ok = False

    if all_ok:
        print("\n✓ All project files are present!")
    else:
        print("\n✗ Some files are missing.")
        return False

    return True


def test_imports():
    """Test if all modules can be imported."""
    print("\n" + "="*80)
    print("TEST 3: Checking Module Imports")
    print("="*80)

    modules_to_test = {
        'attendance_processor': 'AttendanceProcessor',
        'create_sample': 'create_sample_attendance_file',
        'config': 'ProcessingProfile',
    }

    all_ok = True
    for module_name, expected_item in modules_to_test.items():
        try:
            module = __import__(module_name)
            if hasattr(module, expected_item):
                print(f"✅ {module_name:30} - {expected_item} found")
            else:
                print(f"⚠️  {module_name:30} - {expected_item} NOT found")
                all_ok = False
        except ImportError as e:
            print(f"❌ {module_name:30} - Import failed: {e}")
            all_ok = False

    if all_ok:
        print("\n✓ All modules can be imported!")
    else:
        print("\n✗ Some modules have issues.")
        return False

    return True


def test_processor_class():
    """Test basic processor functionality."""
    print("\n" + "="*80)
    print("TEST 4: Testing AttendanceProcessor Class")
    print("="*80)

    try:
        from attendance_processor import AttendanceProcessor
        from datetime import time

        processor = AttendanceProcessor(max_hours_per_day=8.0)
        print("✅ Processor instantiated successfully")

        # Test time parsing
        time_obj = processor.parse_time("09:35")
        if time_obj == time(9, 35):
            print("✅ parse_time() working correctly")
        else:
            print("❌ parse_time() returned unexpected value")
            return False

        # Test punch parsing
        punches = processor.parse_punch_data("09:35 18:10")
        if len(punches) == 2:
            print("✅ parse_punch_data() working correctly")
        else:
            print("❌ parse_punch_data() returned unexpected count")
            return False

        # Test punch logic - Normal
        hours, status, info = processor.process_punch_logic([time(9, 35), time(18, 10)])
        if status == "Present" and hours > 8 and hours < 9:
            print("✅ process_punch_logic() (normal) working correctly")
        else:
            print(f"❌ process_punch_logic() returned unexpected values: {status}, {hours}")
            return False

        # Test punch logic - Missing punch-out
        hours, status, info = processor.process_punch_logic([time(10, 5)])
        if status == "System Assigned – Missing Punch-Out" and hours == 8.0:
            print("✅ process_punch_logic() (missing punch-out) working correctly")
        else:
            print(f"❌ process_punch_logic() (missing punch-out) failed")
            return False

        # Test punch logic - Absent
        hours, status, info = processor.process_punch_logic([])
        if status == "Absent" and hours == 0:
            print("✅ process_punch_logic() (absent) working correctly")
        else:
            print(f"❌ process_punch_logic() (absent) failed")
            return False

        print("\n✓ Processor class is functioning correctly!")
        return True

    except Exception as e:
        print(f"❌ Error testing processor: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_sample_generation():
    """Test sample data generation."""
    print("\n" + "="*80)
    print("TEST 5: Testing Sample Data Generation")
    print("="*80)

    try:
        from create_sample import create_sample_attendance_file
        from pathlib import Path

        test_file = Path(__file__).parent / "test_sample.xlsx"

        # Create sample file
        create_sample_attendance_file(str(test_file))

        # Check if file was created
        if test_file.exists():
            file_size = test_file.stat().st_size
            print(f"✅ Sample file created successfully ({file_size} bytes)")
            test_file.unlink()  # Clean up
            print("✅ Test file cleaned up")
            return True
        else:
            print("❌ Sample file was not created")
            return False

    except Exception as e:
        print(f"❌ Error testing sample generation: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_configuration_profiles():
    """Test configuration profiles."""
    print("\n" + "="*80)
    print("TEST 6: Testing Configuration Profiles")
    print("="*80)

    try:
        from config import ProcessingProfile, FileConfig, CONFIG_8_HOUR, CONFIG_10_HOUR

        # Test configuration dictionaries
        configs = [CONFIG_8_HOUR, CONFIG_10_HOUR]
        for config in configs:
            if 'name' in config and 'max_hours_per_day' in config:
                print(f"✅ {config['name']} - Configuration valid")
            else:
                print(f"❌ Configuration missing required fields")
                return False

        # Test FileConfig
        if FileConfig.BASE_DIR.exists():
            print(f"✅ FileConfig.BASE_DIR - {FileConfig.BASE_DIR}")
        else:
            print(f"✅ FileConfig.BASE_DIR - Defined (directory will be created on use)")

        print("\n✓ Configuration profiles are valid!")
        return True

    except Exception as e:
        print(f"❌ Error testing configuration: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_documentation():
    """Check documentation files."""
    print("\n" + "="*80)
    print("TEST 7: Checking Documentation")
    print("="*80)

    base_dir = Path(__file__).parent
    docs = {
        'README.md': 'Comprehensive documentation',
        'QUICK_START.md': 'Quick start guide',
        'START_HERE.md': 'Navigation guide',
        'DELIVERABLES.md': 'Project summary',
    }

    all_ok = True
    for filename, description in docs.items():
        filepath = base_dir / filename
        if filepath.exists():
            lines = filepath.read_text().count('\n')
            print(f"✅ {filename:20} - {lines:4} lines - {description}")
        else:
            print(f"❌ {filename:20} - NOT FOUND")
            all_ok = False

    if all_ok:
        print("\n✓ All documentation is present!")
    else:
        print("\n✗ Some documentation is missing.")
        return False

    return True


def run_all_tests():
    """Run all tests."""
    print("\n" + "="*80)
    print("ATTENDANCE PROCESSING SYSTEM - VALIDATION TESTS")
    print("="*80)

    results = {
        'Dependencies': test_dependencies(),
        'Files': test_files(),
        'Imports': test_imports(),
        'Processor': test_processor_class(),
        'Sample Generation': test_sample_generation(),
        'Configuration': test_configuration_profiles(),
        'Documentation': test_documentation(),
    }

    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status:10} - {test_name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 ALL TESTS PASSED - System is ready to use!")
        return 0
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")
        return 1


if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)
