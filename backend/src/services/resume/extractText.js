import fs from 'node:fs/promises';
import mammoth from 'mammoth';
import { createRequire } from 'node:module';

// pdf-parse v2 exports a class (PDFParse), not a plain function like v1 did.
// Usage: new PDFParse({ data: buffer }) then await instance.getText().
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const MIN_MEANINGFUL_CHARS = 40;

async function extractFromPdf(filePath) {
  const buffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text || '';
}

async function extractFromDocx(filePath) {
  const buffer = await fs.readFile(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return result.value || '';
}

function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extracts plain text from a resume file. Returns an empty string (never
 * throws for "no text found") so the caller can decide how to handle it —
 * for example a scanned/image-only PDF legitimately has no extractable text.
 */
export async function extractResumeText(filePath, mimeType) {
  let raw = '';

  if (mimeType === 'application/pdf') {
    raw = await extractFromPdf(filePath);
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    raw = await extractFromDocx(filePath);
  } else if (mimeType === 'application/msword') {
    raw = '';
  }

  return cleanText(raw);
}

export function hasMeaningfulText(text) {
  return Boolean(text) && text.trim().length >= MIN_MEANINGFUL_CHARS;
}