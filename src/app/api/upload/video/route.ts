/**
 * API для загрузки видео файлов
 */

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('video') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No video file provided' },
        { status: 400 }
      )
    }

    // Проверка типа файла
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only MP4, MOV, AVI, WEBM are allowed' },
        { status: 400 }
      )
    }

    // Проверка размера (максимум 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 50MB' },
        { status: 400 }
      )
    }

    // Генерация уникального имени файла
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}-${originalName}`

    // Путь для сохранения
    const uploadsDir = join(process.cwd(), 'public', 'videos')
    
    // Создаём директорию если не существует
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const filePath = join(uploadsDir, fileName)

    // Сохраняем файл
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Возвращаем URL для доступа к файлу
    const videoUrl = `/videos/${fileName}`

    console.log('[Upload Video] ✅ Video uploaded:', videoUrl)

    return NextResponse.json({
      success: true,
      videoUrl,
      fileName,
      size: file.size,
    })
  } catch (error) {
    console.error('[Upload Video] ❌ Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload video' },
      { status: 500 }
    )
  }
}
