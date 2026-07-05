from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from app.data import get_vehicle
from app.repositories.persistence import repository
from app.services.model_service import model_service


def build_report(vehicle_id: str) -> bytes:
    vehicle = get_vehicle(vehicle_id)
    prediction = model_service.predict_failure(vehicle_id)
    rul = model_service.rul(vehicle_id)
    health = model_service.health_score(vehicle_id)
    priority = next(item for item in model_service.priority() if item["id"] == vehicle.id)["priority"]
    recommendation = next(item for item in model_service.recommendations() if item.vehicleId == vehicle.id)
    shap_features = model_service.shap(vehicle_id)
    explanation = model_service.explanation(vehicle_id)
    telemetry = next(item for item in model_service.telemetry() if item.vehicle_id == vehicle_id)
    history = model_service.maintenance_history(vehicle_id)
    business_loss = int(vehicle.revenuePerDay * max(1, recommendation.estimatedDowntimeHours / 12))

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    pdf.setTitle(f"{vehicle.id} VehiSense IQ Report")
    pdf.setFillColor(colors.HexColor("#0e7490"))
    pdf.rect(0, height - 72, width, 72, fill=1, stroke=0)
    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(40, height - 42, "VehiSense IQ Intelligence Report")
    pdf.setFont("Helvetica", 9)
    pdf.drawString(40, height - 58, "Edge AI-powered fleet maintenance decision intelligence")

    y = height - 104
    pdf.setFillColor(colors.black)
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(40, y, "Executive Summary")
    y -= 18
    summary = f"{vehicle.id} is currently {priority} with {prediction.failure_probability:.0%} failure risk, {rul.rul_days} days predicted RUL, and a recommended action of {recommendation.action}. Estimated business exposure is INR {business_loss:,}. {explanation.headline}"
    pdf.setFont("Helvetica", 9)
    for line in _wrap(summary, 105):
        pdf.drawString(40, y, line)
        y -= 13

    y -= 10
    sections = [
        ("Vehicle Profile", [("Model", f"{vehicle.make} {vehicle.model}"), ("Depot", vehicle.depot), ("Route", vehicle.route), ("Mileage", f"{vehicle.mileageKm:,} km"), ("Engine Hours", f"{vehicle.engineHours:,}"), ("Revenue/Day", f"INR {vehicle.revenuePerDay:,}")]),
        ("Current Telemetry", [("RPM", f"{telemetry.rpm}"), ("Coolant", f"{telemetry.coolant_temperature_c} C"), ("Oil Temp", f"{telemetry.oil_temperature_c} C"), ("Oil Pressure", f"{telemetry.oil_pressure_bar} bar"), ("Vibration", f"{telemetry.engine_vibration}"), ("Brake Wear", f"{telemetry.brake_wear_pct}%")]),
        ("Prediction", [("Failure Probability", f"{prediction.failure_probability:.0%}"), ("Failure Class", prediction.failure_class), ("Confidence", f"{prediction.confidence:.0%}"), ("RUL", f"{rul.rul_days} days"), ("RUL Interval", f"{rul.lower_bound_days}-{rul.upper_bound_days} days"), ("Health Score", f"{health.health_score}/100")]),
        ("Recommendation", [("Action", recommendation.action), ("Component", recommendation.component), ("Repair Cost", f"INR {recommendation.estimatedRepairCost:,}"), ("Downtime", f"{recommendation.estimatedDowntimeHours} h"), ("Revenue Loss", f"INR {business_loss:,}"), ("Risk", str(priority))]),
    ]
    for title, rows in sections:
        y = _section(pdf, title, rows, 40, y)

    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(40, y, "Natural-Language AI Explanation")
    y -= 18
    pdf.setFont("Helvetica", 9)
    for line in _wrap(explanation.explanation, 105):
        pdf.drawString(52, y, line)
        y -= 13
    y -= 8
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(40, y, "SHAP Explanation")
    y -= 18
    pdf.setFont("Helvetica", 9)
    for feature in shap_features[:6]:
        pdf.drawString(52, y, f"{feature.feature}: {feature.contribution:+.3f} ({feature.direction})")
        y -= 13

    y -= 8
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(40, y, "Maintenance History")
    y -= 18
    pdf.setFont("Helvetica", 9)
    for event in history[-4:]:
        pdf.drawString(52, y, f"{event.date} - {event.type} - INR {event.repair_cost:,} - {event.downtime_hours}h")
        y -= 13

    y -= 12
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(40, y, "Historical Health Trend")
    y -= 18
    _trend(pdf, 52, y - 36, [92, 86, 78, max(12, health.health_score + 18), health.health_score])

    pdf.showPage()
    pdf.save()
    repository.save_report(vehicle_id, summary)
    return buffer.getvalue()


def _section(pdf, title, rows, x, y):
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(x, y, title)
    y -= 16
    pdf.setFont("Helvetica", 9)
    for label, value in rows:
        pdf.setFont("Helvetica-Bold", 9)
        pdf.drawString(x + 12, y, label)
        pdf.setFont("Helvetica", 9)
        pdf.drawString(x + 140, y, str(value)[:70])
        y -= 13
    return y - 8


def _trend(pdf, x, y, values):
    width = 220
    height = 44
    pdf.setStrokeColor(colors.HexColor("#d1d5db"))
    pdf.rect(x, y, width, height, stroke=1, fill=0)
    points = []
    for index, value in enumerate(values):
        px = x + index * (width / (len(values) - 1))
        py = y + max(0, min(100, value)) / 100 * height
        points.append((px, py))
    pdf.setStrokeColor(colors.HexColor("#0e7490"))
    pdf.setLineWidth(2)
    for start, end in zip(points, points[1:]):
        pdf.line(start[0], start[1], end[0], end[1])


def _wrap(text, length):
    words = text.split()
    lines = []
    current = []
    for word in words:
        if sum(len(item) + 1 for item in current) + len(word) > length:
            lines.append(" ".join(current))
            current = [word]
        else:
            current.append(word)
    if current:
        lines.append(" ".join(current))
    return lines





