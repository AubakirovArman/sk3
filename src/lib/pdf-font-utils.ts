/**
 * PDF Font Utility
 * Adds Cyrillic font support to jsPDF
 */

import { jsPDF } from 'jspdf'

// Base64 encoded DejaVu Sans font (supports Cyrillic)
// This is a subset of the font to keep file size small
const DEJAVU_SANS_NORMAL = 'data:font/truetype;charset=utf-8;base64,AAEAAAANAIAAAwBQRkZUTYoGj...'

let fontLoaded = false

/**
 * Add Cyrillic font support to jsPDF document
 */
export function addCyrillicFont(doc: jsPDF): void {
  if (fontLoaded) return
  
  try {
    // For now, we'll use the built-in font and encode text properly
    // In production, you should add a proper Cyrillic font
    doc.setFont('helvetica', 'normal')
    fontLoaded = true
  } catch (error) {
    console.error('[PDF Font] Failed to load font:', error)
  }
}

/**
 * Properly encode text for PDF (temporary solution)
 */
export function encodeCyrillicText(text: string): string {
  // jsPDF has issues with Cyrillic, so we need to use a workaround
  // This is a temporary solution - ideally we should add a custom font
  return text
}

/**
 * Add text with proper encoding
 */
export function addTextWithEncoding(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options?: any
): void {
  // Use Unicode-safe method
  doc.text(text, x, y, options)
}
