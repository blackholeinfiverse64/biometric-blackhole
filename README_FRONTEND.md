# Blackhole Infiverse - Professional React Frontend

A modern, professional SaaS-style React frontend for the Attendance Processing System.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.8+ with Flask backend running

### Installation

1. **Install Frontend Dependencies**
```bash
cd frontend
npm install
```

2. **Install Backend Dependencies**
```bash
cd backend
pip install -r requirements.txt
```

### Running the Application

1. **Start the Backend API** (Terminal 1)
```bash
cd backend
python api.py
```
The API will run on `http://localhost:5000`

2. **Start the React Frontend** (Terminal 2)
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:3000`

### Building for Production

```bash
cd frontend
npm run build
```

The production build will be in `frontend/dist/`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── Layout.jsx          # Main layout with navigation
│   ├── pages/
│   │   ├── Dashboard.jsx       # Home dashboard with stats
│   │   ├── Upload.jsx          # File upload and processing
│   │   └── Reports.jsx         # Detailed reports and charts
│   ├── App.jsx                 # Main app router
│   ├── main.jsx                # React entry point
│   └── index.css               # Global styles with Tailwind
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🎨 Features

- **Modern SaaS Design**: Professional, clean interface with gradient accents
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Interactive Dashboard**: Real-time statistics and metrics
- **File Upload**: Drag-and-drop Excel file upload with validation
- **Data Visualization**: Beautiful charts using Recharts
- **Real-time Processing**: Live feedback during file processing
- **Download Reports**: One-click Excel report downloads

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Recharts** - Beautiful chart library
- **Lucide React** - Modern icon library

## 📡 API Integration

The frontend communicates with the Flask backend API:

- `GET /api/health` - Health check
- `POST /api/process` - Process attendance file
- `GET /api/download/<filename>` - Download processed report

## 🎯 Pages

### Dashboard (`/`)
- Overview statistics
- Feature highlights
- Quick action buttons

### Upload (`/upload`)
- File upload interface
- Configuration options (year, month, hours)
- Processing status and results
- Download processed reports

### Reports (`/reports`)
- Comprehensive data visualization
- Employee statistics
- Interactive charts
- Monthly summary tables

## 🔧 Configuration

### API Endpoint
Update the proxy in `vite.config.js` if your backend runs on a different port:

```js
proxy: {
  '/api': {
    target: 'http://localhost:5000',  // Change if needed
    changeOrigin: true,
  }
}
```

### Styling
Customize colors in `tailwind.config.js`:

```js
colors: {
  primary: {
    // Your custom color palette
  }
}
```

## 📝 Development

### Adding New Pages
1. Create component in `src/pages/`
2. Add route in `src/App.jsx`
3. Add navigation link in `src/components/Layout.jsx`

### Adding New Components
Create reusable components in `src/components/` and import where needed.

## 🐛 Troubleshooting

**Issue: API connection failed**
- Ensure backend is running on port 5000
- Check CORS settings in `backend/api.py`

**Issue: Build errors**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

**Issue: Styles not applying**
- Ensure Tailwind is properly configured
- Check `postcss.config.js` exists
- Restart dev server

## 📄 License

Part of the Attendance Processing System project.

