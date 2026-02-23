'use client';

import { useState, useRef, useCallback } from 'react';
import {
  ProposalFormData, Sections, SectionKey,
  SECTIONS, GUIDE_DATA, CHECKLIST_DATA, PROJECT_TYPES,
} from '@/lib/data';

// ─── Markdown Renderer ────────────────────────────────────────────────────────
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function MarkdownView({ text, compact = false }: { text: string; compact?: boolean }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listKey = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${listKey++}`} className={`${compact ? 'my-1' : 'my-2'} space-y-0.5`}>
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={i} className={`font-bold text-gray-900 border-b border-gray-200 pb-1 ${compact ? 'text-sm mt-4 mb-1.5' : 'text-base mt-5 mb-2'}`}>
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={i} className={`font-semibold text-gray-800 ${compact ? 'text-xs mt-2.5 mb-1' : 'text-sm mt-3 mb-1.5'}`}>
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(
        <li key={i} className={`flex gap-1.5 ${compact ? 'text-xs' : 'text-sm'} text-gray-700 leading-relaxed`}>
          <span className="text-gray-400 flex-shrink-0 mt-0.5">•</span>
          <span>{renderInline(line.slice(2))}</span>
        </li>
      );
    } else if (line.trim() === '') {
      flushList();
      if (elements.length > 0) {
        elements.push(<div key={`sp-${i}`} className={compact ? 'h-1.5' : 'h-2'} />);
      }
    } else {
      flushList();
      elements.push(
        <p key={i} className={`${compact ? 'text-xs' : 'text-sm'} text-gray-700 leading-relaxed`}>
          {renderInline(line)}
        </p>
      );
    }
  });

  flushList();
  return <div className="space-y-0.5">{elements}</div>;
}

// ─── 체크리스트 카테고리 → 섹션 매핑 ─────────────────────────────────────────
const CATEGORY_TO_SECTIONS: Record<number, SectionKey[]> = {
  0: ['necessity'],           // 사업 필요성
  1: ['objectives'],          // 목적 및 목표
  2: ['content'],             // 사업 내용
  3: ['budget'],              // 예산
  4: ['evaluation', 'effects'], // 평가 및 기대 효과
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'info' | 'upload' | SectionKey | 'preview' | 'checklist';

type CheckEntry = {
  checked: boolean;
  auto: boolean;      // AI가 자동 체크했는지
  reason?: string;    // AI가 제공한 근거
};

const DEFAULT_FORM: ProposalFormData = {
  agencyName: '', managerName: '', phone: '', email: '',
  projectName: '', projectType: '성과중심형', region: '',
  startDate: '', endDate: '', budgetTotal: '',
  target: '', targetCount: '', keyOutcome: '',
};

const DEFAULT_SECTIONS: Sections = {
  necessity: '', objectives: '', content: '',
  schedule: '', budget: '', evaluation: '', effects: '',
};

// ─── FormField (최상위 정의 - 한글 IME 보호) ──────────────────────────────────
function FormField({
  label, field, formData, onChange, placeholder, required, type = 'text',
}: {
  label: string; field: keyof ProposalFormData; formData: ProposalFormData;
  onChange: (k: keyof ProposalFormData, v: string) => void;
  placeholder: string; required?: boolean; type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={formData[field]}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder}
        className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 focus:bg-white transition placeholder:text-gray-300"
      />
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ activeTab, setActiveTab, filled }: {
  activeTab: Tab; setActiveTab: (t: Tab) => void; filled: Record<string, boolean>;
}) {
  const NavItem = ({ tabKey, icon, label }: { tabKey: Tab; icon: string; label: string }) => (
    <button
      onClick={() => setActiveTab(tabKey)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all text-left
        ${activeTab === tabKey
          ? 'bg-white/10 text-white font-medium'
          : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
    >
      <span className="text-base w-5 text-center opacity-80">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {filled[tabKey] && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />}
    </button>
  );

  const Group = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="mb-4">
      <p className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">{label}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );

  const filledCount = Object.values(filled).filter(Boolean).length;
  const total = SECTIONS.length + 2;

  return (
    <aside className="w-56 min-w-[224px] bg-zinc-950 flex flex-col overflow-hidden border-r border-zinc-900">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-zinc-900">
        <p className="text-white font-bold text-sm tracking-tight">배분사업 작성기</p>
        <p className="text-zinc-500 text-xs mt-0.5">사회복지공동모금회</p>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-3 border-b border-zinc-900">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] text-zinc-500">작성 진행</span>
          <span className="text-[10px] text-zinc-400 font-semibold">{filledCount}/{total}</span>
        </div>
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${(filledCount / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <Group label="기본 설정">
          <NavItem tabKey="info" icon="📋" label="기본 정보" />
          <NavItem tabKey="upload" icon="📁" label="자료 업로드" />
        </Group>
        <Group label="섹션 작성">
          {SECTIONS.map((s) => (
            <NavItem key={s.key} tabKey={s.key as Tab} icon={s.icon} label={s.label} />
          ))}
        </Group>
        <Group label="완료">
          <NavItem tabKey="preview" icon="👁️" label="미리보기 · 내보내기" />
          <NavItem tabKey="checklist" icon="✅" label="전문가 체크리스트" />
        </Group>
      </nav>
    </aside>
  );
}

// ─── Basic Info Form ──────────────────────────────────────────────────────────
function BasicInfoForm({ formData, setFormData }: {
  formData: ProposalFormData; setFormData: (d: ProposalFormData) => void;
}) {
  const upd = useCallback(
    (k: keyof ProposalFormData, v: string) => setFormData({ ...formData, [k]: v }),
    [formData, setFormData]
  );

  return (
    <div className="space-y-5">
      {/* 섹션 카드: 수행기관 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-800">🏛 수행기관 정보</h2>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <FormField label="기관명" field="agencyName" formData={formData} onChange={upd} placeholder="(사)행복복지재단" required />
          <FormField label="담당자명" field="managerName" formData={formData} onChange={upd} placeholder="홍길동" />
          <FormField label="연락처" field="phone" formData={formData} onChange={upd} placeholder="02-000-0000" />
          <FormField label="이메일" field="email" formData={formData} onChange={upd} placeholder="example@welfare.org" />
        </div>
      </div>

      {/* 사업 기본 정보 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-800">📝 사업 기본 정보</h2>
        </div>
        <div className="p-6 space-y-4">
          <FormField label="사업명" field="projectName" formData={formData} onChange={upd} required
            placeholder="예: 중장년 자존감 회복 프로그램 '마음그림갤러리' 운영사업" />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                사업 유형<span className="text-red-400 ml-0.5">*</span>
              </label>
              <select
                value={formData.projectType}
                onChange={(e) => upd('projectType', e.target.value as ProposalFormData['projectType'])}
                className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 focus:bg-white transition"
              >
                {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <FormField label="사업 지역" field="region" formData={formData} onChange={upd} placeholder="예: 서울특별시 마포구" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="사업 시작일" field="startDate" formData={formData} onChange={upd} placeholder="" type="date" />
            <FormField label="사업 종료일" field="endDate" formData={formData} onChange={upd} placeholder="" type="date" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="신청 금액 (원)" field="budgetTotal" formData={formData} onChange={upd} placeholder="10,000,000" required />
            <FormField label="사업 대상" field="target" formData={formData} onChange={upd} placeholder="50세 이상 중장년" />
            <FormField label="참여 인원" field="targetCount" formData={formData} onChange={upd} placeholder="20명" />
          </div>

          <FormField label="핵심 성과 지표" field="keyOutcome" formData={formData} onChange={upd}
            placeholder="예: RSES 자존감 척도 평균 15% 이상 향상" />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700">
        💡 기본 정보 입력 후 각 섹션에서 <strong>AI 자동 작성</strong> 버튼을 누르면 Claude가 맞춤형 내용을 생성합니다.
      </div>
    </div>
  );
}

// ─── Upload Section ───────────────────────────────────────────────────────────
function UploadSection({ uploadedText, setUploadedText }: {
  uploadedText: string; setUploadedText: (t: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setError('');
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError(`파일이 너무 큽니다. 최대 100MB까지 가능합니다. (현재: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      return;
    }
    setIsExtracting(true);
    try {
      let text = '';
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.toLowerCase().endsWith('.docx');
      const isTxt = file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt');

      if (isPdf) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pages: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pages.push(content.items.map((item: any) => ('str' in item ? item.str : '')).join(' '));
        }
        text = pages.join('\n');
      } else if (isDocx) {
        const arrayBuffer = await file.arrayBuffer();
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mammoth = require('mammoth/mammoth.browser.min.js');
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else if (isTxt) {
        text = await file.text();
      } else {
        setError('지원하지 않는 파일 형식입니다. PDF, DOCX, TXT만 가능합니다.');
        setIsExtracting(false);
        return;
      }

      if (!text.trim()) {
        setError('텍스트를 추출하지 못했습니다. 스캔된 이미지 PDF이거나 보호된 파일일 수 있습니다. 내용을 직접 붙여넣어 주세요.');
      } else {
        setUploadedText(text.trim());
      }
    } catch (err) {
      setError(`파일 처리 중 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    }
    setIsExtracting(false);
  }, [setUploadedText]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-800">📁 사업 소개 자료 업로드</h2>
          <p className="text-xs text-gray-400 mt-0.5">기존 소개서나 계획서를 올리면 AI가 내용을 참고해 더 정확한 프로포절을 작성합니다.</p>
        </div>
        <div className="p-6">
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
              ${isDragging ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
          >
            <div className="text-3xl mb-2">📄</div>
            <p className="text-sm font-medium text-gray-600">클릭하거나 파일을 드래그하여 업로드</p>
            <p className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT · 최대 100MB · 브라우저에서 직접 처리</p>
            {fileName && <p className="text-sm text-blue-600 font-medium mt-2">📎 {fileName}</p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-800">📝 추출된 텍스트 / 직접 입력</h2>
        </div>
        <div className="p-6">
          {isExtracting ? (
            <div className="flex items-center justify-center h-40 gap-2 text-gray-400 text-sm">
              <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              텍스트 추출 중...
            </div>
          ) : (
            <textarea
              value={uploadedText}
              onChange={(e) => setUploadedText(e.target.value)}
              placeholder="파일을 업로드하거나 여기에 사업 내용을 직접 붙여넣으세요.&#10;이 내용을 바탕으로 AI가 각 섹션의 프로포절을 작성합니다."
              className="w-full h-56 px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 resize-y focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 focus:bg-white transition leading-relaxed"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Section Writer ───────────────────────────────────────────────────────────
function SectionWriter({ sectionKey, value, onChange, uploadedText, formData, onChecklistRefresh }: {
  sectionKey: SectionKey; value: string; onChange: (v: string) => void;
  uploadedText: string; formData: ProposalFormData;
  onChecklistRefresh: () => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRef, setShowRef] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const guide = GUIDE_DATA[sectionKey];
  const section = SECTIONS.find((s) => s.key === sectionKey)!;

  const handleGenerate = async () => {
    setIsGenerating(true);
    onChange('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: sectionKey, formData, uploadedText, currentContent: value }),
      });
      if (!res.ok) {
        const err = await res.json();
        onChange(`오류: ${err.error || '생성 실패'}`);
        setIsGenerating(false);
        return;
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(chunk, { stream: true });
        onChange(accumulated);
      }
      // AI 작성 완료 후 체크리스트 자동 분석 트리거
      onChecklistRefresh();
    } catch {
      onChange('네트워크 오류가 발생했습니다. 다시 시도해 주세요.');
    }
    setIsGenerating(false);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* 에디터 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden p-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 flex flex-col overflow-hidden">
          {/* 상단 툴바 */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
            <div>
              <h2 className="text-sm font-bold text-gray-800">{section.icon} {section.label}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{value.length > 0 ? `${value.length}자 작성됨` : '아직 작성되지 않았습니다'}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* 편집/미리보기 토글 */}
              {value && (
                <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                  <button
                    onClick={() => setViewMode('edit')}
                    className={`px-3 py-1.5 transition ${viewMode === 'edit' ? 'bg-gray-900 text-white font-semibold' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    ✏️ 편집
                  </button>
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`px-3 py-1.5 transition ${viewMode === 'preview' ? 'bg-gray-900 text-white font-semibold' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    👁️ 미리보기
                  </button>
                </div>
              )}
              {uploadedText && (
                <button onClick={() => setShowRef(!showRef)}
                  className="text-xs px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
                  {showRef ? '▲ 참고 접기' : '▼ 참고자료'}
                </button>
              )}
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition
                  ${isGenerating ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-700'}`}
              >
                {isGenerating ? (
                  <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>작성 중...</>
                ) : <>✨ AI 자동 작성</>}
              </button>
            </div>
          </div>

          {/* 참고자료 패널 */}
          {showRef && uploadedText && (
            <div className="mx-5 mt-3 p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-500 max-h-32 overflow-y-auto leading-relaxed whitespace-pre-wrap flex-shrink-0">
              {uploadedText}
            </div>
          )}

          {/* 텍스트에리어 / 미리보기 */}
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            {viewMode === 'edit' || !value ? (
              <textarea
                value={value}
                onChange={(e) => { onChange(e.target.value); if (viewMode === 'preview' && !e.target.value) setViewMode('edit'); }}
                placeholder={`${section.label} 내용을 작성하세요.\n\n우측 가이드의 "예시 문구" 버튼으로 템플릿을 불러오거나, AI 자동 작성을 클릭하세요.`}
                className="w-full flex-1 px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 resize-none focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100 focus:bg-white transition leading-relaxed font-mono"
                style={{ minHeight: 0 }}
              />
            ) : (
              <div className="flex-1 overflow-y-auto px-4 py-3 border border-gray-200 rounded-xl bg-white">
                <MarkdownView text={value} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 가이드 패널 */}
      <aside className="w-68 min-w-[272px] bg-white border-l border-gray-100 overflow-y-auto flex-shrink-0">
        <div className="p-5">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-4">📖 작성 가이드</h3>

          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-600 mb-2">✅ 작성 포인트</p>
            <div className="space-y-1.5">
              {guide.points.map((p, i) => (
                <div key={i} className="text-xs text-gray-600 bg-blue-50 border-l-2 border-blue-300 px-2.5 py-2 rounded-r leading-relaxed">
                  {p}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <p className="text-xs font-semibold text-red-500 mb-2">⚠️ 자주 하는 실수</p>
            <div className="space-y-1.5">
              {guide.mistakes.map((m, i) => (
                <div key={i} className="text-xs text-red-600 bg-red-50 border-l-2 border-red-300 px-2.5 py-2 rounded-r leading-relaxed">
                  {m}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">📝 예시 문구</p>
            <div className="space-y-2">
              {guide.templates.map((t, i) => (
                <button key={i} onClick={() => onChange(value ? value + '\n\n' + t : t)}
                  className="w-full text-left p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-500 hover:bg-gray-100 hover:border-gray-200 transition">
                  💡 예시 {i + 1}
                  <span className="block text-gray-400 mt-0.5 truncate">{t.substring(0, 40)}...</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ─── Preview + Export ─────────────────────────────────────────────────────────
function Preview({ formData, sections }: { formData: ProposalFormData; sections: Sections }) {
  const [isExporting, setIsExporting] = useState(false);
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  const period = formData.startDate && formData.endDate ? `${formData.startDate} ~ ${formData.endDate}` : '미정';

  const handleExportDocx = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, sections }),
      });
      if (!res.ok) throw new Error('내보내기 실패');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formData.agencyName || '기관'}_사업계획서.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(`Word 내보내기 실패: ${e instanceof Error ? e.message : '오류'}`);
    }
    setIsExporting(false);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* 내보내기 버튼 그룹 */}
        <div className="flex flex-wrap gap-3 mb-6 no-print">
          <button onClick={handleExportDocx} disabled={isExporting}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition
              ${isExporting ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-700'}`}>
            {isExporting ? (
              <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>생성 중...</>
            ) : '📄 Word 문서(.docx) 저장'}
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
            🖨️ 인쇄 / PDF 저장
          </button>
          <div className="flex items-center text-xs text-gray-400 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            💡 HWP(한글)는 공식 SDK 미제공으로 지원이 어렵습니다. Word 파일을 한글에서 열어 사용하세요.
          </div>
        </div>

        {/* 문서 미리보기 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-3xl mx-auto p-14 print:shadow-none">
          <div className="text-center border-b-4 border-gray-800 pb-12 mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-widest">사 업 계 획 서</h1>
            <p className="text-sm text-gray-500 mb-10">사회복지공동모금회 배분사업 신청</p>
            <table className="w-full border-collapse text-sm">
              <tbody>
                {[
                  ['사  업  명', formData.projectName || '(미입력)'],
                  ['수 행 기 관', formData.agencyName || '(미입력)'],
                  ['사 업 유 형', formData.projectType],
                  ['사 업 기 간', period],
                  ['신 청 금 액', formData.budgetTotal ? formData.budgetTotal + '원' : '(미입력)'],
                  ['사 업 대 상', [formData.target, formData.targetCount].filter(Boolean).join(' ') || '(미입력)'],
                  ...(formData.keyOutcome ? [['핵심 성과목표', formData.keyOutcome]] : []),
                ].map(([k, v], i) => (
                  <tr key={i}>
                    <th className="bg-gray-900 text-white px-4 py-3 text-left w-1/3 font-medium text-sm">{k}</th>
                    <td className={`px-4 py-3 border border-gray-200 text-left text-sm ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-400 mt-6">{today}</p>
            <p className="text-sm font-bold text-gray-800 mt-1">{formData.agencyName}</p>
          </div>

          {SECTIONS.map((s) => sections[s.key] ? (
            <div key={s.key} className="mb-8">
              <div className="bg-gray-900 text-white font-bold text-sm px-4 py-2.5 rounded-lg mb-3">
                {s.icon} {s.label}
              </div>
              <div className="pl-2">
                <MarkdownView text={sections[s.key]} />
              </div>
            </div>
          ) : null)}
        </div>
      </div>
    </div>
  );
}

// ─── Checklist ────────────────────────────────────────────────────────────────
function Checklist({ checklist, setChecklist, isAnalyzing, improvingKeys, onImproveCategory, onImproveAll }: {
  checklist: Record<string, CheckEntry>;
  setChecklist: (c: Record<string, CheckEntry>) => void;
  isAnalyzing: boolean;
  improvingKeys: Set<SectionKey>;
  onImproveCategory: (ci: number) => void;
  onImproveAll: () => void;
}) {
  const total = CHECKLIST_DATA.reduce((a, c) => a + c.items.length, 0);
  const done = Object.values(checklist).filter((e) => e.checked).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // 전체적으로 보완이 필요한 자동 분석 미체크 항목이 있는지
  const hasAnyUncheckedAuto = CHECKLIST_DATA.some((cat, ci) =>
    cat.items.some((_, ii) => {
      const e = checklist[`${ci}_${ii}`];
      return e && !e.checked && e.auto;
    })
  );

  // 섹션 보완 진행 중인지 (CATEGORY_TO_SECTIONS 기준)
  const isAnyImproving = improvingKeys.size > 0;

  const toggle = (key: string) => {
    const cur = checklist[key];
    setChecklist({ ...checklist, [key]: { checked: !cur?.checked, auto: false, reason: cur?.reason } });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-2xl">
        {/* 점수판 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none"
                  stroke={pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="3" strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-800">{pct}%</span>
              </div>
            </div>
            <div>
              <p className="font-bold text-base text-gray-800">
                {pct >= 80 ? '🎉 제출 준비 완료!' : pct >= 60 ? '⚡ 거의 다 왔어요!' : '📝 작성을 계속하세요'}
              </p>
              <p className="text-sm text-gray-400 mt-0.5">{done} / {total} 항목 완료</p>
              {isAnalyzing && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-blue-500">
                  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  AI가 체크리스트를 분석 중...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI 전체 보완 배너 */}
        {hasAnyUncheckedAuto && (
          <div className="bg-blue-950 rounded-2xl p-4 mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-white text-sm font-semibold">✨ AI 자동 보완 가능</p>
              <p className="text-blue-300 text-xs mt-0.5">미충족 항목을 분석해 각 섹션 내용을 자동으로 보강합니다.</p>
            </div>
            <button
              onClick={onImproveAll}
              disabled={isAnyImproving || isAnalyzing}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white whitespace-nowrap transition flex-shrink-0
                ${isAnyImproving || isAnalyzing ? 'bg-blue-800 cursor-not-allowed opacity-60' : 'bg-blue-600 hover:bg-blue-500'}`}
            >
              {isAnyImproving ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>보완 중...</>
              ) : '🔧 전체 자동 보완'}
            </button>
          </div>
        )}

        {/* 범례 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 text-xs text-gray-600 space-y-1.5">
          <p className="font-semibold text-gray-700 mb-2">📌 체크리스트 안내</p>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-md bg-emerald-500 flex-shrink-0 inline-flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
            <span><strong className="text-emerald-700">충족</strong> — AI가 계획서 내용에서 해당 항목을 확인했습니다.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-md border-2 border-amber-400 flex-shrink-0" />
            <span><strong className="text-amber-700">보완 필요</strong> — 해당 항목이 부족하거나 누락되었습니다. AI 보완 버튼으로 자동 개선할 수 있습니다.</span>
          </div>
          <p className="text-gray-400 pt-1">항목을 직접 클릭해 수동으로 체크/해제할 수도 있습니다.</p>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-700 mb-5">
          ⚠️ 공동모금회 전문가 검토에서 자주 지적되는 항목입니다. 제출 전 반드시 점검하세요.
        </div>

        {CHECKLIST_DATA.map((cat, ci) => {
          const catDone = cat.items.filter((_, ii) => checklist[`${ci}_${ii}`]?.checked).length;
          // 이 카테고리에서 미충족 자동 항목이 있는지
          const catUncheckedAuto = cat.items.some((_, ii) => {
            const e = checklist[`${ci}_${ii}`];
            return e && !e.checked && e.auto;
          });
          // 이 카테고리 관련 섹션이 보완 중인지
          const catSections = CATEGORY_TO_SECTIONS[ci] ?? [];
          const catImproving = catSections.some((k) => improvingKeys.has(k));

          return (
            <div key={ci} className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-700">{cat.category}</span>
                <div className="flex items-center gap-2">
                  {catUncheckedAuto && (
                    <button
                      onClick={() => onImproveCategory(ci)}
                      disabled={catImproving || isAnyImproving || isAnalyzing}
                      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold transition
                        ${catImproving
                          ? 'bg-blue-100 text-blue-500 cursor-not-allowed'
                          : isAnyImproving || isAnalyzing
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'}`}
                    >
                      {catImproving ? (
                        <><svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>보완 중</>
                      ) : <>🔧 AI 보완</>}
                    </button>
                  )}
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                    {catDone}/{cat.items.length}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {cat.items.map((item, ii) => {
                  const key = `${ci}_${ii}`;
                  const entry = checklist[key];
                  const isChecked = entry?.checked ?? false;
                  const isAuto = entry?.auto ?? false;
                  const reason = entry?.reason;
                  return (
                    <div key={ii} onClick={() => toggle(key)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all
                        ${isChecked
                          ? 'border-emerald-200 bg-emerald-50'
                          : isAuto
                            ? 'border-amber-200 bg-amber-50 hover:border-amber-300'
                            : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all
                          ${isChecked ? 'bg-emerald-500 border-emerald-500' : isAuto ? 'border-amber-400' : 'border-gray-300'}`}>
                          {isChecked && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-relaxed ${isChecked ? 'text-emerald-800' : 'text-gray-700'}`}>
                            {item}
                          </p>
                          {/* AI 분석 결과 */}
                          {reason && (
                            <p className={`text-xs mt-1.5 leading-relaxed ${isChecked ? 'text-emerald-600' : 'text-amber-700'}`}>
                              🤖 {reason}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {isAuto && isChecked && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-medium">AI ✓</span>
                          )}
                          {isAuto && !isChecked && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">보완 필요</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [formData, setFormData] = useState<ProposalFormData>(DEFAULT_FORM);
  const [sections, setSections] = useState<Sections>(DEFAULT_SECTIONS);
  const [uploadedText, setUploadedText] = useState('');
  const [checklist, setChecklist] = useState<Record<string, CheckEntry>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [improvingKeys, setImprovingKeys] = useState<Set<SectionKey>>(new Set());

  const updateSection = (key: SectionKey, val: string) =>
    setSections((prev) => ({ ...prev, [key]: val }));

  // AI 체크리스트 자동 분석
  const refreshChecklist = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections, formData, checklistData: CHECKLIST_DATA }),
      });
      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        setChecklist((prev) => {
          const next = { ...prev };
          (data.results as Array<{ key: string; ok: boolean; why: string }>).forEach(({ key, ok, why }) => {
            next[key] = { checked: ok, auto: true, reason: why };
          });
          return next;
        });
      }
    } catch {
      // 분석 실패 시 조용히 무시
    }
    setIsAnalyzing(false);
  }, [sections, formData]);

  // ── AI 보완 생성 (체크리스트 미충족 항목 기반) ──────────────────────────────
  const improveWithHints = useCallback(async (categoryIndex: number | 'all') => {
    const categoriesToProcess: number[] =
      categoryIndex === 'all'
        ? Object.keys(CATEGORY_TO_SECTIONS).map(Number)
        : [categoryIndex];

    // 로컬에서 최신 섹션 내용 추적 (stale closure 방지)
    const updatedSections: Sections = { ...sections };

    for (const ci of categoriesToProcess) {
      const sectionKeys = CATEGORY_TO_SECTIONS[ci];
      if (!sectionKeys) continue;

      const cat = CHECKLIST_DATA[ci];
      // 미충족(auto) 항목의 텍스트를 보완 힌트로 수집
      const hints = cat.items
        .map((item, ii) => {
          const e = checklist[`${ci}_${ii}`];
          return (e && !e.checked && e.auto) ? item : null;
        })
        .filter(Boolean) as string[];

      if (hints.length === 0) continue;

      for (const sectionKey of sectionKeys) {
        setImprovingKeys((prev) => new Set(prev).add(sectionKey));
        try {
          const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              section: sectionKey,
              formData,
              uploadedText,
              currentContent: updatedSections[sectionKey], // 최신 내용 사용
              improvementHints: hints,
            }),
          });
          if (res.ok) {
            const reader = res.body!.getReader();
            const decoder = new TextDecoder();
            let accumulated = '';
            while (true) {
              const { done, value: chunk } = await reader.read();
              if (done) break;
              accumulated += decoder.decode(chunk, { stream: true });
              setSections((prev) => ({ ...prev, [sectionKey]: accumulated }));
            }
            updatedSections[sectionKey] = accumulated; // 로컬도 갱신
          }
        } catch {
          // 조용히 무시
        }
        setImprovingKeys((prev) => {
          const next = new Set(prev);
          next.delete(sectionKey);
          return next;
        });
      }
    }

    // ── 보완 완료 후 체크리스트 재분석 ──────────────────────────────────────
    // refreshChecklist()는 stale closure 문제가 있으므로 직접 최신 섹션으로 호출
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: updatedSections, formData, checklistData: CHECKLIST_DATA }),
      });
      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        setChecklist((prev) => {
          const next = { ...prev };
          (data.results as Array<{ key: string; ok: boolean; why: string }>).forEach(({ key, ok, why }) => {
            next[key] = { checked: ok, auto: true, reason: why };
          });
          return next;
        });
      }
    } catch {
      // 분석 실패 시 조용히 무시
    }
    setIsAnalyzing(false);
  }, [checklist, sections, formData, uploadedText]);

  const filled: Record<string, boolean> = {
    info: !!(formData.agencyName && formData.projectName),
    upload: !!uploadedText,
    ...Object.fromEntries(SECTIONS.map((s) => [s.key, sections[s.key].length > 50])),
    checklist: Object.values(checklist).filter((e) => e.checked).length >= 10,
  };

  const currentSection = SECTIONS.find((s) => s.key === activeTab);

  // 탭별 페이지 제목
  const pageTitles: Record<string, { title: string; desc: string }> = {
    info: { title: '기본 정보', desc: '수행기관 및 사업 정보를 입력하세요' },
    upload: { title: '자료 업로드', desc: '기존 사업 소개서나 계획서를 업로드하세요' },
    preview: { title: '미리보기 · 내보내기', desc: '작성된 사업계획서를 확인하고 Word 파일로 저장하세요' },
    checklist: { title: '전문가 체크리스트', desc: '제출 전 전문가 검토 기준으로 점검하세요' },
    ...Object.fromEntries(SECTIONS.map((s) => [s.key, { title: s.label, desc: `${s.label} 섹션을 작성하세요` }])),
  };
  const pageInfo = pageTitles[activeTab] ?? { title: '', desc: '' };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} filled={filled} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 상단 페이지 헤더 */}
        {!currentSection && (
          <div className="flex-shrink-0 bg-white border-b border-gray-100 px-7 py-4">
            <h1 className="text-base font-bold text-gray-900">{pageInfo.title}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{pageInfo.desc}</p>
          </div>
        )}

        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-hidden">
          {activeTab === 'info' && (
            <div className="h-full overflow-y-auto">
              <div className="p-6 max-w-2xl">
                <BasicInfoForm formData={formData} setFormData={setFormData} />
                <div className="mt-5">
                  <button onClick={() => setActiveTab('upload')}
                    className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition">
                    다음: 자료 업로드 →
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="h-full overflow-y-auto">
              <div className="p-6 max-w-2xl">
                <UploadSection uploadedText={uploadedText} setUploadedText={setUploadedText} />
                <div className="mt-5 flex gap-3">
                  <button onClick={() => setActiveTab('necessity')}
                    className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition">
                    다음: 섹션 작성 →
                  </button>
                  <button onClick={() => setActiveTab('info')}
                    className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                    ← 이전
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentSection && (
            <SectionWriter
              sectionKey={activeTab as SectionKey}
              value={sections[activeTab as SectionKey]}
              onChange={(v) => updateSection(activeTab as SectionKey, v)}
              uploadedText={uploadedText}
              formData={formData}
              onChecklistRefresh={refreshChecklist}
            />
          )}

          {activeTab === 'preview' && (
            <Preview formData={formData} sections={sections} />
          )}

          {activeTab === 'checklist' && (
            <Checklist
              checklist={checklist}
              setChecklist={setChecklist}
              isAnalyzing={isAnalyzing}
              improvingKeys={improvingKeys}
              onImproveCategory={(ci) => improveWithHints(ci)}
              onImproveAll={() => improveWithHints('all')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
