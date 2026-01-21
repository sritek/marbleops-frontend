"use client";

import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Sector,
} from "recharts";
import { PieChart as PieChartIcon, Table } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface StockCategoryData {
  name: string;
  value: number;
  color: string;
}

interface StockPieChartProps {
  data: StockCategoryData[];
  title?: string;
  unit?: string;
  isLoading?: boolean;
  className?: string;
}

/**
 * Format large numbers for display (e.g., 15000 -> "15K", 150000 -> "1.5L")
 */
function formatValue(value: number): string {
  if (value >= 100000) {
    return `${(value / 100000).toFixed(value % 100000 === 0 ? 0 : 1)}L`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
  }
  return value.toLocaleString("en-IN");
}

/**
 * Active shape renderer for pie chart hover effect
 */
const renderActiveShape = (props: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: StockCategoryData;
  percent: number;
  value: number;
}) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  } = props;

  return (
    <g>
      {/* Center text */}
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        className="fill-text-primary font-semibold text-sm"
      >
        {payload.name}
      </text>
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        className="fill-text-muted text-xs"
      >
        {formatValue(value)} ({(percent * 100).toFixed(0)}%)
      </text>
      {/* Active sector (slightly larger) */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      {/* Inner ring highlight */}
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={innerRadius - 4}
        outerRadius={innerRadius}
        fill={fill}
        opacity={0.3}
      />
    </g>
  );
};

/**
 * Loading skeleton for the pie chart
 */
function ChartSkeleton() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-[180px] h-[180px] rounded-full skeleton" />
      <div className="flex gap-4 mt-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm skeleton" />
            <div className="w-12 h-4 skeleton rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Table view component for stock data
 */
function TableView({
  data,
  unit,
}: {
  data: StockCategoryData[];
  unit?: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full max-h-[280px] overflow-y-auto">
      <table className="w-full">
        <thead className="sticky top-0 bg-bg-surface z-10">
          <tr className="border-b border-border-subtle">
            <th className="text-left text-xs font-medium text-text-muted py-2 px-2 bg-bg-surface">
              Item
            </th>
            <th className="text-right text-xs font-medium text-text-muted py-2 px-2 bg-bg-surface">
              Quantity {unit && `(${unit})`}
            </th>
            <th className="text-right text-xs font-medium text-text-muted py-2 px-2 bg-bg-surface">
              %
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={index}
              className="border-b border-border-subtle last:border-0"
            >
              <td className="py-2 px-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-text-primary">{item.name}</span>
                </div>
              </td>
              <td className="text-right py-2 px-2">
                <span className="text-sm font-medium text-text-primary">
                  {item.value.toLocaleString("en-IN")}
                </span>
              </td>
              <td className="text-right py-2 px-2">
                <span className="text-sm text-text-muted">
                  {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-bg-app">
            <td className="py-2 px-2">
              <span className="text-sm font-medium text-text-primary">
                Total
              </span>
            </td>
            <td className="text-right py-2 px-2">
              <span className="text-sm font-semibold text-text-primary">
                {total.toLocaleString("en-IN")}
              </span>
            </td>
            <td className="text-right py-2 px-2">
              <span className="text-sm text-text-muted">100%</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/**
 * Stock pie chart component with table toggle
 * Shows stock distribution by category/form with interactive hover
 */
export function StockPieChart({
  data,
  title,
  unit = "sq ft",
  isLoading = false,
  className,
}: StockPieChartProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(
    undefined
  );
  const [viewMode, setViewMode] = React.useState<"chart" | "table">("chart");

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

  if (isLoading) {
    return (
      <div className={cn("w-full", className)}>
        <ChartSkeleton />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={cn("w-full h-[250px] flex items-center justify-center", className)}>
        <p className="text-sm text-text-muted">No data available</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Toggle buttons */}
      <div className="flex items-center justify-end gap-1 mb-3">
        <Button
          variant={viewMode === "chart" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setViewMode("chart")}
          className="h-7 px-2"
        >
          <PieChartIcon className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "table" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setViewMode("table")}
          className="h-7 px-2"
        >
          <Table className="h-4 w-4" />
        </Button>
      </div>

      {viewMode === "chart" ? (
        <>
          {/* Pie Chart */}
          <div className="w-full h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-2">
            {data.map((entry, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 cursor-pointer"
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(undefined)}
              >
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-text-muted">
                  {entry.name}: {formatValue(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <TableView data={data} unit={unit} />
      )}
    </div>
  );
}
