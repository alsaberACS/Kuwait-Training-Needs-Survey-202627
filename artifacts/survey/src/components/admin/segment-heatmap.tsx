import { useState } from "react";
import { useGetSegmentReport, getGetSegmentReportQueryKey, type SegmentDimension, type SegmentSlice, type SegmentReport } from "@workspace/api-client-react";
import { optionLabel } from "@/lib/survey-definition";
import { LOW_N } from "@/lib/study-context";
import { Panel, Chips, Skel, Err } from "./shared";
import { Heatmap, type HeatPalette } from "./charts";

export const useSegmentReport = () => useGetSegmentReport({ query: { queryKey: getGetSegmentReportQueryKey() } });

/** Prefer the survey's own option label when the dimension maps 1:1 to a question. */
export function sliceLabel(dim: SegmentDimension, slice: SegmentSlice): string {
  if (dim.questionId) {
    const l = optionLabel(dim.questionId, slice.key);
    if (l !== slice.key) return l;
  }
  return slice.label;
}

export const dimOptions = (r: SegmentReport) => r.dimensions.map((d) => ({ id: d.id, label: d.label }));

/** Rows × segment-slices heatmap with a dimension picker; shared by the skills, courses and tracks chapters. */
export function SegmentHeatmap({ title, sub, note, rows, pick, palette, domainMax, format, defaultDim = "path", testId }: {
  title: string; sub?: string; note?: string;
  rows: { id: string; label: string }[];
  pick: (s: SegmentSlice) => Record<string, number>;
  palette: HeatPalette; domainMax?: number; format?: (v: number) => string; defaultDim?: string; testId: string;
}) {
  const [dim, setDim] = useState(defaultDim);
  const q = useSegmentReport();
  const d = q.data?.dimensions.find((x) => x.id === dim) ?? q.data?.dimensions[0];
  const cols = d ? d.slices.filter((s) => s.n > 0).map((s) => ({ id: s.key, label: sliceLabel(d, s), n: s.n })) : [];
  return (
    <Panel title={title} sub={sub} note={note} testId={testId}
      action={q.data ? <Chips options={dimOptions(q.data)} value={dim} onChange={setDim} testId={`${testId}-dim`} /> : undefined}>
      {q.isLoading ? <Skel rows={2} /> : q.isError || !q.data || !d ? <Err onRetry={() => q.refetch()} /> : (
        <Heatmap rows={rows} cols={cols} palette={palette} domainMax={domainMax} format={format} lowN={LOW_N} rowHeader={d.label}
          value={(rowId, colId) => { const s = d.slices.find((x) => x.key === colId); return s ? pick(s)[rowId] : undefined; }} />
      )}
    </Panel>
  );
}
