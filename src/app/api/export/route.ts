import { NextRequest } from 'next/server';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle,
  convertInchesToTwip, ShadingType,
} from 'docx';

export const maxDuration = 30;

const SECTION_LABELS: Record<string, string> = {
  necessity: '1. 사업 필요성',
  objectives: '2. 목적 및 목표',
  content: '3. 사업 내용',
  schedule: '4. 추진 일정',
  budget: '5. 예산 계획',
  evaluation: '6. 평가 계획',
  effects: '7. 기대 효과',
};

function makeCell(text: string, isHeader = false, width = 33) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    shading: isHeader ? { fill: '003366', type: ShadingType.SOLID } : undefined,
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: true,
            color: isHeader ? 'FFFFFF' : '1a1a1a',
            size: 20,
          }),
        ],
        spacing: { before: 80, after: 80 },
        indent: { left: convertInchesToTwip(0.08) },
      }),
    ],
  });
}

function sectionHeading(label: string) {
  return new Paragraph({
    children: [new TextRun({ text: label, bold: true, color: 'FFFFFF', size: 22 })],
    shading: { fill: '003366', type: ShadingType.SOLID },
    spacing: { before: 280, after: 120 },
    indent: { left: convertInchesToTwip(0.12) },
  });
}

// ── 인라인 마크다운 파싱 (**bold**) ──────────────────────────────────────────
function parseInline(text: string, defaultSize = 22): TextRun[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return new TextRun({ text: part.slice(2, -2), bold: true, size: defaultSize, color: '1a1a1a' });
    }
    return new TextRun({ text: part, size: defaultSize, color: '1a1a1a' });
  });
}

// ── 마크다운 → DOCX 단락 변환 ─────────────────────────────────────────────
function parseMarkdownToDocx(content: string): Paragraph[] {
  const lines = content.split('\n');
  const paragraphs: Paragraph[] = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      // 주요 소제목
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: line.slice(3), bold: true, size: 24, color: '003366' })],
          spacing: { before: 220, after: 100 },
          indent: { left: convertInchesToTwip(0.08) },
        })
      );
    } else if (line.startsWith('### ')) {
      // 세부 소제목
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun({ text: line.slice(4), bold: true, size: 22, color: '17375E' })],
          spacing: { before: 160, after: 80 },
          indent: { left: convertInchesToTwip(0.1) },
        })
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // 목록 항목
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: '• ', size: 22, color: '555555' }),
            ...parseInline(line.slice(2)),
          ],
          spacing: { after: 60 },
          indent: { left: convertInchesToTwip(0.25), hanging: convertInchesToTwip(0.12) },
        })
      );
    } else if (line.trim() === '') {
      // 빈 줄
      paragraphs.push(new Paragraph({ children: [], spacing: { after: 80 } }));
    } else {
      // 일반 본문
      paragraphs.push(
        new Paragraph({
          children: parseInline(line),
          spacing: { after: 80 },
          indent: { left: convertInchesToTwip(0.1) },
        })
      );
    }
  }

  return paragraphs;
}

export async function POST(req: NextRequest) {
  try {
    const { formData, sections } = await req.json();

    const period =
      formData.startDate && formData.endDate
        ? `${formData.startDate} ~ ${formData.endDate}`
        : '미정';

    const infoRows = [
      ['사  업  명', formData.projectName || '(미입력)'],
      ['수 행 기 관', formData.agencyName || '(미입력)'],
      ['사 업 유 형', formData.projectType],
      ['사 업 기 간', period],
      ['신 청 금 액', formData.budgetTotal ? `${formData.budgetTotal}원` : '(미입력)'],
      ['사 업 대 상', [formData.target, formData.targetCount].filter(Boolean).join(' ') || '(미입력)'],
      ...(formData.keyOutcome ? [['핵심 성과목표', formData.keyOutcome]] : []),
      ...(formData.region ? [['사 업 지 역', formData.region]] : []),
      ...(formData.managerName ? [['담  당  자', formData.managerName]] : []),
    ];

    const today = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const sectionEntries = Object.entries(sections as Record<string, string>).filter(
      ([, v]) => v && v.trim()
    );

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: 'Malgun Gothic', size: 22 },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(1),
                right: convertInchesToTwip(1),
                bottom: convertInchesToTwip(1),
                left: convertInchesToTwip(1),
              },
            },
          },
          children: [
            // 표지 제목
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 800, after: 200 },
              children: [
                new TextRun({ text: '사  업  계  획  서', bold: true, size: 48, color: '003366' }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 },
              children: [
                new TextRun({ text: '사회복지공동모금회 배분사업 신청', size: 26, color: '555555' }),
              ],
            }),

            // 기본 정보 표
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              },
              rows: infoRows.map(([k, v]) =>
                new TableRow({
                  children: [makeCell(k, true, 28), makeCell(v, false, 72)],
                })
              ),
            }),

            // 날짜 / 기관명
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 400 },
              children: [new TextRun({ text: today, size: 20, color: '888888' })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 },
              children: [new TextRun({ text: formData.agencyName || '', bold: true, size: 26 })],
            }),

            // 각 섹션 - 마크다운 파싱 적용
            ...sectionEntries.flatMap(([key, value]) => {
              const label = SECTION_LABELS[key] || key;
              return [
                sectionHeading(label),
                ...parseMarkdownToDocx(value as string),
              ];
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const uint8 = new Uint8Array(buffer);
    const filename = encodeURIComponent(
      `${formData.agencyName || '기관'}_사업계획서.docx`
    );

    return new Response(uint8, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ error: '문서 생성 중 오류가 발생했습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
