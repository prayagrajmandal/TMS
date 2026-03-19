export type UserRole = "super-admin" | "admin" | "head-office" | "gate" | "maintenance" | "vehicle-assignment"

export type AccessRoute =
  | "/dashboard"
  | "/orders"
  | "/planning"
  | "/vehicleassignment"
  | "/trips"
  | "/tracking"
  | "/routemap"
  | "/drivers"
  | "/fleet"
  | "/vehicledriver"
  | "/maintenance"
  | "/trackscale"
  | "/gatepass"
  | "/billing"
  | "/settings"
  | "/admin"
  | "/superadmin"

export interface NavAccessItem {
  label: string
  route: AccessRoute
}

export interface OrganizationConfig {
  name: string
  maxUsers: number
  address: string
  phone: string
  country: string
  email: string
  pan: string
}

export const accessOptions: NavAccessItem[] = [
  { label: "Dashboard", route: "/dashboard" },
  { label: "Orders", route: "/orders" },
  { label: "Planning", route: "/planning" },
  { label: "Vehicle Assignment", route: "/vehicleassignment" },
  { label: "Trips", route: "/trips" },
  { label: "Tracking", route: "/tracking" },
  { label: "Route Map", route: "/routemap" },
  { label: "Drivers", route: "/drivers" },
  { label: "Fleet", route: "/fleet" },
  { label: "Vehicle", route: "/vehicledriver" },
  { label: "Maintenance", route: "/maintenance" },
  { label: "Track Scale", route: "/trackscale" },
  { label: "Gate Pass", route: "/gatepass" },
  { label: "Billing", route: "/billing" },
]

export interface AuthSession {
  userId: string
  name: string
  roles: UserRole[]
  accessRoutes: AccessRoute[]
  organization: string
}

export interface DemoUser extends AuthSession {
  password: string
  email: string
  department: string
}

type LegacyUser = {
  userId: string
  name: string
  password: string
  email?: string
  department?: string
  role?: UserRole
  roles?: UserRole[]
  accessRoutes?: AccessRoute[]
  organization?: string
}

type LegacySession = {
  userId: string
  name: string
  role?: UserRole
  roles?: UserRole[]
  accessRoutes?: AccessRoute[]
  organization?: string
}

export const AUTH_STORAGE_KEY = "vehicle-management-session"
export const AUTH_EVENT_NAME = "vehicle-management-auth-change"
export const USER_DIRECTORY_STORAGE_KEY = "vehicle-management-users"
export const USER_DIRECTORY_EVENT_NAME = "vehicle-management-users-change"
export const ORGANIZATION_STORAGE_KEY = "vehicle-management-organizations"
export const ORGANIZATION_EVENT_NAME = "vehicle-management-organizations-change"

export const roleLabels: Record<UserRole, string> = {
  "super-admin": "Super Admin",
  admin: "Admin",
  "head-office": "Head Office",
  gate: "Gate Pass",
  maintenance: "Maintenance",
  "vehicle-assignment": "Vehicle Assignment",
}

const adminWorkspaceRoutes: AccessRoute[] = ["/admin"]

const roleDefaultAccess: Record<UserRole, AccessRoute[]> = {
  "super-admin": ["/superadmin", "/settings"],
  admin: adminWorkspaceRoutes,
  "head-office": accessOptions.map((item) => item.route),
  gate: ["/gatepass", "/vehicleassignment"],
  maintenance: ["/maintenance"],
  "vehicle-assignment": ["/vehicleassignment"],
}

export const defaultOrganizations: OrganizationConfig[] = [
  {
    name: "Pro",
    maxUsers: 5,
    address: "",
    phone: "",
    country: "India",
    email: "",
    pan: "",
  },
]

function normalizeOrganization(organization: Partial<OrganizationConfig> & Pick<OrganizationConfig, "name" | "maxUsers">): OrganizationConfig {
  return {
    name: organization.name,
    maxUsers: organization.maxUsers,
    address: organization.address ?? "",
    phone: organization.phone ?? "",
    country: organization.country ?? "",
    email: organization.email ?? "",
    pan: organization.pan ?? "",
  }
}

