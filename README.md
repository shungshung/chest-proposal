# 배분사업 프로포절 작성기

사회복지공동모금회 배분사업 사업계획서 AI 작성 도우미 (Claude API 연동)

## 주요 기능

- 📋 **기본 정보 입력**: 기관명, 사업유형, 예산, 기간 등
- 📁 **자료 업로드**: PDF/DOCX/TXT 업로드 → 텍스트 자동 추출
- ✨ **AI 자동 작성**: Claude Sonnet API로 각 섹션별 맞춤 내용 생성 (스트리밍)
- 📖 **섹션별 가이드**: 공동모금회 심사 기준에 맞는 작성 가이드
- 👁️ **미리보기**: 완성된 사업계획서 미리보기 + 인쇄/PDF 저장
- ✅ **전문가 체크리스트**: 자주 지적되는 항목 자가 점검

## 기술 스택

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: Anthropic Claude API (스트리밍)
- **파일 처리**: pdf-parse, mammoth

## 로컬 개발

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.local.example .env.local
# .env.local 파일에 ANTHROPIC_API_KEY 입력

# 개발 서버 실행
npm run dev
```

http://localhost:3000 에서 확인

## Vercel 배포

1. GitHub에 푸시
2. [Vercel](https://vercel.com)에서 GitHub 저장소 연결
3. **Environment Variables** 설정:
   - `ANTHROPIC_API_KEY`: Anthropic 콘솔에서 발급한 API 키
   - `CLAUDE_MODEL` (선택): 사용할 모델 (기본값: `claude-sonnet-4-5-20250929`)
4. Deploy!

## 환경 변수

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | Anthropic API 키 | ✅ |
| `CLAUDE_MODEL` | 사용할 Claude 모델명 | ❌ |

## 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   ├── generate/route.ts   # Claude API 스트리밍
│   │   └── extract/route.ts    # 파일 텍스트 추출
│   ├── layout.tsx
│   ├── page.tsx                # 메인 UI
│   └── globals.css
└── lib/
    └── data.ts                 # 가이드 데이터, 타입 정의
```
