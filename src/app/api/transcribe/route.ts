import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('file') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Аудио файл не найден' },
        { status: 400 }
      )
    }

    // Создаем новый FormData для отправки на внешний API
    const externalFormData = new FormData()
    
    // Определяем тип файла и имя
    let fileName = 'recording.mp3'
    let mimeType = 'audio/mpeg'
    
    if (audioFile.type.includes('webm')) {
      fileName = 'recording.webm'
      mimeType = 'audio/webm'
    } else if (audioFile.type.includes('wav')) {
      fileName = 'recording.wav'
      mimeType = 'audio/wav'
    }
    
    // Создаем Blob с правильным типом
    const audioBlob = new Blob([await audioFile.arrayBuffer()], { type: mimeType })
    externalFormData.append('file', audioBlob, fileName)

    // Отправляем на внешний API транскрибации
    const response = await fetch('https://whssdn.sk-ai.kz/v1/transcribe', {
      method: 'POST',
      body: externalFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Ошибка от API транскрибации:', errorText)
      throw new Error('Ошибка транскрибации')
    }

    const data = await response.json()
    
    return NextResponse.json({ 
      success: true, 
      text: data.text 
    })
  } catch (error) {
    console.error('Ошибка при транскрибации:', error)
    return NextResponse.json(
      { error: 'Не удалось транскрибировать аудио' },
      { status: 500 }
    )
  }
}
