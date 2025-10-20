import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const meetings = await prisma.dialogMeeting.findMany({
    orderBy: [{ code: 'asc' }],
    include: {
      questions: {
        orderBy: [{ number: 'asc' }],
        select: {
          id: true,
          number: true,
          titleRu: true,
          titleKk: true,
          titleEn: true,
          collapsedTextRu: true,
          collapsedTextKk: true,
          collapsedTextEn: true,
          expandedTextRu: true,
          expandedTextKk: true,
          expandedTextEn: true,
          decisionLabelRu: true,
          decisionLabelKk: true,
          decisionLabelEn: true,
          triggerPhrases: true,
        },
      },
    },
  })

  return NextResponse.json({ success: true, meetings })
}
