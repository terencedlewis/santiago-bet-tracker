"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  net: number;
}

interface ProfitChartProps {
  data: DataPoint[];
}

export function ProfitChart({ data }: ProfitChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        No settled bets yet.
      </div>
    );
  }

  const isPositive = data[data.length - 1]?.net >= 0;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={isPositive ? "#16a34a" : "#dc2626"}
              stopOpacity={0.15}
            />
            <stop
              offset="95%"
              stopColor={isPositive ? "#16a34a" : "#dc2626"}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v}`}
          width={50}
        />
        <Tooltip
          formatter={(value) => {
            const num = typeof value === "number" ? value : Number(value);
            return [`$${num.toFixed(2)}`, "Net P/L"];
          }}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            fontSize: "12px",
          }}
        />
        <Area
          type="monotone"
          dataKey="net"
          stroke={isPositive ? "#16a34a" : "#dc2626"}
          strokeWidth={2}
          fill="url(#profitGradient)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
