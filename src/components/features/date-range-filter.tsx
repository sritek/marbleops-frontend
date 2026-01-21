"use client";

import * as React from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type DateRangePreset = "today" | "week" | "month" | "custom";

export interface DateRange {
  startDate: Date;
  endDate: Date;
  preset: DateRangePreset;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

/**
 * Get date range based on preset
 */
function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (preset) {
    case "today":
      return {
        startDate: startOfDay,
        endDate: endOfDay,
        preset: "today",
      };
    case "week": {
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfDay.getDate() - dayOfWeek);
      return {
        startDate: startOfWeek,
        endDate: endOfDay,
        preset: "week",
      };
    }
    case "month": {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate: startOfMonth,
        endDate: endOfDay,
        preset: "month",
      };
    }
    case "custom":
    default:
      return {
        startDate: startOfDay,
        endDate: endOfDay,
        preset: "custom",
      };
  }
}

/**
 * Format date for display
 */
function formatDateRange(range: DateRange, t: ReturnType<typeof useTranslations>): string {
  if (range.preset === "today") {
    return t("today");
  }
  if (range.preset === "week") {
    return t("thisWeek");
  }
  if (range.preset === "month") {
    return t("thisMonth");
  }
  
  // Custom range - show date range
  const options: Intl.DateTimeFormatOptions = { 
    day: "numeric", 
    month: "short" 
  };
  const start = range.startDate.toLocaleDateString("en-IN", options);
  const end = range.endDate.toLocaleDateString("en-IN", options);
  return `${start} - ${end}`;
}

/**
 * Date range filter component for dashboard stats
 */
export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const t = useTranslations("dashboard.dateFilter");
  const [customStartDate, setCustomStartDate] = React.useState<string>("");
  const [customEndDate, setCustomEndDate] = React.useState<string>("");
  const [showCustomInputs, setShowCustomInputs] = React.useState(false);

  const handlePresetSelect = (preset: DateRangePreset) => {
    if (preset === "custom") {
      setShowCustomInputs(true);
      return;
    }
    setShowCustomInputs(false);
    onChange(getDateRangeFromPreset(preset));
  };

  const handleCustomApply = () => {
    if (customStartDate && customEndDate) {
      onChange({
        startDate: new Date(customStartDate),
        endDate: new Date(customEndDate + "T23:59:59.999"),
        preset: "custom",
      });
      setShowCustomInputs(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className={cn("gap-2 min-w-[120px]", className)}
        >
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">{formatDateRange(value, t)}</span>
          <span className="sm:hidden">{value.preset === "today" ? t("today") : formatDateRange(value, t)}</span>
          <ChevronDown className="h-4 w-4 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() => handlePresetSelect("today")}
          className={cn(value.preset === "today" && "bg-bg-app")}
        >
          {t("today")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handlePresetSelect("week")}
          className={cn(value.preset === "week" && "bg-bg-app")}
        >
          {t("thisWeek")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handlePresetSelect("month")}
          className={cn(value.preset === "month" && "bg-bg-app")}
        >
          {t("thisMonth")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        
        {showCustomInputs ? (
          <div className="p-2 space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-border-subtle rounded-md bg-bg-surface focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-border-subtle rounded-md bg-bg-surface focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={() => setShowCustomInputs(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleCustomApply}
                disabled={!customStartDate || !customEndDate}
              >
                Apply
              </Button>
            </div>
          </div>
        ) : (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              handlePresetSelect("custom");
            }}
            className={cn(value.preset === "custom" && "bg-bg-app")}
          >
            {t("custom")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper hook to manage date range state
export function useDateRangeFilter(initialPreset: DateRangePreset = "today") {
  const [dateRange, setDateRange] = React.useState<DateRange>(() => 
    getDateRangeFromPreset(initialPreset)
  );

  return {
    dateRange,
    setDateRange,
    // ISO strings for API calls
    startDateISO: dateRange.startDate.toISOString(),
    endDateISO: dateRange.endDate.toISOString(),
  };
}

export { getDateRangeFromPreset };
