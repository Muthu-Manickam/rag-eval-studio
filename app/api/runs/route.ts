import type { NextRequest } from 'next/server';
import { deleteRun, getDataset, loadRuns } from '@/lib/store';
import { evaluateDataset } from '@/lib/runner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET() {
  const runs = loadRuns().map((run) => ({
    id: run.id,
    datasetName: run.datasetName,
    createdAt: run.createdAt,
    mode: run.mode,
    judge: run.judge,
    overall: run.overall,
    summary: run.summary,
  }));
  return Response.json({ runs });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const datasetId = String(body?.datasetId ?? '');
    const dataset = getDataset(datasetId);
    if (!dataset) return Response.json({ ok: false, error: 'Dataset not found' }, { status: 404 });
    const run = await evaluateDataset(dataset);
    return Response.json({ ok: true, run });
  } catch (error) {
    return Response.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return Response.json({ ok: false, error: 'id is required' }, { status: 400 });
  deleteRun(id);
  return Response.json({ ok: true });
}
