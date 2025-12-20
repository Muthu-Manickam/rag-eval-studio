import fs from 'node:fs';
import path from 'node:path';
import type { Dataset, EvalRun, StoreData } from './types';

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'rag-eval-studio.json');

function empty(): StoreData {
  return { datasets: [], runs: [] };
}

export function loadStore(): StoreData {
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as Partial<StoreData>;
    return { datasets: parsed.datasets ?? [], runs: parsed.runs ?? [] };
  } catch {
    return empty();
  }
}

export function saveStore(data: StoreData): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export function loadDatasets(): Dataset[] {
  return loadStore().datasets;
}

export function getDataset(id: string): Dataset | undefined {
  return loadStore().datasets.find((dataset) => dataset.id === id);
}

export function saveDataset(dataset: Dataset): void {
  const data = loadStore();
  data.datasets = data.datasets.filter((item) => item.id !== dataset.id).concat(dataset);
  saveStore(data);
}

export function deleteDataset(id: string): void {
  const data = loadStore();
  data.datasets = data.datasets.filter((dataset) => dataset.id !== id);
  saveStore(data);
}

export function loadRuns(): EvalRun[] {
  return loadStore().runs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getRun(id: string): EvalRun | undefined {
  return loadStore().runs.find((run) => run.id === id);
}

export function saveRun(run: EvalRun): void {
  const data = loadStore();
  data.runs = data.runs.filter((item) => item.id !== run.id).concat(run).slice(-50);
  saveStore(data);
}

export function deleteRun(id: string): void {
  const data = loadStore();
  data.runs = data.runs.filter((run) => run.id !== id);
  saveStore(data);
}
