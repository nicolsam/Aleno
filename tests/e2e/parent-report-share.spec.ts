import { expect, test } from '@playwright/test'
import { prisma } from '../../src/lib/db'
import { loginByApi } from './utils'

const TEACHER_EMAIL = 'test-regular@example.com'
const SCHOOL_ID = 'e2e-parent-report-school'
const CLASS_ID = 'e2e-parent-report-class'
const STUDENT_ID = 'e2e-parent-report-student'
const ENROLLMENT_ID = 'e2e-parent-report-enrollment'

async function cleanupFixtures() {
  await prisma.studentParentReportLink.deleteMany({ where: { studentId: STUDENT_ID } })
  await prisma.studentContact.deleteMany({ where: { studentId: STUDENT_ID } })
  await prisma.studentReadingHistory.deleteMany({ where: { studentId: STUDENT_ID } })
  await prisma.studentEnrollment.deleteMany({ where: { studentId: STUDENT_ID } })
  await prisma.student.deleteMany({ where: { id: STUDENT_ID } })
  await prisma.class.deleteMany({ where: { id: CLASS_ID } })
  await prisma.userSchool.deleteMany({ where: { schoolId: SCHOOL_ID } })
  await prisma.school.deleteMany({ where: { id: SCHOOL_ID } })
}

async function seedFixtures() {
  const teacher = await prisma.user.findUnique({ where: { email: TEACHER_EMAIL } })
  if (!teacher) throw new Error(`Missing E2E teacher: ${TEACHER_EMAIL}`)

  const level = await prisma.readingLevel.upsert({
    where: { code: 'RW' },
    update: { name: 'Reads Words', order: 4 },
    create: { code: 'RW', name: 'Reads Words', order: 4 },
  })

  await prisma.school.create({
    data: {
      id: SCHOOL_ID,
      name: 'E2E Parent Report School',
      users: { create: { userId: teacher.id, role: 'TEACHER' } },
      classes: {
        create: {
          id: CLASS_ID,
          grade: '1º Ano',
          section: 'P',
          shift: 'Morning',
          academicYear: 2026,
        },
      },
    },
  })

  await prisma.student.create({
    data: {
      id: STUDENT_ID,
      name: 'E2E Parent Report Student',
      studentNumber: 'E2E-REPORT-001',
      schoolId: SCHOOL_ID,
      classId: CLASS_ID,
      enrollments: {
        create: {
          id: ENROLLMENT_ID,
          classId: CLASS_ID,
          startedAt: new Date('2026-01-01T12:00:00.000Z'),
        },
      },
    },
  })

  await prisma.studentReadingHistory.create({
    data: {
      id: 'e2e-parent-report-history',
      studentId: STUDENT_ID,
      enrollmentId: ENROLLMENT_ID,
      readingLevelId: level.id,
      userId: teacher.id,
      recordedAt: new Date('2026-05-03T12:00:00.000Z'),
      notes: 'E2E report note',
    },
  })
}

test.describe('parent report sharing', () => {
  test.beforeEach(async () => {
    await cleanupFixtures()
    await seedFixtures()
  })

  test.afterEach(async () => {
    await cleanupFixtures()
  })

  test('stores a contact, creates a WhatsApp report link, and opens the public report', async ({ page }) => {
    await loginByApi(page, TEACHER_EMAIL, 'playwright123', SCHOOL_ID)
    await page.goto(`/dashboard/students/${STUDENT_ID}`)

    await expect(page.getByRole('heading', { name: 'E2E Parent Report Student' })).toBeVisible()
    await page.getByPlaceholder(/Nome do contato|Contact name/).fill('Maria Parent')
    await page.getByPlaceholder(/Parentesco|Relationship/).fill('Mother')
    await page.getByPlaceholder(/WhatsApp/).fill('(85) 99999-0000')
    await page.getByRole('button', { name: /Adicionar contato|Add contact/ }).click()
    await expect(page.locator('p').filter({ hasText: 'Maria Parent' })).toBeVisible()

    await page.getByRole('button', { name: /Gerar link do relatório|Generate report link/ }).click()
    const reportLink = await page.locator('text=/reports\\/students\\//').last().textContent()
    expect(reportLink).toContain('/reports/students/')

    const popupPromise = page.waitForEvent('popup')
    await page.getByRole('button', { name: /Enviar no WhatsApp|Share on WhatsApp/ }).click()
    const popup = await popupPromise
    expect(popup.url()).toContain('phone=5585999990000')
    await popup.close()

    const reportPath = new URL(reportLink || '').pathname
    await page.goto(reportPath)
    await expect(page.getByRole('heading', { name: 'E2E Parent Report Student' })).toBeVisible()
    await expect(page.getByText('E2E report note')).toBeVisible()
  })
})
