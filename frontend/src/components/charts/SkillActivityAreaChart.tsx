import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

// Working example: skills learned vs recalled across sessions.
// Colors reference var(--chart-N), which shadcn.css maps onto the app tokens,
// so this follows the [data-theme] dark/light toggle automatically.
const data = [
  { session: "S1", learned: 3, recalled: 0 },
  { session: "S2", learned: 5, recalled: 2 },
  { session: "S3", learned: 6, recalled: 4 },
  { session: "S4", learned: 8, recalled: 7 },
  { session: "S5", learned: 9, recalled: 11 },
  { session: "S6", learned: 10, recalled: 16 },
]

const config = {
  learned: { label: "Skills learned", color: "var(--chart-1)" },
  recalled: { label: "Skills recalled", color: "var(--chart-3)" },
} satisfies ChartConfig

export function SkillActivityAreaChart() {
  return (
    <ChartContainer config={config} className="h-[240px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="session" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={28} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          dataKey="learned"
          type="monotone"
          fill="var(--color-learned)"
          fillOpacity={0.18}
          stroke="var(--color-learned)"
          strokeWidth={2}
          stackId="a"
        />
        <Area
          dataKey="recalled"
          type="monotone"
          fill="var(--color-recalled)"
          fillOpacity={0.18}
          stroke="var(--color-recalled)"
          strokeWidth={2}
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  )
}
