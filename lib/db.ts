// Database operations using Supabase
import { createClient as createBrowserClient } from "@/lib/supabase/client"
import { createClient as createServerClient } from "@/lib/supabase/server"
import type {
  User,
  ScriptStep,
  Tabulation,
  ServiceSituation,
  Channel,
  Note,
  CallSession,
  Product,
  LoginSession,
} from "./types"

// Helper to determine if we're on the server or client
const isServer = typeof window === "undefined"

// Get the appropriate Supabase client
async function getSupabaseClient() {
  if (isServer) {
    return await createServerClient()
  }
  return createBrowserClient()
}

// User operations
export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const supabase = await getSupabaseClient()

  // For admin users, validate password
  const { data: users } = await supabase.from("users").select("*").ilike("username", username).single()

  if (!users) return null

  // If admin, check password via Supabase auth
  if (users.role === "admin") {
    // Admin users need to sign in with email/password
    // We'll use username@system.local as email format
    const email = `${username.toLowerCase()}@system.local`
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) return null

    // Update last login
    await supabase
      .from("users")
      .update({ last_login_at: new Date().toISOString(), is_online: true })
      .eq("id", data.user.id)

    // Create login session
    await supabase.from("login_sessions").insert({
      user_id: data.user.id,
      login_at: new Date().toISOString(),
    })

    return users as User
  }

  // For operators, no password needed - create a session
  // We'll use a simple token-based approach for operators
  const email = `${username.toLowerCase()}@operator.local`
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: "operator123", // Default password for operators
  })

  if (error) {
    // If operator doesn't exist in auth, create them
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: "operator123",
    })

    if (signUpError || !signUpData.user) return null

    // Create user profile
    await supabase.from("users").insert({
      id: signUpData.user.id,
      username: users.username,
      full_name: users.full_name,
      role: users.role,
      is_online: true,
      last_login_at: new Date().toISOString(),
    })
  } else if (data.user) {
    // Update last login
    await supabase
      .from("users")
      .update({ last_login_at: new Date().toISOString(), is_online: true })
      .eq("id", data.user.id)
  }

  // Create login session
  if (data?.user) {
    await supabase.from("login_sessions").insert({
      user_id: data.user.id,
      login_at: new Date().toISOString(),
    })
  }

  return users as User
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await getSupabaseClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return null

  const { data: user } = await supabase.from("users").select("*").eq("id", authUser.id).single()

  return user as User | null
}

export async function logout() {
  const supabase = await getSupabaseClient()

  const currentUser = await getCurrentUser()
  if (currentUser) {
    // Update the last login session
    const { data: sessions } = await supabase
      .from("login_sessions")
      .select("*")
      .eq("user_id", currentUser.id)
      .is("logout_at", null)
      .order("login_at", { ascending: false })
      .limit(1)

    if (sessions && sessions.length > 0) {
      const session = sessions[0]
      const logoutAt = new Date()
      const duration = logoutAt.getTime() - new Date(session.login_at).getTime()

      await supabase
        .from("login_sessions")
        .update({
          logout_at: logoutAt.toISOString(),
          duration,
        })
        .eq("id", session.id)
    }

    // Update user online status
    await supabase.from("users").update({ is_online: false }).eq("id", currentUser.id)
  }

  await supabase.auth.signOut()
}

// Product operations
export async function getProducts(): Promise<Product[]> {
  const supabase = await getSupabaseClient()

  const { data } = await supabase.from("products").select("*").order("name", { ascending: true })

  return (data as Product[]) || []
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await getSupabaseClient()

  const { data } = await supabase.from("products").select("*").eq("id", id).single()

  return (data as Product) || null
}

export async function createProduct(product: Omit<Product, "id" | "createdAt">): Promise<Product | null> {
  const supabase = await getSupabaseClient()

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: product.name,
      description: product.description,
      script_id: product.scriptId,
      category: product.category,
      is_active: product.isActive,
      attendance_types: product.attendanceTypes,
      person_types: product.personTypes,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating product:", error)
    return null
  }

  return data as Product
}

export async function updateProduct(product: Product): Promise<void> {
  const supabase = await getSupabaseClient()

  await supabase
    .from("products")
    .update({
      name: product.name,
      description: product.description,
      script_id: product.scriptId,
      category: product.category,
      is_active: product.isActive,
      attendance_types: product.attendanceTypes,
      person_types: product.personTypes,
    })
    .eq("id", product.id)
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = await getSupabaseClient()

  await supabase.from("products").delete().eq("id", id)
}

