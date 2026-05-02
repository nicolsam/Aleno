import { test, expect, type Page } from '@playwright/test'
import bcrypt from 'bcryptjs'
import { prisma } from '../../src/lib/db'
import { loginByApi } from './utils'

const ADMIN_EMAIL = 'test-admin@example.com'
const SEARCH_TEACHER = {
  id: 'e2e-search-teacher',
  name: 'E2E Search Teacher Marina',
  email: 'marina.search@example.com',
}
const INVITE = {
  id: 'e2e-search-invite',
  name: 'E2E Pending Search Teacher',
  email: 'pending.search@example.com',
}
const SCHOOLS = {
  sao: {
    id: 'e2e-search-school-sao',
    name: 'E2E São Search School',
    address: 'Rua Alpha Search',
  },
  beta: {
    id: 'e2e-search-school-beta',
    name: 'E2E Beta Search School',
    address: 'Avenida Beta Search',
  },
} as const
const CLASSES = {
  sao: {
    id: 'e2e-search-class-sao',
    grade: '2º Ano',
    section: 'Z',
  },
  beta: {
    id: 'e2e-search-class-beta',
    grade: '5º Ano',
    section: 'Y',
  },
} as const
const STUDENTS = {
  ana: {
    id: 'e2e-search-student-ana',
    name: 'E2E Ana Search Student',
    number: 'E2E-SEARCH-001',
  },
  bruno: {
    id: 'e2e-search-student-bruno',
    name: 'E2E Bruno Search Student',
    number: 'E2E-SEARCH-002',
  },
} as const

async function cleanupSearchFixtures() {
  const studentIds = Object.values(STUDENTS).map((student) => student.id)
  const classIds = Object.values(CLASSES).map((classRecord) => classRecord.id)
  const schoolIds = Object.values(SCHOOLS).map((school) => school.id)

  await prisma.studentEnrollment.deleteMany({ where: { studentId: { in: studentIds } } })
  await prisma.student.deleteMany({ where: { id: { in: studentIds } } })
  await prisma.userInvite.deleteMany({ where: { id: INVITE.id } })
  await prisma.userSchool.deleteMany({ where: { OR: [{ userId: SEARCH_TEACHER.id }, { schoolId: { in: schoolIds } }] } })
  await prisma.user.deleteMany({ where: { id: SEARCH_TEACHER.id } })
  await prisma.class.deleteMany({ where: { id: { in: classIds } } })
  await prisma.school.deleteMany({ where: { id: { in: schoolIds } } })
}

async function seedSearchFixtures() {
  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } })
  if (!admin) throw new Error(`Missing E2E admin: ${ADMIN_EMAIL}`)

  const academicYear = new Date().getFullYear()
  const hashedPassword = await bcrypt.hash('playwright123', 10)

  await prisma.school.createMany({
    data: Object.values(SCHOOLS),
  })

  await prisma.class.createMany({
    data: [
      { ...CLASSES.sao, shift: 'Morning', academicYear, schoolId: SCHOOLS.sao.id },
      { ...CLASSES.beta, shift: 'Afternoon', academicYear, schoolId: SCHOOLS.beta.id },
    ],
  })

  await prisma.user.create({
    data: {
      ...SEARCH_TEACHER,
      password: hashedPassword,
      schools: {
        create: {
          schoolId: SCHOOLS.sao.id,
          role: 'TEACHER',
        },
      },
    },
  })

  await prisma.userInvite.create({
    data: {
      ...INVITE,
      role: 'TEACHER',
      schoolId: SCHOOLS.beta.id,
      token: 'e2e-search-token',
      tokenHash: 'e2e-search-token-hash',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdById: admin.id,
    },
  })

  await prisma.student.create({
    data: {
      id: STUDENTS.ana.id,
      name: STUDENTS.ana.name,
      studentNumber: STUDENTS.ana.number,
      schoolId: SCHOOLS.sao.id,
      classId: CLASSES.sao.id,
      enrollments: {
        create: {
          id: `${STUDENTS.ana.id}-enrollment`,
          classId: CLASSES.sao.id,
          startedAt: new Date(academicYear, 0, 1),
        },
      },
    },
  })

  await prisma.student.create({
    data: {
      id: STUDENTS.bruno.id,
      name: STUDENTS.bruno.name,
      studentNumber: STUDENTS.bruno.number,
      schoolId: SCHOOLS.beta.id,
      classId: CLASSES.beta.id,
      enrollments: {
        create: {
          id: `${STUDENTS.bruno.id}-enrollment`,
          classId: CLASSES.beta.id,
          startedAt: new Date(academicYear, 0, 1),
        },
      },
    },
  })
}

