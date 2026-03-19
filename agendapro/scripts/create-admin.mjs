import { createClient } from '@supabase/supabase-js'

function parseArgs() {
  const [email, password, fullName = 'Administrador AgendaPro', profession = 'Administrador'] = process.argv.slice(2)

  if (!email || !password) {
    console.error('Uso: npm run create-admin -- <email> <senha> [nome] [profissao]')
    process.exit(1)
  }

  return { email, password, fullName, profession }
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function findUserByEmail(adminClient, email) {
  let page = 1

  while (page < 10) {
    const result = await adminClient.auth.admin.listUsers({ page, perPage: 200 })
    if (result.error) return null

    const match = result.data.users.find(user => user.email?.toLowerCase() === email.toLowerCase())
    if (match) return match
    if (result.data.users.length < 200) return null

    page += 1
  }

  return null
}

async function promoteProfile(adminClient, user, fullName, profession) {
  const slugBase = slugify(fullName) || `admin-${user.id.slice(0, 8)}`
  const payloads = [
    {
      id: user.id,
      full_name: fullName,
      profession,
      plan: 'business',
      role: 'admin',
      slug: `${slugBase}-${user.id.slice(0, 6)}`,
      booking_enabled: true,
      public_phone: false,
    },
    {
      id: user.id,
      full_name: fullName,
      profession,
      plan: 'business',
      role: 'admin',
      slug: `${slugBase}-${user.id.slice(0, 6)}`,
    },
    {
      id: user.id,
      full_name: fullName,
      profession,
      plan: 'business',
      slug: `${slugBase}-${user.id.slice(0, 6)}`,
    },
  ]

  for (const payload of payloads) {
    const result = await adminClient.from('profiles').upsert(payload, { onConflict: 'id' })
    if (!result.error) {
      return { profileMode: payload.role ? 'database-role' : 'legacy-plan-only' }
    }
  }

  return { profileMode: 'failed' }
}

async function main() {
  const { email, password, fullName, profession } = parseArgs()
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Defina SUPABASE_URL (ou VITE_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY antes de executar.')
    process.exit(1)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let user = null
  const createResult = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      profession,
    },
    app_metadata: {
      role: 'admin',
    },
  })

  if (createResult.error) {
    user = await findUserByEmail(adminClient, email)

    if (!user) {
      console.error('Não foi possível criar ou localizar o usuário admin.')
      console.error(createResult.error.message)
      process.exit(1)
    }

    await adminClient.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: {
        ...(user.user_metadata || {}),
        full_name: fullName,
        profession,
      },
      app_metadata: {
        ...(user.app_metadata || {}),
        role: 'admin',
      },
    })
  } else {
    user = createResult.data.user
  }

  const promotion = await promoteProfile(adminClient, user, fullName, profession)

  console.log('Conta admin preparada com sucesso:')
  console.log(`Email: ${email}`)
  console.log(`Senha: ${password}`)
  console.log(`User ID: ${user.id}`)
  console.log(`Modo de promoção: ${promotion.profileMode}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
