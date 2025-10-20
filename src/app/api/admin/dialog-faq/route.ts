import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - получить все FAQ
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    const faqs = await prisma.dialogFAQ.findMany({
      where: isActive !== null ? { isActive: isActive === 'true' } : undefined,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      faqs
    })
  } catch (error) {
    console.error('[Admin Dialog FAQ GET] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - создать новый FAQ
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      questionRu,
      questionKk,
      questionEn,
      answerRu,
      answerKk,
      answerEn,
      videoUrl,
      similarQuestions = [],
      isActive = true,
      priority = 0
    } = body

    console.log('[Admin Dialog FAQ POST] Creating FAQ with videoUrl:', videoUrl)

    if (!questionRu || !answerRu) {
      return NextResponse.json(
        { success: false, error: 'Question and answer in Russian are required' },
        { status: 400 }
      )
    }

    const faq = await prisma.dialogFAQ.create({
      data: {
        questionRu,
        questionKk,
        questionEn,
        answerRu,
        answerKk,
        answerEn,
        videoUrl,
        similarQuestions,
        isActive,
        priority
      }
    })

    return NextResponse.json({
      success: true,
      faq
    })
  } catch (error) {
    console.error('[Admin Dialog FAQ POST] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
