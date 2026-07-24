export type ToolCategory = "cipher" | "encoding" | "utility";

export interface ToolOptionField {
  name: string;
  type: "number" | "text" | "enum" | "boolean" | "textarea" | "matrix";
  label: string;
  defaultValue: unknown;
  min?: number;
  max?: number;
  enumValues?: { value: string; label: string }[];
  matrixSize?: number;
  placeholder?: string;
}

export interface ToolOptions {
  shift?: number;
  key?: string;
  rails?: number;
  offset?: number;
  a?: number;
  b?: number;
  [key: string]: unknown;
}

export interface TransformResult {
  text: string;
  hex?: string;
}

export type TransformOutput = string | TransformResult;

export interface ToolEntry {
  id: string;
  label: string;
  category: ToolCategory;
  encode: (text: string, options?: ToolOptions) => TransformOutput;
  decode: (text: string, options?: ToolOptions) => TransformOutput;
  optionsSchema?: ToolOptionField[];
  /**
   * One-directional "solver" tool: it analyses the input rather than
   * transforming plaintext↔ciphertext, so encode and decode do the same thing.
   * The UI shows a single "solve" action instead of encrypt/decrypt buttons.
   */
  solver?: boolean;
}

export function asText(result: TransformOutput): string {
  return typeof result === "string" ? result : result.text;
}

export function asResult(result: TransformOutput): TransformResult {
  return typeof result === "string" ? { text: result } : result;
}
