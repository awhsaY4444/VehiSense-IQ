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

---

# 🌐 Live Demo

### Frontend
https://vehisense-iq.vercel.app

### Backend API
https://vehisense-iq-1.onrender.com

### API Documentation (Swagger UI)
https://vehisense-iq-1.onrender.com/docs

### Health Check
https://vehisense-iq-1.onrender.com/health

---

# 🚀 Deployment

VehiSense IQ is deployed using:

- **Frontend:** Vercel
- **Backend:** Render (Docker + FastAPI)

## Backend

**Platform:** Render

Configuration

```text
Environment: Docker
Root Directory: backend
Dockerfile: backend/Dockerfile
Health Check Path: /health
```

Environment Variables

```text
APP_ENV=production
CORS_ORIGINS=https://vehisense-iq.vercel.app
```

Backend URL

```text
https://vehisense-iq-1.onrender.com
```

---

## Frontend

**Platform:** Vercel

Configuration

```text
Framework: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

Environment Variable

```text
VITE_API_URL=https://vehisense-iq-1.onrender.com
```

Frontend URL

```text
https://vehisense-iq.vercel.app
```

---

# 🧪 Production Smoke Test

### Backend Endpoints

```text
GET  /health
GET  /fleet
POST /predict
GET  /rul
GET  /health-score
GET  /shap
GET  /explanation
GET  /recommendation
GET  /priority
GET  /telemetry
GET  /alerts
GET  /digital-twin
GET  /timeline
GET  /forecast
GET  /analytics
GET  /monitoring
POST /edge-inference
GET  /report
```

Swagger Documentation

```text
https://vehisense-iq-1.onrender.com/docs
```

Frontend Application

```text
https://vehisense-iq.vercel.app
```

---

## 📦 Deployment Architecture

```text
React + Vite (Frontend)
        │
        ▼
     Vercel
        │
        │ HTTPS
        ▼
FastAPI + XGBoost + SHAP
        │
        ▼
 Render (Docker)
```
