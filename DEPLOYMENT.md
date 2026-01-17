# Deployment Guide

This guide will help you deploy the Attendance Processing System to Vercel (Frontend) and Render (Backend).

## Prerequisites

1. **GitHub Account**: Push your code to GitHub
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Render Account**: Sign up at [render.com](https://render.com)

---

## Part 1: Deploy Backend to Render

### Step 1: Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `biometric-blackhole` (or your preferred name)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && python api.py`
   - **Plan**: Free (or your preferred plan)

### Step 3: Set Environment Variables (Optional)

In Render Dashboard → Your Service → Environment:
- `PORT`: `5000` (optional, Render provides this automatically)
- `FLASK_ENV`: `production` (optional)

### Step 4: Deploy

Click **"Create Web Service"**. Render will:
- Build your backend
- Deploy it
- Provide a URL like: `https://biometric-blackhole.onrender.com`

**Note**: Copy this URL - you'll need it for the frontend configuration!

### Step 5: Test Backend

Visit: `https://your-app-name.onrender.com/api/health`

You should see: `{"status": "healthy", "message": "API is running"}`

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### Step 2: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Set Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

Add:
- **Key**: `VITE_API_BASE_URL`
- **Value**: `https://biometric-blackhole.onrender.com` (Your Render backend URL)
  
**IMPORTANT**: Make sure to use the correct backend URL. If your Render service is named differently, use that URL instead.

**Important**: 
- For Production, Preview, and Development environments, set the same value
- Without the trailing slash `/`

### Step 4: Deploy

Click **"Deploy"**. Vercel will:
- Build your frontend
- Deploy it
- Provide a URL like: `https://your-app.vercel.app`

---

## Part 3: Update CORS in Backend (If Needed)

If you encounter CORS errors, update `backend/api.py`:

```python
# Update CORS to allow your Vercel domain
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://your-app.vercel.app",
            "http://localhost:3000"
        ]
    }
})
```

Or allow all origins (for testing):

```python
CORS(app)  # Already set, allows all origins
```

---

## Part 4: Alternative - Deploy via CLI

### Backend (Render CLI)

```bash
# Install Render CLI
curl -fsSL https://render.com/install.sh | sh

# Login
render login

# Deploy (from project root)
render deploy
```

### Frontend (Vercel CLI)

```bash
cd frontend

# Login
vercel login

# Deploy
vercel

# Set environment variable
vercel env add VITE_API_BASE_URL

# Redeploy
vercel --prod
```

---

## Troubleshooting

### Backend Issues

1. **Build Fails**: Check `backend/requirements.txt` is correct
2. **App Crashes**: Check Render logs for errors
3. **CORS Errors**: Update CORS configuration in `api.py`

### Frontend Issues

1. **Build Fails**: Check `frontend/package.json` dependencies
2. **API Not Working**: Verify `VITE_API_BASE_URL` environment variable is set
3. **404 Errors**: Check `vercel.json` rewrites configuration

### Common Solutions

1. **Clear Build Cache**: 
   - Vercel: Project Settings → Clear Build Cache
   - Render: Redeploy

2. **Check Logs**:
   - Vercel: Deployment → Logs
   - Render: Logs tab

3. **Environment Variables**:
   - Ensure all variables are set correctly
   - Redeploy after adding new variables

---

## File Structure for Deployment

```
Biometric--main/
├── backend/
│   ├── api.py
│   ├── attendance_processor.py
│   ├── requirements.txt
│   └── start.sh
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.js
├── render.yaml
└── DEPLOYMENT.md
```

---

## Post-Deployment Checklist

- [ ] Backend is accessible at Render URL
- [ ] `/api/health` endpoint returns success
- [ ] Frontend is accessible at Vercel URL
- [ ] Environment variable `VITE_API_BASE_URL` is set
- [ ] Frontend can connect to backend API
- [ ] File upload works
- [ ] Reports generation works
- [ ] PDF download works

---

## Production Tips

1. **Enable HTTPS**: Both Vercel and Render provide HTTPS automatically
2. **Set up Custom Domains**: Configure in both platforms
3. **Monitor Logs**: Regularly check for errors
4. **Update Dependencies**: Keep packages updated
5. **Backup Data**: Ensure important data is backed up

---

## Support

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Render Docs: [render.com/docs](https://render.com/docs)
- Flask Docs: [flask.palletsprojects.com](https://flask.palletsprojects.com)
- React Docs: [react.dev](https://react.dev)

