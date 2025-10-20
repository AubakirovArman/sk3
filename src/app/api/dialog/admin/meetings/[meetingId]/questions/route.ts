import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireDialogAdmin } from '@/lib/dialog-admin-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { meetingId: string } }
) {
  const session = await requireDialogAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    number,
    titleRu,
    titleKk,
    titleEn,
    collapsedTextRu,
    collapsedTextKk,
    collapsedTextEn,
    expandedTextRu,
    expandedTextKk,
    expandedTextEn,
    decisionLabelRu,
    decisionLabelKk,
    decisionLabelEn,
    triggerPhrases,
  } = body

  if (
    number === undefined ||
    !titleRu ||
    !titleKk ||
    !titleEn ||
    !collapsedTextRu ||
    !collapsedTextKk ||
    !collapsedTextEn
  ) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const question = await prisma.dialogQuestion.create({
      data: {
        meetingId: params.meetingId,
        number,
        titleRu,
        titleKk,
        titleEn,
        collapsedTextRu,
        collapsedTextKk,
        collapsedTextEn,
        expandedTextRu,
        expandedTextKk,
        expandedTextEn,
        decisionLabelRu,
        decisionLabelKk,
        decisionLabelEn,
        triggerPhrases: Array.isArray(triggerPhrases)
          ? triggerPhrases
          : typeof triggerPhrases === 'string' && triggerPhrases.trim().length > 0
          ? triggerPhrases.split(',').map((item: string) => item.trim())
          : [],
      },
    })

    return NextResponse.json({ success: true, question })
  } catch (error) {
    console.error('[Dialog Admin] Failed to create question:', error)
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
  }
}
