export interface Email {
  message: string;
  sender: string;
  id: string;
  replyToId?: string;
}

export interface EmailThread {
  messages: Email[];
}

export interface Label {
  label: string;
  description: string;
}

export interface LabelResult {
  label: string;
  reason: string;
}

export interface Dataset {
  id: string;
  data: string[];
}

export interface LabelSet {
  id: string;
  datasetId: string;
  labels: Label[];
  results?: LabelResult[];
}

export interface DatasetCompletion {
  id: string;
  datasetId: string;
  nextThreadMessage: string;
}

export interface Database {
  datasets: Map<string, Dataset>;
  labelSets: Map<string, LabelSet>;
  datasetCompletions: Map<string, DatasetCompletion>;
}