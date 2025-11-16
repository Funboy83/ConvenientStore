"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { getSalesReport } from "@/lib/report-actions"
import { Loader2 } from "lucide-react"

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--primary))",
  },
}

export function DashboardChart() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    loadChartData();
  }, []);

  async function loadChartData() {
    try {
      setLoading(true);
      const result = await getSalesReport('last-7-days');
      
      if (result.success && result.data) {
        // Convert daily sales data to chart format
        const data = result.data.map((item: any) => {
          const date = new Date(item.date);
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          return {
            date: dayNames[date.getDay()],
            sales: item.transactions
          };
        });
        setChartData(data);
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Overview</CardTitle>
        <CardDescription>Weekly sales performance</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[250px] w-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[250px] w-full flex items-center justify-center text-muted-foreground">
            No sales data available
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="sales" fill="var(--color-sales)" radius={8} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
