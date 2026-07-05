from app.schemas import Priority, Vehicle


FLEET: list[Vehicle] = [
    Vehicle(id="MH12-EV-4018", make="Tata", model="Ultra T.16", depot="Pune North", route="PNQ-AKL", active=True, healthScore=92, failureProbability=0.08, rulDays=126, priority=Priority.low, status="Operational", lastServiceDate="2026-06-03", mileageKm=148220, engineHours=5190, revenuePerDay=42000),
    Vehicle(id="KA05-HY-7781", make="Ashok Leyland", model="Boss 1415", depot="Bengaluru East", route="BLR-MYS", active=True, healthScore=68, failureProbability=0.31, rulDays=39, priority=Priority.medium, status="Inspection due", lastServiceDate="2026-05-17", mileageKm=213804, engineHours=7418, revenuePerDay=38000),
    Vehicle(id="GJ01-DL-2290", make="Eicher", model="Pro 3019", depot="Ahmedabad", route="AMD-SRT", active=True, healthScore=41, failureProbability=0.72, rulDays=9, priority=Priority.critical, status="At risk", lastServiceDate="2026-04-29", mileageKm=302911, engineHours=10940, revenuePerDay=51000),
    Vehicle(id="TN09-FL-1176", make="Tata", model="Prima 5530.S", depot="Chennai Port", route="MAA-BLR", active=True, healthScore=55, failureProbability=0.49, rulDays=21, priority=Priority.high, status="Service scheduled", lastServiceDate="2026-05-06", mileageKm=267455, engineHours=9361, revenuePerDay=58000),
    Vehicle(id="DL10-IC-8802", make="BharatBenz", model="1617R", depot="Delhi NCR", route="DEL-JAI", active=False, healthScore=36, failureProbability=0.81, rulDays=5, priority=Priority.critical, status="At risk", lastServiceDate="2026-04-14", mileageKm=338912, engineHours=12120, revenuePerDay=47000),
    Vehicle(id="MH14-CV-6388", make="Mahindra", model="Blazo X 28", depot="Pune South", route="PNQ-NAG", active=True, healthScore=77, failureProbability=0.21, rulDays=72, priority=Priority.medium, status="Operational", lastServiceDate="2026-06-12", mileageKm=184902, engineHours=6120, revenuePerDay=45000),
    Vehicle(id="RJ14-TR-5029", make="Tata", model="Signa 4825.TK", depot="Jaipur", route="JAI-DEL", active=True, healthScore=84, failureProbability=0.14, rulDays=94, priority=Priority.low, status="Operational", lastServiceDate="2026-06-18", mileageKm=165778, engineHours=5844, revenuePerDay=49000),
    Vehicle(id="TS08-MX-3419", make="Eicher", model="Pro 2059", depot="Hyderabad", route="HYD-VJA", active=True, healthScore=62, failureProbability=0.38, rulDays=31, priority=Priority.high, status="Inspection due", lastServiceDate="2026-05-23", mileageKm=236410, engineHours=8018, revenuePerDay=36000),
]


def get_vehicle(vehicle_id: str) -> Vehicle:
    return next((vehicle for vehicle in FLEET if vehicle.id == vehicle_id), FLEET[0])


def vehicle_exists(vehicle_id: str) -> bool:
    return any(vehicle.id == vehicle_id for vehicle in FLEET)
