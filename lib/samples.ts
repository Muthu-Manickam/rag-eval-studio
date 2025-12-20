import { randomUUID } from 'node:crypto';
import type { Dataset, EvalSample } from './types';

const CONTEXT_RAG =
  'Retrieval-Augmented Generation (RAG) combines a retrieval system with a generative language model. Documents are chunked, embedded and stored in a vector index. At query time the question is embedded and the most similar chunks are retrieved and inserted into the prompt as context.';
const CONTEXT_CHUNK =
  'Chunk size and chunk overlap are the two most important chunking parameters. Recursive character splitting tries paragraph boundaries first, then sentences, then words. Overlap repeats characters between consecutive chunks so a fact spanning a boundary is not lost.';
const CONTEXT_HYBRID =
  'Dense retrieval uses embeddings and handles paraphrase. Sparse retrieval such as BM25 scores exact term overlap and is strong for rare tokens. Hybrid retrieval fuses both ranked lists, often with reciprocal rank fusion.';
const CONTEXT_EVAL =
  'Faithfulness measures whether the answer is grounded in the retrieved context by checking each factual claim. Answer relevancy measures how directly the answer addresses the question. Context recall measures whether all needed information was retrieved.';

function sample(
  id: string,
  question: string,
  answer: string,
  groundTruth: string,
  retrievedContexts: string[],
): EvalSample {
  return { id, question, answer, groundTruth, retrievedContexts };
}

export function sampleDataset(): Dataset {
  return {
    id: randomUUID(),
    name: 'RAG Q&A evaluation (sample)',
    createdAt: new Date().toISOString(),
    samples: [
      sample(
        's1',
        'What are the three stages of a RAG pipeline?',
        'RAG has three stages: indexing, retrieval and generation. Documents are chunked and embedded during indexing, relevant chunks are retrieved for a query, and the model generates an answer from that context.',
        'Indexing, retrieval and generation.',
        [CONTEXT_RAG],
      ),
      sample(
        's2',
        'How does chunk overlap help retrieval?',
        'Overlap repeats characters between consecutive chunks so a fact that spans a chunk boundary is not lost.',
        'It repeats text between chunks so facts spanning a boundary are preserved.',
        [CONTEXT_CHUNK],
      ),
      sample(
        's3',
        'What is hybrid retrieval?',
        'Hybrid retrieval combines dense vector search with sparse lexical search such as BM25 and fuses the two ranked lists, often using reciprocal rank fusion.',
        'Combining dense and sparse retrieval and fusing the results.',
        [CONTEXT_HYBRID],
      ),
      sample(
        's4',
        'What does faithfulness measure?',
        'Faithfulness measures whether the answer is grounded in the retrieved context by checking each factual claim against it.',
        'Whether the answer is grounded in the retrieved context.',
        [CONTEXT_EVAL],
      ),
      // Deliberately hallucinated: the context says nothing about a specific model.
      sample(
        's5',
        'Which embedding model should I use?',
        'You should always use OpenAI text-embedding-3-large, because it is the only model that supports cosine similarity.',
        'The context does not specify an embedding model.',
        [CONTEXT_RAG],
      ),
      // Deliberately unsupported: context is missing the needed information.
      sample(
        's6',
        'How large should the overlap be?',
        'Set overlap to exactly 512 characters for every document.',
        'Overlap is typically 10 to 20 percent of the chunk size.',
        [CONTEXT_HYBRID],
      ),
    ],
  };
}
