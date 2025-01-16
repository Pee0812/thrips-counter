"use client"

import { useEffect, useState } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js"
import { Line } from "react-chartjs-2"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
)

// 日単位レスポンスの型
type DayData = {
  date: string
  sumTea: number
  sumOther: number
}

// 週単位レスポンスの型
type WeekData = {
  yearWeek: string
  sumTea: number
  sumOther: number
}

// 月単位レスポンスの型
type MonthData = {
  yearMonth: string
  sumTea: number
  sumOther: number
}

export default function ThripsChart() {
  const [period, setPeriod] = useState<"day" | "week" | "month">("day")
  const [dataList, setDataList] = useState<DayData[] | WeekData[] | MonthData[]>([])

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/thrips?period=${period}`, { cache: "no-store" })
        if (!res.ok) {
          throw new Error("Failed to fetch thrips data")
        }
        const data: DayData[] | WeekData[] | MonthData[] = await res.json()
        setDataList(data)
      } catch (error) {
        console.error(error)
      }
    }
    fetchData()
  }, [period])

  // 期間セレクト
  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as "day" | "week" | "month"
    setPeriod(value)
  }

  // グラフ用データ生成
  let labels: string[] = []
  let teaValues: number[] = []
  let otherValues: number[] = []

  switch (period) {
    case "week": {
      const weekData = dataList as WeekData[]
      labels = weekData.map((item) => item.yearWeek)
      teaValues = weekData.map((item) => item.sumTea)
      otherValues = weekData.map((item) => item.sumOther)
      break
    }
    case "month": {
      const monthData = dataList as MonthData[]
      labels = monthData.map((item) => item.yearMonth)
      teaValues = monthData.map((item) => item.sumTea)
      otherValues = monthData.map((item) => item.sumOther)
      break
    }
    case "day":
    default: {
      const dayData = dataList as DayData[]
      labels = dayData.map((item) => item.date)
      teaValues = dayData.map((item) => item.sumTea)
      otherValues = dayData.map((item) => item.sumOther)
      break
    }
  }

  // Chart.js に渡すデータ
  const data = {
    labels,
    datasets: [
      {
        label: "Tea(チャノキイロ)",
        data: teaValues,
        borderColor: "rgba(75, 192, 192, 0.9)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.1,
        fill: true,
      },
      {
        label: "Other(別種)",
        data: otherValues,
        borderColor: "rgba(255, 99, 132, 0.9)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        tension: 0.1,
        fill: true,
      },
    ],
  }

  // オプション (ticks.callback の型修正)
  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          callback: function (tickValue: string | number) {
            // tickValue が number なら文字列化
            if (typeof tickValue === "number") {
              return tickValue.toString()
            }
            // それ以外 (string) はそのまま返す or 必要に応じて変換
            return tickValue
          },
        },
      },
    },
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* タイトル */}
        <h1 className="text-3xl font-bold text-center mb-8">
          アザミウマ記録グラフ
        </h1>

        {/* 期間セレクタ */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <label
            htmlFor="periodSelect"
            className="text-base font-medium text-gray-700"
          >
            集計期間
          </label>
          <select
            id="periodSelect"
            value={period}
            onChange={handlePeriodChange}
            className="border border-gray-300 bg-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="day">日</option>
            <option value="week">週</option>
            <option value="month">月</option>
          </select>
        </div>

        {/* グラフをカード風に */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <Line data={data} options={options} />
        </div>
      </div>
    </div>
  )
}
