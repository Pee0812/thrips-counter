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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

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

  // ★ CSV出力ボタン押下時の処理
  const handleCsvExport = () => {
    if (!dataList.length) {
      alert("データがありません。")
      return
    }

    let csvHeader = ""
    let csvRows: string[] = []

    // 期間に応じてヘッダーと行を作る
    if (period === "day") {
      // dayData[] を想定
      csvHeader = "date,sumTea,sumOther"
      const dayData = dataList as DayData[]
      csvRows = dayData.map((item) => {
        return `${item.date},${item.sumTea},${item.sumOther}`
      })
    } else if (period === "week") {
      // weekData[] を想定
      csvHeader = "yearWeek,sumTea,sumOther"
      const weekData = dataList as WeekData[]
      csvRows = weekData.map((item) => {
        return `${item.yearWeek},${item.sumTea},${item.sumOther}`
      })
    } else {
      // monthData[] を想定
      csvHeader = "yearMonth,sumTea,sumOther"
      const monthData = dataList as MonthData[]
      csvRows = monthData.map((item) => {
        return `${item.yearMonth},${item.sumTea},${item.sumOther}`
      })
    }

    // CSV文字列を生成
    const csvContent = csvHeader + "\n" + csvRows.join("\n")

    // Blobを作成してダウンロードリンク生成
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    // ファイル名を好きに設定
    link.setAttribute("download", `thrips-${period}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as "day" | "week" | "month"
    setPeriod(value)
  }

  // ---- グラフ用に labels / datasets を組み立て ----
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

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          callback: function (value: number) {
            return String(value)
          },
        },
      },
    },
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* タイトル */}
        <h1 className="text-3xl font-bold text-center mb-8">アザミウマ記録グラフ</h1>

        {/* 期間セレクト */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <label htmlFor="periodSelect" className="text-base font-medium text-gray-700">
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

          {/* CSV出力ボタン */}
          <button
            onClick={handleCsvExport}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-md"
          >
            CSV出力
          </button>
        </div>

        {/* グラフ部分 */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <Line data={data} options={options} />
        </div>
      </div>
    </div>
  )
}
