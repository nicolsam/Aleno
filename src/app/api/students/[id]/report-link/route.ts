import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logAction } from '@/lib/audit'
import { forbiddenResponse, hasSchoolAccess, isAuthFailure, requireAuth } from '@/lib/permissions'
import {
  buildStudentReportShareText,
  buildStudentReportUrl,
  createStudentReportToken,
  getStudentReportExpirationDate,
  hashStudentReportToken,
} from '@/lib/student-report-links'

async function getShareableStudent(request: Request, studentId: string) {
  const auth = await requireAuth(request)
  if (isAuthFailure(auth)) return { response: auth.error }

  const student = await prisma.student.findUnique({
    where: { id: studentId, deletedAt: null },
    include: { school: { select: { id: true, name: true, deletedAt: true } } },
  })
  if (!student || student.school.deletedAt) {
    return { response: NextResponse.json({ error: 'Student not found' }, { status: 404 }) }
  }
  if (!hasSchoolAccess(auth.user, student.schoolId)) return { response: forbiddenResponse() }

  return { auth, student }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const access = await getShareableStudent(request, id)
    if (access.response) return access.response

    const token = createStudentReportToken()
    const reportLink = await prisma.studentParentReportLink.create({
      data: {
        studentId: id,
        createdById: access.auth!.user.id,
        tokenHash: hashStudentReportToken(token),
        expiresAt: getStudentReportExpirationDate(),
      },
    })
    const url = buildStudentReportUrl(request, token)
    const shareText = buildStudentReportShareText(access.student!.name, access.student!.school.name, url)

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(access.auth!.user.id, 'CREATE_STUDENT_REPORT_LINK', { studentId: id, reportLinkId: reportLink.id }, ipAddress)

    return NextResponse.json({
      reportLink: { id: reportLink.id, expiresAt: reportLink.expiresAt, url },
      shareText,
    }, { status: 201 })
  } catch (error) {
    console.error('Student report link POST error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
