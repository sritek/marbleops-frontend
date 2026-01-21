"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

// Simple chart data (backward compatible)
export interface MonthlyChartData {
  month: string;
  amount: number;
}

// Stacked chart data with returns
export interface StackedChartData {
  month: string;
  amount: number;
  returnAmount: number;
}

// Simple chart props (backward compatible)
interface SimpleChartProps {
  data: MonthlyChartData[];
  color?: string;
  isLoading?: boolean;
  className?: string;
  stacked?: false;
}

// Stacked chart props
interface StackedChartProps {
  data: StackedChartData[];
  primaryColor: string;
  secondaryColor: string;
  primaryLabel: string;
  secondaryLabel: string;
  isLoading?: boolean;
  className?: string;
  stacked: true;
}

type MonthlyChartProps = SimpleChartProps | StackedChartProps;

/**
 * Format amount for Y-axis labels (e.g., 100000 -> "1L", 50000 -> "50K")
 */
function formatYAxisAmount(value: number): string {
  if (value >= 100000) {
    return `${(value / 100000).toFixed(value % 100000 === 0 ? 0 : 1)}L`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
  }
  return value.toString();
}

/**
 * Format amount for tooltip (full currency format)
 */
function formatTooltipAmount(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Custom tooltip component for simple charts
 */
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-surface border border-border-subtle rounded-lg shadow-lg p-2">
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-sm font-semibold text-text-primary">
          {formatTooltipAmount(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
}

/**
 * Custom tooltip component for stacked charts
 */
function StackedTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-surface border border-border-subtle rounded-lg shadow-lg p-3">
        <p className="text-xs text-text-muted mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-text-muted">{entry.name}:</span>
            <span className="text-sm font-semibold text-text-primary">
              {formatTooltipAmount(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

/**
 * Custom legend component for stacked charts
 */
function CustomLegend({
  payload,
}: {
  payload?: Array<{ value: string; color: string }>;
}) {
  if (!payload) return null;
  return (
    <div className="flex items-center justify-center gap-4 mt-2">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-text-muted">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for the chart
 */
function ChartSkeleton() {
  return (
    <div className="w-full h-[200px] flex items-end justify-around gap-2 px-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="skeleton rounded-t"
          style={{
            width: "14%",
            height: `${Math.random() * 60 + 40}%`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Monthly bar chart component for sales/purchase data
 * Uses Recharts with animations enabled by default
 * Supports both simple and stacked bar modes
 */
export function MonthlyChart(props: MonthlyChartProps) {
  const { data, isLoading = false, className } = props;

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[200px] flex items-center justify-center">
        <p className="text-sm text-text-muted">No data available</p>
      </div>
    );
  }

  // Stacked chart mode
  if (props.stacked) {
    const { primaryColor, secondaryColor, primaryLabel, secondaryLabel } = props;
    
    return (
      <div className={cn("w-full h-[220px]", className)}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border-subtle)"
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "var(--text-muted)" }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              tickFormatter={formatYAxisAmount}
              width={45}
            />
            <Tooltip
              content={<StackedTooltip />}
              cursor={{ fill: "var(--bg-app)", opacity: 0.5 }}
            />
            <Legend content={<CustomLegend />} />
            <Bar
              dataKey="amount"
              name={primaryLabel}
              stackId="a"
              fill={primaryColor}
              radius={[0, 0, 0, 0]}
              animationDuration={800}
              animationEasing="ease-out"
            />
            <Bar
              dataKey="returnAmount"
              name={secondaryLabel}
              stackId="a"
              fill={secondaryColor}
              radius={[4, 4, 0, 0]}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Simple chart mode (default)
  const color = (props as SimpleChartProps).color || "var(--primary-600)";

  return (
    <div className={cn("w-full h-[200px]", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--border-subtle)"
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--text-muted)" }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            tickFormatter={formatYAxisAmount}
            width={45}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "var(--bg-app)", opacity: 0.5 }}
          />
          <Bar
            dataKey="amount"
            fill={color}
            radius={[4, 4, 0, 0]}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
