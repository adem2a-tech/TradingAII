import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { canUserAnalyze, redeemPromo } from '@/lib/access/manager'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  try {
    const { code } = await req.json()
    if (!code) return NextResponse.json({ error: 'Code requis' }, { status: 400 })
    const result = await redeemPromo(session.user.id, code)
    if (!result.ok) return NextResponse.json(result, { status: 400 })
    const access = await canUserAnalyze(session.user.id, session.user.email)
    return NextResponse.json({ ...result, access })
  } catch {
    return NextResponse.json({ error: 'Erreur promo' }, { status: 500 })
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  const status = await canUserAnalyze(session.user.id, session.user.email)
  return NextResponse.json(status)
}
