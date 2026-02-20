import type { Metadata } from 'next'
import { Noto_Sans_KR, Newsreader } from 'next/font/google'
import './globals.css'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
})

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-newsreader',
})

export const metadata: Metadata = {
  title: 'Long Journey',
  description: '생각과 경험을 기록합니다.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={newsreader.variable}>
      <body className={notoSansKR.className}>{children}</body>
    </html>
  )
}