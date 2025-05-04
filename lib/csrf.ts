import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'

const CSRF_COOKIE = 'ark7-csrf-token'
const CSRF_HEADER = 'x-csrf-token'
const TOKEN_LENGTH = 32

export class CSRF {
  static generateToken(): string {
    return randomBytes(TOKEN_LENGTH).toString('hex')
  }

  static setToken(): string {
    const token = CSRF.generateToken()
    const cookieStore = cookies()
    
    cookieStore.set(CSRF_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    })

    return token
  }

  static getToken(): string | undefined {
    const cookieStore = cookies()
    return cookieStore.get(CSRF_COOKIE)?.value
  }

  static validateToken(headerToken?: string): boolean {
    if (!headerToken) return false
    const cookieToken = CSRF.getToken()
    return !!cookieToken && headerToken === cookieToken
  }
}

export const csrfHeaders = {
  [CSRF_HEADER]: CSRF.generateToken()
}

// Hook for React components
export function useCSRF() {
  return {
    getToken: CSRF.getToken,
    headers: csrfHeaders,
  }
}