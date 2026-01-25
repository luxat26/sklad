'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Ověří zadané heslo a nastaví session cookie.
 */
export async function loginAction(formData: FormData) {
  const password = formData.get('password')

  if (password === process.env.WAREHOUSE_PASSWORD) {
    const cookieStore = await cookies()
    // Nastavíme cookie na 30 dní
    cookieStore.set('warehouse_auth', 'true', { 
      httpOnly: true, 
      secure: true, 
      maxAge: 60 * 60 * 24 * 30 
    })
    redirect('/')
  }
  
  return { error: 'Nesprávné heslo' }
}