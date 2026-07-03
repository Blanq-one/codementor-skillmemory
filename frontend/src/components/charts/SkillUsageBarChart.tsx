import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

// Working example: how many stored skills were applied per repo.
const data = [
  { repo: "flask", used: 4, ignored: 1 },
  { repo: "django", used: 6, ignored: 2 },
  { repo: "fastapi", used: 5, ignored: 1 },
  { repo: "express", used: 7, ignored: 3 },
  { repo: "rails", used: 3, ignored: 2 },
]

const config = {
  used: { label: "Applied", color: "var(--chart-1)" },
  ignored: { label: "Recalled, not used", color: "var(--chart-3)" },
} satisfies ChartConfig

export function SkillUsageBarChart() {
  return (
    <ChartContainer config={config} className="h-[240px] w-full">
      <BarChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="repo" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={28} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="used" fill="var(--color-used)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="ignored" fill="var(--color-ignored)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
