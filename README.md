# VehiSense IQ

VehiSense IQ is an Edge AI-powered Fleet Maintenance Decision Intelligence Platform. It predicts failures, estimates remaining useful life, explains model drivers, prioritizes maintenance, simulates cost impact, and recommends optimal actions for fleet operators.

## Stack

- React + TypeScript + Vite
- Tailwind CSS with shadcn-style reusable components
- Framer Motion
- FastAPI + Python
- XGBoost + SHAP-ready service layer
- PostgreSQL
- Docker Compose

## Run

```bash
docker compose up --build
```

Frontend: http://localhost:5173  
Backend API: http://localhost:8000/docs

Demo login accepts any email and password with at least 6 characters.

## Project Structure

```text
frontend/   React application and design system
backend/    FastAPI application, schemas, AI services, report generation
docker-compose.yml
```

The backend currently uses deterministic production-shaped inference logic so the product works without bundled proprietary model artifacts. The `backend/app/services/model_service.py` module is structured for replacing the heuristic scorer with persisted XGBoost and SHAP artifacts.
