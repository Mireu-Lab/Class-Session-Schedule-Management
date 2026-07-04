import React, { useState } from 'react';
import { 
  LayoutGrid, Tags, Share2, PlusCircle, Plus, Archive, MoreVertical, Mail, ChevronRight, CheckCircle, Menu, X 
} from 'lucide-react';
import { Session, Category } from '../types';

interface DashboardProps {
  sessions: Session[];
  categories: Category[];
  selectedFilterCategory: string;
  setSelectedFilterCategory: (category: string) => void;
  showArchived: boolean;
  toggleArchivedSessions: () => void;
  openCreateSessionModal: () => void;
  openCategorySettings: () => void;
  openSnsSettingsModal: () => void;
  openShareSettings: (id: number) => void;
  openKebabControl: (e: React.MouseEvent, id: number) => void;
  goToDetail: (id: number) => void;
  openShareSurveyLink: (id: number) => void;
}

export default function Dashboard({
  sessions,
  categories,
  selectedFilterCategory,
  setSelectedFilterCategory,
  showArchived,
  toggleArchivedSessions,
  openCreateSessionModal,
  openCategorySettings,
  openSnsSettingsModal,
  openShareSettings,
  openKebabControl,
  goToDetail,
  openShareSurveyLink
}: DashboardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <section id="view-admin-dashboard" className="absolute inset-0 flex flex-col bg-slate-50 overflow-hidden">
      {/* Drawer Overlay Backdrop */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Slide-over Drawer Menu */}
      <aside 
        className={`fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 p-5 shadow-2xl z-50 flex flex-col justify-between transform transition-transform duration-300 ease-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">대시보드 메뉴</h3>
                <p className="text-[10px] text-slate-400 font-semibold">설정 및 관리 기능</p>
              </div>
            </div>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => {
                setSelectedFilterCategory('ALL');
                setIsMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 text-xs font-bold rounded-xl transition ${
                selectedFilterCategory === 'ALL'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>세션 대시보드 홈 (전체)</span>
            </button>
            <button
              onClick={() => {
                openCategorySettings();
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-3 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-50 transition"
            >
              <Tags className="w-4 h-4 text-slate-400" />
              <span>카테고리 태그 관리</span>
            </button>
            <button
              onClick={() => {
                openSnsSettingsModal();
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-3 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-50 transition"
            >
              <Share2 className="w-4 h-4 text-indigo-500" />
              <span>관리자 SNS 연동 설정</span>
            </button>
            
            <hr className="my-4 border-slate-100" />

            <button
              onClick={() => {
                openCreateSessionModal();
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-3 text-xs font-bold rounded-xl text-emerald-600 bg-emerald-50 hover:bg-emerald-100/60 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>새 일정 세션 생성</span>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-medium text-center">Scheduler Premium v2.2</p>
        </div>
      </aside>

      {/* Main Content (Wide Layout centering the sessions grid) */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <div className="flex items-center gap-3">
            {/* Hamburger Button */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 shadow-sm transition flex items-center justify-center shrink-0"
              title="대시보드 메뉴 열기"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">정기 일정 세션 제어판</h2>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">최적 시간 자동 추천 및 타임슬롯 확정 모드 활성화됨</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={openCreateSessionModal}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex justify-center items-center gap-1.5 shadow-sm hover:shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>새 일정 생성</span>
            </button>
            <button
              onClick={toggleArchivedSessions}
              className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold flex justify-center items-center gap-1.5 shadow-sm transition"
            >
              <Archive className="w-4 h-4 text-slate-400" />
              <span>{showArchived ? '보관 가리기' : '보관 세션 보기'}</span>
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-5 flex flex-wrap gap-1.5" id="category-filter-chips">
          <button
            onClick={() => setSelectedFilterCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
              selectedFilterCategory === 'ALL'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            전체 세션
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedFilterCategory(cat.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition ${
                selectedFilterCategory === cat.name
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${cat.color}`}></span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Session Card Grid */}
        <div id="session-card-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sessions
            .filter(s => !s.is_deleted && (showArchived || !s.archived) && (selectedFilterCategory === 'ALL' || s.category === selectedFilterCategory))
            .map((s) => {
              const submitted = s.guests.filter(g => g.submitted).length;
              const total = s.guests.length;
              const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;

              const statusBadge = s.status === '확정' ? (
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>확정 완료</span>
                </span>
              ) : (
                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                  조율 중
                </span>
              );

              return (
                <div
                  key={s.id}
                  className={`bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md flex flex-col justify-between transition-all duration-200 ${
                    s.archived ? 'opacity-65 grayscale-[20%]' : ''
                  }`}
                >
                  <div>
                    <div
                      className={`h-28 ${s.color} p-4 text-white flex flex-col justify-between relative cursor-pointer`}
                      onClick={() => goToDetail(s.id)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded backdrop-blur-sm">
                          {s.category}
                        </span>
                        {statusBadge}
                      </div>
                      <div className="flex justify-between items-end gap-2">
                        <h3 className="font-bold text-sm sm:text-base truncate flex-1">{s.title}</h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openKebabControl(e, s.id);
                          }}
                          className="p-1.5 hover:bg-white/20 rounded-lg transition shrink-0"
                          title="설정"
                        >
                          <MoreVertical className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                    <div
                      className="p-4 space-y-3.5 text-xs text-slate-500 font-semibold cursor-pointer"
                      onClick={() => goToDetail(s.id)}
                    >
                      <div className="flex justify-between">
                        <span className="text-slate-400">조율 기간</span>
                        <span className="text-slate-800">{s.startDate} ~ {s.endDate}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">참여 수집율</span>
                        <span className="text-slate-800 font-bold">{submitted} / {total || '자유 수집'}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex justify-between text-xs font-bold">
                    <button
                      onClick={() => openShareSettings(s.id)}
                      className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition"
                    >
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>메일 권한</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openShareSurveyLink(s.id);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition"
                      title="설문지 참여 링크 복사 및 공유"
                    >
                      <Share2 className="w-4 h-4 text-indigo-500" />
                      <span>설문 링크</span>
                    </button>
                    <button
                      onClick={() => goToDetail(s.id)}
                      className="text-slate-600 hover:text-slate-800 transition flex items-center gap-1"
                    >
                      <span>상세 분석</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}
