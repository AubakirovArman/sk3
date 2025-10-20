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
  const { order } = body as { order?: Array<{ id: string; number: number }> }

  if (!Array.isArray(order)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const operations = order.map(({ id, number }) =>
    prisma.dialogQuestion.update({
      where: {
        id,
        meetingId: params.meetingId,
      },
      data: { number },
    })
  )

  try {
    await prisma.$transaction(operations)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Dialog Admin] Failed to reorder questions:', error)
    return NextResponse.json({ error: 'Failed to reorder questions' }, { status: 500 })
  }
}