export const defaultDemoUsers: DemoUser[] = [
  { userId: "supad", password: "1234", name: "Super Administrator", email: "superadmin@platform.local", department: "Platform", roles: ["super-admin"], accessRoutes: roleDefaultAccess["super-admin"], organization: "Platform" },
  { userId: "admin", password: "1234", name: "Administrator", email: "admin@pro.local", department: "Administration", roles: ["admin"], accessRoutes: roleDefaultAccess.admin, organization: "Pro" },
  { userId: "heado", password: "1234", name: "Head Office", email: "headoffice@pro.local", department: "Operations", roles: ["head-office"], accessRoutes: roleDefaultAccess["head-office"], organization: "Pro" },
  { userId: "gate1", password: "1234", name: "Gate Officer", email: "gate@pro.local", department: "Gate", roles: ["gate"], accessRoutes: roleDefaultAccess.gate, organization: "Pro" },
  { userId: "maint", password: "1234", name: "Maintenance Officer", email: "maintenance@pro.local", department: "Maintenance", roles: ["maintenance"], accessRoutes: roleDefaultAccess.maintenance, organization: "Pro" },
  { userId: "vehas", password: "1234", name: "Vehicle Assignment Officer", email: "vehicle@pro.local", department: "Transport", roles: ["vehicle-assignment"], accessRoutes: roleDefaultAccess["vehicle-assignment"], organization: "Pro" },
]

function normalizeRoles(roles?: UserRole[]) {
  const safeRoles = roles?.filter(Boolean) ?? []
  return safeRoles.length > 0 ? Array.from(new Set(safeRoles)) : (["head-office"] as UserRole[])
}

function normalizeAccessRoutes(accessRoutes?: AccessRoute[], roles?: UserRole[]) {
  const normalizedRoles = normalizeRoles(roles)
  const safeRoutes = accessRoutes?.filter(Boolean) ?? []
  const roleBasedRoutes = normalizedRoles.flatMap((role) => roleDefaultAccess[role])

  if (normalizedRoles.includes("admin") && !normalizedRoles.includes("super-admin")) {
    return adminWorkspaceRoutes
  }

  if (safeRoutes.length > 0) {
    return Array.from(new Set([...safeRoutes, ...roleBasedRoutes]))
  }

  return Array.from(new Set(roleBasedRoutes))
}

function emitWindowEvent(eventName: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(eventName))
  }
}

export function getStoredSessionToken() {
  if (typeof window === "undefined") {
    return null
  }

  return window.localStorage.getItem(AUTH_STORAGE_KEY)
}

export function storeSessionToken(token: string) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, token)
  emitWindowEvent(AUTH_EVENT_NAME)
}

export function clearStoredSessionToken() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY)
  emitWindowEvent(AUTH_EVENT_NAME)
}

export function getRoleLabel(role: UserRole) {
  return roleLabels[role]
}

export function getRoleLabels(roles: UserRole[]) {
  return normalizeRoles(roles).map(getRoleLabel).join(", ")
}

export function getDefaultAccessForRoles(roles: UserRole[]) {
  return normalizeAccessRoutes(undefined, roles)
}

export function getOrganizations() {
  if (typeof window === "undefined") {
    return defaultOrganizations
  }

  const rawOrganizations = window.localStorage.getItem(ORGANIZATION_STORAGE_KEY)
  if (!rawOrganizations) {
    return defaultOrganizations
  }

  try {
    const parsedOrganizations = JSON.parse(rawOrganizations) as OrganizationConfig[]
    return parsedOrganizations.length > 0 ? parsedOrganizations.map(normalizeOrganization) : defaultOrganizations
  } catch {
    window.localStorage.removeItem(ORGANIZATION_STORAGE_KEY)
    return defaultOrganizations
  }
}

export function storeOrganizations(organizations: OrganizationConfig[]) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(ORGANIZATION_STORAGE_KEY, JSON.stringify(organizations.map(normalizeOrganization)))
  emitWindowEvent(ORGANIZATION_EVENT_NAME)
}

export function resetOrganizations() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(ORGANIZATION_STORAGE_KEY, JSON.stringify(defaultOrganizations))
  emitWindowEvent(ORGANIZATION_EVENT_NAME)
}

