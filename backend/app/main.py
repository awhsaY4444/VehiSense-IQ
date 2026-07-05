from __future__ import annotations

import asyncio
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse

from app.core.config import settings
from app.data import vehicle_exists
from app.schemas import PredictionRequest, SensorPayload
from app.services.model_service import model_service
from app.services.report_service import build_report

app = FastAPI(title=settings.app_name, version="1.0.0", description="Edge AI-powered fleet maintenance decision intelligence APIs.")

app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origin_list, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def ensure_vehicle(vehicle_id: str) -> None:
    if not vehicle_exists(vehicle_id):
        raise HTTPException(status_code=404, detail=f"Vehicle '{vehicle_id}' was not found")
    
@app.get("/")
def root():
    return {
        "name": "VehiSense IQ API",
        "status": "Running",
        "version": "1.0.0",
        "documentation": "/docs",
        "health": "/health"
    }

@app.get("/health")
def health():
    return {"status": "ok", "service": settings.app_name}

@app.get("/fleet")
def fleet(search: str | None = None, priority: str | None = None, limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0)):
    rows = model_service.fleet()
    if search:
        rows = [row for row in rows if search.lower() in f"{row['id']} {row['depot']} {row['route']}".lower()]
    if priority:
        rows = [row for row in rows if str(row["priority"]) == priority or getattr(row["priority"], "value", None) == priority]
    return rows[offset: offset + limit]

@app.post("/predict")
def predict(payload: PredictionRequest):
    ensure_vehicle(payload.vehicle_id)
    return model_service.predict_failure(payload.vehicle_id, payload)

@app.get("/rul")
def rul(vehicle_id: str):
    ensure_vehicle(vehicle_id)
    return model_service.rul(vehicle_id)

@app.get("/health-score")
def health_score(vehicle_id: str):
    ensure_vehicle(vehicle_id)
    return model_service.health_score(vehicle_id)

@app.get("/shap")
def shap(vehicle_id: str):
    ensure_vehicle(vehicle_id)
    return model_service.shap(vehicle_id)

@app.get("/explanation")
def explanation(vehicle_id: str):
    ensure_vehicle(vehicle_id)
    return model_service.explanation(vehicle_id)

@app.get("/recommendation")
def recommendation():
    return model_service.recommendations()

@app.get("/priority")
def priority():
    return model_service.priority()

@app.get("/telemetry")
def telemetry():
    return model_service.telemetry()

@app.get("/alerts")
def alerts():
    return model_service.alerts()

@app.get("/digital-twin")
def digital_twin():
    return model_service.digital_twins()

@app.get("/maintenance-history")
def maintenance_history(vehicle_id: str):
    ensure_vehicle(vehicle_id)
    return model_service.maintenance_history(vehicle_id)

@app.get("/timeline")
def timeline(vehicle_id: str):
    ensure_vehicle(vehicle_id)
    return model_service.timeline(vehicle_id)

@app.get("/forecast")
def forecast():
    return model_service.forecast()

@app.get("/analytics")
def analytics():
    return model_service.analytics()

@app.get("/monitoring")
def monitoring():
    return model_service.monitoring()

@app.post("/demo/tick")
def demo_tick():
    return model_service.demo_tick()

@app.get("/stream")
async def stream():
    async def events():
        while True:
            yield f"data: {model_service.stream_payload()}\n\n"
            await asyncio.sleep(4)
    return StreamingResponse(events(), media_type="text/event-stream")

@app.post("/edge-inference")
def edge_inference(payload: SensorPayload):
    ensure_vehicle(payload.vehicle_id)
    return model_service.edge_inference(payload)

@app.get("/report")
def report(vehicle_id: str):
    ensure_vehicle(vehicle_id)
    pdf = build_report(vehicle_id)
    headers = {"Content-Disposition": f'attachment; filename="{vehicle_id}-vehisense-report.pdf"'}
    return Response(content=pdf, media_type="application/pdf", headers=headers)