// Script step operations
export async function getScriptSteps(): Promise<ScriptStep[]> {
  const supabase = await getSupabaseClient()

  const { data: steps } = await supabase
    .from("script_steps")
    .select(
      `
      *,
      buttons:script_buttons(*),
      tabulations:step_tabulations(tabulation:tabulations(*))
    `,
    )
    .order("step_order", { ascending: true })

  if (!steps) return []

  // Transform the data to match our ScriptStep type
  return steps.map((step: any) => ({
    id: step.id,
    title: step.title,
    content: step.content,
    order: step.step_order,
    productId: step.product_id,
    formatting: step.formatting,
    buttons: step.buttons.map((btn: any) => ({
      id: btn.id,
      label: btn.label,
      nextStepId: btn.next_step_id,
      variant: btn.variant,
      order: btn.button_order,
      primary: btn.is_primary,
    })),
    tabulations: step.tabulations.map((st: any) => ({
      id: st.tabulation.id,
      name: st.tabulation.name,
      description: st.tabulation.description,
    })),
    createdAt: new Date(step.created_at),
    updatedAt: new Date(step.updated_at),
  }))
}

export async function getScriptStepById(id: string, productId?: string): Promise<ScriptStep | null> {
  const supabase = await getSupabaseClient()

  let query = supabase
    .from("script_steps")
    .select(
      `
      *,
      buttons:script_buttons(*),
      tabulations:step_tabulations(tabulation:tabulations(*))
    `,
    )
    .eq("id", id)

  if (productId) {
    query = query.eq("product_id", productId)
  }

  const { data: step } = await query.single()

  if (!step) return null

  return {
    id: step.id,
    title: step.title,
    content: step.content,
    order: step.step_order,
    productId: step.product_id,
    formatting: step.formatting,
    buttons: step.buttons.map((btn: any) => ({
      id: btn.id,
      label: btn.label,
      nextStepId: btn.next_step_id,
      variant: btn.variant,
      order: btn.button_order,
      primary: btn.is_primary,
    })),
    tabulations: step.tabulations.map((st: any) => ({
      id: st.tabulation.id,
      name: st.tabulation.name,
      description: st.tabulation.description,
    })),
    createdAt: new Date(step.created_at),
    updatedAt: new Date(step.updated_at),
  }
}

export async function getScriptStepsByProduct(productId: string): Promise<ScriptStep[]> {
  const supabase = await getSupabaseClient()

  const { data: steps } = await supabase
    .from("script_steps")
    .select(
      `
      *,
      buttons:script_buttons(*),
      tabulations:step_tabulations(tabulation:tabulations(*))
    `,
    )
    .eq("product_id", productId)
    .order("step_order", { ascending: true })

  if (!steps) return []

  return steps.map((step: any) => ({
    id: step.id,
    title: step.title,
    content: step.content,
    order: step.step_order,
    productId: step.product_id,
    formatting: step.formatting,
    buttons: step.buttons.map((btn: any) => ({
      id: btn.id,
      label: btn.label,
      nextStepId: btn.next_step_id,
      variant: btn.variant,
      order: btn.button_order,
      primary: btn.is_primary,
    })),
    tabulations: step.tabulations.map((st: any) => ({
      id: st.tabulation.id,
      name: st.tabulation.name,
      description: st.tabulation.description,
    })),
    createdAt: new Date(step.created_at),
    updatedAt: new Date(step.updated_at),
  }))
}

export async function createScriptStep(
  step: Omit<ScriptStep, "id" | "createdAt" | "updatedAt">,
): Promise<ScriptStep | null> {
  const supabase = await getSupabaseClient()

  const { data: newStep, error } = await supabase
    .from("script_steps")
    .insert({
      product_id: step.productId,
      title: step.title,
      content: step.content,
      step_order: step.order,
      formatting: step.formatting,
    })
    .select()
    .single()

  if (error || !newStep) {
    console.error("[v0] Error creating script step:", error)
    return null
  }

  // Create buttons
  if (step.buttons && step.buttons.length > 0) {
    const buttons = step.buttons.map((btn) => ({
      step_id: newStep.id,
      label: btn.label,
      next_step_id: btn.nextStepId,
      variant: btn.variant,
      button_order: btn.order,
      is_primary: btn.primary,
    }))

    await supabase.from("script_buttons").insert(buttons)
  }

  // Create tabulation associations
  if (step.tabulations && step.tabulations.length > 0) {
    const stepTabulations = step.tabulations.map((tab) => ({
      step_id: newStep.id,
      tabulation_id: tab.id,
    }))

    await supabase.from("step_tabulations").insert(stepTabulations)
  }

  return await getScriptStepById(newStep.id)
}

