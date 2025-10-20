import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT - обновить FAQ
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      similarQuestions,
      isActive,
      priority
    } = body

    console.log('[Admin Dialog FAQ PUT] Updating FAQ with videoUrl:', videoUrl)

    const faq = await prisma.dialogFAQ.update({
      where: { id: params.id },
      data: {
        ...(questionRu !== undefined && { questionRu }),
        ...(questionKk !== undefined && { questionKk }),
        ...(questionEn !== undefined && { questionEn }),
        ...(answerRu !== undefined && { answerRu }),
        ...(answerKk !== undefined && { answerKk }),
        ...(answerEn !== undefined && { answerEn }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(similarQuestions !== undefined && { similarQuestions }),
        ...(isActive !== undefined && { isActive }),
        ...(priority !== undefined && { priority })
      }
    })

    return NextResponse.json({
      success: true,
      faq
    })
  } catch (error) {
    console.error('[Admin Dialog FAQ PUT] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE - удалить FAQ
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await prisma.dialogFAQ.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('[Admin Dialog FAQ DELETE] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
