"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Spinner } from "./spinner";
import { EmptyState } from "./empty-state";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Whether the table is loading */
  isLoading?: boolean;
  /** Empty state configuration */
  emptyState?: {
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
  };
  /** Pagination config */
  pagination?: {
    pageIndex: number;
    pageSize: number;
    pageCount?: number;
    onPageChange?: (pageIndex: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
  };
  /** Enable row selection */
  enableRowSelection?: boolean;
  /** Selected row handler */
  onRowSelectionChange?: (selectedRows: TData[]) => void;
  /** Row click handler */
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  emptyState,
  pagination,
  enableRowSelection = false,
  onRowSelectionChange,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    enableRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      ...(pagination && {
        pagination: {
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
        },
      }),
    },
    ...(pagination && {
      pageCount: pagination.pageCount,
      manualPagination: !!pagination.pageCount,
    }),
  });

  // Notify parent of selection changes
  React.useEffect(() => {
    if (onRowSelectionChange && enableRowSelection) {
      const selectedRows = table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original);
      onRowSelectionChange(selectedRows);
    }
  }, [rowSelection, onRowSelectionChange, enableRowSelection, table]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Empty state
  if (!data.length && emptyState) {
    return (
      <EmptyState
        title={emptyState.title}
        description={emptyState.description}
        actionLabel={emptyState.actionLabel}
        onAction={emptyState.onAction}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-lg border border-border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-app">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        "h-12 px-4 text-left align-middle",
                        "text-sm font-medium text-text-muted",
                        "border-b border-border-subtle"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-border-subtle last:border-b-0",
                    "transition-colors hover:bg-bg-app",
                    row.getIsSelected() && "bg-primary-50",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="h-14 px-4 align-middle text-sm"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-text-muted">
            {enableRowSelection && (
              <span>
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => pagination.onPageChange?.(pagination.pageIndex - 1)}
              disabled={pagination.pageIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>

            <span className="text-sm text-text-primary">
              Page {pagination.pageIndex + 1}
              {pagination.pageCount && ` of ${pagination.pageCount}`}
            </span>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => pagination.onPageChange?.(pagination.pageIndex + 1)}
              disabled={
                pagination.pageCount
                  ? pagination.pageIndex >= pagination.pageCount - 1
                  : data.length < pagination.pageSize
              }
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Sortable column header helper
 */
export function SortableHeader<TData>({
  column,
  children,
}: {
  column: {
    getToggleSortingHandler: () => ((event: unknown) => void) | undefined;
    getIsSorted: () => false | "asc" | "desc";
  };
  children: React.ReactNode;
}) {
  const handler = column.getToggleSortingHandler();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-bg-app"
      onClick={handler}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}
