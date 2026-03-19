import { createHash, randomUUID, timingSafeEqual } from "node:crypto"
import type { organizations, permissions, roles, user_permissions, user_roles, users } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import {
  accessOptions,
  defaultDemoUsers,
  defaultOrganizations,
  getDefaultAccessForRoles,
  roleLabels,
  type AccessRoute,
  type AuthSession,
  type DemoUser,
  type OrganizationConfig,
  type UserRole,
} from "@/lib/auth"

type DbUserWithRelations = users & {
  organizations: organizations | null
  user_roles: Array<user_roles & { roles: roles | null }>
  user_permissions: Array<user_permissions & { permissions: permissions | null }>
}

let bootstrapPromise: Promise<void> | null = null

const roleCodeMap: Record<UserRole, string> = {
  "super-admin": "super-admin",
  admin: "admin",
  "head-office": "head-office",
  gate: "gate",
  maintenance: "maintenance",
  "vehicle-assignment": "vehicle-assignment",
}

const permissionSeed = accessOptions.map((item) => ({
  name: item.label,
  code: item.route.replace("/", "").replaceAll("/", "-") || "root",
  module: item.route,
}))

function routeToPermissionCode(route: AccessRoute) {
  return route.replace("/", "").replaceAll("/", "-") || "root"
}

function permissionCodeToRoute(code: string) {
  return accessOptions.find((item) => routeToPermissionCode(item.route) === code)?.route ?? null
}

const rolePermissionMap: Record<UserRole, AccessRoute[]> = {
  "super-admin": ["/superadmin", "/settings"],
  admin: ["/admin"],
  "head-office": accessOptions.map((item) => item.route),
  gate: ["/gatepass", "/vehicleassignment"],
  maintenance: ["/maintenance"],
  "vehicle-assignment": ["/vehicleassignment"],
}

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex")
}

function verifyPassword(password: string, passwordHash: string) {
  const hashedInput = hashPassword(password)

  try {
    return timingSafeEqual(Buffer.from(hashedInput), Buffer.from(passwordHash))
  } catch {
    return hashedInput === passwordHash || password === passwordHash
  }
}

function toOrganizationConfig(organization: organizations): OrganizationConfig {
  return {
    name: organization.name,
    maxUsers: organization.max_users ?? 0,
    address: [organization.address_line_1, organization.address_line_2].filter(Boolean).join(", "),
    phone: organization.phone ?? "",
    country: organization.country ?? "",
    email: organization.email ?? "",
    pan: organization.pan_number ?? "",
  }
}

function toSession(user: DbUserWithRelations): AuthSession {
  const roles = user.user_roles
    .map((item) => item.roles?.code)
    .filter(Boolean) as UserRole[]
  const customAccessRoutes = user.user_permissions
    .map((item) => item.permissions?.code)
    .filter(Boolean)
    .map((code) => permissionCodeToRoute(code as string))
    .filter(Boolean) as AccessRoute[]

  return {
    userId: user.user_id ?? "",
    name: user.name,
    roles,
    accessRoutes: customAccessRoutes.length > 0 ? Array.from(new Set(customAccessRoutes)) : getDefaultAccessForRoles(roles),
    organization: user.organizations?.name ?? "",
  }
}

async function toDemoUser(user: DbUserWithRelations, departmentMap: Map<string, string>): Promise<DemoUser> {
  const session = toSession(user)

  return {
    ...session,
    password: "1234",
    email: user.email,
    department: user.department_id ? departmentMap.get(user.department_id) ?? "" : "",
  }
}

function makeOrganizationCode(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24)
}

async function ensureRole(role: UserRole) {
  return prisma.roles.upsert({
    where: { code: roleCodeMap[role] },
    update: { name: roleLabels[role], description: `${roleLabels[role]} role` },
    create: {
      name: roleLabels[role],
      code: roleCodeMap[role],
      description: `${roleLabels[role]} role`,
    },
  })
}

async function ensurePermission(permission: (typeof permissionSeed)[number]) {
  return prisma.permissions.upsert({
    where: { code: permission.code },
    update: {
      name: permission.name,
      module: permission.module,
    },
    create: permission,
  })
}

