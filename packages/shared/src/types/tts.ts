export interface TTSSynthesizeInput {
  text: string;
  voice?: string;
  speechRate?: number;
  volume?: number;
  format?: string;
}

export interface TTSSynthesizeOutput {
  audioBase64: string;
  format: string;
}
