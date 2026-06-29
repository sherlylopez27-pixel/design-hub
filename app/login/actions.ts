'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { emailSchema } from '@/lib/validations'

export async function sendMagicLink(
  rawEmail: string
): Promise<{ error?: string }> {
  const parse = emailSchema.safeParse({ email: rawEmail })
  if (!parse.success) {
    return { error: 'Please enter a valid email address.' }
  }

  const email = parse.data.email.toLowerCase()
  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN

  // Domain check
  if (allowedDomain && !email.endsWith(`@${allowedDomain}`)) {
    return { error: 'Only company email addresses are allowed.' }
  }

  // Allowlist check
  const admin = createAdminClient()
  const { data: allowed } = await admin
    .from('admin_allowlist')
    .select('email')
    .eq('email', email)
    .maybeSingle()

  if (!allowed) {
    return { error: 'Your email is not on the admin allowlist. Contact your administrator.' }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const { error } = await admin.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  })

  if (error) {
    console.error('Magic link error:', error)
    return { error: 'Failed to send sign-in link. Please try again.' }
  }

  return {}
}
