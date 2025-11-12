import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function initializeDatabase() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log("[v0] Initializing database...")

  try {
    // Check if tables already exist
    const { data: existingTables, error: checkError } = await supabase.from("users").select("id").limit(1)

    if (!checkError) {
      console.log("[v0] Database tables already exist!")
      return { success: true, message: "Tables already exist" }
    }

    // If tables don't exist, we need to create them via SQL
    // Note: In production, you should run the SQL scripts directly in Supabase dashboard
    console.log("[v0] ⚠️ Tables do not exist yet.")
    console.log("[v0] Please run the SQL scripts in Supabase Dashboard:")
    console.log("[v0] 1. Go to your Supabase project dashboard")
    console.log("[v0] 2. Navigate to SQL Editor")
    console.log("[v0] 3. Copy and paste the content from scripts/001-create-database-schema.sql")
    console.log("[v0] 4. Click Run")
    console.log("[v0] 5. Repeat for scripts/002-seed-initial-data.sql")

    return {
      success: false,
      message: "Please run SQL scripts manually in Supabase dashboard",
      instructions: [
        "Go to Supabase Dashboard",
        "Open SQL Editor",
        "Run 001-create-database-schema.sql",
        "Run 002-seed-initial-data.sql",
      ],
    }
  } catch (error) {
    console.error("[v0] Error checking database:", error)
    return { success: false, error }
  }
}
