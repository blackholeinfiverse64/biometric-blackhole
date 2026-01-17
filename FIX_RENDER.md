# Fix Indentation Error on Render - Quick Guide

Since you can't push to GitHub due to network issues, here's how to fix it directly on Render:

## Option 1: Use Render Shell (Recommended)

1. Go to **Render Dashboard** → Your Web Service
2. Click **"Shell"** tab (or open the console)
3. Run these commands:

```bash
cd /opt/render/project/src/backend
nano attendance_processor.py
```

4. In nano editor:
   - Press `Ctrl+_` (to jump to line)
   - Type `381` and press Enter
   - You should see line 381: `            else:`
   - Line 382 should have `# Apply business logic` - **make sure it has 16 spaces** (4 indentation levels)
   - Line 383 should have `worked_hours, status, punch_info = self.process_punch_logic(timestamps)` - **make sure it has 16 spaces**

5. If lines 382-383 are NOT indented properly:
   - Move cursor to start of line 382
   - Add spaces to make it align with code inside the `if` block above
   - Same for line 383

6. Save: `Ctrl+O`, `Enter`, `Ctrl+X`

7. Restart the service from Render dashboard

## Option 2: Use sed command (Quick Fix)

Run this in Render Shell:

```bash
cd /opt/render/project/src/backend
sed -i '382s/^\([[:space:]]*\)/\1\1\1\1/' attendance_processor.py
sed -i '383s/^\([[:space:]]*\)/\1\1\1\1/' attendance_processor.py
```

Then restart the service.

## Option 3: Check Current State

First, check what's actually in the file:

```bash
cd /opt/render/project/src/backend
sed -n '380,385p' attendance_processor.py | cat -A
```

This shows the exact characters including spaces/tabs.

## The Correct Format Should Be:

```python
            if is_selected_date and len(timestamps) == 0:
                worked_hours = float(self.max_hours_per_day)
                status = "Admin Assigned – 8 Hours"
                punch_info = "Admin selected date"
                logger.info(f"Admin selected date {date_str}: Assigning 8 hours to {emp_name} (ID: {emp_id})")
            else:
                # Apply business logic
                worked_hours, status, punch_info = self.process_punch_logic(timestamps)
```

Note: The lines inside `else:` must be indented with **4 more spaces** (16 spaces total from start of line).

