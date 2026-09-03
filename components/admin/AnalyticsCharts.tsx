"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Calendar,
  IndianRupee,
} from "lucide-react";
import { formatINR } from "@/lib/format";
import type {
  DailyBookings,
  PoojaPopularity,
  AnalyticsSummary,
} from "@/lib/analytics";

// ─── Color palette ───
const SAFFRON = "#e67e22";
const SAFFRON_LIGHT = "#f39c12";
const MAROOON = "#7b2d26";
const TEAL = "#14b8a6";
const ROSE = "#e11d48";
const PURPLE = "#9333ea";
const COLORS = [SAFFRON, TEAL, MAROOON, PURPLE, ROSE, SAFFRON_LIGHT];

// ─── Bar Chart ───
function BarChart({
  data,
  maxValue,
  height = 180,
}: {
  data: DailyBookings[];
  maxValue: number;
  height?: number;
}) {
  const barWidth = Math.max(4, Math.min(24, Math.floor(600 / data.length) - 2));
  const gap = Math.max(2, Math.floor(barWidth / 3));
  const chartWidth = data.length * (barWidth + gap);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="overflow-x-auto">
      <svg
        width={chartWidth}
        height={height}
        className="block"
        role="img"
        aria-label="Bookings over time bar chart"
      >
        {/* Y-axis grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={0}
            y1={height - pct * (height - 30)}
            x2={chartWidth}
            y2={height - pct * (height - 30)}
            stroke="#f5e6d3"
            strokeWidth={1}
          />
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const barHeight =
            maxValue > 0 ? (d.count / maxValue) * (height - 40) : 0;
          const x = i * (barWidth + gap);
          const y = height - 30 - barHeight;
          const isHovered = hoveredIdx === i;

          return (
            <g
              key={d.date}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                rx={barWidth > 8 ? 3 : 1}
                fill={isHovered ? MAROOON : SAFFRON}
                opacity={isHovered ? 1 : 0.85}
                className="transition-opacity duration-150"
              />

              {/* Tooltip */}
              {isHovered && (
                <g>
                  <rect
                    x={x - 8}
                    y={y - 32}
                    width={barWidth + 16}
                    height={24}
                    rx={6}
                    fill={MAROOON}
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 16}
                    textAnchor="middle"
                    fill="white"
                    fontSize={10}
                    fontWeight={600}
                  >
                    {d.count} ({formatINR(d.revenue)})
                  </text>
                </g>
              )}

              {/* X-axis label (show every Nth) */}
              {data.length <= 14 || i % Math.ceil(data.length / 14) === 0 ? (
                <text
                  x={x + barWidth / 2}
                  y={height - 12}
                  textAnchor="middle"
                  fill="#9a8b7a"
                  fontSize={9}
                  fontWeight={500}
                >
                  {d.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Donut Chart ───
function DonutChart({
  data,
  size = 160,
}: {
  data: PoojaPopularity[];
  size?: number;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.count, 0);
  const radius = size / 2 - 10;
  const innerRadius = radius * 0.55;
  const cx = size / 2;
  const cy = size / 2;

  if (total === 0) {
    return (
      <div className="flex h-[160px] items-center justify-center text-sm text-ink-soft">
        No bookings yet
      </div>
    );
  }

  let cumulativeAngle = -Math.PI / 2; // start from top

  return (
    <div className="flex items-center gap-6">
      <svg
        width={size}
        height={size}
        className="shrink-0"
        role="img"
        aria-label="Popular poojas donut chart"
      >
        {data.map((d, i) => {
          const sliceAngle = (d.count / total) * 2 * Math.PI;
          const startAngle = cumulativeAngle;
          const endAngle = cumulativeAngle + sliceAngle;
          cumulativeAngle = endAngle;

          const x1 = cx + radius * Math.cos(startAngle);
          const y1 = cy + radius * Math.sin(startAngle);
          const x2 = cx + radius * Math.cos(endAngle);
          const y2 = cy + radius * Math.sin(endAngle);
          const ix1 = cx + innerRadius * Math.cos(startAngle);
          const iy1 = cy + innerRadius * Math.sin(startAngle);
          const ix2 = cx + innerRadius * Math.cos(endAngle);
          const iy2 = cy + innerRadius * Math.sin(endAngle);

          const largeArc = sliceAngle > Math.PI ? 1 : 0;
          const color = COLORS[i % COLORS.length];
          const isHovered = hoveredIdx === i;

          const path = [
            `M ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
            `L ${ix2} ${iy2}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
            "Z",
          ].join(" ");

          return (
            <path
              key={d.slug}
              d={path}
              fill={color}
              opacity={isHovered ? 1 : 0.85}
              stroke="white"
              strokeWidth={2}
              className="cursor-pointer transition-opacity duration-150"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          );
        })}

        {/* Center text */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          className="fill-ink font-display"
          fontSize={20}
          fontWeight={700}
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          className="fill-ink-soft"
          fontSize={9}
          fontWeight={500}
        >
          bookings
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-col gap-1.5">
        {data.slice(0, 6).map((d, i) => (
          <div
            key={d.slug}
            className="flex items-center gap-2 text-xs"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="truncate text-ink-soft" style={{ maxWidth: 120 }}>
              {d.title}
            </span>
            <span className="font-semibold text-ink">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Monthly Revenue Bar Chart ───
function RevenueChart({
  data,
  height = 140,
}: {
  data: { month: string; revenue: number }[];
  height?: number;
}) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const barWidth = Math.max(24, Math.floor(300 / data.length) - 8);
  const gap = Math.max(6, Math.floor(barWidth / 2));
  const chartWidth = data.length * (barWidth + gap);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="overflow-x-auto">
      <svg
        width={chartWidth}
        height={height}
        className="block"
        role="img"
        aria-label="Monthly revenue chart"
      >
        {data.map((d, i) => {
          const barHeight =
            maxRevenue > 0
              ? (d.revenue / maxRevenue) * (height - 40)
              : 0;
          const x = i * (barWidth + gap);
          const y = height - 30 - barHeight;
          const isHovered = hoveredIdx === i;

          return (
            <g
              key={d.month}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                rx={barWidth > 12 ? 4 : 2}
                fill={isHovered ? MAROOON : TEAL}
                opacity={isHovered ? 1 : 0.8}
                className="transition-opacity duration-150"
              />

              {isHovered && (
                <g>
                  <rect
                    x={x - 4}
                    y={y - 28}
                    width={barWidth + 8}
                    height={22}
                    rx={5}
                    fill={MAROOON}
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 13}
                    textAnchor="middle"
                    fill="white"
                    fontSize={10}
                    fontWeight={600}
                  >
                    {formatINR(d.revenue)}
                  </text>
                </g>
              )}

              <text
                x={x + barWidth / 2}
                y={height - 12}
                textAnchor="middle"
                fill="#9a8b7a"
                fontSize={9}
                fontWeight={500}
              >
                {d.month}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Main Analytics Panel ───
export default function AnalyticsCharts({
  analytics,
}: {
  analytics: AnalyticsSummary;
}) {
  const maxDailyBookings = Math.max(
    ...analytics.bookingsPerDay.map((d) => d.count),
    1
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<IndianRupee className="h-5 w-5" />}
          label="Total Revenue"
          value={formatINR(analytics.totalRevenue)}
          gradient="from-emerald-500 to-teal-600"
        />
        <StatCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="Total Bookings"
          value={analytics.totalBookings}
          gradient="from-saffron-500 to-saffron-600"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Avg. Order Value"
          value={formatINR(analytics.averageOrderValue)}
          gradient="from-maroon-600 to-maroon-700"
        />
        <StatCard
          icon={<Calendar className="h-5 w-5" />}
          label="Active Bookings"
          value={analytics.activeBookings}
          gradient="from-purple-500 to-purple-600"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bookings over time */}
        <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-soft">
          <h3 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-ink">
            <BarChart3 className="h-4 w-4 text-saffron-600" />
            Bookings (Last 30 Days)
          </h3>
          <BarChart data={analytics.bookingsPerDay} maxValue={maxDailyBookings} />
        </div>

        {/* Popular poojas */}
        <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-soft">
          <h3 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-ink">
            <PieChart className="h-4 w-4 text-saffron-600" />
            Most Popular Poojas
          </h3>
          <DonutChart data={analytics.popularPoojas} />
        </div>
      </div>

      {/* Monthly revenue */}
      <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-soft">
        <h3 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-ink">
          <TrendingUp className="h-4 w-4 text-teal-600" />
          Monthly Revenue
        </h3>
        <RevenueChart data={analytics.monthlyRevenue} />
      </div>
    </div>
  );
}

// ─── Stat Card ───
function StatCard({
  icon,
  label,
  value,
  gradient,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  gradient: string;
}) {
  return (
    <div className="rounded-3xl border border-saffron-100 bg-white p-5 shadow-soft">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-soft`}
      >
        {icon}
      </span>
      <div className="mt-3 font-display text-2xl font-bold text-ink">
        {value}
      </div>
      <div className="text-xs font-medium text-ink-soft">{label}</div>
    </div>
  );
}
