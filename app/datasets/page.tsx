import { DatasetManager } from '@/components/DatasetManager';

export default function DatasetsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Datasets</h1>
        <p className="text-sm text-slate-500">
          Each sample is a question, the generated answer, a ground-truth answer and the retrieved
          contexts that were used.
        </p>
      </div>
      <DatasetManager />
    </div>
  );
}
