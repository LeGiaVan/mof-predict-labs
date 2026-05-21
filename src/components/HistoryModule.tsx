import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, History as HistoryIcon, Loader2 } from "lucide-react";

type DLRow = {
  prediction_id: number;
  central_metal_atom: string | null;
  organic_ligand: string | null;
  bit148: boolean | null;
  bit223: boolean | null;
  bit657: boolean | null;
  predicted_loading_capacity: number | null;
  prediction_date: string | null;
};

type CytoRow = {
  prediction_id: number;
  central_metal_atom: string | null;
  organic_ligand: string | null;
  concentration: number | null;
  size: number | null;
  zeta_potential: number | null;
  exposure_time: number | null;
  cell_type: string | null;
  predicted_cell_viability: number | null;
  prediction_date: string | null;
};

const PAGE_SIZE = 5;

interface Props { refreshKey: number; }

export function HistoryModule({ refreshKey }: Props) {
  const [dl, setDl] = useState<DLRow[]>([]);
  const [cyto, setCyto] = useState<CytoRow[]>([]);
  const [dlPage, setDlPage] = useState(0);
  const [cytoPage, setCytoPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [a, b] = await Promise.all([
        supabase.from("drug_loading_predictions").select("*").order("prediction_date", { ascending: false }),
        supabase.from("cytotoxicity_predictions").select("*").order("prediction_date", { ascending: false }),
      ]);
      if (!alive) return;
      setDl((a.data as DLRow[]) ?? []);
      setCyto((b.data as CytoRow[]) ?? []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const dlPages = Math.max(1, Math.ceil(dl.length / PAGE_SIZE));
  const cytoPages = Math.max(1, Math.ceil(cyto.length / PAGE_SIZE));
  const dlSlice = dl.slice(dlPage * PAGE_SIZE, dlPage * PAGE_SIZE + PAGE_SIZE);
  const cytoSlice = cyto.slice(cytoPage * PAGE_SIZE, cytoPage * PAGE_SIZE + PAGE_SIZE);

  const fmt = (d: string | null) => d ? new Date(d).toLocaleString() : "—";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5 text-primary" />
            Drug Loading History
          </CardTitle>
          <CardDescription>{dl.length} prediction(s) total</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Metal</TableHead>
                <TableHead>Ligand</TableHead>
                <TableHead>Bits</TableHead>
                <TableHead className="text-right">Loading (g/g)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dlSlice.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No predictions yet.</TableCell></TableRow>
              )}
              {dlSlice.map((r) => (
                <TableRow key={r.prediction_id}>
                  <TableCell className="text-xs text-muted-foreground">{fmt(r.prediction_date)}</TableCell>
                  <TableCell><Badge variant="secondary">{r.central_metal_atom}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{r.organic_ligand}</Badge></TableCell>
                  <TableCell className="text-xs">
                    {[r.bit148 && "148", r.bit223 && "223", r.bit657 && "657"].filter(Boolean).join(", ") || "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-primary">
                    {r.predicted_loading_capacity?.toFixed(3)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={dlPage} pages={dlPages} onPage={setDlPage} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5 text-primary" />
            Cytotoxicity History
          </CardTitle>
          <CardDescription>{cyto.length} prediction(s) total</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Metal</TableHead>
                <TableHead>Conc.</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Zeta</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Cell</TableHead>
                <TableHead className="text-right">Viability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cytoSlice.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No predictions yet.</TableCell></TableRow>
              )}
              {cytoSlice.map((r) => (
                <TableRow key={r.prediction_id}>
                  <TableCell className="text-xs text-muted-foreground">{fmt(r.prediction_date)}</TableCell>
                  <TableCell><Badge variant="secondary">{r.central_metal_atom}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{r.concentration} μg/ml</TableCell>
                  <TableCell className="font-mono text-xs">{r.size} nm</TableCell>
                  <TableCell className="font-mono text-xs">{r.zeta_potential} mV</TableCell>
                  <TableCell className="font-mono text-xs">{r.exposure_time}h</TableCell>
                  <TableCell className="text-xs">{r.cell_type}</TableCell>
                  <TableCell className="text-right font-mono font-semibold text-primary">
                    {r.predicted_cell_viability?.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={cytoPage} pages={cytoPages} onPage={setCytoPage} />
        </CardContent>
      </Card>
    </div>
  );
}

function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between">
      <div className="text-xs text-muted-foreground">Page {page + 1} of {pages}</div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}