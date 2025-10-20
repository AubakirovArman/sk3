import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireDialogAdmin } from '@/lib/dialog-admin-auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { meetingId: string; questionId: string } }
) {
  const session = await requireDialogAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  try {
    const question = await prisma.dialogQuestion.update({
      where: {
        id: params.questionId,
        meetingId: params.meetingId,
      },
      data: {
        number: body.number,
        titleRu: body.titleRu,
        titleKk: body.titleKk,
        titleEn: body.titleEn,
        collapsedTextRu: body.collapsedTextRu,
        collapsedTextKk: body.collapsedTextKk,
        collapsedTextEn: body.collapsedTextEn,
        expandedTextRu: body.expandedTextRu,
        expandedTextKk: body.expandedTextKk,
        expandedTextEn: body.expandedTextEn,
        decisionLabelRu: body.decisionLabelRu,
        decisionLabelKk: body.decisionLabelKk,
        decisionLabelEn: body.decisionLabelEn,
        triggerPhrases: Array.isArray(body.triggerPhrases)
          ? body.triggerPhrases
          : typeof body.triggerPhrases === 'string' && body.triggerPhrases.trim().length > 0
          ? body.triggerPhrases.split(',').map((item: string) => item.trim())
          : [],
      },
    })

    return NextResponse.json({ success: true, question })
  } catch (error) {
    console.error('[Dialog Admin] Failed to update question:', error)
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { meetingId: string; questionId: string } }
) {
  const session = await requireDialogAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await prisma.dialogQuestion.delete({
      where: {
        id: params.questionId,
        meetingId: params.meetingId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Dialog Admin] Failed to delete question:', error)
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
  }
}
