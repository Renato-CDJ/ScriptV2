import { list } from '@vercel/blob'
import { NextResponse } from 'next/server'

// Hardcoded token for now since env vars aren't working in preview
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || 'vercel_blob_rw_5ya1KTGM0hmPvFBU_xQO6vF38XC6Xc38S5Eqwsj4QmBioll'

export async function GET() {
  try {
    console.log('[v0] Fetching trainings from Vercel Blob...')
    
    const { blobs } = await list({ token: BLOB_TOKEN })
    
    console.log('[v0] Found blobs:', blobs.length)
    
    // Filter only PDF files
    const pdfFiles = blobs
      .filter(blob => blob.pathname.toLowerCase().endsWith('.pdf'))
      .map(blob => ({
        id: blob.pathname,
        title: blob.pathname.replace('.pdf', '').replace(/-/g, ' ').replace(/_/g, ' '),
        filename: blob.pathname,
        url: blob.url,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      }))

    console.log('[v0] PDF files found:', pdfFiles.length)

    return NextResponse.json({ trainings: pdfFiles })
  } catch (error) {
    console.error('[v0] Error listing trainings:', error)
    return NextResponse.json({ 
      error: 'Erro ao listar treinamentos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
