import { NextRequest, NextResponse } from 'next/server'
import { isValidUserId } from '@/lib/validate'
import { canUsePost } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('user_id') ?? ''
  if (!isValidUserId(userId)) {
    return NextResponse.json({ error: 'Invalid user_id' }, { status: 400 })
  }

  const postEnabled = await canUsePost(userId)
  return NextResponse.json({ postEnabled })
}
