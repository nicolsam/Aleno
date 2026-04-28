export type ReadingLevelCode = 'DNI' | 'LO' | 'SO' | 'RW' | 'RS' | 'RTS' | 'RTF'

export interface ReadingLevelStyle {
  color: string
  backgroundColor: string
  textColor: string
}

export interface ReadingLevelMetadata {
  isAttention: boolean
  style: ReadingLevelStyle
}

const FALLBACK_STYLE: ReadingLevelStyle = {
  color: '#6B7280',
  backgroundColor: '#F3F4F6',
  textColor: '#374151',
}

export const READING_LEVEL_METADATA: Record<ReadingLevelCode, ReadingLevelMetadata> = {
  DNI: {
    isAttention: true,
    style: { color: '#DC2626', backgroundColor: '#FEE2E2', textColor: '#991B1B' },
  },
  LO: {
    isAttention: true,
    style: { color: '#DC2626', backgroundColor: '#FEE2E2', textColor: '#991B1B' },
  },
  SO: {
    isAttention: true,
    style: { color: '#DC2626', backgroundColor: '#FEE2E2', textColor: '#991B1B' },
  },
  RW: {
    isAttention: false,
    style: { color: '#F97316', backgroundColor: '#FFEDD5', textColor: '#9A3412' },
  },
  RS: {
    isAttention: false,
    style: { color: '#EAB308', backgroundColor: '#FEF9C3', textColor: '#854D0E' },
  },
  RTS: {
    isAttention: false,
    style: { color: '#84CC16', backgroundColor: '#ECFCCB', textColor: '#3F6212' },
  },
  RTF: {
    isAttention: false,
    style: { color: '#16A34A', backgroundColor: '#DCFCE7', textColor: '#166534' },
  },
}

export function isReadingLevelCode(code: string): code is ReadingLevelCode {
  return code in READING_LEVEL_METADATA
}

export function isAttentionReadingLevel(code: string | undefined): boolean {
  return !!code && isReadingLevelCode(code) && READING_LEVEL_METADATA[code].isAttention
}

export function getReadingLevelStyle(code: string | undefined): ReadingLevelStyle {
  if (!code || !isReadingLevelCode(code)) {
    return FALLBACK_STYLE
  }

  return READING_LEVEL_METADATA[code].style
}
