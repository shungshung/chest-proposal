import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 30;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929';

export async function POST(req: NextRequest) {
  try {
    const { sections, formData, checklistData } = await req.json();

    // 사업계획서 텍스트 조합
    const proposalText = Object.entries(sections as Record<string, string>)
      .filter(([, v]) => v && (v as string).trim())
      .map(([k, v]) => `[${k}]\n${v}`)
      .join('\n\n');

    if (!proposalText.trim()) {
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 체크리스트 항목을 key 포함해서 평탄화
    const flatItems: { key: string; category: string; item: string }[] = [];
    (checklistData as Array<{ category: string; items: string[] }>).forEach(
      (cat, ci) => {
        cat.items.forEach((item, ii) => {
          flatItems.push({ key: `${ci}_${ii}`, category: cat.category, item });
        });
      }
    );

    const itemsText = flatItems
      .map(({ key, category, item }) => `${key} [${category}] ${item}`)
      .join('\n');

    const userPrompt = `다음은 사회복지공동모금회 배분사업 사업계획서입니다.

사업명: ${formData.projectName || '(미입력)'}
수행기관: ${formData.agencyName || '(미입력)'}

--- 사업계획서 내용 ---
${proposalText}

--- 체크리스트 ---
${itemsText}

각 체크리스트 항목이 사업계획서에 충족되어 있는지 분석하고, 아래 JSON 형식으로만 응답해주세요. 다른 텍스트는 절대 포함하지 마세요.

[{"key":"0_0","ok":true,"why":"이유를 한 줄로 간결하게"}]

- ok: 충족이면 true, 미충족이면 false
- why: 충족 근거(true일 때) 또는 보완 방법(false일 때)을 15자 이내로`;

    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = (msg.content[0] as { text: string }).text.trim();

    // JSON 파싱 (마크다운 코드블록 등 처리)
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results = JSON.parse(jsonMatch[0]);
    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Check API error:', error);
    return new Response(
      JSON.stringify({ results: [], error: '분석 중 오류가 발생했습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