async function ensureDepartment(organizationId: string, departmentName: string) {
  const normalizedName = departmentName.trim()
  if (!normalizedName) {
    return null
  }

  const existing = await prisma.departments.findFirst({
    where: {
      organization_id: organizationId,
      name: {
        equals: normalizedName,
        mode: "insensitive",
      },
    },
  })

  if (existing) {
    return existing
  }

  return prisma.departments.create({
    data: {
      organization_id: organizationId,
      name: normalizedName,
      code: makeOrganizationCode(normalizedName).toUpperCase(),
    },
  })
}

async function ensureOrganization(organization: OrganizationConfig) {
  const code = makeOrganizationCode(organization.name).toUpperCase() || organization.name.toUpperCase()

  const existing = await prisma.organizations.findFirst({
    where: {
      name: {
        equals: organization.name,
        mode: "insensitive",
      },
    },
  })

  if (existing) {
    return prisma.organizations.update({
      where: { id: existing.id },
      data: {
        code: existing.code || code,
        email: organization.email,
        phone: organization.phone,
        country: organization.country,
        address_line_1: organization.address,
        pan_number: organization.pan,
        max_users: organization.maxUsers,
      },
    })
  }

  return prisma.organizations.create({
    data: {
      name: organization.name,
      code,
      email: organization.email,
      phone: organization.phone,
      country: organization.country,
      address_line_1: organization.address,
      pan_number: organization.pan,
      max_users: organization.maxUsers,
      status: "active",
    },
  })
}

async function ensureRolePermissions(roleRecord: roles, permissionRecords: permissions[]) {
  const desiredRoutes = rolePermissionMap[roleRecord.code as UserRole] ?? []
  for (const route of desiredRoutes) {
    const permissionCode = route.replace("/", "").replaceAll("/", "-") || "root"
    const permission = permissionRecords.find((item) => item.code === permissionCode)
    if (!permission) {
      continue
    }

    const existing = await prisma.role_permissions.findFirst({
      where: {
        role_id: roleRecord.id,
        permission_id: permission.id,
      },
    })

    if (!existing) {
      await prisma.role_permissions.create({
        data: {
          role_id: roleRecord.id,
          permission_id: permission.id,
        },
      })
    }
  }
}

async function syncUserPermissions(userId: string, accessRoutes: AccessRoute[]) {
  const permissionCodes = accessRoutes.map(routeToPermissionCode)
  const permissionRecords = await prisma.permissions.findMany({
    where: {
      code: {
        in: permissionCodes,
      },
    },
  })

  await prisma.user_permissions.deleteMany({
    where: { user_id: userId },
  })

  for (const permission of permissionRecords) {
    await prisma.user_permissions.create({
      data: {
        user_id: userId,
        permission_id: permission.id,
      },
    })
  }
}

async function ensureUser(user: DemoUser) {
  const organization = await ensureOrganization({
    name: user.organization,
    maxUsers: defaultOrganizations.find((item) => item.name === user.organization)?.maxUsers ?? 5,
    address: "",
    phone: "",
    country: user.organization === "Platform" ? "" : "India",
    email: "",
    pan: "",
  })
  const department = await ensureDepartment(organization.id, user.department)
  const existing = await prisma.users.findFirst({
    where: {
      organization_id: organization.id,
      user_id: {
        equals: user.userId,
        mode: "insensitive",
      },
    },
  })

  const passwordHash = hashPassword(user.password)
  const dbUser = existing
    ? await prisma.users.update({
        where: { id: existing.id },
        data: {
          name: user.name,
          email: user.email,
          password_hash: existing.password_hash || passwordHash,
          department_id: department?.id ?? null,
          status: "active",
        },
      })
    : await prisma.users.create({
        data: {
          organization_id: organization.id,
          user_id: user.userId,
          name: user.name,
          email: user.email,
          password_hash: passwordHash,
          department_id: department?.id ?? null,
          status: "active",
        },
      })

  await prisma.user_roles.deleteMany({
    where: {
      user_id: dbUser.id,
      roles: {
        is: {
          code: {
            notIn: user.roles.map((role) => roleCodeMap[role]),
          },
        },
      },
    },
  })

  for (const role of user.roles) {
    const roleRecord = await ensureRole(role)
    const existingUserRole = await prisma.user_roles.findFirst({
      where: { user_id: dbUser.id, role_id: roleRecord.id },
    })

    if (!existingUserRole) {
      await prisma.user_roles.create({
        data: {
          user_id: dbUser.id,
          role_id: roleRecord.id,
        },
      })
    }
  }

  await syncUserPermissions(dbUser.id, user.accessRoutes)
}

