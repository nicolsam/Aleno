import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aleno - Teacher Dashboard",
  description: "Track and analyze student reading skills",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}