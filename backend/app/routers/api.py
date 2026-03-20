from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse

from app.services import tms


router = APIRouter(prefix="/api")


@router.get("/orders")
def orders():
    return tms.get_orders()


@router.get("/drivers")
def drivers():
    return tms.get_drivers()


@router.post("/drivers")
async def drivers_save(request: Request):
    body = await request.json()
    driver = body.get("driver")
    if not driver:
        raise HTTPException(status_code=400, detail="Driver is required")
    return tms.save_driver(driver)


@router.delete("/drivers")
async def drivers_remove(request: Request):
    body = await request.json()
    driver_id = body.get("driverId")
    if not driver_id:
        raise HTTPException(status_code=400, detail="Driver ID is required")
    return tms.remove_driver(driver_id)


@router.get("/fleet")
def fleet():
    return tms.get_fleet()


@router.post("/fleet")
async def fleet_save(request: Request):
    body = await request.json()
    vehicle = body.get("vehicle")
    if not vehicle:
        raise HTTPException(status_code=400, detail="Vehicle is required")
    return tms.save_fleet(vehicle)


@router.delete("/fleet")
async def fleet_remove(request: Request):
    body = await request.json()
    vehicle_id = body.get("vehicleId")
    if not vehicle_id:
        raise HTTPException(status_code=400, detail="Vehicle ID is required")
    return tms.remove_fleet(vehicle_id)


@router.get("/gatepasses")
def gatepasses():
    return tms.get_gatepasses()


