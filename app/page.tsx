import { Dashboard } from '@/components/Dashboard';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">RAG Eval Studio</h1>
        <p className="text-sm text-slate-500">
          Score RAG answers with RAGAS-style metrics — faithfulness, answer relevancy, context
          precision, context recall and groundedness. Works offline with a deterministic estimator;
          add an OpenAI key for a real LLM-as-a-judge.
        </p>
      </div>
      <Dashboard />
    </div>
  );
}
