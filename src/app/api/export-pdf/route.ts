/**
 * PDF Export API with QR Code
 * Generates a PDF document with analysis results and embedded QR code
 */

import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { generatePDFWithPdfMake } from '@/lib/pdf-generator'
import { randomBytes } from 'crypto'

interface ExportRequest {
  vnd: string
  np: string
  summary: string
  fileName?: string
  language?: 'ru' | 'kk' | 'en'
  timestamp?: Date | string
}

// Храним PDF в памяти (глобально, чтобы сохранялось между hot reloads)
// В dev режиме это нужно для того, чтобы storage не очищался при hot reload
const globalForPdfStorage = globalThis as unknown as {
  pdfStorage: Map<string, Buffer> | undefined
}

const pdfStorage = globalForPdfStorage.pdfStorage ?? new Map<string, Buffer>()

if (process.env.NODE_ENV !== 'production') {
  globalForPdfStorage.pdfStorage = pdfStorage
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json()
    const { vnd, np, summary, fileName = 'document', language = 'ru', timestamp } = body

    console.log('[Export PDF] 📄 Generating PDF...', { fileName, language, timestamp })

    // Generate unique ID for this PDF
    const pdfId = randomBytes(16).toString('hex')
    
    // Get base URL for QR code - use request headers to determine actual URL
    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
    const baseUrl = `${protocol}://${host}`
    const downloadUrl = `${baseUrl}/api/download-pdf/${pdfId}`
    
    console.log('[Export PDF] 🔗 Generated download URL:', downloadUrl)
    console.log('[Export PDF] 🌐 Host:', host, '| Protocol:', protocol)

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(downloadUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })

    // Generate PDF using pdfmake (with Cyrillic support!)
    const pdfBuffer = await generatePDFWithPdfMake({
      vnd,
      np,
      summary,
      fileName,
      language,
      qrCodeDataUrl,
      downloadUrl,
      timestamp: timestamp ? new Date(timestamp) : undefined,
    })

    // Store PDF in memory
    pdfStorage.set(pdfId, pdfBuffer)

    console.log('[Export PDF] ✅ PDF generated successfully', { pdfId, size: pdfBuffer.length, totalStored: pdfStorage.size })

    // Return PDF ID and download URL
    return NextResponse.json({
      success: true,
      pdfId,
      downloadUrl,
      qrCodeUrl: qrCodeDataUrl,
      size: pdfBuffer.length,
    })

  } catch (error) {
    console.error('[Export PDF] ❌ Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// Export storage for download endpoint
export { pdfStorage }
