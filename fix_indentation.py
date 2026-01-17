#!/usr/bin/env python3
"""
Quick fix script for indentation error in attendance_processor.py
Run this in Render Shell to fix the indentation issue
"""

file_path = '/opt/render/project/src/backend/attendance_processor.py'

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Check lines 381-383 (0-indexed: 380-382)
print(f"Line 381 (index 380): {repr(lines[380])}")
print(f"Line 382 (index 381): {repr(lines[381])}")
print(f"Line 383 (index 382): {repr(lines[382])}")

# Fix if needed
if lines[380].strip() == 'else:' and not lines[381].startswith('                '):
    print("\nFixing indentation...")
    # Ensure proper indentation (16 spaces = 4 levels * 4 spaces)
    lines[381] = '                # Apply business logic\n'
    lines[382] = '                worked_hours, status, punch_info = self.process_punch_logic(timestamps)\n'
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Fixed! File saved.")
else:
    print("\nIndentation looks correct already.")

