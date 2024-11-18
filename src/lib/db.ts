import { Database, Dataset, LabelSet, DatasetCompletion } from './types';
import { v4 as uuid } from 'uuid';

// In-memory database
const db: Database = {
  datasets: new Map(),
  labelSets: new Map(),
  datasetCompletions: new Map(),
};
console.log("🚀 ~ db:", db)

export function generateId(): string {
  return uuid()
}

export async function createDataset(data: string[]) {
  const id = generateId();
  db.datasets.set(id, { id, data });
  return id;
}

export async function getDataset(id: string): Promise<Dataset | undefined> {
  return db.datasets.get(id);
}

export async function getAllDatasetIds(): Promise<string[]> {
  return Array.from(db.datasets.keys());
}

export async function createLabelSet(
  datasetId: string,
  labels: { label: string; description: string }[],
  results?: { label: string; reason: string }[]
): Promise<string> {
  const id = generateId();
  db.labelSets.set(id, { id, datasetId, labels });
  return id;
}

export async function getLabelSet(id: string): Promise<LabelSet | undefined> {
  return db.labelSets.get(id);
}

export async function getLabelSetsByDatasetId(datasetId: string): Promise<string[]> {
  return Array.from(db.labelSets.values())
    .filter((labelSet) => labelSet.datasetId === datasetId)
    .map((labelSet) => labelSet.id);
}

export async function getDatasetCompletions(datasetId: string): Promise<DatasetCompletion[]> {
  return Array.from(db.datasetCompletions.values())
    .filter((completion) => completion.datasetId === datasetId)
}

export default db;