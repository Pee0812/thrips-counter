// src/app/api/thrips/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { format, startOfWeek, startOfMonth } from 'date-fns'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'day'

    const allThrips = await prisma.thrips.findMany({
      orderBy: { createdAt: 'asc' },
    })

    const grouped: Record<string, { tea: number; other: number }> = {}

    for (const row of allThrips) {
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

    // ★ period別に返すキー名を変更
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
    // リクエストボディを取得
    const body = await req.json();

    // データのバリデーション（必要なら追加）
    if (!body.tea || !body.other) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Prisma を使用してデータベースに保存
    const newThrips = await prisma.thrips.create({
      data: {
        tea: body.tea,
        other: body.other,
      },
    });

    // 成功時のレスポンス
    return NextResponse.json({ message: 'Data saved successfully', data: newThrips }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}