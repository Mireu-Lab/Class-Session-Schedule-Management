import React from 'react';
import { X, Trash2, Edit3, Archive, AlertOctagon, Share2, Mail, CheckCircle, Settings, Plus, Tags, Copy, ExternalLink, QrCode, ChevronRight } from 'lucide-react';
import { Category, SnsAccount, Session } from '../types';

// ================= 1. Session creation / edit modal =================
interface SessionModalProps {
  visible: boolean;
  title: string;
  setTitle: (t: string) => void;
  category: string;
  setCategory: (c: string) => void;
  interval: number;
  setInterval: (i: number) => void;
  startDate: string;
  setStartDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
  guestMode: 'unspecified' | 'specified';
  setGuestMode: (m: 'unspecified' | 'specified') => void;
  guestsText: string;
  setGuestsText: (t: string) => void;
  categories: Category[];
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  editMode: boolean;
}

export function SessionModal({
  visible,
  title,
  setTitle,
  category,
  setCategory,
  interval,
  setInterval,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  guestMode,
  setGuestMode,
  guestsText,
  setGuestsText,
  categories,
  onSave,
  onCancel,
  editMode
}: SessionModalProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-slate-900">{editMode ? '세션 일정 속성 수정' : '새 세션 개설'}</h3>
          <button onClick={onCancel} className="text-slate-400 p-1 hover:bg-slate-50 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={onSave} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1">세션 이름</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">종료일</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">-- 선택 --</option>
                {categories.filter(c => !c.archived).map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">타임 슬롯 간격</label>
              <select
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                required
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value={30}>30분 단위</option>
                <option value={60}>60분 단위</option>
                <option value={120}>120분 단위</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1">게스트 지정 옵션</label>
            <select
              value={guestMode}
              onChange={(e) => setGuestMode(e.target.value as 'unspecified' | 'specified')}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            >
              <option value="unspecified">비지정 (실명 자율)</option>
              <option value="specified">지정 (아래 명단으로 제한)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1">게스트 명단 (쉼표 구분)</label>
            <input
              type="text"
              value={guestsText}
              onChange={(e) => setGuestsText(e.target.value)}
              placeholder="예: 홍길동, 김철수, 이영희"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition hover:bg-slate-200"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-xs transition hover:bg-indigo-700"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ================= 2. Category tag management modal =================
interface CategoryModalProps {
  visible: boolean;
  categories: Category[];
  newCatName: string;
  setCatName: (n: string) => void;
  newCatColor: string;
  setCatColor: (c: string) => void;
  onSave: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
  editingId: string | null;
  onReset: () => void;
  sessionsCountByCat: Record<string, number>;
}

export function CategoryModal({
  visible,
  categories,
  newCatName,
  setCatName,
  newCatColor,
  setCatColor,
  onSave,
  onEdit,
  onDelete,
  onCancel,
  editingId,
  onReset,
  sessionsCountByCat
}: CategoryModalProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-3 shrink-0">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Tags className="w-4 h-4 text-indigo-600" />
            <span>카테고리 관리</span>
          </h3>
          <button onClick={onCancel} className="text-slate-400 p-1 hover:bg-slate-50 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3 shrink-0">
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="카테고리 명칭"
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold"
            />
            <select
              value={newCatColor}
              onChange={(e) => setCatColor(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold"
            >
              <option value="bg-blue-600">Blue (기본)</option>
              <option value="bg-indigo-600">Indigo</option>
              <option value="bg-emerald-500">Emerald</option>
              <option value="bg-slate-700">Slate</option>
              <option value="bg-rose-500">Rose</option>
              <option value="bg-amber-500">Amber</option>
            </select>
          </div>
          <div className="flex gap-2 mt-2">
            {editingId && (
              <button
                type="button"
                onClick={onReset}
                className="flex-1 bg-slate-200 text-slate-700 font-bold py-1.5 rounded-lg text-[10px] transition hover:bg-slate-300"
              >
                취소
              </button>
            )}
            <button
              onClick={onSave}
              className="flex-1 bg-indigo-600 text-white font-bold py-1.5 rounded-lg text-[10px] transition hover:bg-indigo-700"
            >
              저장
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div id="category-list-box" className="space-y-1.5">
            {categories.map(cat => {
              const count = sessionsCountByCat[cat.name] || 0;
              return (
                <div
                  key={cat.id}
                  className={`flex justify-between items-center p-2.5 rounded-xl border ${
                    cat.archived ? 'bg-slate-100 opacity-60' : 'bg-white'
                  } text-[11px] border-slate-200 shadow-sm`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${cat.color}`}></span>
                    <span className="font-bold text-slate-700">
                      {cat.name} (세션: {count}개)
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onEdit(cat.id)}
                      className="p-1 hover:bg-indigo-50 rounded text-slate-400 hover:text-indigo-600 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(cat.id)}
                      className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ================= 3. Admin SNS integration settings modal =================
interface SnsModalProps {
  visible: boolean;
  snsAccounts: SnsAccount[];
  onToggleLink: (idx: number) => void;
  onCancel: () => void;
}

export function SnsModal({ visible, snsAccounts, onToggleLink, onCancel }: SnsModalProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-3.5">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-indigo-600" />
            <span>관리자 SNS 연동 설정</span>
          </h3>
          <button onClick={onCancel} className="text-slate-400 p-1 hover:bg-slate-50 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {snsAccounts.map((acc, idx) => (
            <div key={acc.provider} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    acc.linked ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'
                  }`}
                ></span>
                <div>
                  <p className="text-xs font-bold text-slate-800">{acc.provider} 계정</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{acc.email}</p>
                </div>
              </div>
              <button
                onClick={() => onToggleLink(idx)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition ${
                  acc.linked ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'
                }`}
              >
                {acc.linked ? '연동해제' : '연동등록'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ================= 4. Kebab session action modal =================
interface KebabModalProps {
  visible: boolean;
  title: string;
  onAction: (action: 'edit' | 'archive' | 'delete') => void;
  onCancel: () => void;
}

export function KebabModal({ visible, title, onAction, onCancel }: KebabModalProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-slate-900 truncate pr-4">{title} 제어</h3>
          <button onClick={onCancel} className="text-slate-400 p-1 transition hover:bg-slate-50 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-1">
          <button
            onClick={() => onAction('edit')}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl transition"
          >
            <Edit3 className="w-4 h-4 text-slate-500" />
            <span>속성 및 일정 수정</span>
          </button>
          <button
            onClick={() => onAction('archive')}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl transition"
          >
            <Archive className="w-4 h-4 text-slate-500" />
            <span>보관 처리 (숨김)</span>
          </button>
          <button
            onClick={() => onAction('delete')}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 text-xs font-bold text-red-600 rounded-xl transition"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            <span>영구 삭제 (Deep Delete)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ================= 5. Deep Delete vs Soft Delete modal =================
interface DeleteConfirmModalProps {
  visible: boolean;
  onDeleteOption: (type: 'soft' | 'deep') => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({ visible, onDeleteOption, onCancel }: DeleteConfirmModalProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-slate-100 text-center">
        <div className="mx-auto w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-3">
          <AlertOctagon className="w-5 h-5" />
        </div>
        <h3 className="text-base font-bold text-slate-900">세션 삭제 방법 선택</h3>
        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
          해당 일정을 즉시 비공개(보관함 이동) 처리하거나 데이터베이스에서 물리적으로 영구 파괴할 수 있습니다.
        </p>
        <div className="space-y-2 mt-4">
          <button
            onClick={() => onDeleteOption('soft')}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Archive className="w-4 h-4" />
            <span>소프트 삭제 (Archive 보관)</span>
          </button>
          <button
            onClick={() => onDeleteOption('deep')}
            className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md"
          >
            <Trash2 className="w-4 h-4" />
            <span>Deep Delete (영구 물리 삭제)</span>
          </button>
          <button onClick={onCancel} className="w-full text-slate-400 hover:text-slate-600 text-xs py-1.5 font-semibold transition">
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

// ================= 6. Share and Mail authorization modal =================
interface ShareModalProps {
  visible: boolean;
  adminEmailsText: string;
  setAdminEmailsText: (t: string) => void;
  viewerEmailsText: string;
  setViewerEmailsText: (t: string) => void;
  cascadeCategory: boolean;
  setCascadeCategory: (c: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ShareModal({
  visible,
  adminEmailsText,
  setAdminEmailsText,
  viewerEmailsText,
  setViewerEmailsText,
  cascadeCategory,
  setCascadeCategory,
  onSave,
  onCancel
}: ShareModalProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-indigo-600" />
            <span>공유 및 메일 권한 설정</span>
          </h3>
          <button onClick={onCancel} className="text-slate-400 p-1 hover:bg-slate-50 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">세션 관리자 할당 메일 (쉼표 구분)</label>
            <input
              type="text"
              value={adminEmailsText}
              onChange={(e) => setAdminEmailsText(e.target.value)}
              placeholder="admin1@co.com, admin2@co.com"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">보기 권한 공유 대상 메일 (쉼표 구분)</label>
            <input
              type="text"
              value={viewerEmailsText}
              onChange={(e) => setViewerEmailsText(e.target.value)}
              placeholder="viewer1@co.com, viewer2@co.com"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="bg-indigo-50 p-3 rounded-lg text-[10px] text-indigo-800 font-semibold space-y-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={cascadeCategory}
                onChange={(e) => setCascadeCategory(e.target.checked)}
                className="rounded border-slate-300"
              />
              이 카테고리 내 모든 세션에 일괄 권한 적용
            </label>
          </div>
          <button onClick={onSave} className="w-full bg-indigo-600 hover:bg-indigo-700 transition text-white font-bold py-2.5 rounded-xl text-xs">
            권한 저장 및 이메일 발송
          </button>
        </div>
      </div>
    </div>
  );
}

// ================= 7. Guest final review before submission modal =================
interface ConfirmModalProps {
  visible: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ visible, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-5 w-full max-w-xs shadow-2xl text-center">
        <div className="mx-auto w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
          <CheckCircle className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">최종 일정 제출 검토</h3>
        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: message }}></p>
        <div className="flex gap-2 pt-4">
          <button
            onClick={onCancel}
            className="flex-1 bg-slate-100 text-slate-700 font-bold py-2 rounded-xl text-xs transition hover:bg-slate-200"
          >
            수정
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs transition hover:bg-emerald-700"
          >
            확정
          </button>
        </div>
      </div>
    </div>
  );
}

// ================= 8. Share Survey Link modal =================
interface ShareLinkModalProps {
  visible: boolean;
  session: Session | null;
  onCancel: () => void;
  showToast: (msg: string, icon?: string) => void;
  onDirectGoToSurvey?: (sessionId: number) => void;
}

export function ShareLinkModal({ visible, session, onCancel, showToast, onDirectGoToSurvey }: ShareLinkModalProps) {
  if (!visible || !session) return null;

  const url = `${window.location.origin}${window.location.pathname}?session=${session.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      showToast('설문 공유 링크가 클립보드에 성공적으로 복사되었습니다.', 'CheckCircle');
    }).catch(() => {
      showToast('링크 복사에 실패했습니다.', 'X');
    });
  };

  const handleOpenLink = () => {
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-indigo-600" />
            <span>설문지 참여 링크 배포</span>
          </h3>
          <button onClick={onCancel} className="text-slate-400 p-1 hover:bg-slate-50 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* 설문 페이지 바로 가기 단축 버튼 (앱 내부 네비게이션) */}
          {onDirectGoToSurvey && (
            <div 
              onClick={() => {
                onDirectGoToSurvey(session.id);
                onCancel();
              }}
              className="group cursor-pointer bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white p-3.5 rounded-2xl border border-indigo-400 shadow-md transition-all duration-300 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 text-white rounded-xl">
                  <ExternalLink className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h4 className="text-[9px] font-extrabold text-indigo-100 tracking-wider">이동 시뮬레이션</h4>
                  <p className="text-xs font-bold text-white">설문 페이지 열기</p>
                </div>
              </div>
              <div className="p-1 bg-white/20 text-white rounded-lg group-hover:translate-x-1 transition-transform">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          )}

          <div className="bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100 text-center">
            <p className="text-[10px] text-indigo-800 font-extrabold mb-1">참여자 스케줄 수집 링크</p>
            <p className="text-xs text-slate-800 font-extrabold truncate max-w-full mb-2 bg-white px-2.5 py-1.5 rounded-xl border border-indigo-200 select-all font-mono">
              {url}
            </p>
            <div className="flex gap-1.5 justify-center">
              <button
                onClick={handleCopy}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>링크 복사</span>
              </button>
              <button
                onClick={handleOpenLink}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>설문페이지 열기</span>
              </button>
            </div>
          </div>

          {/* Simulated QR Code representing advanced deployment options */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="bg-white p-1.5 border border-slate-200 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              <QrCode className="w-12 h-12 text-slate-800" />
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-slate-800 mb-0.5">QR 코드 모바일 배포</h4>
              <p className="text-[9px] text-slate-400 leading-normal">
                강의실 앞 스크린이나 안내서에 이 QR 코드를 인쇄하여 게스트들의 참여를 즉시 유도하세요.
              </p>
            </div>
          </div>

          <div className="text-[9px] text-slate-400 font-semibold space-y-1 bg-slate-50/40 p-3 rounded-xl border border-slate-100">
            <p className="text-slate-600 font-bold">💡 알아두기:</p>
            <ul className="list-disc pl-3.5 space-y-0.5">
              <li>참여자들은 로그인이 없어도 실명 입력 후 바로 응답할 수 있습니다.</li>
              <li>중복 제출 방지 및 재수정 허용 옵션이 실시간 적용됩니다.</li>
            </ul>
          </div>

          <button
            onClick={onCancel}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
