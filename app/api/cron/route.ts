import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Supabase 핑 - posts 테이블 쿼리
    const { data, error } = await supabase
      .from('posts')
      .select('id')
      .limit(1)

    if (error) {
      return NextResponse.json({ 
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Supabase is alive!',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to ping Supabase' 
    }, { status: 500 })
  }
}