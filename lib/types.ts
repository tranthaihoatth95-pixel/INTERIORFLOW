export type DataType = 'image' | 'text' | 'mask' | 'number';

export interface PortDef {
  id: string;
  label: string;
  dataType: DataType;
}

export type ParamDef =
  | { kind: 'text'; id: string; label: string; placeholder?: string; multiline?: boolean }
  | { kind: 'select'; id: string; label: string; options: string[] }
  | { kind: 'slider'; id: string; label: string; min: number; max: number; step: number; default: number }
  | { kind: 'image'; id: string; label: string }
  | { kind: 'mask'; id: string; label: string }
  | { kind: 'annotate'; id: string; label: string };

export type NodeCategory = 'INPUT' | 'AI_GENERATE' | 'AI_EDIT' | 'SLIDE' | 'UTILITY' | 'OUTPUT';

export interface PortValue {
  dataType: DataType;
  value: string | number;
}

export interface ExecContext {
  nodeId: string;
  inputs: Record<string, PortValue | undefined>;
  params: Record<string, string | number>;
  onProgress: (progress: number) => void;
}

export interface NodeDefinition {
  type: string;
  title: string;
  category: NodeCategory;
  description: string;
  inputs: PortDef[];
  outputs: PortDef[];
  params: ParamDef[];
  creditCost: number;
  execute: (ctx: ExecContext) => Promise<Record<string, PortValue>>;
}

export type RunStatus = 'idle' | 'queued' | 'running' | 'done' | 'error';

export interface NodeRunState {
  status: RunStatus;
  progress: number;
  outputs?: Record<string, PortValue>;
  error?: string;
  /** hash of inputs+params of the last successful run — unchanged inputs are not re-run */
  inputHash?: string;
}

export interface Job {
  id: string;
  nodeId: string;
  nodeTitle: string;
  status: RunStatus;
  createdAt: number;
  finishedAt?: number;
  creditCost: number;
  error?: string;
}

export interface InteriorNodeData extends Record<string, unknown> {
  defType: string;
  params: Record<string, string | number>;
  run: NodeRunState;
  /** sticky note content (type === 'note' only) */
  note?: string;
}

export const DATA_TYPE_COLORS: Record<DataType, string> = {
  image: '#8b7cf7',
  text: '#38bdf8',
  mask: '#f59e0b',
  number: '#34d399',
};

export const CATEGORY_META: Record<NodeCategory, { label: string; color: string }> = {
  INPUT: { label: 'Input', color: '#38bdf8' },
  AI_GENERATE: { label: 'AI Generate', color: '#8b7cf7' },
  AI_EDIT: { label: 'AI Edit', color: '#f472b6' },
  SLIDE: { label: 'Slide Deck', color: '#fb923c' },
  UTILITY: { label: 'Utility', color: '#34d399' },
  OUTPUT: { label: 'Output', color: '#fbbf24' },
};
