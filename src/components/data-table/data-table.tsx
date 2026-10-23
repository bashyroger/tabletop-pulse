"use client";

import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  sortValue?: (row: T) => string | number;
  render: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string;
  searchPlaceholder?: string;
  searchMatcher?: (row: T, query: string) => boolean;
  emptyMessage?: string;
  toolbarRight?: React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  searchPlaceholder = "Filter records...",
  searchMatcher,
  emptyMessage = "No matching records found.",
  toolbarRight,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filteredData = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = data;
    if (q && searchMatcher) {
      list = list.filter((item) => searchMatcher(item, q));
    }

    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col?.sortValue) {
        const getter = col.sortValue;
        list = [...list].sort((a, b) => {
          const va = getter(a);
          const vb = getter(b);
          if (typeof va === "number" && typeof vb === "number") {
            return sortDir === "asc" ? va - vb : vb - va;
          }
          return sortDir === "asc"
            ? String(va).localeCompare(String(vb))
            : String(vb).localeCompare(String(va));
        });
      }
    }

    return list;
  }, [data, query, searchMatcher, sortKey, sortDir, columns]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {searchMatcher ? (
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 border-white/[0.1] bg-[#13151C] pl-9 text-xs text-[#F4F0E8] placeholder:text-[#6B7280]"
            />
          </div>
        ) : (
          <div />
        )}
        {toolbarRight ? (
          <div className="flex flex-wrap items-center gap-2">
            {toolbarRight}
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#13151C]">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.08] hover:bg-transparent">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <TableHead
                    key={col.key}
                    className={
                      col.align === "right"
                        ? "text-right text-[11px] font-semibold tracking-wider text-[#9CA3AF] uppercase"
                        : col.align === "center"
                          ? "text-center text-[11px] font-semibold tracking-wider text-[#9CA3AF] uppercase"
                          : "text-left text-[11px] font-semibold tracking-wider text-[#9CA3AF] uppercase"
                    }
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className="inline-flex items-center gap-1 transition hover:text-[#F4F0E8]"
                      >
                        <span>{col.header}</span>
                        {isSorted ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5 text-[#A48DFF]" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 text-[#A48DFF]" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow className="border-white/[0.06]">
                <TableCell
                  colSpan={columns.length}
                  className="py-10 text-center text-sm text-[#9CA3AF]"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row, idx) => (
                <TableRow
                  key={rowKey(row)}
                  className="border-white/[0.06] transition hover:bg-white/[0.03]"
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                            ? "text-center"
                            : "text-left"
                      }
                    >
                      {col.render(row, idx)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
