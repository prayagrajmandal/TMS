import hashlib
import os
import secrets
import threading
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any

from fastapi import APIRouter, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from psycopg import connect
from psycopg.rows import dict_row


BASE_DIR = Path(__file__).resolve().parents[2]


def load_env_file() -> None:
    env_path = BASE_DIR / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env_file()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")

ACCESS_OPTIONS = [
    {"label": "Dashboard", "route": "/dashboard"},
    {"label": "Orders", "route": "/orders"},
    {"label": "Planning", "route": "/planning"},
    {"label": "Vehicle Assignment", "route": "/vehicleassignment"},
    {"label": "Trips", "route": "/trips"},
    {"label": "Tracking", "route": "/tracking"},
    {"label": "Route Map", "route": "/routemap"},
    {"label": "Drivers", "route": "/drivers"},
    {"label": "Fleet", "route": "/fleet"},
    {"label": "Vehicle", "route": "/vehicledriver"},
    {"label": "Maintenance", "route": "/maintenance"},
    {"label": "Track Scale", "route": "/trackscale"},
    {"label": "Gate Pass", "route": "/gatepass"},
    {"label": "Billing", "route": "/billing"},
]

ROLE_LABELS = {
    "super-admin": "Super Admin",
    "admin": "Admin",
    "head-office": "Head Office",
    "gate": "Gate Pass",
    "maintenance": "Maintenance",
    "vehicle-assignment": "Vehicle Assignment",
}

ROLE_PERMISSION_MAP = {
    "super-admin": ["/superadmin", "/settings"],
    "admin": ["/admin"],
    "head-office": [item["route"] for item in ACCESS_OPTIONS],
    "gate": ["/gatepass", "/vehicleassignment"],
    "maintenance": ["/maintenance"],
    "vehicle-assignment": ["/vehicleassignment"],
}

DEFAULT_ORGANIZATIONS = [
    {"name": "Pro", "maxUsers": 5, "address": "", "phone": "", "country": "India", "email": "", "pan": ""}
]

DEFAULT_DEMO_USERS = [
    {
        "userId": "supad",
        "password": "1234",
        "name": "Super Administrator",
        "email": "superadmin@platform.local",
        "department": "Platform",
        "roles": ["super-admin"],
        "accessRoutes": ["/superadmin", "/settings"],
        "organization": "Platform",
    },
    {
        "userId": "admin",
        "password": "1234",
        "name": "Administrator",
        "email": "admin@pro.local",
        "department": "Administration",
        "roles": ["admin"],
        "accessRoutes": ["/admin"],
        "organization": "Pro",
    },
    {
        "userId": "heado",
        "password": "1234",
        "name": "Head Office",
        "email": "headoffice@pro.local",
        "department": "Operations",
        "roles": ["head-office"],
        "accessRoutes": [item["route"] for item in ACCESS_OPTIONS],
        "organization": "Pro",
    },
    {
        "userId": "gate1",
        "password": "1234",
        "name": "Gate Officer",
        "email": "gate@pro.local",
        "department": "Gate",
        "roles": ["gate"],
        "accessRoutes": ["/gatepass", "/vehicleassignment"],
        "organization": "Pro",
    },
    {
        "userId": "maint",
        "password": "1234",
        "name": "Maintenance Officer",
        "email": "maintenance@pro.local",
        "department": "Maintenance",
        "roles": ["maintenance"],
        "accessRoutes": ["/maintenance"],
        "organization": "Pro",
    },
    {
        "userId": "vehas",
        "password": "1234",
        "name": "Vehicle Assignment Officer",
        "email": "vehicle@pro.local",
        "department": "Transport",
        "roles": ["vehicle-assignment"],
        "accessRoutes": ["/vehicleassignment"],
        "organization": "Pro",
    },
]

bootstrap_lock = threading.Lock()
bootstrap_ready = False
custom_table_lock = threading.Lock()
custom_tables_ready = False


@contextmanager
def db_cursor():
    with connect(DATABASE_URL, row_factory=dict_row) as connection:
        with connection.cursor() as cursor:
            yield cursor
        connection.commit()


