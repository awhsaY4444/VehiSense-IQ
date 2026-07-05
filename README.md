# 🚛 VehiSense IQ

> AI-Powered Fleet Maintenance Decision Intelligence Platform

VehiSense IQ is a full-stack AI-powered fleet maintenance platform that helps fleet operators predict potential vehicle failures, estimate Remaining Useful Life (RUL), understand the reasons behind predictions using Explainable AI, and prioritize maintenance based on operational impact.

Rather than simply indicating that a vehicle may fail, VehiSense IQ helps answer:

- Which vehicle is at the highest risk?
- Why is it at risk?
- How soon could it fail?
- What is the expected business impact?
- Which vehicle should be repaired first?
- What maintenance action is recommended?

---

## ✨ Features

- Fleet Health Dashboard
- AI-based Failure Prediction
- Remaining Useful Life (RUL) Estimation
- Explainable AI using SHAP
- Maintenance Priority Ranking
- Intelligent Recommendation Engine
- Cost Impact Simulator
- Digital Twin Visualization
- Fleet Analytics Dashboard
- Automated PDF Report Generation
- Edge AI Telemetry Simulation
- Backend REST APIs using FastAPI

---

## 🏗️ System Architecture

```text
Vehicle Data
        │
        ▼
Telemetry Layer
        │
        ▼
Feature Engineering
        │
        ▼
XGBoost Models
        │
        ├── Failure Prediction
        ├── Remaining Useful Life
        └── SHAP Explainability
        │
        ▼
Decision Intelligence Engine
        │
        ▼
Dashboard • Reports • Recommendations
```

---

## 🤖 Machine Learning

### Failure Prediction

- Model: XGBoost Classifier
- Dataset: AI4I Predictive Maintenance Dataset
- Output:
  - Failure Probability
  - Failure Classification
  - Confidence Score

### Remaining Useful Life

- Model: XGBoost Regressor
- Dataset: NASA CMAPSS Turbofan Engine Dataset
- Output:
  - Remaining Useful Life
  - Confidence Interval

### Explainable AI

SHAP is used to explain model predictions by highlighting the features that contributed most to vehicle risk.

---

## 📊 Key Functionalities

- Predictive Maintenance
- Fleet Health Monitoring
- Remaining Useful Life Prediction
- AI Explainability
- Business-Aware Maintenance Prioritization
- Maintenance Recommendations
- Fleet Analytics
- Cost & Downtime Estimation
- Digital Twin
- PDF Reporting

---

## 🛠️ Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Recharts

### Backend

- FastAPI
- Python
- Pydantic
- ReportLab

### Machine Learning

- XGBoost
- SHAP
- Scikit-learn
- Pandas
- NumPy

### Database

- PostgreSQL Ready

---

## 📁 Project Structure

```
VehiSense-IQ
│
├── frontend/
├── backend/
│   ├── app/
│   ├── ml/
│   ├── models/
│   └── services/
│
├── docker-compose.yml
├── package.json
└── README.md
```

---

## 🚀 Running the Project

### Clone

```bash
git clone https://github.com/<YOUR_USERNAME>/VehiSense-IQ.git
cd VehiSense-IQ
```

### Backend

```bash
cd backend

python -m venv .venv

# Windows
.venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend

npm install

npm run dev
```

---

## 📡 Prototype vs Production

### Current Prototype

- Synthetic fleet records
- Simulated telemetry
- Real XGBoost models
- Real SHAP explanations
- AI-powered recommendations
- Digital Twin
- Cost simulator

### Production Deployment

The AI pipeline is designed to integrate with real vehicle telemetry from:

- OBD-II
- CAN Bus
- ECU
- GPS
- IoT Sensors
- Fleet Telematics Platforms

Only the telemetry source changes; the AI decision pipeline remains the same.

---

## 📈 Future Enhancements

- Live OBD-II Integration
- CAN Bus Support
- IoT Telemetry Streaming
- PostgreSQL Persistence
- JWT Authentication
- Fleet Mobile App
- Predictive Spare Parts Planning
- Multi-Fleet Management
- Cloud Deployment
- Personalized AI Models

---

## 📚 Datasets Used

### AI4I 2020 Predictive Maintenance Dataset
Used to train the XGBoost classifier for failure prediction and health assessment.

### NASA CMAPSS Turbofan Engine Dataset
Used to train the XGBoost regressor for Remaining Useful Life (RUL) prediction.

---

## ⚠️ Prototype Note

This prototype uses realistic synthetic fleet records together with simulated telemetry to demonstrate the complete AI decision pipeline. The machine learning models, SHAP explainability, and inference pipeline are fully functional.

For production deployment, the telemetry simulation layer can be replaced with real-time data from vehicle OBD-II ports, CAN Bus, ECU, GPS, and IoT sensors without changing the core AI architecture.

---

## 📜 License

This project was developed as part of a hackathon prototype and is intended for educational and research purposes.

---

## Production Deployment: Render + Vercel

This project is deployment-ready for the following hosting split:

- Frontend: React + Vite on Vercel
- Backend: FastAPI on Render using Docker

### Backend Deployment on Render

Create a new Render Web Service from this repository.

Recommended Render settings:

```text
Service type: Web Service
Environment: Docker
Root directory: backend
Dockerfile path: backend/Dockerfile
Health check path: /health
```

The backend Dockerfile starts FastAPI with Render's `PORT` environment variable:

```bash
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

Required Render environment variables:

```text
APP_ENV=production
CORS_ORIGINS=https://<your-vercel-app>.vercel.app
```

Optional Render environment variables:

```text
DATABASE_URL=<render-postgres-external-or-internal-url>
CORS_ORIGIN_REGEX=https://.*\.vercel\.app
```

Notes:

- Do not set `CORS_ORIGINS=*` in production. The backend rejects wildcard CORS outside development.
- If `DATABASE_URL` is not available, the app still starts and runs with in-memory/demo persistence disabled.
- Trained model files are included from `backend/models` during the Docker build.

Expected backend URL:

```text
https://vehisense-iq-api.onrender.com
```

Verify backend after deploy:

```text
https://vehisense-iq-api.onrender.com/health
```

Expected response:

```json
{"status":"ok","service":"VehiSense IQ API"}
```

### Frontend Deployment on Vercel

Create a Vercel project from this repository.

Recommended Vercel settings:

```text
Root directory: frontend
Framework preset: Vite
Build command: npm run build
Output directory: dist
```

Required Vercel environment variable:

```text
VITE_API_URL=https://vehisense-iq-api.onrender.com
```

Local development may omit `VITE_API_URL`; the frontend then uses `http://localhost:8000` only in Vite dev mode. Production builds must provide `VITE_API_URL`.

Expected frontend URL:

```text
https://vehisense-iq.vercel.app
```

### Deployment Order

1. Deploy the backend on Render.
2. Confirm `/health` works.
3. Add the Vercel URL to Render `CORS_ORIGINS`.
4. Deploy the frontend on Vercel with `VITE_API_URL` set to the Render backend URL.
5. Open the Vercel app and verify dashboard API data loads.

### Production Smoke Test Checklist

Verify these endpoints on Render:

```text
/health
/fleet
/predict
/rul
/health-score
/shap
/explanation
/recommendation
/priority
/telemetry
/alerts
/digital-twin
/timeline
/forecast
/analytics
/monitoring
/edge-inference
/report
```

Verify these frontend pages on Vercel:

```text
/login
/
/fleet
/fleet/<vehicle-id>
/explainable-ai
/priority
/recommendations
/simulator
/reports
/architecture
/digital-twin
/monitoring
/settings
```
