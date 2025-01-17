// src/app/api/thrips/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { format, startOfWeek, startOfMonth } from 'date-fns'

// Supabaseクライアントの初期化
const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'day'

    // Supabaseからデータを取得
    const { data: allThrips, error } = await supabase
      .from('thrips')
      .select('*')
      .order('createdAt', { ascending: true })  // カラム名はテーブル定義に合わせる
    if (error) throw error

    const grouped: Record<string, { tea: number; other: number }> = {}

    for (const row of allThrips || []) {
      // Supabaseでは通常、タイムスタンプフィールドは snake_case のため 'createdAt' を使用
      const dateObj = new Date(row.createdAt)
      let key = ''

      if (period === 'week') {
        const monday = startOfWeek(dateObj, { weekStartsOn: 1 })
        key = format(monday, 'yyyy-MM-dd')
      } else if (period === 'month') {
        const firstDayOfMonth = startOfMonth(dateObj)
        key = format(firstDayOfMonth, 'yyyy-MM')
      } else {
        // day
        key = format(dateObj, 'yyyy-MM-dd')
      }

      if (!grouped[key]) {
        grouped[key] = { tea: 0, other: 0 }
      }
      grouped[key].tea += row.tea
      grouped[key].other += row.other
    }

    const sortedKeys = Object.keys(grouped).sort()

    const result = sortedKeys.map((k) => {
      if (period === 'week') {
        return {
          yearWeek: k,
          sumTea: grouped[k].tea,
          sumOther: grouped[k].other,
        }
      } else if (period === 'month') {
        return {
          yearMonth: k,
          sumTea: grouped[k].tea,
          sumOther: grouped[k].other,
        }
      } else {
        return {
          date: k,
          sumTea: grouped[k].tea,
          sumOther: grouped[k].other,
        }
      }
    })

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.tea === undefined || body.other === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Supabaseを使ってデータを挿入
    const { data: newThrips, error } = await supabase
      .from('thrips')
      .insert({ tea: body.tea, other: body.other })
      .select()  // 挿入したデータを返す場合
    if (error) throw error

    return NextResponse.json({ message: 'Data saved successfully', data: newThrips }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
