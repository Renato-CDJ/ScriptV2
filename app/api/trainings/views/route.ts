import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseDb } from '@/lib/firebase/config'
import { collection, addDoc, getDocs, query, orderBy, where } from 'firebase/firestore'
import { toFirestoreDate } from '@/lib/firebase/firestore'

const COLLECTION_NAME = 'training_views'

// POST - Registrar visualização de treinamento
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { training_filename, training_title, user_id, user_name } = body

    if (!training_filename || !user_id || !user_name) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    const db = getFirebaseDb()
    const viewsRef = collection(db, COLLECTION_NAME)

    await addDoc(viewsRef, {
      training_filename,
      training_title: training_title || training_filename,
      user_id,
      user_name,
      viewed_at: toFirestoreDate(new Date()),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error in training views POST:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// GET - Buscar visualizações (para relatório)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const filename = searchParams.get('filename')

    const db = getFirebaseDb()
    const viewsRef = collection(db, COLLECTION_NAME)
    
    let q = query(viewsRef, orderBy('viewed_at', 'desc'))
    
    if (filename) {
      q = query(viewsRef, where('training_filename', '==', filename), orderBy('viewed_at', 'desc'))
    }

    const snapshot = await getDocs(q)
    const views = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    return NextResponse.json({ views })
  } catch (error) {
    console.error('[v0] Error in training views GET:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
