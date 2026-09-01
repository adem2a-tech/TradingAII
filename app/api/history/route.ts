import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { getHistoryForUser } from '@/lib/storage/history'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  try {
    const history = await getHistoryForUser(session.user.id)
    return NextResponse.json(history)
  } catch {
    return NextResponse.json({ error: 'Impossible de charger l\'historique' }, { status: 500 })
  }
}
