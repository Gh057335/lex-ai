import { extractText } from 'unpdf';

export interface ExtractedDoc {
  text: string;
  totalPages: number;
}

export async function extractPdfText(bytes: ArrayBuffer): Promise<ExtractedDoc> {
  const result = await extractText(new Uint8Array(bytes), { mergePages: true });
  const text = Array.isArray(result.text) ? result.text.join('\n') : (result.text ?? '');
  return { text, totalPages: result.totalPages };
}
