import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { SectionKey, ProposalFormData } from '@/lib/data';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929';

const SYSTEM_PROMPT = `당신은 사회복지공동모금회 배분사업 프로포절 작성 전문가입니다.
사업계획서의 각 섹션을 전문적이고 설득력 있게 작성해 주세요.

작성 원칙:
- 명확하고 구체적인 문장으로 작성
- 통계, 수치, 근거를 적극 활용
- 심사위원을 설득하는 논리적 흐름
- 불필요한 미사여구 없이 핵심만 간결하게
- 한국어로 자연스럽게 작성
- 각 섹션에 맞는 구조와 형식 사용`;

const SECTION_INSTRUCTIONS: Record<SectionKey, string> = {
  necessity: `사업 필요성 섹션을 작성해 주세요.

다음 구조를 따르세요:
1. 문제 현황 (통계 및 수치 포함) - 국내외 관련 통계를 인용하여 문제의 심각성 제시
2. 지역사회/현장 실태 - 구체적인 현황 데이터
3. 기존 서비스의 한계 - 기존 지원의 부족한 부분
4. 기관의 개입 필요성 - 왜 이 기관이 이 사업을 해야 하는지

【주의】"있을 것으로 예상된다" 등 추정 표현 대신 근거를 명시하고,
기관의 특화 역량과 기존 서비스와의 차별성을 반드시 포함하세요.`,

  objectives: `목적 및 목표 섹션을 작성해 주세요.

다음 구조를 따르세요:
1. 최종 목적 (1~2문장)
2. 사업 목적 (구체적 변화)
3. 성과목표 (SMART 원칙 - 측정도구, 수치 목표치 포함)
4. 산출목표 (투입 규모, 횟수, 인원)

【주의】"향상", "증진" 등 방향만 제시하지 말고 반드시 수치 목표치(%)와
측정 도구명을 명시하세요.`,

  content: `사업 내용 섹션을 작성해 주세요.

다음 구조를 따르세요:
1. 프로그램 개요 (사업 구조 전체 흐름)
2. 대상자 모집 방법 및 선정 기준
3. 세부 프로그램 내용 (단계별 또는 회기별)
4. 전문인력 구성 및 역할
5. 협력기관 역할 분담 (있을 경우)

【주의】프로그램 제목만 나열하지 말고 각 내용을 구체적으로 서술하세요.`,

  schedule: `추진 일정 섹션을 작성해 주세요.

다음 구조를 따르세요:
1. 준비 단계 - 모집, 홍보, 오리엔테이션, 사전 성과 측정
2. 실행 단계 - 월별 프로그램 운영, 중간 모니터링
3. 마무리 단계 - 사후 성과 측정, 평가, 보고서 작성

월별 주요 활동을 표 형식으로 정리하고,
성과 측정(사전·중간·사후) 시점을 명확히 제시하세요.`,

  budget: `예산 계획 섹션을 작성해 주세요.

다음 구조를 따르세요:
1. 인건비 (담당자 운영비, 단가 기준 명시)
2. 직접비 (프로그램 운영비, 교재비, 홍보비 등)
3. 관리운영비 (교통비, 통신비 등)
4. 예비비 (총액의 10% 이내)
5. 합계 (신청금액과 일치)

【핵심】모든 항목에 산출근거(단가 × 수량 = 금액)를 반드시 포함하고,
인건비 단가 기준(생활임금 또는 호봉표)을 명시하세요.`,

  evaluation: `평가 계획 섹션을 작성해 주세요.

다음 구조를 따르세요:
1. 성과목표별 평가 지표 및 측정 도구 (척도명 명시)
2. 정량 평가 계획 (사전·중간·사후 측정 시점)
3. 정성 평가 계획 (관찰 기록, 면담, 소감문 등)
4. 데이터 수집·분석 담당자 및 방법
5. 평가 결과 활용 방안

【주의】"설문지 실시" 등 막연한 표현 대신 척도명과 측정 시점을 구체적으로 명시하세요.`,

  effects: `기대 효과 섹션을 작성해 주세요.

다음 3가지 차원에서 기술하세요:
1. 참여자 차원 - 수치화된 변화 기대 효과
2. 지역사회 차원 - 파급 효과, 유사 기관 확산 가능성
3. 기관 차원 - 전문성 강화, 레퍼런스 확보

마지막으로:
4. 지속 가능성 - 사업 종료 후 자체 운영, 연계 계획

【주의】"삶의 질이 향상될 것입니다" 등 모호한 표현 대신
구체적이고 수치화 가능한 기대 효과를 제시하세요.`,
};

function buildUserPrompt(
  section: SectionKey,
  formData: ProposalFormData,
  uploadedText: string,
  currentContent: string
): string {
  const sectionInstruction = SECTION_INSTRUCTIONS[section];
  const period =
    formData.startDate && formData.endDate
      ? `${formData.startDate} ~ ${formData.endDate}`
      : '미정';

  let prompt = `## 사업 기본 정보
- 수행기관: ${formData.agencyName || '미입력'}
- 사업명: ${formData.projectName || '미입력'}
- 사업 유형: ${formData.projectType}
- 사업 기간: ${period}
- 신청 금액: ${formData.budgetTotal ? formData.budgetTotal + '원' : '미입력'}
- 사업 대상: ${formData.target || '미입력'} ${formData.targetCount ? '(' + formData.targetCount + ')' : ''}
- 핵심 성과 지표: ${formData.keyOutcome || '미입력'}
- 사업 지역: ${formData.region || '미입력'}

## 작성 지침
${sectionInstruction}
`;

  if (uploadedText && uploadedText.trim()) {
    prompt += `\n## 참고 자료 (업로드된 사업 소개 자료)\n${uploadedText.slice(0, 3000)}\n`;
  }

  if (currentContent && currentContent.trim()) {
    prompt += `\n## 기존 작성 내용 (이를 바탕으로 개선해 주세요)\n${currentContent}\n`;
    prompt += '\n위 내용을 더 구체적이고 설득력 있게 개선해 주세요.';
  } else {
    prompt += '\n위 정보를 바탕으로 해당 섹션을 작성해 주세요.';
  }

  return prompt;
}

export async function POST(req: NextRequest) {
  try {
    const { section, formData, uploadedText, currentContent } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userPrompt = buildUserPrompt(section, formData, uploadedText, currentContent);

    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(new TextEncoder().encode(event.delta.text));
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('Generate API error:', error);
    return new Response(
      JSON.stringify({ error: '생성 중 오류가 발생했습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
