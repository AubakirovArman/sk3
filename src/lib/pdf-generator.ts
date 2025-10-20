/**
 * PDF Generator with pdfmake (better UTF-8 support)
 * Generates PDF with Cyrillic support
 */

import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces'

export async function generatePDFWithPdfMake(data: {
  vnd: string
  np: string
  summary: string
  fileName: string
  language: 'ru' | 'kk' | 'en'
  qrCodeDataUrl: string
  downloadUrl: string
  timestamp?: Date
}): Promise<Buffer> {
  // Dynamic import to avoid SSR issues
  const pdfMakeModule = await import('pdfmake/build/pdfmake')
  const pdfFontsModule = await import('pdfmake/build/vfs_fonts')
  
  const pdfMake = pdfMakeModule.default as any

  // vfs_fonts exports plain object with font data; ensure both vfs and font map are wired
  const vfs =
    (pdfFontsModule as any).default ||
    (pdfFontsModule as any).pdfMake?.vfs ||
    pdfFontsModule

  pdfMake.vfs = vfs
  pdfMake.fonts = {
    Roboto: {
      normal: 'Roboto-Regular.ttf',
      bold: 'Roboto-Medium.ttf',
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-MediumItalic.ttf',
    },
  }

  const { vnd, np, summary, fileName, language, qrCodeDataUrl, downloadUrl, timestamp } = data

  // Format date based on language
  const formatDate = (date: Date, lang: string): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    const locales = { ru: 'ru-RU', kk: 'kk-KZ', en: 'en-US' }
    return date.toLocaleString(locales[lang as keyof typeof locales] || 'ru-RU', options)
  }

  const currentDate = timestamp || new Date()
  const formattedDate = formatDate(currentDate, language)

  // Get localized strings
  const strings = {
    ru: {
      title: 'Заключение независимого директора',
      date: 'Дата',
      file: 'Файл',
      summary: '📋 Итоговое решение',
      qrTitle: '📲 QR-код для скачивания',
      qrSubtitle: 'Отсканируйте QR-код для скачивания этого документа',
    },
    kk: {
      title: 'Тәуелсіз директордың қорытындысы',
      date: 'Күні',
      file: 'Файл',
      summary: '📋 Қорытынды шешім',
      qrTitle: '📲 Жүктеу үшін QR-коды',
      qrSubtitle: 'Осы құжатты жүктеу үшін QR-кодты сканерлеңіз',
    },
    en: {
      title: 'Independent Director Conclusion',
      date: 'Date',
      file: 'File',
      summary: '📋 Final Decision',
      qrTitle: '📲 Download QR Code',
      qrSubtitle: 'Scan QR code to download this document',
    },
  }

  const t = strings[language]

  // Clean text from markdown
  const cleanText = (text: string) => {
    return text
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .trim()
  }

  const content: Content = [
    // Title
    {
      text: t.title,
      style: 'header',
      alignment: 'center',
      margin: [0, 0, 0, 20],
    },

    // Metadata
    {
      text: [
        { text: `${t.date}: `, bold: true },
        { text: formattedDate + '\n' },
        { text: `${t.file}: `, bold: true },
        { text: fileName },
      ],
      style: 'metadata',
      margin: [0, 0, 0, 20],
    },

    // Summary section (Итоговое решение)
    {
      text: t.summary,
      style: 'sectionHeader',
      margin: [0, 10, 0, 10],
    },
    {
      text: cleanText(summary),
      style: 'normal',
      margin: [0, 0, 0, 30],
    },

    // Page break before QR code
    { text: '', pageBreak: 'before' },

    // QR Code section
    {
      text: t.qrTitle,
      style: 'qrHeader',
      alignment: 'center',
      margin: [0, 50, 0, 30],
    },
    {
      image: qrCodeDataUrl,
      width: 200,
      alignment: 'center',
      margin: [0, 0, 0, 20],
    },
    {
      text: t.qrSubtitle,
      style: 'qrSubtitle',
      alignment: 'center',
      margin: [0, 0, 0, 10],
    },
    {
      text: downloadUrl,
      style: 'link',
      alignment: 'center',
      link: downloadUrl,
    },
  ]

  const docDefinition: TDocumentDefinitions = {
    content,
    styles: {
      header: {
        fontSize: 22,
        bold: true,
        color: '#1a1a1a',
      },
      metadata: {
        fontSize: 10,
        color: '#666666',
      },
      sectionHeader: {
        fontSize: 16,
        bold: true,
        color: '#d7a13a',
      },
      normal: {
        fontSize: 11,
        lineHeight: 1.5,
        color: '#333333',
      },
      qrHeader: {
        fontSize: 18,
        bold: true,
        color: '#d7a13a',
      },
      qrSubtitle: {
        fontSize: 10,
        color: '#666666',
      },
      link: {
        fontSize: 9,
        color: '#0066cc',
      },
    },
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    defaultStyle: {
      font: 'Roboto', // pdfmake includes Roboto with Cyrillic support!
    },
  }

  return new Promise((resolve, reject) => {
    const pdfDoc = pdfMake.createPdf(docDefinition)
    pdfDoc.getBuffer(
      (buffer: Buffer) => {
        resolve(buffer)
      },
      (error: unknown) => {
        reject(error)
      }
    )
  })
}