async function loginAdminByApi(page: Page) {
  await prisma.userSession.deleteMany({ where: { user: { email: ADMIN_EMAIL } } })
  await loginByApi(page, ADMIN_EMAIL)
}

test.describe('dashboard list search', () => {
  test.beforeAll(async () => {
    await cleanupSearchFixtures()
    await seedSearchFixtures()
  })

  test.afterAll(async () => {
    await cleanupSearchFixtures()
  })

  test('filters students by visible name and number fields', async ({ page }) => {
    await loginAdminByApi(page)
    await page.goto('/dashboard/students')

    await expect(page.getByText(STUDENTS.ana.name)).toBeVisible()
    await expect(page.getByText(STUDENTS.bruno.name)).toBeVisible()

    await page.getByTestId('students-search').fill('Ana Search')
    await expect(page.getByText(STUDENTS.ana.name)).toBeVisible()
    await expect(page.getByText(STUDENTS.bruno.name)).toBeHidden()

    await page.getByTestId('students-search').fill(STUDENTS.bruno.number)
    await expect(page.getByText(STUDENTS.ana.name)).toBeHidden()
    await expect(page.getByText(STUDENTS.bruno.name)).toBeVisible()
  })

  test('filters classes by visible grade, section, and school fields', async ({ page }) => {
    await loginAdminByApi(page)
    await page.goto('/dashboard/classes')

    await expect(page.getByText(SCHOOLS.sao.name)).toBeVisible()
    await expect(page.getByText(SCHOOLS.beta.name)).toBeVisible()

    await page.getByTestId('classes-search').fill('sao search')
    await expect(page.getByText(SCHOOLS.sao.name)).toBeVisible()
    await expect(page.getByText(SCHOOLS.beta.name)).toBeHidden()

    await page.getByTestId('classes-search').fill('5º Ano')
    await expect(page.getByText(SCHOOLS.sao.name)).toBeHidden()
    await expect(page.getByText(SCHOOLS.beta.name)).toBeVisible()
  })

  test('filters schools by visible name and address fields', async ({ page }) => {
    await loginAdminByApi(page)
    await page.goto('/dashboard/schools')

    await expect(page.getByText(SCHOOLS.sao.name)).toBeVisible()
    await expect(page.getByText(SCHOOLS.beta.name)).toBeVisible()

    await page.getByTestId('schools-search').fill('sao search')
    await expect(page.getByText(SCHOOLS.sao.name)).toBeVisible()
    await expect(page.getByText(SCHOOLS.beta.name)).toBeHidden()

    await page.getByTestId('schools-search').fill(SCHOOLS.beta.address)
    await expect(page.getByText(SCHOOLS.sao.name)).toBeHidden()
    await expect(page.getByText(SCHOOLS.beta.name)).toBeVisible()
  })

  test('filters teachers and pending invites by visible fields', async ({ page }) => {
    await loginAdminByApi(page)
    await page.goto('/dashboard/teachers')

    await expect(page.getByText(SEARCH_TEACHER.name)).toBeVisible()
    await expect(page.getByText(INVITE.name)).toBeVisible()

    await page.getByTestId('teachers-search').fill(SEARCH_TEACHER.email)
    await expect(page.getByText(SEARCH_TEACHER.name)).toBeVisible()
    await expect(page.getByText(INVITE.name)).toBeHidden()

    await page.getByTestId('teachers-search').fill(INVITE.email)
    await expect(page.getByText(SEARCH_TEACHER.name)).toBeHidden()
    await expect(page.getByText(INVITE.name)).toBeVisible()
  })
})
