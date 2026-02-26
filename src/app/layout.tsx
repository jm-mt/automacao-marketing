import type { Metadata } from 'next'
import './globals.scss'

export const metadata: Metadata = {
  title: 'Automação de Marketing',
  description: 'Editor visual de fluxos de automação',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