export async function updateScriptStep(step: ScriptStep): Promise<void> {
  const supabase = await getSupabaseClient()

  await supabase
    .from("script_steps")
    .update({
      title: step.title,
      content: step.content,
      step_order: step.order,
      formatting: step.formatting,
      product_id: step.productId,
    })
    .eq("id", step.id)

  // Update buttons - delete and recreate
  await supabase.from("script_buttons").delete().eq("step_id", step.id)

  if (step.buttons && step.buttons.length > 0) {
    const buttons = step.buttons.map((btn) => ({
      step_id: step.id,
      label: btn.label,
      next_step_id: btn.nextStepId,
      variant: btn.variant,
      button_order: btn.order,
      is_primary: btn.primary,
    }))

    await supabase.from("script_buttons").insert(buttons)
  }

  // Update tabulations - delete and recreate
  await supabase.from("step_tabulations").delete().eq("step_id", step.id)

  if (step.tabulations && step.tabulations.length > 0) {
    const stepTabulations = step.tabulations.map((tab) => ({
      step_id: step.id,
      tabulation_id: tab.id,
    }))

    await supabase.from("step_tabulations").insert(stepTabulations)
  }
}

export async function deleteScriptStep(id: string): Promise<void> {
  const supabase = await getSupabaseClient()

  await supabase.from("script_steps").delete().eq("id", id)
}

// Tabulation operations
export async function getTabulations(): Promise<Tabulation[]> {
  const supabase = await getSupabaseClient()

  const { data } = await supabase.from("tabulations").select("*").order("name", { ascending: true })

  return (data as Tabulation[]) || []
}

// Service situation operations
export async function getSituations(): Promise<ServiceSituation[]> {
  const supabase = await getSupabaseClient()

  const { data } = await supabase.from("service_situations").select("*").order("name", { ascending: true })

  return (data as ServiceSituation[]) || []
}

// Channel operations
export async function getChannels(): Promise<Channel[]> {
  const supabase = await getSupabaseClient()

  const { data } = await supabase.from("channels").select("*").order("name", { ascending: true })

  return (data as Channel[]) || []
}

// Note operations
export async function getNotes(userId: string): Promise<Note[]> {
  const supabase = await getSupabaseClient()

  const { data } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  return (data as Note[]) || []
}

export async function saveNote(userId: string, content: string): Promise<void> {
  const supabase = await getSupabaseClient()

  await supabase.from("notes").insert({
    user_id: userId,
    content,
  })
}

// Call session operations
export async function createCallSession(operatorId: string, startStepId: string): Promise<CallSession | null> {
  const supabase = await getSupabaseClient()

  const { data, error } = await supabase
    .from("call_sessions")
    .insert({
      operator_id: operatorId,
      current_step_id: startStepId,
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating call session:", error)
    return null
  }

  return data as CallSession
}

export async function updateCallSession(session: CallSession): Promise<void> {
  const supabase = await getSupabaseClient()

  await supabase
    .from("call_sessions")
    .update({
      current_step_id: session.currentStepId,
      tabulation_id: session.tabulationId,
      situation_id: session.situationId,
      channel_id: session.channelId,
      notes: session.notes,
    })
    .eq("id", session.id)
}

// User management operations
export async function getAllUsers(): Promise<User[]> {
  const supabase = await getSupabaseClient()

  const { data } = await supabase.from("users").select("*").order("username", { ascending: true })

  return (data as User[]) || []
}

export async function getTodayLoginSessions(userId: string): Promise<LoginSession[]> {
  const supabase = await getSupabaseClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from("login_sessions")
    .select("*")
    .eq("user_id", userId)
    .gte("login_at", today.toISOString())
    .order("login_at", { ascending: false })

  return (data as LoginSession[]) || []
}

export async function getTodayConnectedTime(userId: string): Promise<number> {
  const sessions = await getTodayLoginSessions(userId)

  return sessions.reduce((total, session) => {
    if (session.duration) {
      return total + session.duration
    } else if (!session.logoutAt) {
      // Still logged in
      return total + (Date.now() - new Date(session.loginAt).getTime())
    }
    return total
  }, 0)
}
