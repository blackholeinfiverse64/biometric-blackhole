# Commands to Run in Render Shell

Copy and paste these commands **one by one** into Render's Shell/Console:

## Step 1: Navigate to backend directory
```bash
cd /opt/render/project/src/backend
```

## Step 2: Check current state
```bash
sed -n '380,385p' attendance_processor.py
```

## Step 3: Fix the indentation (add 16 spaces to lines 382-383)
```bash
sed -i '382s/^/                /' attendance_processor.py
sed -i '383s/^/                /' attendance_processor.py
```

## Step 4: Verify the fix
```bash
sed -n '380,385p' attendance_processor.py
```

You should see:
```
            else:
                # Apply business logic
                worked_hours, status, punch_info = self.process_punch_logic(timestamps)
```

## Step 5: Restart your service
- Go back to Render Dashboard
- Click "Manual Deploy" → "Deploy latest commit"
- Or just wait for auto-restart

---

**Note:** These commands work in **bash/Linux shell** (Render's shell), NOT in PowerShell!

