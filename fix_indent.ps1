# PowerShell script to create a Python fix script for Render
$fixScript = @"
import sys

file_path = '/opt/render/project/src/backend/attendance_processor.py'

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix lines 382-383 (indices 381-382)
if lines[380].strip() == 'else:':
    # Ensure proper indentation (16 spaces)
    lines[381] = '                # Apply business logic\n'
    lines[382] = '                worked_hours, status, punch_info = self.process_punch_logic(timestamps)\n'
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print('Fixed! Lines 382-383 are now properly indented.')
    sys.exit(0)
else:
    print('Warning: Could not find else: on line 381')
    sys.exit(1)
"@

$fixScript | Out-File -FilePath "fix_render.py" -Encoding utf8
Write-Host "Created fix_render.py - Upload this to Render and run: python fix_render.py"

