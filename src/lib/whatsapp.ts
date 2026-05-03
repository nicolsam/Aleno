export function buildWhatsappShareUrl(shareText: string, whatsappPhone?: string | null): string {
  const encodedText = encodeURIComponent(shareText)
  if (whatsappPhone) return `https://wa.me/${whatsappPhone}?text=${encodedText}`
  return `https://wa.me/?text=${encodedText}`
}