function normalizeUser(user: LegacyUser): DemoUser {
  const roles = normalizeRoles(user.roles ?? (user.role ? [user.role] : undefined))

  return {
    userId: user.userId,
    name: user.name,
    password: user.password,
    email: user.email ?? "",
    department: user.department ?? "",
    roles,
    accessRoutes: normalizeAccessRoutes(user.accessRoutes, roles),
    organization: user.organization ?? "Pro",
  }
}

function normalizeSession(session: LegacySession): AuthSession {
  const roles = normalizeRoles(session.roles ?? (session.role ? [session.role] : undefined))

  return {
    userId: session.userId,
    name: session.name,
    roles,
    accessRoutes: normalizeAccessRoutes(session.accessRoutes, roles),
    organization: session.organization ?? "Pro",
  }
}

export function getUserDirectory() {
  if (typeof window === "undefined") {
    return defaultDemoUsers
  }

  const rawUsers = window.localStorage.getItem(USER_DIRECTORY_STORAGE_KEY)
  if (!rawUsers) {
    return defaultDemoUsers
  }

  try {
    const parsedUsers = JSON.parse(rawUsers) as LegacyUser[]
    if (parsedUsers.length === 0) {
      return defaultDemoUsers
    }

    const normalizedUsers = parsedUsers.map(normalizeUser)
    const existingUserIds = new Set(normalizedUsers.map((user) => `${user.organization.toLowerCase()}::${user.userId.toLowerCase()}`))
    const missingDefaultUsers = defaultDemoUsers.filter(
      (user) => !existingUserIds.has(`${user.organization.toLowerCase()}::${user.userId.toLowerCase()}`)
    )

    return [...normalizedUsers, ...missingDefaultUsers]
  } catch {
    window.localStorage.removeItem(USER_DIRECTORY_STORAGE_KEY)
    return defaultDemoUsers
  }
}

export function storeUserDirectory(users: DemoUser[]) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(USER_DIRECTORY_STORAGE_KEY, JSON.stringify(users.map(normalizeUser)))
  emitWindowEvent(USER_DIRECTORY_EVENT_NAME)
}

export function resetUserDirectory() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(USER_DIRECTORY_STORAGE_KEY, JSON.stringify(defaultDemoUsers))
  emitWindowEvent(USER_DIRECTORY_EVENT_NAME)
}

export function getOrganizationLimit(organizationName: string) {
  return getOrganizations().find((organization) => organization.name.toLowerCase() === organizationName.toLowerCase()) ?? null
}

export function countUsersForOrganization(users: DemoUser[], organizationName: string) {
  return users.filter((user) => user.organization.toLowerCase() === organizationName.toLowerCase()).length
}

export function authenticateUser(organization: string, userId: string, password: string): AuthSession | null {
  const normalizedOrganization = organization.trim().toLowerCase()
  const normalizedUserId = userId.trim().toLowerCase()
  const user = getUserDirectory().find(
    (item) =>
      item.organization.toLowerCase() === normalizedOrganization &&
      item.userId.toLowerCase() === normalizedUserId &&
      item.password === password
  )

  if (!user) {
    return null
  }

  return {
    userId: user.userId,
    name: user.name,
    roles: normalizeRoles(user.roles),
    accessRoutes: normalizeAccessRoutes(user.accessRoutes, user.roles),
    organization: user.organization,
  }
}

export function getDefaultRouteForSession(session: Pick<AuthSession, "roles" | "accessRoutes">) {
  if (session.roles.includes("super-admin")) {
    return "/superadmin"
  }
  if (session.roles.includes("admin")) {
    return "/admin"
  }

  if (session.accessRoutes.includes("/dashboard")) return "/dashboard"
  return session.accessRoutes[0] ?? "/dashboard"
}

export function canAccessRoute(session: Pick<AuthSession, "roles" | "accessRoutes">, pathname: string) {
  if (session.roles.includes("super-admin") && (pathname === "/superadmin" || pathname === "/settings" || pathname.startsWith("/settings/"))) {
    return true
  }

  if (session.roles.includes("admin") && pathname === "/admin") {
    return true
  }

  return session.accessRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export function getStoredSession(): AuthSession | null {
  return null
}

export function storeSession(session: AuthSession) {
  void session
}

export function clearStoredSession() {
  clearStoredSessionToken()
}