def fetch_all(sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    with db_cursor() as cursor:
        cursor.execute(sql, params)
        return list(cursor.fetchall())


def fetch_one(sql: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
    with db_cursor() as cursor:
        cursor.execute(sql, params)
        return cursor.fetchone()


def execute(sql: str, params: tuple[Any, ...] = ()) -> None:
    with db_cursor() as cursor:
        cursor.execute(sql, params)


def route_to_permission_code(route: str) -> str:
    return route.replace("/", "").replace("/", "-") or "root"


def permission_code_to_route(code: str) -> str | None:
    for item in ACCESS_OPTIONS:
        if route_to_permission_code(item["route"]) == code:
            return item["route"]
    return None


def make_slug(value: str) -> str:
    slug = []
    previous_dash = False
    for char in value.strip().lower():
        if char.isalnum():
            slug.append(char)
            previous_dash = False
        elif not previous_dash:
            slug.append("-")
            previous_dash = True
    return "".join(slug).strip("-")[:24]


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    hashed_input = hash_password(password)
    return secrets.compare_digest(hashed_input, password_hash) or secrets.compare_digest(password, password_hash)


def get_default_access_for_roles(roles: list[str]) -> list[str]:
    if "admin" in roles and "super-admin" not in roles:
        return ["/admin"]
    routes: list[str] = []
    for role in roles:
        routes.extend(ROLE_PERMISSION_MAP.get(role, []))
    return list(dict.fromkeys(routes))


def capitalize_status(status: str | None, default: str) -> str:
    if not status:
        return default
    lowered = status.lower()
    replacements = {"on trip": "On Trip", "on break": "On Break", "in transit": "In Transit"}
    return replacements.get(lowered, lowered[:1].upper() + lowered[1:])


def title_case(value: str | None, default: str) -> str:
    if not value:
        return default
    lowered = value.lower()
    return lowered[:1].upper() + lowered[1:]


def decimal_to_float(value: Any) -> float:
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def format_ymd(value: Any, default: str = "") -> str:
    if not value:
        return default
    if hasattr(value, "date"):
        try:
            return value.date().isoformat()
        except Exception:
            pass
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def format_timestamp(value: Any, default: str = "N/A") -> str:
    if not value:
        return default
    if hasattr(value, "isoformat"):
        return value.isoformat(timespec="minutes").replace("T", " ")
    return str(value)


def format_trip_datetime(value: Any) -> str:
    if not value:
        return "N/A"
    if hasattr(value, "strftime"):
        try:
            return value.strftime("%b %#d, %H:%M")
        except ValueError:
            return value.strftime("%b %-d, %H:%M")
    return str(value)


def format_number_indian(value: float) -> str:
    rounded = int(round(value))
    text = str(rounded)
    if len(text) <= 3:
        return text
    last_three = text[-3:]
    remaining = text[:-3]
    groups = []
    while len(remaining) > 2:
        groups.insert(0, remaining[-2:])
        remaining = remaining[:-2]
    if remaining:
        groups.insert(0, remaining)
    return ",".join(groups + [last_three])


def to_organization_config(row: dict[str, Any]) -> dict[str, Any]:
    address = ", ".join(part for part in [row.get("address_line_1"), row.get("address_line_2")] if part)
    return {
        "name": row["name"],
        "maxUsers": row.get("max_users") or 0,
        "address": address,
        "phone": row.get("phone") or "",
        "country": row.get("country") or "",
        "email": row.get("email") or "",
        "pan": row.get("pan_number") or "",
    }


def get_user_with_relations(db_user_id: str) -> dict[str, Any] | None:
    user = fetch_one(
        """
        SELECT u.id, u.user_id, u.name, u.email, u.password_hash, u.department_id, o.name AS organization_name
        FROM users u
        LEFT JOIN organizations o ON o.id = u.organization_id
        WHERE u.id = %s
        LIMIT 1
        """,
        (db_user_id,),
    )
    if not user:
        return None

    roles = fetch_all(
        """
        SELECT r.code
        FROM user_roles ur
        LEFT JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = %s
        """,
        (db_user_id,),
    )
    permissions = fetch_all(
        """
        SELECT p.code
        FROM user_permissions up
        LEFT JOIN permissions p ON p.id = up.permission_id
        WHERE up.user_id = %s
        """,
        (db_user_id,),
    )
    user["roles"] = [item["code"] for item in roles if item.get("code")]
    user["permissions"] = [item["code"] for item in permissions if item.get("code")]
    return user


def to_session(user: dict[str, Any]) -> dict[str, Any]:
    custom_routes = [permission_code_to_route(code) for code in user.get("permissions", [])]
    access_routes = [route for route in custom_routes if route]
    return {
        "userId": user.get("user_id") or "",
        "name": user.get("name") or "",
        "roles": user.get("roles", []),
        "accessRoutes": list(dict.fromkeys(access_routes)) if access_routes else get_default_access_for_roles(user.get("roles", [])),
        "organization": user.get("organization_name") or "",
    }


def ensure_custom_tables() -> None:
    global custom_tables_ready
    if custom_tables_ready:
        return

    with custom_table_lock:
        if custom_tables_ready:
            return

        statements = [
            """
            CREATE TABLE IF NOT EXISTS app_settings (
              id TEXT PRIMARY KEY,
              company_name TEXT NOT NULL,
              contact_email TEXT NOT NULL,
              google_maps_key TEXT NOT NULL DEFAULT '',
              gps_provider TEXT NOT NULL DEFAULT 'JioGPS',
              updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """,
            """
            INSERT INTO app_settings (id, company_name, contact_email, google_maps_key, gps_provider)
            VALUES ('default', 'NextGen Logistics Pvt. Ltd.', 'ops@nextgenlogistics.in', '', 'JioGPS')
            ON CONFLICT (id) DO NOTHING
            """,
            """
            CREATE TABLE IF NOT EXISTS api_setups (
              id TEXT PRIMARY KEY,
              provider TEXT NOT NULL,
              base_url TEXT NOT NULL,
              auth_type TEXT NOT NULL,
              client_id TEXT NOT NULL,
              client_secret TEXT NOT NULL,
              order_endpoint TEXT NOT NULL,
              sync_method TEXT NOT NULL,
              order_id_field TEXT NOT NULL,
              customer_field TEXT NOT NULL,
              source_field TEXT NOT NULL,
              destination_field TEXT NOT NULL,
              weight_field TEXT NOT NULL,
              volume_field TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'Draft',
              updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """,
            """
            INSERT INTO api_setups (
              id, provider, base_url, auth_type, client_id, client_secret, order_endpoint, sync_method,
              order_id_field, customer_field, source_field, destination_field, weight_field, volume_field, status
            )
            VALUES (
              'default', 'SAP S/4HANA', 'https://sap-pro.company.com/api', 'Bearer Token', 'nextgen-tms', '',
              '/orders/open', 'Pull every 15 minutes', 'VBELN', 'KUNNR', 'WERKS_FROM', 'WERKS_TO', 'BRGEW', 'VOLUM', 'Draft'
            )
            ON CONFLICT (id) DO NOTHING
            """,
            """
            CREATE TABLE IF NOT EXISTS maintenance_entries (
              id TEXT PRIMARY KEY,
              vehicle_id TEXT NOT NULL,
              vehicle_number TEXT NOT NULL,
              maintenance_type TEXT NOT NULL,
              service_date DATE NOT NULL,
              next_due_date DATE,
              service_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
              workshop_name TEXT NOT NULL,
              notes TEXT NOT NULL DEFAULT '',
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS transport_routes_custom (
              id TEXT PRIMARY KEY,
              route_name TEXT NOT NULL,
              start_location TEXT NOT NULL,
              end_location TEXT NOT NULL,
              via_points TEXT NOT NULL DEFAULT '',
              vehicle_type TEXT NOT NULL,
              distance_km NUMERIC(12, 2) NOT NULL DEFAULT 0,
              estimated_time TEXT NOT NULL,
              color TEXT NOT NULL DEFAULT '#1A73E8',
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS weighments (
              id TEXT PRIMARY KEY,
              vehicle_id TEXT NOT NULL,
              weighment_type TEXT NOT NULL,
              gross_weight NUMERIC(12, 2) NOT NULL DEFAULT 0,
              tare_weight NUMERIC(12, 2) NOT NULL DEFAULT 0,
              net_weight NUMERIC(12, 2) NOT NULL DEFAULT 0,
              material TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'Completed',
              recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS vehicle_assignments (
              id TEXT PRIMARY KEY,
              delivery_id TEXT NOT NULL UNIQUE,
              customer TEXT NOT NULL,
              source TEXT NOT NULL,
              destination TEXT NOT NULL,
              quantity_kg NUMERIC(12, 2) NOT NULL DEFAULT 0,
              load_type TEXT NOT NULL,
              recommended_truck_size TEXT NOT NULL,
              assigned_vehicle_id TEXT NOT NULL,
              assigned_vehicle_type TEXT NOT NULL,
              assigned_vehicle_capacity TEXT NOT NULL,
              assigned_by TEXT NOT NULL,
              assigned_by_user_id TEXT NOT NULL,
              organization TEXT NOT NULL,
              notes TEXT NOT NULL DEFAULT '',
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """,
        ]
        for statement in statements:
            execute(statement)
        custom_tables_ready = True


def ensure_role(role: str) -> dict[str, Any]:
    existing = fetch_one("SELECT id, code FROM roles WHERE code = %s LIMIT 1", (role,))
    if existing:
        execute(
            "UPDATE roles SET name = %s, description = %s, updated_at = NOW() WHERE id = %s",
            (ROLE_LABELS[role], f"{ROLE_LABELS[role]} role", existing["id"]),
        )
        return existing

    created = fetch_one(
        """
        INSERT INTO roles (name, code, description)
        VALUES (%s, %s, %s)
        RETURNING id, code
        """,
        (ROLE_LABELS[role], role, f"{ROLE_LABELS[role]} role"),
    )
    return created or {"id": "", "code": role}


def ensure_permission(permission: dict[str, str]) -> dict[str, Any]:
    existing = fetch_one("SELECT id, code FROM permissions WHERE code = %s LIMIT 1", (permission["code"],))
    if existing:
        execute(
            "UPDATE permissions SET name = %s, module = %s WHERE id = %s",
            (permission["name"], permission["module"], existing["id"]),
        )
        return existing

    created = fetch_one(
        """
        INSERT INTO permissions (name, code, module)
        VALUES (%s, %s, %s)
        RETURNING id, code
        """,
        (permission["name"], permission["code"], permission["module"]),
    )
    return created or {"id": "", "code": permission["code"]}


def ensure_role_permissions(role_record: dict[str, Any], permission_records: list[dict[str, Any]]) -> None:
    for route in ROLE_PERMISSION_MAP.get(role_record["code"], []):
        permission_code = route_to_permission_code(route)
        permission = next((item for item in permission_records if item["code"] == permission_code), None)
        if not permission:
            continue
        existing = fetch_one(
            "SELECT id FROM role_permissions WHERE role_id = %s AND permission_id = %s LIMIT 1",
            (role_record["id"], permission["id"]),
        )
        if not existing:
            execute(
                "INSERT INTO role_permissions (role_id, permission_id) VALUES (%s, %s)",
                (role_record["id"], permission["id"]),
            )


def ensure_organization(organization: dict[str, Any]) -> dict[str, Any]:
    code = (make_slug(organization["name"]) or organization["name"]).upper()
    existing = fetch_one("SELECT id, code FROM organizations WHERE LOWER(name) = LOWER(%s) LIMIT 1", (organization["name"],))
    if existing:
        updated = fetch_one(
            """
            UPDATE organizations
            SET code = %s, email = %s, phone = %s, country = %s, address_line_1 = %s, pan_number = %s, max_users = %s
            WHERE id = %s
            RETURNING id, name, max_users, address_line_1, address_line_2, phone, country, email, pan_number
            """,
            (
                existing["code"] or code,
                organization.get("email", ""),
                organization.get("phone", ""),
                organization.get("country", ""),
                organization.get("address", ""),
                organization.get("pan", ""),
                organization.get("maxUsers", 0),
                existing["id"],
            ),
        )
        return updated or existing

    created = fetch_one(
        """
        INSERT INTO organizations (name, code, email, phone, country, address_line_1, pan_number, max_users, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'active')
        RETURNING id, name, max_users, address_line_1, address_line_2, phone, country, email, pan_number
        """,
        (
            organization["name"],
            code,
            organization.get("email", ""),
            organization.get("phone", ""),
            organization.get("country", ""),
            organization.get("address", ""),
            organization.get("pan", ""),
            organization.get("maxUsers", 0),
        ),
    )
    return created or {}


def ensure_department(organization_id: str, department_name: str) -> dict[str, Any] | None:
    normalized_name = department_name.strip()
    if not normalized_name:
        return None
    existing = fetch_one(
        "SELECT id FROM departments WHERE organization_id = %s AND LOWER(name) = LOWER(%s) LIMIT 1",
        (organization_id, normalized_name),
    )
    if existing:
        return existing
    return fetch_one(
        """
        INSERT INTO departments (organization_id, name, code)
        VALUES (%s, %s, %s)
        RETURNING id
        """,
        (organization_id, normalized_name, (make_slug(normalized_name) or normalized_name).upper()),
    )


def sync_user_permissions(db_user_id: str, access_routes: list[str]) -> None:
    permission_codes = [route_to_permission_code(route) for route in access_routes]
    execute("DELETE FROM user_permissions WHERE user_id = %s", (db_user_id,))
    if not permission_codes:
        return
    permissions = fetch_all("SELECT id FROM permissions WHERE code = ANY(%s)", (permission_codes,))
    for permission in permissions:
        execute(
            "INSERT INTO user_permissions (user_id, permission_id) VALUES (%s, %s)",
            (db_user_id, permission["id"]),
        )


def ensure_user(user: dict[str, Any]) -> None:
    existing_organization = fetch_one(
        """
        SELECT name, max_users, address_line_1, address_line_2, phone, country, email, pan_number
        FROM organizations
        WHERE LOWER(name) = LOWER(%s)
        LIMIT 1
        """,
        (user["organization"],),
    )
    organization_defaults = next(
        (item for item in DEFAULT_ORGANIZATIONS if item["name"] == user["organization"]),
        None,
    )
    persisted_organization = to_organization_config(existing_organization) if existing_organization else {}
    max_users = (
        persisted_organization.get("maxUsers")
        or (organization_defaults or {}).get("maxUsers")
        or 5
    )
    organization = ensure_organization(
        {
            "name": user["organization"],
            "maxUsers": max_users,
            "address": persisted_organization.get("address")
            or (organization_defaults or {}).get("address")
            or "",
            "phone": persisted_organization.get("phone")
            or (organization_defaults or {}).get("phone")
            or "",
            "country": persisted_organization.get("country")
            or (organization_defaults or {}).get("country")
            or ("" if user["organization"] == "Platform" else "India"),
            "email": persisted_organization.get("email")
            or (organization_defaults or {}).get("email")
            or "",
            "pan": persisted_organization.get("pan")
            or (organization_defaults or {}).get("pan")
            or "",
        }
    )
    department = ensure_department(organization["id"], user.get("department", ""))
    existing = fetch_one(
        """
        SELECT id, password_hash
        FROM users
        WHERE organization_id = %s AND LOWER(user_id) = LOWER(%s)
        LIMIT 1
        """,
        (organization["id"], user["userId"]),
    )
    password_hash = hash_password(user["password"])

    if existing:
        user_row = fetch_one(
            """
            UPDATE users
            SET name = %s, email = %s, password_hash = %s, department_id = %s, status = 'active'
            WHERE id = %s
            RETURNING id
            """,
            (
                user["name"],
                user["email"],
                existing["password_hash"] or password_hash,
                department["id"] if department else None,
                existing["id"],
            ),
        )
    else:
        user_row = fetch_one(
            """
            INSERT INTO users (organization_id, user_id, name, email, password_hash, department_id, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'active')
            RETURNING id
            """,
            (
                organization["id"],
                user["userId"],
                user["name"],
                user["email"],
                password_hash,
                department["id"] if department else None,
            ),
        )

    if not user_row:
        return

    execute(
        """
        DELETE FROM user_roles
        WHERE user_id = %s
          AND role_id IN (SELECT id FROM roles WHERE code <> ALL(%s))
        """,
        (user_row["id"], user["roles"]),
    )
    for role in user["roles"]:
        role_record = ensure_role(role)
        existing_user_role = fetch_one(
            "SELECT id FROM user_roles WHERE user_id = %s AND role_id = %s LIMIT 1",
            (user_row["id"], role_record["id"]),
        )
        if not existing_user_role:
            execute(
                "INSERT INTO user_roles (user_id, role_id) VALUES (%s, %s)",
                (user_row["id"], role_record["id"]),
            )

    sync_user_permissions(user_row["id"], user["accessRoutes"])


def run_bootstrap_data() -> None:
    permissions = [
        ensure_permission({"name": item["label"], "code": route_to_permission_code(item["route"]), "module": item["route"]})
        for item in ACCESS_OPTIONS
    ]
    for role in ROLE_LABELS:
        role_record = ensure_role(role)
        ensure_role_permissions(role_record, permissions)
    for organization in DEFAULT_ORGANIZATIONS:
        ensure_organization(organization)
    for user in DEFAULT_DEMO_USERS:
        ensure_user(user)


def bootstrap_data_exists() -> bool:
    counts = fetch_one(
        """
        SELECT
          (SELECT COUNT(*) FROM permissions) AS permission_count,
          (SELECT COUNT(*) FROM roles) AS role_count,
          (SELECT COUNT(*) FROM users) AS user_count
        """
    )
    if not counts:
        return False

    return (
        int(counts.get("permission_count") or 0) >= len(ACCESS_OPTIONS)
        and int(counts.get("role_count") or 0) >= len(ROLE_LABELS)
        and int(counts.get("user_count") or 0) >= len(DEFAULT_DEMO_USERS)
    )


def ensure_bootstrap_data(force: bool = False) -> None:
    global bootstrap_ready
    if bootstrap_ready and not force:
        return
    with bootstrap_lock:
        if bootstrap_ready and not force:
            return
        if force or not bootstrap_data_exists():
            run_bootstrap_data()
        bootstrap_ready = True


def get_organizations_from_db() -> list[dict[str, Any]]:
    ensure_bootstrap_data()
    rows = fetch_all(
        "SELECT name, max_users, address_line_1, address_line_2, phone, country, email, pan_number FROM organizations ORDER BY name ASC"
    )
    return [to_organization_config(row) for row in rows]


def reset_organizations_in_db() -> list[dict[str, Any]]:
    ensure_bootstrap_data()
    execute("DELETE FROM organizations WHERE name <> 'Platform'")
    for organization in DEFAULT_ORGANIZATIONS:
        ensure_organization(organization)
    ensure_bootstrap_data(force=True)
    return get_organizations_from_db()


def save_organizations_to_db(organizations: list[dict[str, Any]]) -> list[dict[str, Any]]:
    ensure_bootstrap_data()
    for organization in organizations:
        ensure_organization(organization)
    return get_organizations_from_db()


def delete_organization_in_db(organization_name: str) -> list[dict[str, Any]]:
    ensure_bootstrap_data()
    if organization_name.strip().lower() == "platform":
        raise HTTPException(status_code=400, detail="Platform organization cannot be deleted")

    organization = fetch_one("SELECT id FROM organizations WHERE LOWER(name) = LOWER(%s) LIMIT 1", (organization_name.strip(),))
    if not organization:
        return get_organizations_from_db()

    organization_id = organization["id"]
    execute("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE organization_id = %s)", (organization_id,))
    execute("DELETE FROM user_permissions WHERE user_id IN (SELECT id FROM users WHERE organization_id = %s)", (organization_id,))
    execute("DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE organization_id = %s)", (organization_id,))
    execute("DELETE FROM gate_passes WHERE organization_id = %s", (organization_id,))
    execute("DELETE FROM trips WHERE organization_id = %s", (organization_id,))
    execute("DELETE FROM invoices WHERE organization_id = %s", (organization_id,))
    execute("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE organization_id = %s)", (organization_id,))
    execute("DELETE FROM orders WHERE organization_id = %s", (organization_id,))
    execute("DELETE FROM drivers WHERE organization_id = %s", (organization_id,))
    execute("DELETE FROM vehicles WHERE organization_id = %s", (organization_id,))
    execute("DELETE FROM departments WHERE organization_id = %s", (organization_id,))
    execute("DELETE FROM users WHERE organization_id = %s", (organization_id,))
    execute("DELETE FROM organizations WHERE id = %s", (organization_id,))
    return get_organizations_from_db()


def get_users_from_db() -> list[dict[str, Any]]:
    ensure_bootstrap_data()
    rows = fetch_all(
        """
        SELECT
          u.id,
          u.user_id,
          u.name,
          u.email,
          o.name AS organization_name,
          d.name AS department_name,
          COALESCE(ARRAY_AGG(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}'::text[]) AS roles,
          COALESCE(ARRAY_AGG(DISTINCT p.code) FILTER (WHERE p.code IS NOT NULL), '{}'::text[]) AS permissions
        FROM users u
        LEFT JOIN organizations o ON o.id = u.organization_id
        LEFT JOIN departments d ON d.id = u.department_id
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        LEFT JOIN roles r ON r.id = ur.role_id
        LEFT JOIN user_permissions up ON up.user_id = u.id
        LEFT JOIN permissions p ON p.id = up.permission_id
        GROUP BY u.id, u.user_id, u.name, u.email, o.name, d.name, u.organization_id
        ORDER BY u.organization_id ASC, u.user_id ASC
        """
    )

    users = []
    for row in rows:
        session = to_session(
            {
                "user_id": row.get("user_id"),
                "name": row.get("name"),
                "organization_name": row.get("organization_name"),
                "roles": row.get("roles") or [],
                "permissions": row.get("permissions") or [],
            }
        )
        users.append(
            {
                **session,
                "password": "1234",
                "email": row.get("email") or "",
                "department": row.get("department_name") or "",
            }
        )
    return users


def save_users_to_db(users: list[dict[str, Any]]) -> list[dict[str, Any]]:
    ensure_bootstrap_data()
    incoming = {f"{user['organization'].lower()}::{user['userId'].lower()}" for user in users}
    existing_users = fetch_all(
        """
        SELECT u.id, u.user_id, o.name AS organization_name
        FROM users u
        LEFT JOIN organizations o ON o.id = u.organization_id
        """
    )
    for existing in existing_users:
        key = f"{(existing.get('organization_name') or '').lower()}::{(existing.get('user_id') or '').lower()}"
        if key not in incoming:
            execute("DELETE FROM sessions WHERE user_id = %s", (existing["id"],))
            execute("DELETE FROM user_permissions WHERE user_id = %s", (existing["id"],))
            execute("DELETE FROM user_roles WHERE user_id = %s", (existing["id"],))
            execute("DELETE FROM users WHERE id = %s", (existing["id"],))
    for user in users:
        ensure_user(user)
    return get_users_from_db()


def delete_user_in_db(organization_name: str, user_id: str) -> list[dict[str, Any]]:
    ensure_bootstrap_data()
    if organization_name.strip().lower() == "platform" and user_id.strip().lower() == "supad":
        raise HTTPException(status_code=400, detail="Super admin cannot be deleted")

    organization = fetch_one("SELECT id FROM organizations WHERE LOWER(name) = LOWER(%s) LIMIT 1", (organization_name.strip(),))
    if not organization:
        return get_users_from_db()

    user = fetch_one(
        """
        SELECT id
        FROM users
        WHERE organization_id = %s AND LOWER(user_id) = LOWER(%s)
        LIMIT 1
        """,
        (organization["id"], user_id.strip()),
    )
    if not user:
        return get_users_from_db()

    execute("DELETE FROM sessions WHERE user_id = %s", (user["id"],))
    execute("DELETE FROM user_permissions WHERE user_id = %s", (user["id"],))
    execute("DELETE FROM user_roles WHERE user_id = %s", (user["id"],))
    execute("DELETE FROM users WHERE id = %s", (user["id"],))
    return get_users_from_db()


def reset_users_in_db() -> list[dict[str, Any]]:
    ensure_bootstrap_data()
    execute("DELETE FROM sessions")
    execute("DELETE FROM user_permissions")
    execute("DELETE FROM user_roles")
    execute("DELETE FROM users WHERE user_id <> 'supad'")
    for user in DEFAULT_DEMO_USERS:
        ensure_user(user)
    ensure_bootstrap_data(force=True)
    return get_users_from_db()


def authenticate_user_from_db(organization_name: str, user_id: str, password: str) -> dict[str, Any] | None:
    org_name = organization_name.strip()
    user_code = user_id.strip()
    password_text = password.strip()
    if not org_name or not user_code or not password_text:
        return None

    def find_user() -> dict[str, Any] | None:
        organization = fetch_one("SELECT id FROM organizations WHERE LOWER(name) = LOWER(%s) LIMIT 1", (org_name,))
        if not organization:
            return None
        row = fetch_one(
            """
            SELECT id
            FROM users
            WHERE organization_id = %s AND LOWER(user_id) = LOWER(%s)
            LIMIT 1
            """,
            (organization["id"], user_code),
        )
        if not row:
            return None
        return get_user_with_relations(row["id"])

    user = find_user()
    if not user:
        ensure_bootstrap_data()
        user = find_user()
    if not user or not verify_password(password_text, user["password_hash"]):
        return None

    execute("UPDATE users SET last_login_at = NOW() WHERE id = %s", (user["id"],))
    token = str(uuid.uuid4())
    execute("INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)", (user["id"], token, datetime.now(timezone.utc) + timedelta(days=7)))
    return {"token": token, "session": to_session(user)}


def get_session_from_token(token: str) -> dict[str, Any] | None:
    if not token:
        return None
    session = fetch_one("SELECT user_id, expires_at FROM sessions WHERE token = %s LIMIT 1", (token,))
    if not session:
        return None
    expires_at = session.get("expires_at")
    comparison_now = datetime.now(expires_at.tzinfo) if expires_at and getattr(expires_at, "tzinfo", None) else datetime.utcnow()
    if expires_at and expires_at < comparison_now:
        execute("DELETE FROM sessions WHERE token = %s", (token,))
        return None
    user = get_user_with_relations(session["user_id"])
    if not user:
        execute("DELETE FROM sessions WHERE token = %s", (token,))
        return None
    return to_session(user)


def clear_session_token(token: str) -> None:
    if token:
        execute("DELETE FROM sessions WHERE token = %s", (token,))


def get_app_settings() -> dict[str, Any]:
    ensure_custom_tables()
    row = fetch_one("SELECT company_name, contact_email, google_maps_key, gps_provider FROM app_settings WHERE id = 'default'")
    return {
        "companyName": row.get("company_name") if row else "NextGen Logistics Pvt. Ltd.",
        "contactEmail": row.get("contact_email") if row else "ops@nextgenlogistics.in",
        "googleMapsKey": row.get("google_maps_key") if row else "",
        "gpsProvider": row.get("gps_provider") if row else "JioGPS",
    }


def save_app_settings(settings: dict[str, Any]) -> dict[str, Any]:
    ensure_custom_tables()
    execute(
        """
        INSERT INTO app_settings (id, company_name, contact_email, google_maps_key, gps_provider, updated_at)
        VALUES ('default', %s, %s, %s, %s, NOW())
        ON CONFLICT (id) DO UPDATE SET
          company_name = EXCLUDED.company_name,
          contact_email = EXCLUDED.contact_email,
          google_maps_key = EXCLUDED.google_maps_key,
          gps_provider = EXCLUDED.gps_provider,
          updated_at = NOW()
        """,
        (settings["companyName"], settings["contactEmail"], settings["googleMapsKey"], settings["gpsProvider"]),
    )
    return get_app_settings()


def get_api_setup() -> dict[str, Any]:
    ensure_custom_tables()
    row = fetch_one("SELECT * FROM api_setups WHERE id = 'default'")
    return {
        "provider": row.get("provider") if row else "SAP S/4HANA",
        "baseUrl": row.get("base_url") if row else "",
        "authType": row.get("auth_type") if row else "Bearer Token",
        "clientId": row.get("client_id") if row else "",
        "clientSecret": row.get("client_secret") if row else "",
        "orderEndpoint": row.get("order_endpoint") if row else "",
        "syncMethod": row.get("sync_method") if row else "Pull every 15 minutes",
        "orderIdField": row.get("order_id_field") if row else "VBELN",
        "customerField": row.get("customer_field") if row else "KUNNR",
        "sourceField": row.get("source_field") if row else "WERKS_FROM",
        "destinationField": row.get("destination_field") if row else "WERKS_TO",
        "weightField": row.get("weight_field") if row else "BRGEW",
        "volumeField": row.get("volume_field") if row else "VOLUM",
        "status": "Connected" if row and row.get("status") == "Connected" else "Draft",
    }


def save_api_setup(setup: dict[str, Any]) -> dict[str, Any]:
    ensure_custom_tables()
    execute(
        """
        INSERT INTO api_setups (
          id, provider, base_url, auth_type, client_id, client_secret, order_endpoint, sync_method,
          order_id_field, customer_field, source_field, destination_field, weight_field, volume_field, status, updated_at
        )
        VALUES ('default', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        ON CONFLICT (id) DO UPDATE SET
          provider = EXCLUDED.provider,
          base_url = EXCLUDED.base_url,
          auth_type = EXCLUDED.auth_type,
          client_id = EXCLUDED.client_id,
          client_secret = EXCLUDED.client_secret,
          order_endpoint = EXCLUDED.order_endpoint,
          sync_method = EXCLUDED.sync_method,
          order_id_field = EXCLUDED.order_id_field,
          customer_field = EXCLUDED.customer_field,
          source_field = EXCLUDED.source_field,
          destination_field = EXCLUDED.destination_field,
          weight_field = EXCLUDED.weight_field,
          volume_field = EXCLUDED.volume_field,
          status = EXCLUDED.status,
          updated_at = NOW()
        """,
        (
            setup["provider"],
            setup["baseUrl"],
            setup["authType"],
            setup["clientId"],
            setup["clientSecret"],
            setup["orderEndpoint"],
            setup["syncMethod"],
            setup["orderIdField"],
            setup["customerField"],
            setup["sourceField"],
            setup["destinationField"],
            setup["weightField"],
            setup["volumeField"],
            setup["status"],
        ),
    )
    return get_api_setup()


def get_maintenance_entries() -> list[dict[str, Any]]:
    ensure_custom_tables()
    rows = fetch_all(
        """
        SELECT id, vehicle_id, vehicle_number, maintenance_type, service_date, next_due_date, service_cost, workshop_name, notes
        FROM maintenance_entries
        ORDER BY service_date DESC, created_at DESC
        """
    )
    return [
        {
            "id": row["id"],
            "vehicleId": row["vehicle_id"],
            "vehicleNumber": row["vehicle_number"],
            "maintenanceType": row["maintenance_type"],
            "serviceDate": format_ymd(row["service_date"]),
            "nextDueDate": format_ymd(row["next_due_date"], "-"),
            "cost": f"Rs. {format_number_indian(decimal_to_float(row['service_cost']))}",
            "workshop": row["workshop_name"],
            "notes": row["notes"],
        }
        for row in rows
    ]


def create_maintenance_entry(entry: dict[str, Any]) -> list[dict[str, Any]]:
    ensure_custom_tables()
    execute(
        """
        INSERT INTO maintenance_entries (
          id, vehicle_id, vehicle_number, maintenance_type, service_date, next_due_date, service_cost, workshop_name, notes, created_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """,
        (
            f"MNT-{800 + secrets.randbelow(9000)}",
            entry["vehicleId"],
            entry["vehicleNumber"],
            entry["maintenanceType"],
            entry["serviceDate"],
            entry.get("nextDueDate") or None,
            entry["serviceCost"],
            entry["workshop"],
            entry["notes"],
        ),
    )
    return get_maintenance_entries()


def get_transport_routes() -> list[dict[str, Any]]:
    ensure_custom_tables()
    rows = fetch_all(
        """
        SELECT id, route_name, start_location, end_location, distance_km, estimated_time, vehicle_type, via_points, color
        FROM transport_routes_custom
        ORDER BY created_at DESC
        """
    )
    return [
        {
            "id": row["id"],
            "routeName": row["route_name"],
            "start": row["start_location"],
            "end": row["end_location"],
            "distanceKm": decimal_to_float(row["distance_km"]),
            "estTime": row["estimated_time"],
            "vehicleType": row["vehicle_type"],
            "viaPoints": row["via_points"],
            "color": row["color"],
        }
        for row in rows
    ]


def create_transport_route(route: dict[str, Any]) -> list[dict[str, Any]]:
    ensure_custom_tables()
    colors = ["#1A73E8", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"]
    execute(
        """
        INSERT INTO transport_routes_custom (
          id, route_name, start_location, end_location, via_points, vehicle_type, distance_km, estimated_time, color, created_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """,
        (
            f"RT-{100 + secrets.randbelow(900)}",
            route["routeName"],
            route["start"],
            route["end"],
            route["viaPoints"],
            route["vehicleType"],
            route["distanceKm"],
            route["estTime"],
            colors[secrets.randbelow(len(colors))],
        ),
    )
    return get_transport_routes()


def get_weighments() -> list[dict[str, Any]]:
    ensure_custom_tables()
    rows = fetch_all(
        """
        SELECT id, vehicle_id, weighment_type, gross_weight, tare_weight, net_weight, material, recorded_at, status
        FROM weighments
        ORDER BY recorded_at DESC
        """
    )
    return [
        {
            "id": row["id"],
            "vehicle": row["vehicle_id"],
            "type": row["weighment_type"],
            "grossWeight": f"{format_number_indian(decimal_to_float(row['gross_weight']))} kg",
            "tareWeight": f"{format_number_indian(decimal_to_float(row['tare_weight']))} kg",
            "netWeight": f"{format_number_indian(decimal_to_float(row['net_weight']))} kg",
            "material": row["material"],
            "time": format_timestamp(row["recorded_at"]),
            "status": row["status"],
        }
        for row in rows
    ]


def create_weighment(entry: dict[str, Any]) -> list[dict[str, Any]]:
    ensure_custom_tables()
    net_weight = max(float(entry["grossWeight"]) - float(entry["tareWeight"]), 0)
    execute(
        """
        INSERT INTO weighments (
          id, vehicle_id, weighment_type, gross_weight, tare_weight, net_weight, material, status, recorded_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """,
        (
            f"WB-{7000 + secrets.randbelow(9000)}",
            entry["vehicleId"],
            entry["type"],
            entry["grossWeight"],
            entry["tareWeight"],
            net_weight,
            entry["material"],
            entry.get("status") or "Completed",
        ),
    )
    return get_weighments()


def get_vehicle_assignments() -> list[dict[str, Any]]:
    ensure_custom_tables()
    rows = fetch_all("SELECT * FROM vehicle_assignments ORDER BY created_at DESC")
    return [
        {
            "id": row["id"],
            "deliveryId": row["delivery_id"],
            "customer": row["customer"],
            "source": row["source"],
            "destination": row["destination"],
            "quantityKg": decimal_to_float(row["quantity_kg"]),
            "loadType": row["load_type"],
            "recommendedTruckSize": row["recommended_truck_size"],
            "assignedVehicleId": row["assigned_vehicle_id"],
            "assignedVehicleType": row["assigned_vehicle_type"],
            "assignedVehicleCapacity": row["assigned_vehicle_capacity"],
            "assignedBy": row["assigned_by"],
            "assignedByUserId": row["assigned_by_user_id"],
            "organization": row["organization"],
            "createdAt": format_timestamp(row["created_at"]),
            "notes": row["notes"],
        }
        for row in rows
    ]


def save_vehicle_assignments(assignments: list[dict[str, Any]]) -> list[dict[str, Any]]:
    ensure_custom_tables()
    execute("DELETE FROM vehicle_assignments")
    for assignment in assignments:
        execute(
            """
            INSERT INTO vehicle_assignments (
              id, delivery_id, customer, source, destination, quantity_kg, load_type, recommended_truck_size,
              assigned_vehicle_id, assigned_vehicle_type, assigned_vehicle_capacity, assigned_by, assigned_by_user_id,
              organization, notes, created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                assignment.get("id") or str(uuid.uuid4()),
                assignment["deliveryId"],
                assignment["customer"],
                assignment["source"],
                assignment["destination"],
                assignment["quantityKg"],
                assignment["loadType"],
                assignment["recommendedTruckSize"],
                assignment["assignedVehicleId"],
                assignment["assignedVehicleType"],
                assignment["assignedVehicleCapacity"],
                assignment["assignedBy"],
                assignment["assignedByUserId"],
                assignment["organization"],
                assignment["notes"],
                assignment.get("createdAt") or datetime.utcnow(),
            ),
        )
    return get_vehicle_assignments()


def get_orders():
    rows = fetch_all(
        """
        SELECT o.order_number, c.customer_name, o.pickup_address, o.drop_address, o.total_weight, o.unit, o.status, o.order_date
        FROM orders o
        LEFT JOIN customers c ON c.id = o.customer_id
        ORDER BY o.order_date ASC
        """
    )
    return {
        "orders": [
            {
                "id": row.get("order_number") or "UNKNOWN",
                "customer": row.get("customer_name") or "Unknown Customer",
                "source": row.get("pickup_address") or "Unknown",
                "destination": row.get("drop_address") or "Unknown",
                "weight": f"{format_number_indian(decimal_to_float(row['total_weight']))} {row.get('unit') or 'kg'}" if row.get("total_weight") is not None else "0 kg",
                "volume": "Standard CBM",
                "status": title_case(row.get("status"), "Pending"),
                "createdAt": format_ymd(row.get("order_date")),
            }
            for row in rows
        ]
    }


def get_drivers():
    rows = fetch_all("SELECT driver_code, driver_name, phone, license_number, status FROM drivers ORDER BY driver_code ASC")
    return {
        "drivers": [
            {
                "id": row.get("driver_code") or "Unknown",
                "name": row.get("driver_name") or "Unknown Driver",
                "phone": row.get("phone") or "N/A",
                "license": row.get("license_number") or "N/A",
                "tripsToday": 0,
                "rating": 5.0,
                "status": capitalize_status(row.get("status"), "Available"),
            }
            for row in rows
        ]
    }


def save_driver(driver: dict[str, Any]):
    organization = None
    if driver.get("organization"):
        organization = fetch_one("SELECT id FROM organizations WHERE LOWER(name) = LOWER(%s) LIMIT 1", (driver["organization"],))

    if driver.get("driverId"):
        existing = fetch_one("SELECT id, organization_id FROM drivers WHERE driver_code = %s LIMIT 1", (driver["driverId"],))
        if not existing:
            raise HTTPException(status_code=404, detail="Driver not found")
        execute(
            """
            UPDATE drivers
            SET organization_id = %s, driver_name = %s, phone = %s, email = %s, license_number = %s, status = %s
            WHERE id = %s
            """,
            (
                organization["id"] if organization else existing.get("organization_id"),
                driver["name"],
                driver["phone"],
                driver.get("email"),
                driver["license"],
                (driver.get("status") or "available").lower(),
                existing["id"],
            ),
        )
    else:
        count = fetch_one("SELECT COUNT(*) AS count FROM drivers")["count"]
        execute(
            """
            INSERT INTO drivers (organization_id, driver_code, driver_name, phone, email, license_number, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                organization["id"] if organization else None,
                f"DRV-{401 + int(count)}",
                driver["name"],
                driver["phone"],
                driver.get("email"),
                driver["license"],
                (driver.get("status") or "available").lower(),
            ),
        )
    return get_drivers()


def remove_driver(driver_id: str):
    existing = fetch_one("SELECT id FROM drivers WHERE driver_code = %s LIMIT 1", (driver_id,))
    if not existing:
        raise HTTPException(status_code=404, detail="Driver not found")
    execute("DELETE FROM drivers WHERE id = %s", (existing["id"],))
    return get_drivers()


def get_fleet():
    rows = fetch_all(
        """
        SELECT vehicle_number, vehicle_type, registration_number, capacity, capacity_unit, status, remarks, updated_at
        FROM vehicles
        ORDER BY vehicle_number ASC
        """
    )
    fleet = []
    for row in rows:
        status = (row.get("status") or "").lower()
        location = "Depot"
        if status in {"on trip", "loading"}:
            location = "On Route"
        elif status == "maintenance":
            location = "Workshop"
        ownership = row.get("remarks") or "Own Vehicle"
        if ownership.lower().startswith("ownership:"):
            ownership = ownership.split(":", 1)[1].strip() or "Own Vehicle"
        fleet.append(
            {
                "id": row.get("vehicle_number") or "Unknown",
                "registrationNumber": row.get("registration_number") or "",
                "ownership": ownership,
                "type": row.get("vehicle_type") or "Standard",
                "capacity": f"{format_number_indian(decimal_to_float(row['capacity']))} {row.get('capacity_unit') or 'kg'}" if row.get("capacity") is not None else "N/A",
                "location": location,
                "lastService": format_ymd(row.get("updated_at"), "Unknown"),
                "status": capitalize_status(row.get("status"), "Available"),
            }
        )
    return {"fleet": fleet}


def save_fleet(vehicle: dict[str, Any]):
    if vehicle.get("vehicleId"):
        existing = fetch_one("SELECT id, status FROM vehicles WHERE vehicle_number = %s LIMIT 1", (vehicle["vehicleId"],))
        if not existing:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        execute(
            """
            UPDATE vehicles
            SET vehicle_type = %s, registration_number = %s, capacity = %s, capacity_unit = 'kg', status = %s, remarks = %s
            WHERE id = %s
            """,
            (
                vehicle["vehicleType"],
                vehicle["vehicleNumber"],
                float(vehicle["capacityTon"]) * 1000,
                existing.get("status") or "available",
                f"Ownership: {vehicle['ownership']}",
                existing["id"],
            ),
        )
    else:
        count = fetch_one("SELECT COUNT(*) AS count FROM vehicles")["count"]
        execute(
            """
            INSERT INTO vehicles (vehicle_number, vehicle_type, registration_number, capacity, capacity_unit, status, remarks)
            VALUES (%s, %s, %s, %s, 'kg', 'available', %s)
            """,
            (
                f"VH-{200 + int(count) + 1}",
                vehicle["vehicleType"],
                vehicle["vehicleNumber"],
                float(vehicle["capacityTon"]) * 1000,
                f"Ownership: {vehicle['ownership']}",
            ),
        )
    return get_fleet()


def remove_fleet(vehicle_id: str):
    vehicle = fetch_one("SELECT id FROM vehicles WHERE vehicle_number = %s LIMIT 1", (vehicle_id,))
    if not vehicle:
        return get_fleet()
    execute("DELETE FROM gate_passes WHERE vehicle_id = %s", (vehicle["id"],))
    execute("DELETE FROM trips WHERE vehicle_id = %s", (vehicle["id"],))
    execute("DELETE FROM vehicles WHERE id = %s", (vehicle["id"],))
    return get_fleet()


def get_gatepasses():
    rows = fetch_all(
        """
        SELECT gp.gate_pass_number, v.vehicle_number, d.driver_name, gp.remarks, gp.security_person_name, gp.gate_status, gp.created_at
        FROM gate_passes gp
        LEFT JOIN vehicles v ON v.id = gp.vehicle_id
        LEFT JOIN drivers d ON d.id = gp.driver_id
        ORDER BY gp.created_at DESC
        """
    )
    return {
        "gatePasses": [
            {
                "id": row.get("gate_pass_number") or "Unknown",
                "vehicle": row.get("vehicle_number") or "Unknown",
                "driver": row.get("driver_name") or "Unknown",
                "purpose": row.get("remarks") or "General Transport",
                "requestedBy": row.get("security_person_name") or "System Default",
                "approvalStatus": title_case(row.get("gate_status"), "Pending"),
                "time": format_timestamp(row.get("created_at")),
            }
            for row in rows
        ]
    }


def get_trips():
    rows = fetch_all(
        """
        SELECT t.trip_number, t.start_location, t.end_location, t.planned_end_time, t.actual_end_time, t.distance_km, t.trip_status,
               v.vehicle_number, d.driver_name
        FROM trips t
        LEFT JOIN vehicles v ON v.id = t.vehicle_id
        LEFT JOIN drivers d ON d.id = t.driver_id
        ORDER BY t.updated_at DESC
        """
    )
    active_trips = []
    completed_trips = []
    for row in rows:
        base = {
            "id": row.get("trip_number") or "UNKNOWN",
            "vehicle": row.get("vehicle_number") or "Unknown",
            "driver": row.get("driver_name") or "Unknown",
        }
        if row.get("trip_status") == "completed":
            completed_trips.append(
                {
                    **base,
                    "distance": f"{decimal_to_float(row['distance_km'])} km" if row.get("distance_km") is not None else "N/A",
                    "completedAt": format_trip_datetime(row.get("actual_end_time")),
                }
            )
        else:
            status_label = "Planned"
            if row.get("trip_status") == "in transit":
                status_label = "In Transit"
            elif row.get("trip_status") == "loading":
                status_label = "Loading"
            elif row.get("trip_status") == "unloading":
                status_label = "Unloading"
            active_trips.append(
                {
                    **base,
                    "route": f"{row.get('start_location') or 'Unknown'} -> {row.get('end_location') or 'Unknown'}",
                    "eta": format_trip_datetime(row.get("planned_end_time")),
                    "status": status_label,
                }
            )
    return {"activeTrips": active_trips, "completedTrips": completed_trips}


def get_invoices():
    rows = fetch_all(
        """
        SELECT i.invoice_number, c.customer_name, i.total_amount, i.payment_status, i.created_at
        FROM invoices i
        LEFT JOIN customers c ON c.id = i.customer_id
        ORDER BY i.created_at DESC
        """
    )
    return {
        "invoices": [
            {
                "id": row.get("invoice_number") or "Unknown",
                "tripId": "N/A",
                "customer": row.get("customer_name") or "Unknown Customer",
                "amount": decimal_to_float(row.get("total_amount")),
                "status": title_case(row.get("payment_status"), "Draft"),
                "createdAt": format_ymd(row.get("created_at"), "1970-01-01"),
            }
            for row in rows
        ]
    }


