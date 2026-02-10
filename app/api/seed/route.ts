import { loadDatasets, saveDataset } from '@/lib/store';
import { sampleDataset } from '@/lib/samples';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  if (loadDatasets().length === 0) {
    saveDataset(sampleDataset());
  }
  return Response.json({ ok: true, datasets: loadDatasets().length });
}
