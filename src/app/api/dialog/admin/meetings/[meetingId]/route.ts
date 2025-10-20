import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireDialogAdmin } from '@/lib/dialog-admin-auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: { meetingId: string } }
) {
  const session = await requireDialogAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const meeting = await prisma.dialogMeeting.findUnique({
    where: { id: params.meetingId },
    include: {
      questions: {
        orderBy: [{ number: 'asc' }],
      },
    },
  })

  if (!meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, meeting })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { meetingId: string } }
) {
  const session = await requireDialogAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  try {
    const meeting = await prisma.dialogMeeting.update({
      where: { id: params.meetingId },
      data: {
        code: body.code,
        titleRu: body.titleRu,
        titleKk: body.titleKk,
        titleEn: body.titleEn,
        summaryRu: body.summaryRu,
        summaryKk: body.summaryKk,
        summaryEn: body.summaryEn,
        overviewRu: body.overviewRu,
        overviewKk: body.overviewKk,
        overviewEn: body.overviewEn,
      },
    })

    return NextResponse.json({ success: true, meeting })
  } catch (error) {
    console.error('[Dialog Admin] Failed to update meeting:', error)
    return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { meetingId: string } }
) {
  const session = await requireDialogAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await prisma.dialogMeeting.delete({ where: { id: params.meetingId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Dialog Admin] Failed to delete meeting:', error)
    return NextResponse.json({ error: 'Failed to delete meeting' }, { status: 500 })
  }
}
