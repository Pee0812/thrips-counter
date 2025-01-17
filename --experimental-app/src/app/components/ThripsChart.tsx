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

  // CSVエクスポート用の関数
  const exportCSV = () => {
    let csvContent = '';
    let headers = '';

    if (period === "day") {
      headers = 'date,sumTea,sumOther';
    } else if (period === "week") {
      headers = 'yearWeek,sumTea,sumOther';
    } else {
      headers = 'yearMonth,sumTea,sumOther';
    }
    csvContent += headers + '\n';

    dataList.forEach(item => {
      if (period === "day") {
        const row = item as DayData;
        csvContent += `${row.date},${row.sumTea},${row.sumOther}\n`;
      } else if (period === "week") {
        const row = item as WeekData;
        csvContent += `${row.yearWeek},${row.sumTea},${row.sumOther}\n`;
      } else {
        const row = item as MonthData;
        csvContent += `${row.yearMonth},${row.sumTea},${row.sumOther}\n`;
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `thrips_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  const data = {
    labels,
    datasets: [
      {
        label: "チャノキイロ",
        data: teaValues,
        borderColor: "rgba(75, 192, 192, 0.9)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.1,
        fill: true,
      },
      {
        label: "別種",
        data: otherValues,
        borderColor: "rgba(255, 99, 132, 0.9)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        tension: 0.1,
        fill: true,
      },
    ],
  }

  // 縦軸の目盛りを見やすく設定するための計算
  const allValues = [...teaValues, ...otherValues];
  const maxY = allValues.length ? Math.max(...allValues) : 0;
  const adjustedMax = Math.ceil(maxY / 10) * 10;  // 最大値を10の倍数に調整

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 10,            // 10刻みで設定
          max: adjustedMax,        // 調整した最大値
          precision: 0,            // 整数表示を強制
          callback: function (tickValue: string | number) {
            if (typeof tickValue === "number") {
              return tickValue.toString();
            }
            return tickValue;
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

        {/* 期間セレクタとCSVエクスポートボタン */}
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

          <button
            onClick={exportCSV}
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
          >
            CSVエクスポート
          </button>
        </div>

        {/* グラフをカード風に */}
        <div className="bg-white shadow-sm rounded-lg p-6" style={{ height: '500px' }}>
          <Line data={data} options={options} />
        </div>
      </div>
    </div>
  )
}
