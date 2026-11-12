// Username + password accounts. Supabase logs in with an email, so each username account gets a hidden
// placeholder address on a reserved domain that can never receive mail. Players never see it, and real emails
// are never sent back to the browser: logging in by username happens here, on the server.
//   POST { action: 'signup', username, password }  → new account, or upgrades the calling guest (keeps their Blips)
//   POST { action: 'login',  username, password }  → session for that player
// shortcut: logins share this function's IP for Supabase's sign-in rate limit; fine for a small player base.
import { createClient } from 'npm:@supabase/supabase-js@2'

const url = Deno.env.get('SUPABASE_URL')!
const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const fail = (error: string) => reply({ error }, 400)

async function passwordLogin(email: string, password: string, apikey: string) {
  const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return r.ok ? await r.json() : null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return fail('POST only')
  const apikey = req.headers.get('apikey') ?? ''
  const { action, username, password } = await req.json().catch(() => ({}))
  if (typeof username !== 'string' || typeof password !== 'string') return fail('Enter a username and password')

  if (action === 'login') {
    const { data: id } = await admin.rpc('user_by_name', { p_name: username })
    const email = id && (await admin.auth.admin.getUserById(id)).data.user?.email
    const session = email && (await passwordLogin(email, password, apikey))
    return session ? reply({ session }) : fail('Wrong username or password')
  }

  if (action !== 'signup') return fail('Unknown action')
  if (password.length < 8 || password.length > 72) return fail('Passwords need 8 or more characters')

  // A guest signing up keeps their progress: upgrade their account instead of making a new one.
  const token = req.headers.get('authorization')?.replace(/^Bearer /, '')
  const caller = token ? (await admin.auth.getUser(token)).data.user : null
  const email = `${crypto.randomUUID()}@players.blipup.invalid`
  let id: string
  if (caller?.is_anonymous) {
    id = caller.id
    const { error } = await admin.rpc('claim_username', { p_user: id, p_name: username })
    if (error) return fail(error.message)
    const up = await admin.auth.admin.updateUserById(id, { email, password, email_confirm: true })
    if (up.error) return fail(up.error.message)
  } else {
    const made = await admin.auth.admin.createUser({ email, password, email_confirm: true })
    if (made.error || !made.data.user) return fail(made.error?.message ?? 'Could not make the account')
    id = made.data.user.id
    const { error } = await admin.rpc('claim_username', { p_user: id, p_name: username })
    if (error) {
      await admin.auth.admin.deleteUser(id)
      return fail(error.message)
    }
  }
  const session = await passwordLogin(email, password, apikey)
  return session ? reply({ session }) : fail('Account made, but logging in failed. Try logging in.')
})
