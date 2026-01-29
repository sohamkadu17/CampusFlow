# 🚀 CampusFlow Deployment Guide (100% Free Tier)

Complete guide to deploy CampusFlow on free hosting tiers.

## 📋 Prerequisites

- GitHub account
- Gmail account (for service sign-ups)
- Credit card (some services require it but won't charge for free tier)

## 🎯 Deployment Architecture

```
Frontend (Vercel) ←→ Backend (Railway) ←→ MongoDB Atlas (Database)
                         ↓
                   Cloudinary (Files)
                   Brevo (Emails)
                   Upstash (Redis - Optional)
```

---

## Step 1: Set Up MongoDB Atlas (Database) ✅ FREE FOREVER

### 1.1 Create Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google/GitHub
3. Choose **FREE** tier (M0)

### 1.2 Create Cluster
1. Click "Build a Database"
2. Select **M0 FREE** tier
3. Choose cloud provider (AWS recommended) and region (closest to you)
4. Cluster Name: `campusflow-cluster`
5. Click "Create"

### 1.3 Set Up Database Access
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `campusflow_user`
5. Password: Generate strong password (save it!)
6. Database User Privileges: "Read and write to any database"
7. Click "Add User"

### 1.4 Configure Network Access
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Confirm

### 1.5 Get Connection String
1. Go to "Databases" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string:
   ```
   mongodb+srv://campusflow_user:<password>@campusflow-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Add database name at the end: `/campusflow`
7. **Save this connection string** - you'll need it for Railway

---

## Step 2: Set Up Brevo (Email Service) ✅ FREE 300 emails/day

### 2.1 Create Account
1. Go to https://www.brevo.com
2. Sign up with email
3. Verify your email address

### 2.2 Get SMTP Credentials
1. Go to "Settings" (top right)
2. Click "SMTP & API"
3. Click "SMTP" tab
4. Note down:
   - **Server:** `smtp-relay.brevo.com`
   - **Port:** `587`
   - **Login:** (your login email)
   - **Password:** Click "Generate new SMTP key" and copy it
5. **Save these credentials**

### 2.3 Verify Sender Email (Optional but Recommended)
1. Go to "Senders" in left sidebar
2. Add your domain email or use Brevo's default

---

## Step 3: Set Up Cloudinary (File Storage) ✅ FREE 25 credits/month

### 3.1 Create Account
1. Go to https://cloudinary.com/users/register_free
2. Sign up with Google/GitHub
3. Verify email

### 3.2 Get API Credentials
1. Go to Dashboard
2. Note down:
   - **Cloud Name**
   - **API Key**
   - **API Secret**
3. **Save these credentials**

### 3.3 Create Upload Presets
1. Go to "Settings" → "Upload"
2. Scroll to "Upload presets"
3. Click "Add upload preset"
4. Name: `campusflow_uploads`
5. Signing Mode: "Unsigned"
6. Folder: `campusflow`
7. Save

---

## Step 4: Deploy Backend to Railway ✅ FREE 500 hours/month

### 4.1 Create Account
1. Go to https://railway.app
2. Sign up with GitHub
3. Authorize Railway

### 4.2 Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account
4. Select your CampusFlow repository
5. Select the `Backend` folder as root directory

### 4.3 Configure Build Settings
1. In project settings, set:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Root Directory:** `Backend`

### 4.4 Set Environment Variables
1. Click on your service
2. Go to "Variables" tab
3. Add the following variables:

```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-app.vercel.app (we'll update this later)

# MongoDB (from Step 1)
MONGODB_URI=mongodb+srv://campusflow_user:your-password@campusflow-cluster.xxxxx.mongodb.net/campusflow?retryWrites=true&w=majority

# JWT Secrets (generate random strings)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-characters
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Brevo Email (from Step 2)
EMAIL_FROM=noreply@campusflow.com
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your-brevo-login-email
BREVO_SMTP_PASS=your-brevo-smtp-key

# Cloudinary (from Step 3)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# OTP
OTP_EXPIRES_IN=600000
OTP_LENGTH=6
```

### 4.5 Deploy
1. Railway will automatically deploy
2. Wait for build to complete (5-10 minutes)
3. Go to "Settings" → "Networking"
4. Click "Generate Domain"
5. **Copy your backend URL** (e.g., `https://campusflow-backend.up.railway.app`)
6. Test health endpoint: `https://your-backend-url.railway.app/health`

---

## Step 5: Deploy Frontend to Vercel ✅ FREE

### 5.1 Create Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel

### 5.2 Import Project
1. Click "Add New..." → "Project"
2. Import your CampusFlow repository
3. **Root Directory:** Select `Frontend`
4. **Framework Preset:** Vite
5. Click "Deploy"

### 5.3 Set Environment Variables
1. Go to "Settings" → "Environment Variables"
2. Add:

```env
VITE_API_URL=https://your-backend-url.railway.app/api
```

Replace with your actual Railway backend URL from Step 4.5

### 5.4 Redeploy
1. Go to "Deployments"
2. Click "..." on latest deployment
3. Click "Redeploy"

### 5.5 Get Frontend URL
1. Copy your Vercel URL (e.g., `https://campusflow.vercel.app`)
2. **Go back to Railway** (Step 4)
3. Update `FRONTEND_URL` environment variable with your Vercel URL
4. Redeploy Railway backend

---

## Step 6: (Optional) Set Up Upstash Redis ✅ FREE 10K commands/day

Only needed if you're scaling Socket.IO across multiple instances.

### 6.1 Create Account
1. Go to https://upstash.com
2. Sign up with GitHub

### 6.2 Create Database
1. Click "Create Database"
2. Name: `campusflow-redis`
3. Type: Redis
4. Region: Choose closest to your Railway region
5. Click "Create"

### 6.3 Get Connection String
1. Copy the connection string (starts with `rediss://`)
2. Go to Railway → Variables
3. Add:
   ```env
   REDIS_URL=rediss://default:your-password@your-host.upstash.io:port
   ```

---

## Step 7: Configure Custom Domain (Optional)

### 7.1 For Frontend (Vercel)
1. Go to Vercel project → "Settings" → "Domains"
2. Add your domain: `campusflow.yourdomain.com`
3. Follow DNS configuration instructions
4. Vercel provides free SSL certificate

### 7.2 For Backend (Railway)
1. Go to Railway project → "Settings" → "Networking"
2. Add custom domain: `api.campusflow.yourdomain.com`
3. Follow DNS configuration instructions

---

## Step 8: Test Deployment

### 8.1 Test Backend
1. Visit: `https://your-backend-url.railway.app/health`
2. Should return: `{"status":"OK","timestamp":"..."}`

### 8.2 Test Frontend
1. Visit: `https://your-app.vercel.app`
2. Should load landing page
3. Try registering a new user
4. Check email for OTP

### 8.3 Check Logs
- **Railway:** Project → "View Logs"
- **Vercel:** Project → "Deployments" → Click deployment → "View Function Logs"

---

## Step 9: Set Up CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy CampusFlow

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install Backend Dependencies
        run: cd Backend && npm ci
      - name: Build Backend
        run: cd Backend && npm run build
      - name: Deploy to Railway
        run: echo "Railway auto-deploys on push to main"

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install Frontend Dependencies
        run: cd Frontend && npm ci
      - name: Build Frontend
        run: cd Frontend && npm run build
      - name: Deploy to Vercel
        run: echo "Vercel auto-deploys on push to main"
```

---

## 🎯 Free Tier Limits Summary

| Service | Free Tier Limit | What Happens if Exceeded |
|---------|----------------|--------------------------|
| **MongoDB Atlas** | 512MB storage | Need to upgrade |
| **Railway** | 500 hours/month (~20 days) | App sleeps, need to add credit |
| **Brevo** | 300 emails/day | Rate limited |
| **Cloudinary** | 25 credits/month (~25GB) | Rate limited |
| **Vercel** | Unlimited requests, 100GB bandwidth | Rate limited |
| **Upstash** | 10K commands/day | Rate limited |

### Tips to Stay Within Limits:
1. **Railway:** Put app to sleep during inactive hours or use Render free tier (750h/month)
2. **Brevo:** Use transactional emails only, not marketing
3. **Cloudinary:** Optimize image sizes before upload
4. **Database:** Clean up old data periodically

---

## 🐛 Troubleshooting

### Backend Won't Start
- Check Railway logs for errors
- Verify MongoDB connection string
- Ensure all environment variables are set

### Frontend Can't Connect to Backend
- Verify `VITE_API_URL` is correct
- Check CORS settings in backend
- Verify Railway backend is running

### Emails Not Sending
- Check Brevo SMTP credentials
- Verify email quota (300/day)
- Check Railway logs for email errors

### Database Connection Failed
- Verify MongoDB connection string
- Check if IP address is whitelisted (0.0.0.0/0)
- Verify database user credentials

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [Brevo API Documentation](https://developers.brevo.com)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

---

## ✅ Deployment Checklist

- [ ] MongoDB Atlas cluster created and connection string saved
- [ ] Brevo account created and SMTP credentials saved
- [ ] Cloudinary account created and API keys saved
- [ ] Backend deployed to Railway with all environment variables
- [ ] Backend health endpoint responding
- [ ] Frontend deployed to Vercel with API URL configured
- [ ] Frontend can reach backend API
- [ ] User registration with OTP working
- [ ] File uploads working (Cloudinary)
- [ ] Email notifications working (Brevo)
- [ ] (Optional) Custom domain configured
- [ ] (Optional) Redis configured for Socket.IO scaling

---

**Congratulations! 🎉 CampusFlow is now live and fully deployed on free tier services!**

For support, create an issue in the GitHub repository.
