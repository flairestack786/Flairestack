'use client'

import type { ReactNode } from 'react'
import { NextAuthProvider } from '@/lib/next/NextAuthProvider'

export default function NextProviders({ children }: { children: ReactNode }) {
  return <NextAuthProvider>{children}</NextAuthProvider>
}
