import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { getFirebaseDb } from "@/lib/firebase/config"
import { COLLECTIONS } from "@/lib/firebase/firestore"
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore"

// Este endpoint e chamado automaticamente pelo Vercel Cron Job
// para limpar mensagens de chat e publicacoes de operadores com mais de 24 horas
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
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - 24)
    const cutoffISO = cutoffDate.toISOString()

    let supervisorCount = 0
    let qualityCount = 0
    let operatorPostsCount = 0
    let operatorCommentsCount = 0

    // ==========================================
    // 1. Limpar chats do Supabase (se configurado)
    // ==========================================
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Deletar mensagens do chat com supervisao com mais de 24 horas
      const { error: supervisorError, count: supCount } = await supabase
        .from("supervisor_chat_messages")
        .delete({ count: "exact" })
        .lt("created_at", cutoffISO)

      if (supervisorError) {
        console.error("[Cleanup] Erro ao limpar supervisor_chat_messages:", supervisorError)
      } else {
        supervisorCount = supCount || 0
      }

      // Deletar mensagens do chat com qualidade com mais de 24 horas
      const { error: qualityError, count: qualCount } = await supabase
        .from("quality_chat_messages")
        .delete({ count: "exact" })
        .lt("created_at", cutoffISO)

      if (qualityError) {
        console.error("[Cleanup] Erro ao limpar quality_chat_messages:", qualityError)
      } else {
        qualityCount = qualCount || 0
      }
    }

    // ==========================================
    // 2. Limpar publicacoes de OPERADORES no Firebase
    //    (tipo "pergunta" - apenas posts de operadores)
    //    Comunicados, recados e quiz dos admins permanecem!
    // ==========================================
    const db = getFirebaseDb()
    const postsRef = collection(db, COLLECTIONS.QUALITY_POSTS)
    
    // Buscar posts do tipo "pergunta" (feitos por operadores) com mais de 24h
    const postsQuery = query(
      postsRef,
      where("type", "==", "pergunta"),
      where("created_at", "<", cutoffISO)
    )
    
    const postsSnapshot = await getDocs(postsQuery)
    
    // Deletar cada post de operador e seus comentarios
    for (const postDoc of postsSnapshot.docs) {
      const postId = postDoc.id
      
      // Primeiro deletar comentarios do post
      const commentsRef = collection(db, COLLECTIONS.QUALITY_COMMENTS)
      const commentsQuery = query(commentsRef, where("post_id", "==", postId))
      const commentsSnapshot = await getDocs(commentsQuery)
      
      for (const commentDoc of commentsSnapshot.docs) {
        await deleteDoc(doc(db, COLLECTIONS.QUALITY_COMMENTS, commentDoc.id))
        operatorCommentsCount++
      }
      
      // Depois deletar o post
      await deleteDoc(doc(db, COLLECTIONS.QUALITY_POSTS, postId))
      operatorPostsCount++
    }

    const totalDeleted = supervisorCount + qualityCount + operatorPostsCount

    console.log(`[Cleanup] Limpeza concluida:`)
    console.log(`  - ${supervisorCount} mensagens do chat com supervisao`)
    console.log(`  - ${qualityCount} mensagens do chat com qualidade`)
    console.log(`  - ${operatorPostsCount} publicacoes de operadores (perguntas)`)
    console.log(`  - ${operatorCommentsCount} comentarios em publicacoes de operadores`)

    return NextResponse.json({
      success: true,
      deleted: {
        supervisor_chat_messages: supervisorCount,
        quality_chat_messages: qualityCount,
        operator_posts: operatorPostsCount,
        operator_posts_comments: operatorCommentsCount,
        total: totalDeleted,
      },
      note: "Comunicados, recados e quiz dos admins permanecem. Apenas perguntas de operadores sao removidas apos 24h.",
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
