import { prisma } from '@/lib/db'
import { hashStudentReportToken } from '@/lib/student-report-links'

export type StudentParentReport = {
  student: {
    id: string
    name: string
    studentNumber: string
    school: { name: string }
    class: {
      grade: string
      section: string
      shift: string
      academicYear: number
    }
  }
  expiresAt: Date
  history: {
    id: string
    recordedAt: Date
    notes: string | null
    readingLevel: { code: string; name: string; order: number }
    teacher: { name: string }
  }[]
}

export async function getStudentParentReportByToken(
  token: string,
  now = new Date()
): Promise<StudentParentReport | null> {
  const tokenHash = hashStudentReportToken(token)
  const reportLink = await prisma.studentParentReportLink.findUnique({
    where: { tokenHash },
    include: {
      student: {
        include: {
          school: { select: { name: true, deletedAt: true } },
          class: {
            select: {
              grade: true,
              section: true,
              shift: true,
              academicYear: true,
              deletedAt: true,
            },
          },
        },
      },
    },
  })

  if (!reportLink || reportLink.revokedAt || reportLink.expiresAt <= now) return null
  if (reportLink.student.deletedAt || reportLink.student.school.deletedAt || reportLink.student.class.deletedAt) return null

  await prisma.studentParentReportLink.update({
    where: { id: reportLink.id },
    data: { lastViewedAt: now },
  })

  const history = await prisma.studentReadingHistory.findMany({
    where: { studentId: reportLink.studentId },
    orderBy: [
      { recordedAt: 'desc' },
      { createdAt: 'desc' },
    ],
    include: {
      readingLevel: { select: { code: true, name: true, order: true } },
      user: { select: { name: true } },
    },
  })

  return {
    expiresAt: reportLink.expiresAt,
    student: {
      id: reportLink.student.id,
      name: reportLink.student.name,
      studentNumber: reportLink.student.studentNumber,
      school: { name: reportLink.student.school.name },
      class: reportLink.student.class,
    },
    history: history.map((entry) => ({ ...entry, teacher: entry.user })),
  }
}
