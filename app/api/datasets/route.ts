import { randomUUID } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { deleteDataset, loadDatasets, saveDataset } from '@/lib/store';
import type { EvalSample } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ datasets: loadDatasets() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? '').trim();
    const samples = Array.isArray(body?.samples) ? body.samples : [];
    if (!name) return Response.json({ ok: false, error: 'name is required' }, { status: 400 });
    if (samples.length === 0) {
      return Response.json({ ok: false, error: 'at least one sample is required' }, { status: 400 });
    }

    const dataset = {
      id: randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      samples: samples.map(
        (raw: Record<string, unknown>): EvalSample => ({
          id: String(raw?.id ?? randomUUID()),
          question: String(raw?.question ?? ''),
          answer: String(raw?.answer ?? ''),
          groundTruth: String(raw?.groundTruth ?? ''),
          retrievedContexts: Array.isArray(raw?.retrievedContexts)
            ? raw.retrievedContexts.map(String)
            : [],
        }),
      ),
    };
    saveDataset(dataset);
    return Response.json({ ok: true, dataset });
  } catch (error) {
    return Response.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return Response.json({ ok: false, error: 'id is required' }, { status: 400 });
  deleteDataset(id);
  return Response.json({ ok: true });
}
