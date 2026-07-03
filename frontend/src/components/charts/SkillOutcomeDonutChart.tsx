import { Label, Pie, PieChart } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

// Working example: outcome split for recalled skills. Each row carries its own
// fill referencing var(--color-<key>), injected by ChartContainer from config.
const data = [
  { outcome: "used", count: 25, fill: "var(--color-used)" },
  { outcome: "adapted", count: 9, fill: "var(--color-adapted)" },
  { outcome: "ignored", count: 6, fill: "var(--color-ignored)" },
]

const config = {
  count: { label: "Skills" },
  used: { label: "Used as-is", color: "var(--chart-1)" },
  adapted: { label: "Adapted", color: "var(--chart-5)" },
  ignored: { label: "Ignored", color: "var(--chart-3)" },
} satisfies ChartConfig

const total = data.reduce((sum, d) => sum + d.count, 0)

export function SkillOutcomeDonutChart() {
  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-[240px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="outcome" hideLabel />} />
        <Pie data={data} dataKey="count" nameKey="outcome" innerRadius={60} strokeWidth={4}>
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox)) return null
              return (
                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                  <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-semibold">
                    {total}
                  </tspan>
                  <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 18} className="fill-muted-foreground text-xs">
                    recalled
                  </tspan>
                </text>
              )
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
