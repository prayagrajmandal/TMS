import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"

type QueryRow = Record<string, unknown>

let initPromise: Promise<void> | null = null

function escape(value: string) {
  return value.replace(/'/g, "''")
}

function quote(value: string | null | undefined) {
  if (value == null) return "NULL"
  return `'${escape(value)}'`
}

function quoteNumber(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "NULL"
  return String(value)
}

function quoteTimestamp(value: string | Date | null | undefined) {
  if (!value) return "NULL"
  const timestamp = value instanceof Date ? value.toISOString() : value
  return `'${escape(timestamp)}'::timestamptz`
}

async function execute(sql: string) {
  await prisma.$executeRawUnsafe(sql)
}

async function query<T extends QueryRow>(sql: string) {
  return prisma.$queryRawUnsafe<T[]>(sql)
}

export async function ensureCustomTables() {
  if (!initPromise) {
    initPromise = (async () => {
      await execute(`
        CREATE TABLE IF NOT EXISTS app_settings (
          id TEXT PRIMARY KEY,
          company_name TEXT NOT NULL,
          contact_email TEXT NOT NULL,
          google_maps_key TEXT NOT NULL DEFAULT '',
          gps_provider TEXT NOT NULL DEFAULT 'JioGPS',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `)

      await execute(`
        INSERT INTO app_settings (id, company_name, contact_email, google_maps_key, gps_provider)
        VALUES ('default', 'NextGen Logistics Pvt. Ltd.', 'ops@nextgenlogistics.in', '', 'JioGPS')
        ON CONFLICT (id) DO NOTHING;
      `)

      await execute(`
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
        );
      `)

      await execute(`
        INSERT INTO api_setups (
          id,
          provider,
          base_url,
          auth_type,
          client_id,
          client_secret,
          order_endpoint,
          sync_method,
          order_id_field,
          customer_field,
          source_field,
          destination_field,
          weight_field,
          volume_field,
          status
        )
        VALUES (
          'default',
          'SAP S/4HANA',
          'https://sap-pro.company.com/api',
          'Bearer Token',
          'nextgen-tms',
          '',
          '/orders/open',
          'Pull every 15 minutes',
          'VBELN',
          'KUNNR',
          'WERKS_FROM',
          'WERKS_TO',
          'BRGEW',
          'VOLUM',
          'Draft'
        )
        ON CONFLICT (id) DO NOTHING;
      `)

      await execute(`
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
        );
      `)

      await execute(`
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
        );
      `)

      await execute(`
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
        );
      `)

      await execute(`
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
        );
      `)
    })()
  }

  await initPromise
}

export interface AppSettingsRecord {
  companyName: string
  contactEmail: string
  googleMapsKey: string
  gpsProvider: string
}

export async function getAppSettings(): Promise<AppSettingsRecord> {
  await ensureCustomTables()
  const [row] = await query<{
    company_name: string
    contact_email: string
    google_maps_key: string
    gps_provider: string
  }>(`
    SELECT company_name, contact_email, google_maps_key, gps_provider
    FROM app_settings
    WHERE id = 'default'
    LIMIT 1;
  `)

  return {
    companyName: row?.company_name ?? "NextGen Logistics Pvt. Ltd.",
    contactEmail: row?.contact_email ?? "ops@nextgenlogistics.in",
    googleMapsKey: row?.google_maps_key ?? "",
    gpsProvider: row?.gps_provider ?? "JioGPS",
  }
}

export async function saveAppSettings(settings: AppSettingsRecord) {
  await ensureCustomTables()
  await execute(`
    INSERT INTO app_settings (id, company_name, contact_email, google_maps_key, gps_provider, updated_at)
    VALUES (
      'default',
      ${quote(settings.companyName)},
      ${quote(settings.contactEmail)},
      ${quote(settings.googleMapsKey)},
      ${quote(settings.gpsProvider)},
      NOW()
    )
    ON CONFLICT (id)
    DO UPDATE SET
      company_name = EXCLUDED.company_name,
      contact_email = EXCLUDED.contact_email,
      google_maps_key = EXCLUDED.google_maps_key,
      gps_provider = EXCLUDED.gps_provider,
      updated_at = NOW();
  `)

  return getAppSettings()
}

export interface ApiSetupRecord {
  provider: string
  baseUrl: string
  authType: string
  clientId: string
  clientSecret: string
  orderEndpoint: string
  syncMethod: string
  orderIdField: string
  customerField: string
  sourceField: string
  destinationField: string
  weightField: string
  volumeField: string
  status: "Draft" | "Connected"
}

export async function getApiSetup(): Promise<ApiSetupRecord> {
  await ensureCustomTables()
  const [row] = await query<{
    provider: string
    base_url: string
    auth_type: string
    client_id: string
    client_secret: string
    order_endpoint: string
    sync_method: string
    order_id_field: string
    customer_field: string
    source_field: string
    destination_field: string
    weight_field: string
    volume_field: string
    status: string
  }>(`
    SELECT *
    FROM api_setups
    WHERE id = 'default'
    LIMIT 1;
  `)

  return {
    provider: row?.provider ?? "SAP S/4HANA",
    baseUrl: row?.base_url ?? "",
    authType: row?.auth_type ?? "Bearer Token",
    clientId: row?.client_id ?? "",
    clientSecret: row?.client_secret ?? "",
    orderEndpoint: row?.order_endpoint ?? "",
    syncMethod: row?.sync_method ?? "Pull every 15 minutes",
    orderIdField: row?.order_id_field ?? "VBELN",
    customerField: row?.customer_field ?? "KUNNR",
    sourceField: row?.source_field ?? "WERKS_FROM",
    destinationField: row?.destination_field ?? "WERKS_TO",
    weightField: row?.weight_field ?? "BRGEW",
    volumeField: row?.volume_field ?? "VOLUM",
    status: row?.status === "Connected" ? "Connected" : "Draft",
  }
}

export async function saveApiSetup(setup: ApiSetupRecord) {
  await ensureCustomTables()
  await execute(`
    INSERT INTO api_setups (
      id,
      provider,
      base_url,
      auth_type,
      client_id,
      client_secret,
      order_endpoint,
      sync_method,
      order_id_field,
      customer_field,
      source_field,
      destination_field,
      weight_field,
      volume_field,
      status,
      updated_at
    )
    VALUES (
      'default',
      ${quote(setup.provider)},
      ${quote(setup.baseUrl)},
      ${quote(setup.authType)},
      ${quote(setup.clientId)},
      ${quote(setup.clientSecret)},
      ${quote(setup.orderEndpoint)},
      ${quote(setup.syncMethod)},
      ${quote(setup.orderIdField)},
      ${quote(setup.customerField)},
      ${quote(setup.sourceField)},
      ${quote(setup.destinationField)},
      ${quote(setup.weightField)},
      ${quote(setup.volumeField)},
      ${quote(setup.status)},
      NOW()
    )
    ON CONFLICT (id)
    DO UPDATE SET
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
      updated_at = NOW();
  `)

  return getApiSetup()
}

export interface MaintenanceEntryRecord {
  id: string
  vehicleId: string
  vehicleNumber: string
  maintenanceType: string
  serviceDate: string
  nextDueDate: string
  cost: string
  workshop: string
  notes: string
}

export async function getMaintenanceEntries(): Promise<MaintenanceEntryRecord[]> {
  await ensureCustomTables()
  const rows = await query<{
    id: string
    vehicle_id: string
    vehicle_number: string
    maintenance_type: string
    service_date: string
    next_due_date: string | null
    service_cost: string
    workshop_name: string
    notes: string
  }>(`
    SELECT id, vehicle_id, vehicle_number, maintenance_type, service_date::text, next_due_date::text, service_cost::text, workshop_name, notes
    FROM maintenance_entries
    ORDER BY service_date DESC, created_at DESC;
  `)

  return rows.map((row) => ({
    id: row.id,
    vehicleId: row.vehicle_id,
    vehicleNumber: row.vehicle_number,
    maintenanceType: row.maintenance_type,
    serviceDate: row.service_date,
    nextDueDate: row.next_due_date ?? "—",
    cost: `Rs. ${Number(row.service_cost || 0).toLocaleString("en-IN")}`,
    workshop: row.workshop_name,
    notes: row.notes,
  }))
}

export async function createMaintenanceEntry(entry: Omit<MaintenanceEntryRecord, "id" | "cost"> & { serviceCost: number }) {
  await ensureCustomTables()
  const id = `MNT-${800 + Math.floor(Math.random() * 9000)}`
  await execute(`
    INSERT INTO maintenance_entries (
      id,
      vehicle_id,
      vehicle_number,
      maintenance_type,
      service_date,
      next_due_date,
      service_cost,
      workshop_name,
      notes,
      created_at
    )
    VALUES (
      ${quote(id)},
      ${quote(entry.vehicleId)},
      ${quote(entry.vehicleNumber)},
      ${quote(entry.maintenanceType)},
      ${quote(entry.serviceDate)}::date,
      ${entry.nextDueDate ? `${quote(entry.nextDueDate)}::date` : "NULL"},
      ${quoteNumber(entry.serviceCost)},
      ${quote(entry.workshop)},
      ${quote(entry.notes)},
      NOW()
    );
  `)

  return getMaintenanceEntries()
}

export interface TransportRouteRecord {
  id: string
  routeName: string
  start: string
  end: string
  distanceKm: number
  estTime: string
  vehicleType: string
  viaPoints: string
  color: string
}

export async function getTransportRoutes(): Promise<TransportRouteRecord[]> {
  await ensureCustomTables()
  const rows = await query<{
    id: string
    route_name: string
    start_location: string
    end_location: string
    distance_km: string
    estimated_time: string
    vehicle_type: string
    via_points: string
    color: string
  }>(`
    SELECT id, route_name, start_location, end_location, distance_km::text, estimated_time, vehicle_type, via_points, color
    FROM transport_routes_custom
    ORDER BY created_at DESC;
  `)

  return rows.map((row) => ({
    id: row.id,
    routeName: row.route_name,
    start: row.start_location,
    end: row.end_location,
    distanceKm: Number(row.distance_km || 0),
    estTime: row.estimated_time,
    vehicleType: row.vehicle_type,
    viaPoints: row.via_points,
    color: row.color,
  }))
}

export async function createTransportRoute(route: Omit<TransportRouteRecord, "id" | "color"> & { color?: string }) {
  await ensureCustomTables()
  const id = `RT-${String(Math.floor(Math.random() * 900) + 100)}`
  const color = route.color || ["#1A73E8", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"][Math.floor(Math.random() * 6)]
  await execute(`
    INSERT INTO transport_routes_custom (
      id,
      route_name,
      start_location,
      end_location,
      via_points,
      vehicle_type,
      distance_km,
      estimated_time,
      color,
      created_at
    )
    VALUES (
      ${quote(id)},
      ${quote(route.routeName)},
      ${quote(route.start)},
      ${quote(route.end)},
      ${quote(route.viaPoints)},
      ${quote(route.vehicleType)},
      ${quoteNumber(route.distanceKm)},
      ${quote(route.estTime)},
      ${quote(color)},
      NOW()
    );
  `)

  return getTransportRoutes()
}

export interface WeighmentRecord {
  id: string
  vehicle: string
  type: string
  grossWeight: string
  tareWeight: string
  netWeight: string
  material: string
  time: string
  status: string
}

export async function getWeighments(): Promise<WeighmentRecord[]> {
  await ensureCustomTables()
  const rows = await query<{
    id: string
    vehicle_id: string
    weighment_type: string
    gross_weight: string
    tare_weight: string
    net_weight: string
    material: string
    recorded_at: string
    status: string
  }>(`
    SELECT id, vehicle_id, weighment_type, gross_weight::text, tare_weight::text, net_weight::text, material, recorded_at::text, status
    FROM weighments
    ORDER BY recorded_at DESC;
  `)

  return rows.map((row) => ({
    id: row.id,
    vehicle: row.vehicle_id,
    type: row.weighment_type,
    grossWeight: `${Number(row.gross_weight || 0).toLocaleString("en-IN")} kg`,
    tareWeight: `${Number(row.tare_weight || 0).toLocaleString("en-IN")} kg`,
    netWeight: `${Number(row.net_weight || 0).toLocaleString("en-IN")} kg`,
    material: row.material,
    time: row.recorded_at.slice(0, 16).replace("T", " "),
    status: row.status,
  }))
}

export async function createWeighment(entry: {
  vehicleId: string
  type: string
  grossWeight: number
  tareWeight: number
  material: string
  status?: string
}) {
  await ensureCustomTables()
  const id = `WB-${7000 + Math.floor(Math.random() * 9000)}`
  const netWeight = Math.max(entry.grossWeight - entry.tareWeight, 0)
  await execute(`
    INSERT INTO weighments (
      id,
      vehicle_id,
      weighment_type,
      gross_weight,
      tare_weight,
      net_weight,
      material,
      status,
      recorded_at
    )
    VALUES (
      ${quote(id)},
      ${quote(entry.vehicleId)},
      ${quote(entry.type)},
      ${quoteNumber(entry.grossWeight)},
      ${quoteNumber(entry.tareWeight)},
      ${quoteNumber(netWeight)},
      ${quote(entry.material)},
      ${quote(entry.status ?? "Completed")},
      NOW()
    );
  `)

  return getWeighments()
}

export interface VehicleAssignmentRecord {
  id: string
  deliveryId: string
  customer: string
  source: string
  destination: string
  quantityKg: number
  loadType: string
  recommendedTruckSize: string
  assignedVehicleId: string
  assignedVehicleType: string
  assignedVehicleCapacity: string
  assignedBy: string
  assignedByUserId: string
  organization: string
  createdAt: string
  notes: string
}

export async function getVehicleAssignments(): Promise<VehicleAssignmentRecord[]> {
  await ensureCustomTables()
  const rows = await query<{
    id: string
    delivery_id: string
    customer: string
    source: string
    destination: string
    quantity_kg: string
    load_type: string
    recommended_truck_size: string
    assigned_vehicle_id: string
    assigned_vehicle_type: string
    assigned_vehicle_capacity: string
    assigned_by: string
    assigned_by_user_id: string
    organization: string
    created_at: string
    notes: string
  }>(`
    SELECT *
    FROM vehicle_assignments
    ORDER BY created_at DESC;
  `)

  return rows.map((row) => ({
    id: row.id,
    deliveryId: row.delivery_id,
    customer: row.customer,
    source: row.source,
    destination: row.destination,
    quantityKg: Number(row.quantity_kg || 0),
    loadType: row.load_type,
    recommendedTruckSize: row.recommended_truck_size,
    assignedVehicleId: row.assigned_vehicle_id,
    assignedVehicleType: row.assigned_vehicle_type,
    assignedVehicleCapacity: row.assigned_vehicle_capacity,
    assignedBy: row.assigned_by,
    assignedByUserId: row.assigned_by_user_id,
    organization: row.organization,
    createdAt: row.created_at.slice(0, 16).replace("T", " "),
    notes: row.notes,
  }))
}

export async function saveVehicleAssignments(assignments: VehicleAssignmentRecord[]) {
  await ensureCustomTables()
  await execute(`DELETE FROM vehicle_assignments;`)

  for (const assignment of assignments) {
    await execute(`
      INSERT INTO vehicle_assignments (
        id,
        delivery_id,
        customer,
        source,
        destination,
        quantity_kg,
        load_type,
        recommended_truck_size,
        assigned_vehicle_id,
        assigned_vehicle_type,
        assigned_vehicle_capacity,
        assigned_by,
        assigned_by_user_id,
        organization,
        notes,
        created_at
      )
      VALUES (
        ${quote(assignment.id || randomUUID())},
        ${quote(assignment.deliveryId)},
        ${quote(assignment.customer)},
        ${quote(assignment.source)},
        ${quote(assignment.destination)},
        ${quoteNumber(assignment.quantityKg)},
        ${quote(assignment.loadType)},
        ${quote(assignment.recommendedTruckSize)},
        ${quote(assignment.assignedVehicleId)},
        ${quote(assignment.assignedVehicleType)},
        ${quote(assignment.assignedVehicleCapacity)},
        ${quote(assignment.assignedBy)},
        ${quote(assignment.assignedByUserId)},
        ${quote(assignment.organization)},
        ${quote(assignment.notes)},
        ${quoteTimestamp(assignment.createdAt)}
      );
    `)
  }

  return getVehicleAssignments()
}
