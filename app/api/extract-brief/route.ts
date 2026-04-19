import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MAX_CHARS = 4000;
const TRUNC_NOTE = '(Brief truncated to 4,000 characters for processing)';

function finalizeExtractedText(raw: string): string {
  const trimmed = raw.replace(/\u0000/g, '').trim();
  if (trimmed.length <= MAX_CHARS) {
    return trimmed;
  }
  return `${trimmed.slice(0, MAX_CHARS)}\n\n${TRUNC_NOTE}`;
}

function extensionOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i).toLowerCase() : '';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const name = file.name || '';
    const ext = extensionOf(name);

    if (ext !== '.pdf' && ext !== '.docx' && ext !== '.doc') {
      return NextResponse.json(
        { error: 'Only PDF and Word documents (.docx) are supported' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let rawText = '';

    if (ext === '.pdf') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse/lib/pdf-parse');
      const pdfData = await pdfParse(buffer);
      rawText = typeof pdfData.text === 'string' ? pdfData.text : '';
    } else {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        rawText = typeof result.value === 'string' ? result.value : '';
      } catch {
        return NextResponse.json(
          {
            error:
              'Could not read this Word file. Only .docx is supported; legacy .doc files may not extract — try saving as .docx or PDF.',
          },
          { status: 400 }
        );
      }
    }

    const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

    if (!normalized || normalized.length < 10) {
      return NextResponse.json(
        { error: 'Could not extract enough text from this document. It may be empty or image-based.' },
        { status: 400 }
      );
    }

    const text = finalizeExtractedText(normalized);

    return NextResponse.json({ text });
  } catch (err) {
    console.error('Brief extraction error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Extraction failed' },
      { status: 500 }
    );
  }
}