async function runBootstrapData() {
  const permissions = []
  for (const permission of permissionSeed) {
    permissions.push(await ensurePermission(permission))
  }

  for (const role of Object.keys(roleCodeMap) as UserRole[]) {
    const roleRecord = await ensureRole(role)
    await ensureRolePermissions(roleRecord, permissions)
  }

  for (const organization of defaultOrganizations) {
    await ensureOrganization(organization)
  }

  for (const user of defaultDemoUsers) {
    await ensureUser(user)
  }
}

export async function ensureBootstrapData(force = false) {
  if (force) {
    bootstrapPromise = null
  }

  if (!bootstrapPromise) {
    bootstrapPromise = runBootstrapData()
  }

  await bootstrapPromise
}

export async function getOrganizationsFromDb() {
  await ensureBootstrapData()
  const organizations = await prisma.organizations.findMany({
    orderBy: { name: "asc" },
  })

  return organizations.map(toOrganizationConfig)
}

export async function resetOrganizationsInDb() {
  await ensureBootstrapData()
  await prisma.organizations.deleteMany({
    where: {
      name: {
        notIn: ["Platform"],
      },
    },
  })

  for (const organization of defaultOrganizations) {
    await ensureOrganization(organization)
  }

  await ensureBootstrapData(true)
  return getOrganizationsFromDb()
}

export async function saveOrganizationsToDb(organizations: OrganizationConfig[]) {
  await ensureBootstrapData()

  for (const organization of organizations) {
    await ensureOrganization(organization)
  }

  return getOrganizationsFromDb()
}

export async function deleteOrganizationInDb(organizationName: string) {
  await ensureBootstrapData()

  if (organizationName.trim().toLowerCase() === "platform") {
    throw new Error("Platform organization cannot be deleted")
  }

  const organization = await prisma.organizations.findFirst({
    where: {
      name: {
        equals: organizationName.trim(),
        mode: "insensitive",
      },
    },
    select: { id: true },
  })

  if (!organization) {
    return getOrganizationsFromDb()
  }

  await prisma.sessions.deleteMany({
    where: {
      users: {
        is: {
          organization_id: organization.id,
        },
      },
    },
  })
  await prisma.user_permissions.deleteMany({
    where: {
      users: {
        is: {
          organization_id: organization.id,
        },
      },
    },
  })
  await prisma.user_roles.deleteMany({
    where: {
      users: {
        is: {
          organization_id: organization.id,
        },
      },
    },
  })
  await prisma.gate_passes.deleteMany({ where: { organization_id: organization.id } })
  await prisma.trips.deleteMany({ where: { organization_id: organization.id } })
  await prisma.invoices.deleteMany({ where: { organization_id: organization.id } })
  await prisma.order_items.deleteMany({
    where: {
      orders: {
        is: {
          organization_id: organization.id,
        },
      },
    },
  })
  await prisma.orders.deleteMany({ where: { organization_id: organization.id } })
  await prisma.drivers.deleteMany({ where: { organization_id: organization.id } })
  await prisma.vehicles.deleteMany({ where: { organization_id: organization.id } })
  await prisma.departments.deleteMany({ where: { organization_id: organization.id } })
  await prisma.users.deleteMany({ where: { organization_id: organization.id } })
  await prisma.organizations.delete({ where: { id: organization.id } })

  return getOrganizationsFromDb()
}

export async function getUsersFromDb() {
  await ensureBootstrapData()
  const users = await prisma.users.findMany({
    include: {
      organizations: true,
      user_roles: {
        include: {
          roles: true,
        },
      },
      user_permissions: {
        include: {
          permissions: true,
        },
      },
    },
    orderBy: [{ organization_id: "asc" }, { user_id: "asc" }],
  })
  const departments = await prisma.departments.findMany({
    select: {
      id: true,
      name: true,
    },
  })
  const departmentMap = new Map(departments.map((department) => [department.id, department.name]))

  const mappedUsers = []
  for (const user of users) {
    mappedUsers.push(await toDemoUser(user, departmentMap))
  }

  return mappedUsers
}

