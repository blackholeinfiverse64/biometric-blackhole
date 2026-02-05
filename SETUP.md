# 🚀 Blackhole Infiverse - Complete Setup Guide

## Prerequisites

Before you begin, ensure you have:
- **Python 3.8+** installed
- **Node.js 18+** and npm installed
- **Git** (optional, for cloning)

## 📦 Installation Steps

### Step 1: Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This installs:
- Flask (web framework)
- Flask-CORS (CORS support)
- pandas (data processing)
- openpyxl (Excel file handling)

### Step 2: Install Frontend Dependencies

```bash
cd frontend
npm install
```

This installs:
- React 18
- Vite (build tool)
- Tailwind CSS (styling)
- React Router (routing)
- Axios (HTTP client)
- Recharts (charts)
- Lucide React (icons)

## 🏃 Running the Application

### Option 1: Quick Start (Recommended)

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
python api.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 🌐 Access the Application

Once both servers are running:

- **Frontend**: Open http://localhost:3000 in your browser
- **Backend API**: http://localhost:5000 (API endpoints)

## 📝 First Time Usage

1. **Open the application** at http://localhost:3000
2. **Navigate to Upload** page
3. **Upload an Excel file** with attendance data
4. **Configure** year, month, and max hours per day
5. **Click "Process Attendance File"**
6. **View results** and download the report

## 🎨 Features Overview

### Dashboard
- Overview statistics
- Quick metrics
- Feature highlights

### Upload Page
- Drag-and-drop file upload
- Configuration options
- Real-time processing
- Instant results

### Reports Page
- Interactive charts
- Employee statistics
- Monthly summaries
- Downloadable reports

## 🔧 Troubleshooting

### Backend Issues

**Port 5000 already in use:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill
```

**Module not found errors:**
```bash
cd backend
pip install -r requirements.txt --upgrade
```

### Frontend Issues

**Port 3000 already in use:**
- Vite will automatically use the next available port (3001, 3002, etc.)

**Dependencies not installing:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Build errors:**
```bash
cd frontend
npm run build
```

## 📊 Project Structure

```
Biometric--main/
├── backend/
│   ├── api.py                 # Flask API server
│   ├── attendance_processor.py # Core processing logic
│   ├── requirements.txt       # Python dependencies
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Page components
│   │   └── ...
│   ├── package.json          # Node dependencies
│   └── ...
├── start.bat                 # Windows startup script
├── start.sh                  # Linux/Mac startup script
└── README_FRONTEND.md        # Frontend documentation
```

## 🚀 Production Deployment

### Build Frontend
```bash
cd frontend
npm run build
```

The production build will be in `frontend/dist/`

### Deploy Backend
Use a production WSGI server like Gunicorn:
```bash
pip install gunicorn
cd backend
gunicorn -w 4 -b 0.0.0.0:5000 api:app
```

## 📚 Additional Resources

- **Frontend Docs**: See `README_FRONTEND.md`
- **Backend API**: See `backend/README.md`
- **Quick Start**: See `QUICK_START.md`

## 💡 Tips

1. **Keep both servers running** - Backend and frontend need to run simultaneously
2. **Check browser console** - For any frontend errors
3. **Check terminal output** - For backend processing logs
4. **File format** - Ensure Excel files match the expected format (see QUICK_START.md)

## 🎯 Next Steps

1. ✅ Complete setup
2. ✅ Test with sample data
3. ✅ Customize styling (optional)
4. ✅ Deploy to production (optional)

Enjoy using Blackhole Infiverse! 🎉