@router.post("/gatepasses")
async def gatepasses_save(request: Request):
    body = await request.json()
    if body.get("statusUpdate"):
        status_update = body["statusUpdate"]
        existing = tms.fetch_one("SELECT id FROM gate_passes WHERE gate_pass_number = %s LIMIT 1", (status_update["id"],))
        if not existing:
            raise HTTPException(status_code=404, detail="Gate pass not found")
        tms.execute("UPDATE gate_passes SET gate_status = %s WHERE id = %s", (status_update["status"].lower(), existing["id"]))
        return tms.get_gatepasses()

    gate_pass = body.get("gatePass")
    if not gate_pass:
        raise HTTPException(status_code=400, detail="Gate pass payload is required")

    count = tms.fetch_one("SELECT COUNT(*) AS count FROM gate_passes")["count"]
    vehicle = tms.fetch_one("SELECT id FROM vehicles WHERE vehicle_number = %s LIMIT 1", (gate_pass["vehicleId"],))
    driver = tms.fetch_one("SELECT id FROM drivers WHERE driver_code = %s LIMIT 1", (gate_pass["driverId"],))
    if not vehicle or not driver:
        raise HTTPException(status_code=400, detail="Vehicle or driver not found")
    tms.execute(
        """
        INSERT INTO gate_passes (gate_pass_number, vehicle_id, driver_id, gate_status, security_person_name, remarks, exit_time)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (
            f"GP-{500 + int(count) + 1}",
            vehicle["id"],
            driver["id"],
            gate_pass["approvalStatus"].lower(),
            gate_pass["requestedBy"],
            gate_pass["purpose"],
            gate_pass.get("expectedReturn") or None,
        ),
    )
    return tms.get_gatepasses()


@router.get("/trips")
def trips():
    return tms.get_trips()


@router.get("/invoices")
def invoices():
    return tms.get_invoices()


@router.post("/auth/login")
async def auth_login(request: Request):
    body = await request.json()
    result = tms.authenticate_user_from_db(body.get("organization", ""), body.get("userId", ""), body.get("password", ""))
    if not result:
        return JSONResponse(status_code=401, content={"error": "Invalid organization, User ID, or Password."})
    return result


@router.get("/auth/session")
def auth_session(token: str = Query(default="")):
    session = tms.get_session_from_token(token)
    if not session:
        return JSONResponse(status_code=401, content={"session": None})
    return {"session": session}


@router.post("/auth/logout")
async def auth_logout(request: Request):
    body = await request.json()
    tms.clear_session_token(body.get("token", ""))
    return {"ok": True}


@router.get("/organizations")
def organizations():
    return {"organizations": tms.get_organizations_from_db()}


@router.post("/organizations")
async def organizations_save(request: Request):
    body = await request.json()
    return {"organizations": tms.save_organizations_to_db(body.get("organizations", []))}


@router.delete("/organizations")
async def organizations_remove(request: Request):
    body = await request.json()
    try:
        return {"organizations": tms.delete_organization_in_db(body.get("organizationName", ""))}
    except HTTPException as exc:
        return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@router.post("/organizations/reset")
def organizations_reset():
    return {"organizations": tms.reset_organizations_in_db()}


@router.get("/users")
def users():
    return {"users": tms.get_users_from_db()}


@router.post("/users")
async def users_save(request: Request):
    body = await request.json()
    return {"users": tms.save_users_to_db(body.get("users", []))}


@router.delete("/users")
async def users_remove(request: Request):
    body = await request.json()
    try:
        return {"users": tms.delete_user_in_db(body.get("organization", ""), body.get("userId", ""))}
    except HTTPException as exc:
        return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@router.post("/users/reset")
def users_reset():
    return {"users": tms.reset_users_in_db()}


@router.get("/settings")
def settings():
    return {"settings": tms.get_app_settings()}


@router.post("/settings")
async def settings_save(request: Request):
    body = await request.json()
    settings = body.get("settings") or {
        "companyName": "",
        "contactEmail": "",
        "googleMapsKey": "",
        "gpsProvider": "JioGPS",
    }
    return {"settings": tms.save_app_settings(settings)}


@router.get("/api-setup")
def api_setup():
    return {"setup": tms.get_api_setup()}


@router.post("/api-setup")
async def api_setup_save(request: Request):
    body = await request.json()
    setup = body.get("setup") or {
        "provider": "SAP S/4HANA",
        "baseUrl": "",
        "authType": "Bearer Token",
        "clientId": "",
        "clientSecret": "",
        "orderEndpoint": "",
        "syncMethod": "Pull every 15 minutes",
        "orderIdField": "VBELN",
        "customerField": "KUNNR",
        "sourceField": "WERKS_FROM",
        "destinationField": "WERKS_TO",
        "weightField": "BRGEW",
        "volumeField": "VOLUM",
        "status": "Draft",
    }
    return {"setup": tms.save_api_setup(setup)}


@router.get("/maintenance")
def maintenance():
    return {"entries": tms.get_maintenance_entries()}


@router.post("/maintenance")
async def maintenance_save(request: Request):
    body = await request.json()
    entry = body.get("entry")
    if not entry:
        raise HTTPException(status_code=400, detail="Entry is required")
    return {"entries": tms.create_maintenance_entry(entry)}


@router.get("/routes-map")
def routes_map():
    return {"routes": tms.get_transport_routes()}


@router.post("/routes-map")
async def routes_map_save(request: Request):
    body = await request.json()
    route = body.get("route")
    if not route:
        raise HTTPException(status_code=400, detail="Route is required")
    return {"routes": tms.create_transport_route(route)}


@router.get("/weighments")
def weighments():
    return {"weighments": tms.get_weighments()}


@router.post("/weighments")
async def weighments_save(request: Request):
    body = await request.json()
    weighment = body.get("weighment")
    if not weighment:
        raise HTTPException(status_code=400, detail="Weighment is required")
    return {"weighments": tms.create_weighment(weighment)}


@router.get("/vehicle-assignments")
def vehicle_assignments():
    return {"assignments": tms.get_vehicle_assignments()}


@router.post("/vehicle-assignments")
async def vehicle_assignments_save(request: Request):
    body = await request.json()
    return {"assignments": tms.save_vehicle_assignments(body.get("assignments", []))}
