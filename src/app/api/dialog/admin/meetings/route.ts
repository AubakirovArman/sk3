import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireDialogAdmin } from '@/lib/dialog-admin-auth'

export async function GET() {
  const session = await requireDialogAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const meetings = await prisma.dialogMeeting.findMany({
    orderBy: [{ code: 'asc' }],
    include: {
      questions: {
        orderBy: [{ number: 'asc' }],
      },
    },
  })

  return NextResponse.json({ success: true, meetings })
}

export async function POST(request: NextRequest) {
  const session = await requireDialogAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    code,
    titleRu,
    titleKk,
    titleEn,
    summaryRu,
    summaryKk,
    summaryEn,
    overviewRu,
    overviewKk,
    overviewEn,
  } = body

  if (!code || !titleRu || !titleKk || !titleEn) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const meeting = await prisma.dialogMeeting.create({
      data: {
        code,
        titleRu,
        titleKk,
        titleEn,
        summaryRu,
        summaryKk,
        summaryEn,
        overviewRu,
        overviewKk,
        overviewEn,
      },
    })

    return NextResponse.json({ success: true, meeting })
  } catch (error) {
    console.error('[Dialog Admin] Failed to create meeting:', error)
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 })
  }
}
