import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Este endpoint e chamado automaticamente pelo Vercel Cron Job
// para limpar mensagens de chat com mais de 24 horas
// Isso economiza espaco no banco de dados e mantem a privacidade

export async function GET(request: Request) {
  // Verificar se e uma requisicao do Vercel Cron
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Permitir tambem sem autenticacao em ambiente de desenvolvimento
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    // Usar service role key para ter permissao de deletar
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Supabase credentials not configured" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - 24)
    const cutoffISO = cutoffDate.toISOString()

    // Deletar mensagens do chat com supervisao com mais de 24 horas
    const { error: supervisorError, count: supervisorCount } = await supabase
      .from("supervisor_chat_messages")
      .delete({ count: "exact" })
      .lt("created_at", cutoffISO)

    if (supervisorError) {
      console.error("[Cleanup] Erro ao limpar supervisor_chat_messages:", supervisorError)
    }

    // Deletar mensagens do chat com qualidade com mais de 24 horas
    const { error: qualityError, count: qualityCount } = await supabase
      .from("quality_chat_messages")
      .delete({ count: "exact" })
      .lt("created_at", cutoffISO)

    if (qualityError) {
      console.error("[Cleanup] Erro ao limpar quality_chat_messages:", qualityError)
    }

    const totalDeleted = (supervisorCount || 0) + (qualityCount || 0)

    console.log(`[Cleanup] Limpeza concluida: ${supervisorCount || 0} mensagens do supervisor, ${qualityCount || 0} mensagens da qualidade deletadas`)

    return NextResponse.json({
      success: true,
      deleted: {
        supervisor_chat_messages: supervisorCount || 0,
        quality_chat_messages: qualityCount || 0,
        total: totalDeleted,
      },
      cutoff_date: cutoffISO,
      executed_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Cleanup] Erro durante a limpeza:", error)
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    )
  }
}
