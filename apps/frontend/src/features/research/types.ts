// Research-related types will be defined here
export interface ResearchQuery {
  id: string;
  query: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'error';
}

export interface ResearchResult {
  id: string;
  queryId: string;
  data: any;
  sources: string[];
  confidence: number;
}