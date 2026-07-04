import React, { useState } from 'react';
import { 
  ArrowLeft, Clock, Zap, FileText, FileSpreadsheet, Cloud, FileDown, Image as ImageIcon, CheckCircle, Info, Menu, X, Settings, Users, Download, Share2
} from 'lucide-react';
import { Session } from '../types';
import { getSessionDatesForWeek } from '../utils/date';

interface DetailProps {
  session: Session;
  currentActiveWeek: number;
  setCurrentActiveWeek: (week: number) => void;
  selectedAnalysisView: 'heatmap' | 'individual';
  setSelectedAnalysisView: (view: 'heatmap' | 'individual') => void;
  onBackToDashboard: () => void;
  onUpdateSessionSettings: (expiry: string, preventDup: boolean, allowMutation: boolean) => void;
  onExport: (type: 'CSV' | 'XLSX' | 'Sheets' | 'PDF' | 'PNG') => void;
  onConfirmTimeslot: (slotId: string) => void;
  onTriggerReminder: (name: string) => void;
  onShareSurveyLink: (id: number) => void;
}

export default function Detail({
  session,
  currentActiveWeek,
  setCurrentActiveWeek,
  selectedAnalysisView,
  setSelectedAnalysisView,
  onBackToDashboard,
  onUpdateSessionSettings,
  onExport,
  onConfirmTimeslot,
  onTriggerReminder,
  onShareSurveyLink
}: DetailProps) {
  const [expiry, setExpiry] = useState(session.expiry);
  const [preventDup, setPreventDup] = useState(session.preventDuplicate);
  const [allowMutation, setAllowMutation] = useState(session.allowGuestMutation);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Sync state if session changes
  React.useEffect(() => {
    setExpiry(session.expiry);
    setPreventDup(session.preventDuplicate);
    setAllowMutation(session.allowGuestMutation);
  }, [session]);

  const handleRecommendClick = (slot: string) => {
    const [weekDayPrefix, day, time] = slot.split('-');
    const weekNum = parseInt(weekDayPrefix.replace('W', ''), 10);
    if (!isNaN(weekNum) && session.duration === '4weeks') {
      setCurrentActiveWeek(weekNum);
    }
    
    // Smooth scroll and highlight the matched slot cell
    setTimeout(() => {
      const el = document.getElementById(`admin-slot-${slot}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        // Flash a nice highlight
        el.classList.add('bg-amber-100', 'scale-105', 'z-10', 'ring-2', 'ring-amber-400');
        setTimeout(() => {
          el.classList.remove('bg-amber-100', 'scale-105', 'z-10', 'ring-2', 'ring-amber-400');
        }, 2000);
      }
    }, 150);
  };

  const daysEng = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daysKor = ["일", "월", "화", "수", "목", "금", "토"];

  const activeDates = getSessionDatesForWeek(session.startDate, session.endDate, currentActiveWeek);

  // Helper to generate dynamic time slots based on interval (30, 60, 120 minutes)
  const getTimeslots = (interval: number) => {
    const slots: string[] = [];
    // From 09:00 to 22:00 for optimal scheduling
    const startHour = 9;
    const endHour = 22;
    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += interval) {
        slots.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
      }
    }
    return slots;
  };

  const timeslots = getTimeslots(session.time_interval || 60);

  // Calculate overlap scores for AI recommendations
  const getOptimalSlots = () => {
    const scores: Record<string, number> = {};
    session.guests.forEach(g => {
      if (g.submitted) {
        Object.keys(g.schedule).forEach(k => {
          if (g.schedule[k]) {
            scores[k] = (scores[k] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  };

  const optimalSlots = getOptimalSlots();
  const submittedCount = session.guests.filter(g => g.submitted).length;
  const totalCount = session.guests.length;
  const respondPercent = totalCount > 0 ? (submittedCount / totalCount) * 100 : 0;

  return (
    <section id="view-admin-detail" className="absolute inset-0 flex flex-col lg:flex-row bg-slate-50 overflow-hidden">
      {/* Sliding Drawer Backdrop */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-200 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Slide-over Management Menu Drawer (Focuses on session management) - Always visible on desktop (lg), slide-over drawer on tablet/mobile */}
      <aside 
        className={`fixed inset-y-0 left-0 lg:static lg:inset-auto w-80 sm:w-96 lg:w-80 shrink-0 bg-white border-r border-slate-200 p-5 shadow-2xl lg:shadow-none z-50 lg:z-0 flex flex-col justify-between transform lg:transform-none transition-transform duration-300 ease-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar space-y-5">
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">세션 상세 관리 메뉴</h3>
                <p className="text-[10px] text-indigo-600 font-bold">오버랩 조율 통합 제어</p>
              </div>
            </div>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition lg:hidden"
              title="메뉴 닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Session Summary Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/65">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">선택된 일정 세션</h4>
            <h2 className="text-sm font-extrabold text-slate-900 leading-snug">{session.title}</h2>
            <div className="flex gap-1.5 mt-2 flex-wrap mb-3.5">
              <span className="inline-block bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                {session.category}
              </span>
              <span className="inline-block bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                {session.time_interval}분 단위
              </span>
            </div>
            <button
              onClick={() => {
                onShareSurveyLink(session.id);
                setIsMenuOpen(false);
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-[0.98]"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-200" />
              <span>설문 참여 링크 복사 및 공유</span>
            </button>
          </div>

          {/* 1. 최적 시간 자동 추천 (AI) */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>1. 최적 시간 자동 추천 (AI)</span>
            </h3>
            <div className="space-y-1.5">
              {optimalSlots.length === 0 ? (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-400 text-center">
                  수집된 일정이 없습니다.
                </div>
              ) : (
                optimalSlots.map(([slot, count], idx) => {
                  const [weekDayPrefix, day, time] = slot.split('-');
                  const weekNum = weekDayPrefix.replace('W', '');
                  const dayIndex = daysEng.indexOf(day);
                  const displayDay = dayIndex !== -1 ? daysKor[dayIndex] : day;
                  const displayWeek = session.duration === '4weeks' ? `${weekNum}주차 ` : '';
                  const cleanSlot = `${displayWeek}${displayDay}요일 ${time}`;

                  const isConfirmed = session.status === '확정' && session.confirmedSlot === slot;

                  return (
                    <div
                      key={slot}
                      onClick={() => {
                        handleRecommendClick(slot);
                        setIsMenuOpen(false); // Close menu to focus on calendar
                      }}
                      title="클릭하면 캘린더에서 이 시간대로 이동하고 강조 표시합니다"
                      className="flex items-center justify-between bg-amber-50/50 hover:bg-amber-50 px-3 py-2.5 rounded-xl border border-amber-100 text-[10px] font-bold text-slate-800 cursor-pointer transition-all duration-200 active:scale-[0.98] hover:shadow-sm"
                    >
                      <div className="flex items-center gap-1.5 select-none">
                        <span>👑 {idx + 1}위: {cleanSlot}</span>
                        <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[8px] font-extrabold">
                          {count}명 가능
                        </span>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        {isConfirmed ? (
                          <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[8px] font-bold">
                            확정됨
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              onConfirmTimeslot(slot);
                              setIsMenuOpen(false);
                            }}
                            className="bg-white border border-amber-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 text-amber-700 transition px-2 py-0.5 rounded text-[8px] font-bold shadow-sm cursor-pointer"
                          >
                            확정하기
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 2. 마감 시한 및 정책 설정 */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>2. 마감 시한 및 정책 설정</span>
            </h3>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">설문 수집 마감 시한</label>
                <input
                  type="datetime-local"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-700"
                />
              </div>
              <div className="space-y-2 text-[10px] font-extrabold text-slate-600">
                <label className="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-100 rounded transition">
                  <input
                    type="checkbox"
                    checked={preventDup}
                    onChange={(e) => setPreventDup(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  <span>실시간 중복 제출 제어</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-100 rounded transition">
                  <input
                    type="checkbox"
                    checked={allowMutation}
                    onChange={(e) => setAllowMutation(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  <span>게스트 재수정 허용 (설문 정정)</span>
                </label>
              </div>
              <button
                onClick={() => {
                  onUpdateSessionSettings(expiry, preventDup, allowMutation);
                  setIsMenuOpen(false);
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold py-2.5 rounded-lg transition shadow-sm hover:shadow"
              >
                업데이트 저장 및 적용
              </button>
            </div>
          </div>

          {/* 3. 게스트 제출 현황 */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <Users className="w-4 h-4 text-emerald-500" />
              <span>3. 게스트 제출 현황</span>
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>실시간 수집율</span>
                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-[10px]">
                  {submittedCount} / {totalCount || '무제한'}명 제출
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${respondPercent}%` }}
                ></div>
              </div>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                {session.guests.length === 0 ? (
                  <p className="text-[10px] text-slate-400 text-center py-4">등록된 참여자가 없습니다.</p>
                ) : (
                  session.guests.map(g => (
                    <div key={g.name} className="flex justify-between items-center py-1 border-b border-slate-100/50 last:border-0">
                      <span className="text-[10px] font-bold flex items-center gap-1.5 text-slate-700">
                        <span className={`w-1.5 h-1.5 rounded-full ${g.submitted ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                        {g.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${g.submitted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {g.submitted ? '완료' : '미응답'}
                        </span>
                        {!g.submitted && (
                          <button
                            onClick={() => {
                              onTriggerReminder(g.name);
                              setIsMenuOpen(false);
                            }}
                            className="text-[8px] font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-slate-200 hover:bg-indigo-50 px-1.5 py-0.5 rounded transition shrink-0 shadow-sm"
                          >
                            Nudge 독촉
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 4. 통합 파일 내보내기 */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <Download className="w-4 h-4 text-rose-500" />
              <span>4. 통합 파일 내보내기 (Export)</span>
            </h3>
            <div className="grid grid-cols-5 gap-1.5 text-[9px] font-bold">
              <button
                onClick={() => {
                  onExport('CSV');
                  setIsMenuOpen(false);
                }}
                className="flex flex-col items-center p-2 bg-slate-50 hover:bg-emerald-50 rounded-xl text-slate-700 border border-slate-200 transition"
              >
                <FileText className="w-4 h-4 text-emerald-600 mb-1" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => {
                  onExport('XLSX');
                  setIsMenuOpen(false);
                }}
                className="flex flex-col items-center p-2 bg-slate-50 hover:bg-blue-50 rounded-xl text-slate-700 border border-slate-200 transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-600 mb-1" />
                <span>Excel</span>
              </button>
              <button
                onClick={() => {
                  onExport('Sheets');
                  setIsMenuOpen(false);
                }}
                className="flex flex-col items-center p-2 bg-slate-50 hover:bg-indigo-50 rounded-xl text-slate-700 border border-slate-200 transition"
              >
                <Cloud className="w-4 h-4 text-indigo-600 mb-1" />
                <span>시트</span>
              </button>
              <button
                onClick={() => {
                  onExport('PDF');
                  setIsMenuOpen(false);
                }}
                className="flex flex-col items-center p-2 bg-slate-50 hover:bg-rose-50 rounded-xl text-slate-700 border border-slate-200 transition"
              >
                <FileDown className="w-4 h-4 text-rose-500 mb-1" />
                <span>PDF</span>
              </button>
              <button
                onClick={() => {
                  onExport('PNG');
                  setIsMenuOpen(false);
                }}
                className="flex flex-col items-center p-2 bg-slate-50 hover:bg-amber-50 rounded-xl text-slate-700 border border-slate-200 transition"
              >
                <ImageIcon className="w-4 h-4 text-amber-500 mb-1" />
                <span>이미지</span>
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="pt-4 border-t border-slate-100 text-center shrink-0">
          <p className="text-[10px] text-slate-400 font-bold">Scheduler Premium v2.2</p>
        </div>
      </aside>

      {/* Main View Area: Focused strictly on the Calendar Schedule Heatmap */}
      <div className="flex-1 p-4 sm:p-6 flex flex-col overflow-hidden relative">
        
        {/* View Header with beautiful actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 mb-4 gap-4 shrink-0">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Hamburger Button to Open Management Menu Drawer */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 shadow-sm transition flex items-center justify-center shrink-0 lg:hidden"
              title="상세 관리 메뉴 열기"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={onBackToDashboard}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition flex items-center justify-center shrink-0"
              title="대시보드로 돌아가기"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="truncate">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate max-w-[200px] sm:max-w-[300px]">
                  {session.title}
                </h2>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                  session.status === '확정' 
                    ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                    : 'bg-amber-50 text-amber-700 border-amber-100'
                }`}>
                  {session.status === '확정' ? '확정 완료' : '조율 중'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                오버랩 기간: {session.startDate} ~ {session.endDate} ({session.time_interval}분 단위)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {/* Quick Access Share Survey Link Button */}
            <button
              onClick={() => onShareSurveyLink(session.id)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 shadow-sm hover:shadow transition"
              title="설문지 참여 링크 복사 및 공유"
            >
              <Share2 className="w-4 h-4 text-indigo-200" />
              <span>설문 공유 링크</span>
            </button>

            {/* Week Tabs for 4-weeks session */}
            {session.duration === '4weeks' && (
              <div id="admin-week-tabs-container" className="flex bg-white p-1 rounded-xl border border-slate-200 text-[10px] font-bold gap-1 shadow-sm">
                {[1, 2, 3, 4].map(w => (
                  <button
                    key={w}
                    onClick={() => setCurrentActiveWeek(w)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                      currentActiveWeek === w
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {w}주차
                  </button>
                ))}
              </div>
            )}

            {/* Analysis View Toggles */}
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 text-[10px] font-bold gap-1 shadow-sm">
              <button
                onClick={() => setSelectedAnalysisView('heatmap')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                  selectedAnalysisView === 'heatmap' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                오버랩 히트맵
              </button>
              <button
                onClick={() => setSelectedAnalysisView('individual')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                  selectedAnalysisView === 'individual' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                명단 개별분석
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Legend / Status Bar */}
        <div className="mb-3 px-3.5 py-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-wrap justify-between items-center text-[10px] font-bold text-slate-700 gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>상단의 <strong className="text-indigo-600">햄버거 메뉴(Menu)</strong>를 클릭하여 AI 자동 추천 확인, 권한 설정 및 파일 내보내기를 실행할 수 있습니다.</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-200 inline-block"></span> 0명</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-200 inline-block"></span> 1명</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-300 inline-block"></span> 2명</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> 3명+</span>
          </div>
        </div>

        {/* Calendar Heatmap Container */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-auto custom-scrollbar relative animate-in fade-in duration-300" id="admin-calendar-container">
            <div className="grid" id="admin-heatmap-grid" style={{ gridTemplateColumns: `50px repeat(${activeDates.length}, minmax(70px, 1fr))` }}>
              {/* Header corner */}
              <div className="header-corner-sticky flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {/* Day headers with actual date labels */}
              {activeDates.map((dateInfo) => (
                <div
                  key={dateInfo.dateStr}
                  className="header-row-sticky flex items-center justify-center text-[10px] font-bold text-slate-600 py-2 border-r border-slate-100"
                >
                  {dateInfo.formatted}
                </div>
              ))}

              {/* Grid content rows */}
              {timeslots.map(time => {
                const cols = [<div key={`time-${time}`} className="time-col-sticky text-[9px] font-bold text-slate-500 flex items-start justify-center pt-1 border-b border-slate-100">{time}</div>];

                activeDates.forEach((dateInfo) => {
                  const prefix = session.duration === '4weeks' ? `W${currentActiveWeek}-` : `W1-`;
                  const key = `${prefix}${dateInfo.dayNameEng}-${time}`;
                  const matched = session.guests.filter(g => g.submitted && g.schedule[key]);
                  const count = matched.length;

                  const isConfirmed = session.status === '확정' && session.confirmedSlot === key;

                  let cellContent = null;
                  if (isConfirmed) {
                    cellContent = (
                      <div className="w-full h-full bg-indigo-600 text-white rounded-lg flex justify-center items-center text-[9px] font-bold shadow-md m-0.5 animate-pulse">
                        <span>확정됨</span>
                      </div>
                    );
                  } else if (selectedAnalysisView === 'heatmap' && count > 0) {
                    let colorClass = 'bg-emerald-100 text-emerald-800';
                    if (count >= 2) colorClass = 'bg-emerald-300 text-emerald-900';
                    if (count >= 3) colorClass = 'bg-emerald-500 text-white font-bold';

                    cellContent = (
                      <div className={`w-full h-full ${colorClass} rounded-lg flex justify-center items-center text-[9px] shadow-sm m-0.5`}>
                        <span>{count}명</span>
                      </div>
                    );
                  } else if (selectedAnalysisView === 'individual' && count > 0) {
                    cellContent = (
                      <div className="w-full h-full flex flex-col gap-0.5 p-0.5 overflow-y-auto max-h-[40px] custom-scrollbar">
                        {matched.map(m => (
                          <span key={m.name} className="bg-indigo-100 text-indigo-700 text-[8px] rounded px-0.5 truncate text-center font-bold">
                            {m.name}
                          </span>
                        ))}
                      </div>
                    );
                  }

                  cols.push(
                    <div
                      key={key}
                      id={`admin-slot-${key}`}
                      className={`min-h-[44px] border-r border-b border-slate-100 flex items-center justify-center relative transition-all duration-300 ${
                        isConfirmed ? 'bg-indigo-50' : ''
                      }`}
                    >
                      {cellContent}
                    </div>
                  );
                });

                return cols;
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
