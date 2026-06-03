import { ArrowDownUp, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BatchRankingRow } from "@/lib/formulation";

type SortKey = "match" | "predictedLoading" | "releaseAtTargetPh" | "ic50" | "bioavailability";

type BatchRankingTableProps = {
  rows: BatchRankingRow[];
};

const sortLabels: Record<SortKey, string> = {
  match: "Match",
  predictedLoading: "Loading",
  releaseAtTargetPh: "Release",
  ic50: "IC50",
  bioavailability: "Bioavail.",
};

export function BatchRankingTable({ rows }: BatchRankingTableProps) {
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("match");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");

  const filteredRows = useMemo(() => {
    const normalized = filter.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (!normalized) return true;
        return [row.payload, row.mof, row.metalNode, row.linker].some((value) =>
          value.toLowerCase().includes(normalized),
        );
      })
      .sort((a, b) => {
        const delta = a[sortKey] - b[sortKey];
        return direction === "asc" ? delta : -delta;
      });
  }, [direction, filter, rows, sortKey]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setDirection("desc");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Filter by payload, MOF, node..."
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(sortLabels) as SortKey[]).map((key) => (
            <Button
              key={key}
              type="button"
              variant={sortKey === key ? "secondary" : "outline"}
              size="sm"
              onClick={() => toggleSort(key)}
            >
              <ArrowDownUp className="h-3.5 w-3.5" />
              {sortLabels[key]}
            </Button>
          ))}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rank</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Payload</TableHead>
            <TableHead>MOF</TableHead>
            <TableHead className="text-right">Loading</TableHead>
            <TableHead className="text-right">Release</TableHead>
            <TableHead className="text-right">IC50</TableHead>
            <TableHead className="text-right">Bioavail.</TableHead>
            <TableHead className="text-right">Match</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">#{row.rank}</TableCell>
              <TableCell>{row.sourceIndex}</TableCell>
              <TableCell>{row.payload}</TableCell>
              <TableCell>
                <div className="font-medium">{row.mof}</div>
                <div className="text-xs text-muted-foreground">
                  {row.metalNode} / {row.linker}
                </div>
              </TableCell>
              <TableCell className="text-right">{row.predictedLoading}%</TableCell>
              <TableCell className="text-right">{row.releaseAtTargetPh}%</TableCell>
              <TableCell className="text-right">{row.ic50}</TableCell>
              <TableCell className="text-right">{row.bioavailability}%</TableCell>
              <TableCell className="text-right font-semibold">{row.match}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
