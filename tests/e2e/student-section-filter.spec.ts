import { test, expect, type Page } from '@playwright/test'
import { prisma } from '../../src/lib/db'
import { loginByApi } from './utils'

const TEACHER_EMAIL = 'test-regular@example.com'
const SCHOOL_ID = 'e2e-section-filter-school'
const CLASSES = [
  { id: 'e2e-section-class-1c', grade: '1º Ano', section: 'C' },
  { id: 'e2e-section-class-1a', grade: '1º Ano', section: 'A' },
  { id: 'e2e-section-class-2b', grade: '2º Ano', section: 'B' },
  { id: 'e2e-section-class-2a10', grade: '2º Ano', section: 'A10' },
  { id: 'e2e-section-class-2a2', grade: '2º Ano', section: 'A2' },
] as const
const STUDENTS = {
  grade1A: {
    id: 'e2e-section-student-1a',
    name: 'E2E Section Student A',
    number: 'E2E-SECTION-001',
    classId: 'e2e-section-class-1a',
  },
  grade1C: {
    id: 'e2e-section-student-1c',
    name: 'E2E Section Student C',
    number: 'E2E-SECTION-002',
    classId: 'e2e-section-class-1c',
  },
  grade2B: {
    id: 'e2e-section-student-2b',
    name: 'E2E Section Student B',
    number: 'E2E-SECTION-003',
    classId: 'e2e-section-class-2b',
  },
} as const

const CLASS_IDS = CLASSES.map((classRecord) => classRecord.id)
const STUDENT_IDS = Object.values(STUDENTS).map((student) => student.id)

async function cleanupSectionFixtures() {
  await prisma.studentEnrollment.deleteMany({ where: { studentId: { in: STUDENT_IDS } } })
  await prisma.student.deleteMany({ where: { id: { in: STUDENT_IDS } } })
  await prisma.class.deleteMany({ where: { id: { in: CLASS_IDS } } })
  await prisma.teacherSchool.deleteMany({ where: { schoolId: SCHOOL_ID } })
  await prisma.school.deleteMany({ where: { id: SCHOOL_ID } })
}

async function seedSectionFixtures() {
  const teacher = await prisma.teacher.findUnique({ where: { email: TEACHER_EMAIL } })
  if (!teacher) throw new Error(`Missing E2E teacher: ${TEACHER_EMAIL}`)

  const academicYear = new Date().getFullYear()
  await prisma.school.create({
    data: {
      id: SCHOOL_ID,
      name: 'E2E Section Filter School',
      teachers: {
        create: {
          teacherId: teacher.id,
        },
      },
      classes: {
        create: CLASSES.map((classRecord) => ({
          id: classRecord.id,
          grade: classRecord.grade,
          section: classRecord.section,
          shift: 'Morning',
          academicYear,
        })),
      },
    },
  })

  for (const student of Object.values(STUDENTS)) {
    await prisma.student.create({
      data: {
        id: student.id,
        name: student.name,
        studentNumber: student.number,
        schoolId: SCHOOL_ID,
        classId: student.classId,
        enrollments: {
          create: {
            id: `${student.id}-enrollment`,
            classId: student.classId,
            startedAt: new Date(academicYear, 0, 1),
          },
        },
      },
    })
  }
}

async function openFilter(page: Page, testId: string) {
  await page.getByTestId(testId).click()
}

async function selectFilterOption(page: Page, testId: string, optionName: string) {
  await openFilter(page, testId)
  await page.getByRole('option', { name: optionName, exact: true }).click()
}

async function expectOpenOptions(page: Page, expectedOptions: (string | RegExp)[]) {
  await expect(page.getByRole('option')).toHaveText(expectedOptions)
}

test.describe('students section filter', () => {
  test.beforeAll(async () => {
    await cleanupSectionFixtures()
    await seedSectionFixtures()
  })

  test.afterAll(async () => {
    await cleanupSectionFixtures()
  })

  test('shows alphabetical section options and filters by selected grade', async ({ page }) => {
    await loginByApi(page, TEACHER_EMAIL, 'playwright123', SCHOOL_ID)
    await page.goto('/dashboard/students')

    await expect(page.getByText(STUDENTS.grade1A.name)).toBeVisible()
    await expect(page.getByText(STUDENTS.grade1C.name)).toBeVisible()
    await expect(page.getByText(STUDENTS.grade2B.name)).toBeVisible()

    await openFilter(page, 'students-section-filter')
    await expectOpenOptions(page, [/All|Todos/, 'A', 'A2', 'A10', 'B', 'C'])
    await page.keyboard.press('Escape')

    await selectFilterOption(page, 'students-grade-filter', '1º Ano')
    await openFilter(page, 'students-section-filter')
    await expectOpenOptions(page, [/All|Todos/, 'A', 'C'])
    await page.getByRole('option', { name: 'A', exact: true }).click()

    await expect(page.getByText(STUDENTS.grade1A.name)).toBeVisible()
    await expect(page.getByText(STUDENTS.grade1C.name)).toBeHidden()
    await expect(page.getByText(STUDENTS.grade2B.name)).toBeHidden()

    await selectFilterOption(page, 'students-section-filter', 'C')
    await expect(page.getByText(STUDENTS.grade1A.name)).toBeHidden()
    await expect(page.getByText(STUDENTS.grade1C.name)).toBeVisible()
    await expect(page.getByText(STUDENTS.grade2B.name)).toBeHidden()

    await selectFilterOption(page, 'students-grade-filter', '2º Ano')
    await expect(page.getByTestId('students-section-filter')).toContainText(/All|Todos/)
    await openFilter(page, 'students-section-filter')
    await expectOpenOptions(page, [/All|Todos/, 'A2', 'A10', 'B'])
    await page.keyboard.press('Escape')

    await expect(page.getByText(STUDENTS.grade1A.name)).toBeHidden()
    await expect(page.getByText(STUDENTS.grade1C.name)).toBeHidden()
    await expect(page.getByText(STUDENTS.grade2B.name)).toBeVisible()
  })
})
