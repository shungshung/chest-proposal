import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: '파일이 없습니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const MAX_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_SIZE) {
      return new Response(
        JSON.stringify({
          error: `파일 크기가 너무 큽니다. 최대 100MB까지 업로드 가능합니다. (현재 파일: ${(file.size / 1024 / 1024).toFixed(1)}MB)`,
        }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    let text = '';

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // pdf-parse의 index.js는 초기화 시 테스트 파일을 읽어 서버리스 환경에서 오류 발생.
      // lib/pdf-parse.js를 직접 임포트해서 우회.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse/lib/pdf-parse.js');
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.endsWith('.docx')
    ) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      text = new TextDecoder('utf-8').decode(buffer);
    } else {
      return new Response(
        JSON.stringify({ error: '지원하지 않는 파일 형식입니다. PDF, DOCX, TXT만 가능합니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ text: text.trim() }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // 실제 에러 메시지를 응답에 포함해 원인 파악 용이하게
    const message = error instanceof Error ? error.message : String(error);
    console.error('Extract API error:', error);
    return new Response(
      JSON.stringify({ error: `파일 텍스트 추출 중 오류가 발생했습니다: ${message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export const maxDuration = 60;
