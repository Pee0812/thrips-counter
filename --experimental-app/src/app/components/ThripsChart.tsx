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
  ArcElement,
} from "chart.js"
import { Line, Pie } from "react-chartjs-2"
import { Loader2 } from "lucide-react"

// chadcnUI コンポーネントのインポート
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
)

// データ型の定義
type DayData = {
  date: string
  sumTea: number
  sumOther: number
}

type WeekData = {
  yearWeek: string
  sumTea: number
  sumOther: number
}

type MonthData = {
  yearMonth: string
  sumTea: number
  sumOther: number
}

export default function ThripsChart() {
  const [period, setPeriod] = useState<"day" | "week" | "month">("day")
  const [chartType, setChartType] = useState<"line" | "pie">("line")
  const [dataList, setDataList] = useState<DayData[] | WeekData[] | MonthData[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    setLoading(true)
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
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [period])

  useEffect(() => {
    if(period === "month" && chartType === "pie" && !selectedMonth && dataList.length > 0) {
      const monthData = dataList as MonthData[]
      if(monthData.length > 0) {
        setSelectedMonth(monthData[0].yearMonth)
      }
    }
  }, [period, chartType, selectedMonth, dataList])

  const exportCSV = () => {
    let csvContent = ''
    let headers = ''

    if (period === "day") {
      headers = 'date,sumTea,sumOther'
    } else if (period === "week") {
      headers = 'yearWeek,sumTea,sumOther'
    } else {
      headers = 'yearMonth,sumTea,sumOther'
    }
    csvContent += headers + '\n'

    dataList.forEach(item => {
      if (period === "day") {
        const row = item as DayData
        csvContent += `${row.date},${row.sumTea},${row.sumOther}\n`
      } else if (period === "week") {
        const row = item as WeekData
        csvContent += `${row.yearWeek},${row.sumTea},${row.sumOther}\n`
      } else {
        const row = item as MonthData
        csvContent += `${row.yearMonth},${row.sumTea},${row.sumOther}\n`
      }
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `thrips_${period}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  let labels: string[] = []
  let teaValues: number[] = []
  let otherValues: number[] = []

  switch (period) {
    case "week": {
      const weekData = dataList as WeekData[]
      labels = weekData.map(item => item.yearWeek)
      teaValues = weekData.map(item => item.sumTea)
      otherValues = weekData.map(item => item.sumOther)
      break
    }
    case "month": {
      const monthData = dataList as MonthData[]
      labels = monthData.map(item => item.yearMonth)
      teaValues = monthData.map(item => item.sumTea)
      otherValues = monthData.map(item => item.sumOther)
      break
    }
    case "day":
    default: {
      const dayData = dataList as DayData[]
      labels = dayData.map(item => item.date)
      teaValues = dayData.map(item => item.sumTea)
      otherValues = dayData.map(item => item.sumOther)
      break
    }
  }

  const chartDataLine = {
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

  const totalTea = teaValues.reduce((acc, val) => acc + val, 0)
  const totalOther = otherValues.reduce((acc, val) => acc + val, 0)

  let chartDataPie = {
    labels: ["チャノキイロ", "別種"],
    datasets: [
      {
        data: [totalTea, totalOther],
        backgroundColor: ["rgba(75, 192, 192, 0.6)", "rgba(255, 99, 132, 0.6)"],
        borderColor: ["rgba(75, 192, 192, 1)", "rgba(255, 99, 132, 1)"],
        borderWidth: 1,
      },
    ],
  }

  if(chartType === "pie" && period === "month" && selectedMonth) {
    const monthRecord = (dataList as MonthData[]).find(item => item.yearMonth === selectedMonth)
    if(monthRecord) {
      chartDataPie = {
        labels: ["チャノキイロ", "別種"],
        datasets: [
          {
            data: [monthRecord.sumTea, monthRecord.sumOther],
            backgroundColor: ["rgba(75, 192, 192, 0.6)", "rgba(255, 99, 132, 0.6)"],
            borderColor: ["rgba(75, 192, 192, 1)", "rgba(255, 99, 132, 1)"],
            borderWidth: 1,
          },
        ],
      }
    }
  }

  const allValues = [...teaValues, ...otherValues]
  const maxY = allValues.length ? Math.max(...allValues) : 0
  const adjustedMax = Math.ceil(maxY / 10) * 10

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 10,
          max: adjustedMax,
          precision: 0,
          callback: function (tickValue: string | number) {
            if (typeof tickValue === "number") {
              return tickValue.toString()
            }
            return tickValue
          },
        },
      },
    },
  }

  const titleText = 
    period === "day" ? "Daily" : 
    period === "week" ? "Weekly" : "Monthly"

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-center mb-8">Thrips Count</h1>

        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 space-y-4 md:space-y-0">
          {chartType === "line" && (
            <div className="flex items-center space-x-2">
              <Label htmlFor="periodSelect">期間</Label>
              <Select 
                value={period} 
                onValueChange={(value) => setPeriod(value as "day" | "week" | "month")}
              >
                <SelectTrigger id="periodSelect" className="w-[150px]">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {chartType === "pie" && (
            <div className="flex items-center justify-center space-x-2">
              <Label htmlFor="monthSelect">Select Month</Label>
              <Select 
                value={selectedMonth ?? ""} 
                onValueChange={(value) => setSelectedMonth(value)}
              >
                <SelectTrigger id="monthSelect" className="w-[150px]">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {(dataList as MonthData[]).map(item => (
                    <SelectItem key={item.yearMonth} value={item.yearMonth}>
                      {item.yearMonth}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex space-x-2">
            <Button
              variant={chartType === "line" ? "default" : "outline"}
              onClick={() => {
                setChartType("line")
                setPeriod("day")
              }}
            >
              折れ線
            </Button>
            <Button
              variant={chartType === "pie" ? "default" : "outline"}
              onClick={() => {
                setChartType("pie")
                setPeriod("month")
              }}
            >
              円
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">{titleText}</CardTitle>
          </CardHeader>
          <CardContent className="h-[500px] flex justify-center items-center">
            {loading ? (
              <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
            ) : chartType === "line" ? (
              <Line data={chartDataLine} options={options} />
            ) : (
              <Pie data={chartDataPie} />
            )}
          </CardContent>
        </Card>

        {chartType === "line" && (
          <div className="flex justify-center mt-4">
            <Button onClick={exportCSV}>Export CSV</Button>
          </div>
        )}
      </div>
    </div>
  )
}
