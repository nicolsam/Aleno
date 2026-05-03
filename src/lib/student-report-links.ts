import crypto from 'crypto'

export const STUDENT_REPORT_EXPIRATION_DAYS = 30

export function createStudentReportToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

export function hashStudentReportToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function getStudentReportExpirationDate(now = new Date()): Date {
  return new Date(now.getTime() + STUDENT_REPORT_EXPIRATION_DAYS * 24 * 60 * 60 * 1000)
}

export function buildStudentReportUrl(request: Request, token: string): string {
  const url = new URL(request.url)
  return `${url.origin}/reports/students/${token}`
}

export function buildStudentReportShareText(studentName: string, schoolName: string, reportUrl: string): string {
  return [
    'Ola! Compartilho o relatorio de leitura do estudante.',
    '',
    `Aluno: ${studentName}`,
    `Escola: ${schoolName}`,
    '',
    'Abra o link abaixo para acompanhar o progresso:',
    reportUrl,
  ].join('\n')
}
