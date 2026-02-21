"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MoreHorizontal, Filter, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  title?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  title
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  })

  return (
    <div className="w-full flex flex-col bg-white dark:bg-background text-slate-900 dark:text-foreground border-slate-200 dark:border-border shadow-sm rounded-none">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-border bg-slate-50 dark:bg-muted/20">
        <span className="text-[10px] font-bold tracking-[0.2em] text-slate-500 dark:text-muted-foreground uppercase">{title}</span>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-foreground transition-colors">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between p-4 gap-4 border-b border-slate-200 dark:border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-200 dark:border-border rounded-none overflow-hidden bg-white dark:bg-background">
             <Button variant="ghost" size="sm" className="h-8 px-2 rounded-none hover:bg-accent">
                <Filter className="h-3.5 w-3.5" />
             </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-tight text-slate-500 dark:text-muted-foreground">
          <span>Showing {table.getRowModel().rows.length} of {data.length}</span>
          {Object.keys(rowSelection).length > 0 && (
            <span className="bg-neutral-800 dark:bg-foreground dark:text-background px-2 py-0.5 rounded-none lowercase">
              {Object.keys(rowSelection).length} selected
            </span>
          )}
        </div>
      </div>

      <div className="relative overflow-auto">
        <Table className="border-collapse">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-slate-200 dark:border-border hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-10 px-4 text-[10px] font-bold uppercase text-slate-400 dark:text-muted-foreground/50 border-none">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  "border-b border-slate-100 dark:border-border/40 transition-colors group",
                  row.getIsSelected() 
                    ? "bg-neutral-100 dark:bg-muted/40" 
                    : "hover:bg-slate-50 dark:hover:bg-accent/50"
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="p-4 text-xs whitespace-nowrap border-none">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-border">
        <div></div>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-none border border-slate-200 dark:border-border hover:bg-accent"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center">
            {table.getPageOptions().map((page) => (
              <Button
                key={page}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 min-w-[32px] rounded-none border-y border-r border-slate-200 dark:border-border font-bold text-[10px]",
                  table.getState().pagination.pageIndex === page 
                  ? "bg-neutral-900 text-white dark:bg-foreground dark:text-background" 
                  : "text-muted-foreground hover:bg-accent"
                )}
                onClick={() => table.setPageIndex(page)}
              >
                {page + 1}
              </Button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-none border-y border-r border-slate-200 dark:border-border hover:bg-accent"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}