export async function saveUsersToDb(users: DemoUser[]) {
  await ensureBootstrapData()

  const incomingKeys = new Set(users.map((user) => `${user.organization.toLowerCase()}::${user.userId.toLowerCase()}`))
  const existingUsers = await prisma.users.findMany({
    include: {
      organizations: true,
    },
  })

  for (const existingUser of existingUsers) {
    const key = `${existingUser.organizations?.name.toLowerCase() ?? ""}::${existingUser.user_id?.toLowerCase() ?? ""}`
    if (!incomingKeys.has(key)) {
      await prisma.sessions.deleteMany({ where: { user_id: existingUser.id } })
      await prisma.user_permissions.deleteMany({ where: { user_id: existingUser.id } })
      await prisma.user_roles.deleteMany({ where: { user_id: existingUser.id } })
      await prisma.users.delete({ where: { id: existingUser.id } })
    }
  }

  for (const user of users) {
    await ensureUser(user)
  }

  return getUsersFromDb()
}

export async function deleteUserInDb(organizationName: string, userId: string) {
  await ensureBootstrapData()

  if (
    organizationName.trim().toLowerCase() === "platform" &&
    userId.trim().toLowerCase() === "supad"
  ) {
    throw new Error("Super admin cannot be deleted")
  }

  const organization = await prisma.organizations.findFirst({
    where: {
      name: {
        equals: organizationName.trim(),
        mode: "insensitive",
      },
    },
    select: { id: true },
  })

  if (!organization) {
    return getUsersFromDb()
  }

  const user = await prisma.users.findFirst({
    where: {
      organization_id: organization.id,
      user_id: {
        equals: userId.trim(),
        mode: "insensitive",
      },
    },
    select: { id: true },
  })

  if (!user) {
    return getUsersFromDb()
  }

  await prisma.sessions.deleteMany({ where: { user_id: user.id } })
  await prisma.user_permissions.deleteMany({ where: { user_id: user.id } })
  await prisma.user_roles.deleteMany({ where: { user_id: user.id } })
  await prisma.users.delete({ where: { id: user.id } })

  return getUsersFromDb()
}

export async function resetUsersInDb() {
  await ensureBootstrapData()
  await prisma.sessions.deleteMany()
  await prisma.user_permissions.deleteMany()
  await prisma.user_roles.deleteMany()
  await prisma.users.deleteMany({
    where: {
      user_id: {
        not: "supad",
      },
    },
  })

  for (const user of defaultDemoUsers) {
    await ensureUser(user)
  }

  await ensureBootstrapData(true)
  return getUsersFromDb()
}

export async function authenticateUserFromDb(organizationName: string, userId: string, password: string) {
  const normalizedOrganizationName = organizationName.trim()
  const normalizedUserId = userId.trim()
  const normalizedPassword = password.trim()

  const findUser = async () => {
    if (!normalizedOrganizationName || !normalizedUserId || !normalizedPassword) {
      return null
    }

    const organization = await prisma.organizations.findFirst({
      where: {
        name: {
          equals: normalizedOrganizationName,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
      },
    })

    if (!organization) {
      return null
    }

    return prisma.users.findFirst({
      where: {
        organization_id: organization.id,
        user_id: {
          equals: normalizedUserId,
          mode: "insensitive",
        },
      },
      include: {
        organizations: true,
        user_roles: {
          include: {
            roles: true,
          },
        },
        user_permissions: {
          include: {
            permissions: true,
          },
        },
      },
    })
  }

  let user = await findUser()

  if (!user) {
    await ensureBootstrapData()
    user = await findUser()
  }

  if (!user || !verifyPassword(normalizedPassword, user.password_hash)) {
    return null
  }

  await prisma.users.update({
    where: { id: user.id },
    data: {
      last_login_at: new Date(),
    },
  })

  const token = randomUUID()
  await prisma.sessions.create({
    data: {
      user_id: user.id,
      token,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  })

  return {
    token,
    session: toSession(user),
  }
}

export async function getSessionFromToken(token: string) {
  if (!token) {
    return null
  }

  const session = await prisma.sessions.findUnique({
    where: { token },
    include: {
      users: {
        include: {
          organizations: true,
          user_roles: {
            include: {
              roles: true,
            },
          },
          user_permissions: {
            include: {
              permissions: true,
            },
          },
        },
      },
    },
  })

  if (!session || (session.expires_at && session.expires_at.getTime() < Date.now()) || !session.users) {
    if (session) {
      await prisma.sessions.delete({ where: { token } }).catch(() => undefined)
    }
    return null
  }

  return toSession(session.users)
}

export async function clearSessionToken(token: string) {
  if (!token) {
    return
  }

  await prisma.sessions.deleteMany({
    where: { token },
  })
}
