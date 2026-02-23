'use client';

import { useState, useRef, useCallback } from 'react';
import {
  ProposalFormData,
  Sections,
  SectionKey,
  SECTIONS,
  GUIDE_DATA,
  CHECKLIST_DATA,
  PROJECT_TYPES,
} from '@/lib/data';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'info' | 'upload' | SectionKey | 'preview' | 'checklist';

const DEFAULT_FORM: ProposalFormData = {
  agencyName: '',
  managerName: '',
  phone: '',
  email: '',
  projectName: '',
  projectType: '성과중심형',
  region: '',
  startDate: '',
  endDate: '',
  budgetTotal: '',
  target: '',
  targetCount: '',
  keyOutcome: '',
};

const DEFAULT_SECTIONS: Sections = {
  necessity: '',
  objectives: '',
  content: '',
  schedule: '',
  budget: '',
  evaluation: '',
  effects: '',
};

// ─── Form Field (모듈 최상위에 정의 - 한글 IME 버그 방지) ─────────────────────
function FormField({
  label,
  field,
  formData,
  onChange,
  placeholder,
  required,
  type = 'text',
}: {
  label: string;
  field: keyof ProposalFormData;
  formData: ProposalFormData;
  onChange: (k: keyof ProposalFormData, v: string) => void;
  placeholder: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-primary-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={formData[field]}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition"
      />
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
  activeTab,
  setActiveTab,
  filled,
}: {
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  filled: Record<string, boolean>;
}) {
  const navGroup = (label: string, items: { key: Tab; icon: string; label: string }[]) => (
    <div className="mb-2">
      <p className="px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-widest text-blue-300 opacity-70">
        {label}
      </p>
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => setActiveTab(item.key)}
          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-all
            border-l-[3px] ${
              activeTab === item.key
                ? 'bg-white/15 text-white border-blue-300 font-semibold'
                : 'text-white/70 border-transparent hover:bg-white/10 hover:text-white'
            }`}
        >
          <span className="text-base w-5 text-center">{item.icon}</span>
          <span className="flex-1 truncate">{item.label}</span>
          {filled[item.key] && (
            <span className="text-green-400 text-xs">✓</span>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <aside className="w-52 min-w-[208px] bg-primary-900 flex flex-col overflow-y-auto">
      {navGroup('기본 설정', [
        { key: 'info', icon: '📋', label: '기본 정보' },
        { key: 'upload', icon: '📁', label: '자료 업로드' },
      ])}
      {navGroup('섹션 작성', SECTIONS.map((s) => ({ key: s.key as Tab, icon: s.icon, label: s.label })))}
      {navGroup('완료', [
        { key: 'preview', icon: '👁️', label: '미리보기' },
        { key: 'checklist', icon: '✅', label: '전문가 체크리스트' },
      ])}
    </aside>
  );
}

// ─── Basic Info Form ──────────────────────────────────────────────────────────
function BasicInfoForm({
  formData,
  setFormData,
}: {
  formData: ProposalFormData;
  setFormData: (d: ProposalFormData) => void;
}) {
  const upd = useCallback(
    (k: keyof ProposalFormData, v: string) => setFormData({ ...formData, [k]: v }),
    [formData, setFormData]
  );

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-primary-900 mb-4 pb-2 border-b-2 border-blue-100">
          🏛 수행기관 정보
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="기관명" field="agencyName" formData={formData} onChange={upd} placeholder="(사)행복복지재단" required />
          <FormField label="담당자명" field="managerName" formData={formData} onChange={upd} placeholder="홍길동" />
          <FormField label="연락처" field="phone" formData={formData} onChange={upd} placeholder="02-000-0000" />
          <FormField label="이메일" field="email" formData={formData} onChange={upd} placeholder="example@welfare.org" />
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-primary-900 mb-4 pb-2 border-b-2 border-blue-100">
          📝 사업 기본 정보
        </h2>
        <div className="space-y-4">
          <FormField
            label="사업명"
            field="projectName"
            formData={formData}
            onChange={upd}
            required
            placeholder="예: 중장년 자존감 회복 프로그램 '마음그림갤러리' 운영사업"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-primary-700">
                사업 유형<span className="text-red-500 ml-0.5">*</span>
              </label>
              <select
                value={formData.projectType}
                onChange={(e) => upd('projectType', e.target.value as ProposalFormData['projectType'])}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition"
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
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

          <FormField
            label="핵심 성과 지표"
            field="keyOutcome"
            formData={formData}
            onChange={upd}
            placeholder="예: RSES 자존감 척도 평균 15% 이상 향상"
          />
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 text-sm text-blue-800">
        💡 기본 정보 입력 후 각 섹션에서 <strong>AI로 자동 작성</strong> 버튼을 누르면 Claude가 맞춤형 내용을 생성합니다.
      </div>
    </div>
  );
}

// ─── Upload Section ───────────────────────────────────────────────────────────
function UploadSection({
  uploadedText,
  setUploadedText,
}: {
  uploadedText: string;
  setUploadedText: (t: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setError('');

    // 클라이언트 사전 검증: 100MB 초과 시 즉시 에러
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError(`파일이 너무 큽니다. 최대 100MB까지 가능합니다. (현재: ${(file.size / 1024 / 1024).toFixed(1)}MB)\n큰 파일은 텍스트를 복사해 아래 입력창에 직접 붙여넣어 주세요.`);
      return;
    }

    setIsExtracting(true);
    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/extract', { method: 'POST', body: fd });
      // JSON 파싱 실패 대비 (서버가 HTML 500 에러를 반환하는 경우 등)
      let data: { error?: string; text?: string };
      try {
        data = await res.json();
      } catch {
        const raw = await res.text().catch(() => '');
        setError(`서버 오류 (${res.status}): ${raw.slice(0, 200) || '응답을 읽을 수 없습니다.'}`);
        setIsExtracting(false);
        return;
      }
      if (data.error) {
        setError(data.error);
      } else {
        setUploadedText(data.text ?? '');
      }
    } catch (err) {
      setError(`네트워크 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    }
    setIsExtracting(false);
  }, [setUploadedText]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-primary-900 mb-4 pb-2 border-b-2 border-blue-100">
          📁 사업 소개 자료 업로드
        </h2>
        <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-3 text-sm text-blue-700 mb-4">
          기존 사업 소개서, 계획서를 업로드하면 AI가 내용을 참고하여 더 맞춤화된 프로포절을 작성합니다.
        </div>
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
        >
          <div className="text-4xl mb-3">📄</div>
          <p className="text-sm text-gray-600 font-medium">파일을 클릭하거나 드래그하여 업로드</p>
          <p className="text-xs text-gray-400 mt-1">지원 형식: PDF, DOCX, TXT · 최대 100MB</p>
          {fileName && <p className="text-sm text-blue-600 font-semibold mt-2">📎 {fileName}</p>}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {error && <p className="text-red-500 text-sm mt-2">⚠️ {error}</p>}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-primary-900 mb-3 pb-2 border-b-2 border-blue-100">
          📝 추출된 텍스트 / 직접 입력
        </h2>
        {isExtracting ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm gap-2">
            <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
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
            className="w-full h-64 px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 resize-y focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition leading-relaxed"
          />
        )}
      </div>
    </div>
  );
}

