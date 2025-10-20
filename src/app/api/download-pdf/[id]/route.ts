/**
 * PDF Download API
 * Serves generated PDF files by ID
 */

import { NextRequest, NextResponse } from 'next/server'

// Import storage from export endpoint
import { pdfStorage } from '../../export-pdf/route'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    console.log('[Download PDF] 📥 Downloading PDF:', id)
    console.log('[Download PDF] 📦 Total PDFs in storage:', pdfStorage.size)
    console.log('[Download PDF] 🔑 Available IDs:', Array.from(pdfStorage.keys()))

    // Get PDF from storage
    const pdfBuffer = pdfStorage.get(id)

    if (!pdfBuffer) {
      console.log('[Download PDF] ❌ PDF not found:', id)
      return NextResponse.json(
        { error: 'PDF not found' },
        { status: 404 }
      )
    }

    console.log('[Download PDF] ✅ PDF found, sending...', { size: pdfBuffer.length })

    // Return PDF file
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="analysis-${id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('[Download PDF] ❌ Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
