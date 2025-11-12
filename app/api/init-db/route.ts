import { NextResponse } from "next/server"
import { initializeDatabase } from "@/lib/supabase/init-database"

export async function POST() {
  try {
    const result = await initializeDatabase()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to initialize database" }, { status: 500 })
  }
}