// ─── Section Writer ───────────────────────────────────────────────────────────
function SectionWriter({
  sectionKey,
  value,
  onChange,
  uploadedText,
  formData,
}: {
  sectionKey: SectionKey;
  value: string;
  onChange: (v: string) => void;
  uploadedText: string;
  formData: ProposalFormData;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRef, setShowRef] = useState(false);
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
    } catch {
      onChange('네트워크 오류가 발생했습니다. 다시 시도해 주세요.');
    }

    setIsGenerating(false);
  };

  const insertTemplate = (tmpl: string) => {
    onChange(value ? value + '\n\n' + tmpl : tmpl);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Editor - 화면 전체 높이 활용 */}
      <div className="flex-1 p-5 flex flex-col overflow-hidden">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
          {/* 상단 툴바 */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-base font-bold text-primary-900">
              {section.icon} {section.label}
            </h2>
            <div className="flex gap-2">
              {uploadedText && (
                <button
                  onClick={() => setShowRef(!showRef)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                >
                  {showRef ? '▲ 참고자료 접기' : '▼ 참고자료 보기'}
                </button>
              )}
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition
                  ${isGenerating
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}`}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    AI 작성 중...
                  </>
                ) : (
                  <>✨ AI로 자동 작성</>
                )}
              </button>
            </div>
          </div>

          {/* 참고자료 패널 (접을 수 있음) */}
          {showRef && uploadedText && (
            <div className="mx-5 mt-3 mb-0 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 max-h-36 overflow-y-auto leading-relaxed whitespace-pre-wrap flex-shrink-0">
              {uploadedText}
            </div>
          )}

          {/* 텍스트에리어 - flex-1로 남은 공간 전부 차지 */}
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`${section.label} 내용을 작성하세요.\n\n우측 가이드의 "예시 문구 삽입" 버튼으로 템플릿을 불러오거나, AI 자동 작성 버튼을 클릭하세요.`}
              className={`w-full flex-1 px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 resize-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition leading-relaxed
                ${isGenerating ? 'cursor-blink' : ''}`}
              style={{ minHeight: 0 }}
            />
            <p className="text-right text-xs text-gray-400 mt-1.5 flex-shrink-0">{value.length}자</p>
          </div>
        </div>
      </div>

      {/* 가이드 패널 */}
      <aside className="w-72 min-w-[288px] bg-white border-l border-gray-100 overflow-y-auto p-5 flex-shrink-0">
        <h3 className="text-sm font-bold text-primary-900 mb-4 pb-2 border-b-2 border-blue-100">
          📖 작성 가이드
        </h3>

        <div className="mb-5">
          <p className="text-xs font-bold text-primary-700 mb-2 flex items-center gap-1">
            ✅ 작성 포인트
          </p>
          <div className="space-y-1.5">
            {guide.points.map((p, i) => (
              <div key={i} className="text-xs text-blue-800 bg-blue-50 border-l-2 border-blue-400 px-2.5 py-2 rounded-r leading-relaxed">
                • {p}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <p className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1">
            ⚠️ 자주 하는 실수
          </p>
          <div className="space-y-1.5">
            {guide.mistakes.map((m, i) => (
              <div key={i} className="text-xs text-red-700 bg-red-50 border-l-2 border-red-400 px-2.5 py-2 rounded-r leading-relaxed">
                ✗ {m}
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-700 mb-2">
            📝 예시 문구 삽입
          </p>
          <div className="space-y-2">
            {guide.templates.map((t, i) => (
              <button
                key={i}
                onClick={() => insertTemplate(t)}
                className="w-full text-left p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-blue-50 hover:border-blue-300 transition"
              >
                💡 예시 {i + 1} 불러오기
                <span className="block text-gray-400 mt-1 truncate">{t.substring(0, 40)}...</span>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

// ─── Preview ──────────────────────────────────────────────────────────────────
function Preview({ formData, sections }: { formData: ProposalFormData; sections: Sections }) {
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  const period =
    formData.startDate && formData.endDate
      ? `${formData.startDate} ~ ${formData.endDate}`
      : '미정';

  return (
    <div className="p-6">
      <div className="flex gap-3 mb-6 no-print">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition"
        >
          🖨️ 인쇄 / PDF 저장
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md max-w-3xl mx-auto p-16 print:shadow-none print:rounded-none">
        {/* Cover */}
        <div className="text-center border-b-4 border-primary-900 pb-12 mb-10">
          <h1 className="text-3xl font-bold text-primary-900 mb-2">사 업 계 획 서</h1>
          <p className="text-base text-primary-700 mb-10">사회복지공동모금회 배분사업 신청</p>
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
                  <th className="bg-primary-900 text-white px-4 py-3 text-left w-1/3 font-medium">{k}</th>
                  <td className={`px-4 py-3 border border-gray-200 text-left ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-sm text-gray-500 mt-8">{today}</p>
          <p className="text-base font-bold text-primary-900 mt-1">{formData.agencyName}</p>
        </div>

        {/* Sections */}
        {SECTIONS.map((s) =>
          sections[s.key] ? (
            <div key={s.key} className="mb-6">
              <div className="bg-primary-900 text-white font-bold text-sm px-4 py-2.5 rounded mb-3">
                {s.icon} {s.label}
              </div>
              <p className="text-sm leading-loose text-gray-700 whitespace-pre-wrap">{sections[s.key]}</p>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

// ─── Checklist ────────────────────────────────────────────────────────────────
function Checklist({
  checked,
  setChecked,
}: {
  checked: Record<string, boolean>;
  setChecked: (c: Record<string, boolean>) => void;
}) {
  const total = CHECKLIST_DATA.reduce((a, c) => a + c.items.length, 0);
  const done = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((done / total) * 100);
  const color = pct >= 80 ? '#1B5E20' : pct >= 60 ? '#E65100' : '#B71C1C';

  const toggle = (key: string) => setChecked({ ...checked, [key]: !checked[key] });

  return (
    <div className="p-6 max-w-2xl">
      {/* Score */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6 text-center">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl font-bold border-8"
          style={{ borderColor: color, color }}
        >
          {pct}%
        </div>
        <p className="font-bold text-base" style={{ color }}>
          {pct >= 80 ? '🎉 제출 준비 완료!' : pct >= 60 ? '⚡ 거의 다 왔어요!' : '📝 계속 작성해주세요'}
        </p>
        <p className="text-gray-400 text-sm mt-1">{done} / {total} 항목 완료</p>
      </div>

      <div className="bg-orange-50 border-l-4 border-orange-400 rounded-lg p-4 text-sm text-orange-800 mb-6">
        ⚠️ 공동모금회 전문가 검토에서 자주 지적되는 항목들입니다. 제출 전 반드시 점검하세요.
      </div>

      {CHECKLIST_DATA.map((cat, ci) => {
        const catDone = cat.items.filter((_, ii) => checked[`${ci}_${ii}`]).length;
        return (
          <div key={ci} className="mb-6">
            <div className="flex items-center justify-between bg-blue-50 px-4 py-2.5 rounded-lg mb-3">
              <span className="text-sm font-bold text-primary-700">{cat.category}</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                {catDone}/{cat.items.length}
              </span>
            </div>
            <div className="space-y-2">
              {cat.items.map((item, ii) => {
                const key = `${ci}_${ii}`;
                return (
                  <div
                    key={ii}
                    onClick={() => toggle(key)}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition
                      ${checked[key]
                        ? 'border-green-300 bg-green-50 text-green-800'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'}`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition
                      ${checked[key] ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                      {checked[key] && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>}
                    </div>
                    <span className="text-sm leading-relaxed">{item}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [formData, setFormData] = useState<ProposalFormData>(DEFAULT_FORM);
  const [sections, setSections] = useState<Sections>(DEFAULT_SECTIONS);
  const [uploadedText, setUploadedText] = useState('');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  const updateSection = (key: SectionKey, val: string) =>
    setSections((prev) => ({ ...prev, [key]: val }));

  const filled: Record<string, boolean> = {
    info: !!(formData.agencyName && formData.projectName),
    upload: !!uploadedText,
    ...Object.fromEntries(SECTIONS.map((s) => [s.key, sections[s.key].length > 50])),
  };
  const filledCount = Object.values(filled).filter(Boolean).length;
  const currentSection = SECTIONS.find((s) => s.key === activeTab);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-900 to-primary-500 text-white px-6 py-3.5 flex items-center gap-4 shadow-md z-10 flex-shrink-0">
        <div>
          <p className="text-lg font-bold leading-tight tracking-tight">🏛 배분사업 프로포절 작성기</p>
          <p className="text-xs opacity-75">사회복지공동모금회 배분사업 AI 작성 도우미</p>
        </div>
        <div className="ml-auto flex items-center gap-4 text-sm">
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs">
            작성 진행: {filledCount} / {SECTIONS.length + 2} 섹션
          </span>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} filled={filled} />

        {/* main: overflow-hidden으로 변경 → 각 탭이 자체적으로 스크롤 관리 */}
        <main className="flex-1 overflow-hidden bg-gray-50">

          {/* 기본 정보 탭 */}
          {activeTab === 'info' && (
            <div className="h-full overflow-y-auto">
              <div className="p-6 max-w-2xl">
                <BasicInfoForm formData={formData} setFormData={setFormData} />
                <div className="mt-5">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    다음: 자료 업로드 →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 자료 업로드 탭 */}
          {activeTab === 'upload' && (
            <div className="h-full overflow-y-auto">
              <div className="p-6 max-w-2xl">
                <UploadSection uploadedText={uploadedText} setUploadedText={setUploadedText} />
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => setActiveTab('necessity')}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    다음: 섹션 작성 시작 →
                  </button>
                  <button
                    onClick={() => setActiveTab('info')}
                    className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition"
                  >
                    ← 이전
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 섹션 작성 탭: h-full로 전체 높이 활용 */}
          {currentSection && (
            <SectionWriter
              sectionKey={activeTab as SectionKey}
              value={sections[activeTab as SectionKey]}
              onChange={(v) => updateSection(activeTab as SectionKey, v)}
              uploadedText={uploadedText}
              formData={formData}
            />
          )}

          {/* 미리보기 탭 */}
          {activeTab === 'preview' && (
            <div className="h-full overflow-y-auto">
              <Preview formData={formData} sections={sections} />
            </div>
          )}

          {/* 체크리스트 탭 */}
          {activeTab === 'checklist' && (
            <div className="h-full overflow-y-auto">
              <Checklist checked={checklist} setChecked={setChecklist} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
