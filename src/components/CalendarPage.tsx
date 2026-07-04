import React, { useState, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, CalendarDays, Filter, 
  CheckCircle, Clock, Users, User, ExternalLink, RefreshCw,
  X, Menu, List, Download
} from 'lucide-react';
import { Session, Category } from '../types';

interface CalendarPageProps {
  sessions: Session[];
  categories: Category[];
  goToDetail: (id: number) => void;
  openShareSurveyLink: (id: number) => void;
}

export default function CalendarPage({ 
  sessions, 
  categories, 
  goToDetail,
  openShareSurveyLink 
}: CalendarPageProps) {
  // Use July 2026 as default since our mockup data resides in July 2026
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // 0-indexed (6 is July)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 6, 1)); // Default selected date: 2026-07-01

  // Refs for tracking touch events for swipe gestures
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Mobile/Tablet side drawer toggle states
  const [isLeftFilterOpen, setIsLeftFilterOpen] = useState(false);
  const [isRightAgendaOpen, setIsRightAgendaOpen] = useState(false);

  const calendarRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!calendarRef.current) return;
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = calendarRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        ignoreElements: (el) => el.classList.contains('pdf-no-export')
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`calendar_${currentYear}_${currentMonth + 1}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Filter lists
  const [enabledCategoryIds, setEnabledCategoryIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    categories.forEach(cat => {
      initial[cat.name] = true; // Use name as key since sessions store category as name
    });
    return initial;
  });

  const [enabledSessionIds, setEnabledSessionIds] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    sessions.forEach(sess => {
      if (!sess.is_deleted) {
        initial[sess.id] = true;
      }
    });
    return initial;
  });

  // Category and session search queries
  const [categorySearch, setCategorySearch] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');

  // Helper arrays for calendar generation
  const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
  
  // Date-handling helpers
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Touch handlers for month swipe transitions
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    // Must be primarily horizontal movement
    if (Math.abs(diffX) > Math.abs(diffY)) {
      const swipeThreshold = 50; // Minimum drag distance in pixels
      if (Math.abs(diffX) > swipeThreshold) {
        if (diffX > 0) {
          // Swiped right -> Previous month
          handlePrevMonth();
        } else {
          // Swiped left -> Next month
          handleNextMonth();
        }
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleGoToToday = () => {
    const today = new Date();
    // If today is far from default mock data, we still point to July 2026 for demonstration
    // But let's set to July 2026 so that user sees mock data immediately
    setCurrentYear(2026);
    setCurrentMonth(6);
    setSelectedDate(new Date(2026, 6, 1));
  };

  // Generate calendar days
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);
  
  // Get previous month padding days
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
  
  const calendarCells: { date: Date; isCurrentMonth: boolean }[] = [];
  
  // 1. Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    calendarCells.push({
      date: new Date(prevYear, prevMonth, day),
      isCurrentMonth: false
    });
  }

  // 2. Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({
      date: new Date(currentYear, currentMonth, i),
      isCurrentMonth: true
    });
  }

  // 3. Next month leading days to complete full grid (multiple of 7, usually 35 or 42 cells)
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  for (let i = 1; i <= remainingCells || calendarCells.length < 35; i++) {
    calendarCells.push({
      date: new Date(nextYear, nextMonth, i),
      isCurrentMonth: false
    });
    if (calendarCells.length >= 42) break; // Maximum 6 rows
  }

  // Format date to comparison string "YYYY-MM-DD" in local time timezone safely
  const formatDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dateVal = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${dateVal}`;
  };

  const selectedDateStr = formatDateStr(selectedDate);

  // Filter active sessions matching user settings
  const filteredSessions = sessions.filter(sess => {
    if (sess.is_deleted) return false;
    
    const catEnabled = enabledCategoryIds[sess.category] !== false;
    const sessEnabled = enabledSessionIds[sess.id] !== false;
    
    return catEnabled && sessEnabled;
  });

  // Check if a session overlaps with a given day
  const getSessionsForDate = (date: Date) => {
    const dateStr = formatDateStr(date);
    return filteredSessions.filter(sess => {
      return sess.startDate <= dateStr && dateStr <= sess.endDate;
    });
  };

  // Toggle Category Checkbox
  const toggleCategory = (catName: string) => {
    setEnabledCategoryIds(prev => ({
      ...prev,
      [catName]: prev[catName] === false ? true : false
    }));
  };

  // Toggle Session Checkbox
  const toggleSession = (id: number) => {
    setEnabledSessionIds(prev => ({
      ...prev,
      [id]: prev[id] === false ? true : false
    }));
  };

  const toggleAllCategories = (enable: boolean) => {
    const next: Record<string, boolean> = {};
    categories.forEach(cat => {
      next[cat.name] = enable;
    });
    setEnabledCategoryIds(next);
  };

  const toggleAllSessions = (enable: boolean) => {
    const next: Record<number, boolean> = {};
    sessions.forEach(sess => {
      if (!sess.is_deleted) {
        next[sess.id] = enable;
      }
    });
    setEnabledSessionIds(next);
  };

  // Selected date's agenda sessions
  const activeSessionsForSelectedDate = getSessionsForDate(selectedDate);

  // Search filter lists
  const searchedCategories = categories.filter(c => 
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const searchedSessions = sessions.filter(s => 
    !s.is_deleted && s.title.toLowerCase().includes(sessionSearch.toLowerCase())
  );

  return (
    <section id="view-admin-calendar" className="absolute inset-0 flex flex-col lg:flex-row bg-slate-50 overflow-hidden">
      
      {/* Sliding Drawer Backdrop for Left Sidebar */}
      {isLeftFilterOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-200 lg:hidden"
          onClick={() => setIsLeftFilterOpen(false)}
        />
      )}

      {/* 1. LEFT SIDEBAR: Categories & Sessions Filter (구글 캘린더 스타일) - Always visible on desktop (lg), slide-over drawer on tablet/mobile */}
      <aside 
        className={`fixed inset-y-0 left-0 w-80 bg-white border-r border-slate-200 p-5 z-50 flex flex-col justify-between transform transition-transform duration-300 ease-out lg:static lg:inset-auto lg:w-80 lg:shrink-0 lg:z-0 lg:shadow-none lg:transform-none ${
          isLeftFilterOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar space-y-6">
          
          {/* Sidebar Title with Close Button on Mobile/Tablet */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Filter className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">통합 캘린더 필터</h2>
                <p className="text-[10px] text-slate-400 font-medium">카테고리 및 세션 활성화 관리</p>
              </div>
            </div>
            {/* Close Button only visible on mobile/tablet */}
            <button 
              onClick={() => setIsLeftFilterOpen(false)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition lg:hidden"
              title="필터 닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        {/* Category Filters (카테고리별 읽기/토글) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>1. 카테고리 필터</span>
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600">
              <button onClick={() => toggleAllCategories(true)} className="hover:underline">모두 켬</button>
              <span className="text-slate-300">|</span>
              <button onClick={() => toggleAllCategories(false)} className="hover:underline">모두 끔</button>
            </div>
          </div>
          
          {/* Quick Category Search */}
          <input 
            type="text" 
            placeholder="카테고리명 검색..." 
            value={categorySearch} 
            onChange={e => setCategorySearch(e.target.value)} 
            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
          />

          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
            {searchedCategories.map(cat => {
              const isChecked = enabledCategoryIds[cat.name] !== false;
              // Map background color to matching dot border/bg
              const colorClass = cat.color || 'bg-slate-500';
              return (
                <label 
                  key={cat.id} 
                  className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl cursor-pointer text-xs transition"
                >
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => toggleCategory(cat.name)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
                      <span className="font-semibold text-slate-700">{cat.name}</span>
                    </div>
                  </div>
                </label>
              );
            })}
            {searchedCategories.length === 0 && (
              <p className="text-[11px] text-slate-400 py-2 text-center font-medium">검색 결과가 없습니다.</p>
            )}
          </div>
        </div>

        {/* Sessions Filter */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>2. 세션별 일정 필터</span>
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600">
              <button onClick={() => toggleAllSessions(true)} className="hover:underline">모두 켬</button>
              <span className="text-slate-300">|</span>
              <button onClick={() => toggleAllSessions(false)} className="hover:underline">모두 끔</button>
            </div>
          </div>

          {/* Quick Session Search */}
          <input 
            type="text" 
            placeholder="세션 제목 검색..." 
            value={sessionSearch} 
            onChange={e => setSessionSearch(e.target.value)} 
            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
          />

          <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
            {searchedSessions.map(sess => {
              const isChecked = enabledSessionIds[sess.id] !== false;
              const colorClass = sess.color || 'bg-slate-500';
              return (
                <label 
                  key={sess.id} 
                  className="flex items-start gap-2.5 p-2 hover:bg-slate-50 rounded-xl cursor-pointer text-xs transition"
                >
                  <input 
                    type="checkbox" 
                    checked={isChecked}
                    onChange={() => toggleSession(sess.id)}
                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${colorClass}`} />
                      <p className="font-bold text-slate-700 line-clamp-1">{sess.title}</p>
                    </div>
                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5 ml-3.5">
                      {sess.startDate} ~ {sess.endDate}
                    </p>
                  </div>
                </label>
              );
            })}
            {searchedSessions.length === 0 && (
              <p className="text-[11px] text-slate-400 py-2 text-center font-medium">등록된 세션이 없습니다.</p>
            )}
          </div>
        </div>
        </div>
      </aside>

      {/* 2. CENTER: Main Calendar Grid (구글 캘린더 스타일 월간 달력) */}
      <div ref={calendarRef} className="flex-1 flex flex-col bg-white overflow-hidden">
        
        {/* Calendar Controller Header */}
        <header className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {/* Mobile/Tablet: Button to open Left Sidebar (Filter) */}
            <button
              onClick={() => setIsLeftFilterOpen(true)}
              className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 shadow-sm transition flex items-center justify-center shrink-0 lg:hidden pdf-no-export"
              title="필터 열기"
            >
              <Filter className="w-4 h-4 text-slate-500" />
            </button>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl pdf-no-export">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white rounded-lg transition text-slate-600 hover:text-slate-900 shadow-none hover:shadow-sm"
                title="이전 달"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white rounded-lg transition text-slate-600 hover:text-slate-900 shadow-none hover:shadow-sm"
                title="다음 달"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <button 
              onClick={handleGoToToday}
              className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm hidden sm:flex pdf-no-export"
            >
              <CalendarDays className="w-4 h-4 text-indigo-500" />
              <span>기준 데이터(2026.07) 이동</span>
            </button>
          </div>

          <div className="text-center">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              {currentYear}년 {currentMonth + 1}월
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm pdf-no-export disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>PDF 저장 중...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>PDF로 저장</span>
                </>
              )}
            </button>

            <div className="text-xs text-slate-400 font-bold bg-slate-100 px-3 py-1.5 rounded-xl hidden sm:block">
              <span className="text-slate-500">조율 세션 수:</span> <span className="text-indigo-600">{filteredSessions.length}개</span>
            </div>

            {/* Mobile/Tablet: Button to open Right Sidebar (Details) */}
            <button
              onClick={() => setIsRightAgendaOpen(true)}
              className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 shadow-sm transition flex items-center justify-center shrink-0 lg:hidden pdf-no-export"
              title="상세 일정 열기"
            >
              <List className="w-4 h-4 text-indigo-600" />
            </button>
          </div>
        </header>

        {/* Days of Week Row */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 py-2 text-center shrink-0">
          {daysOfWeek.map((day, idx) => {
            const isSunday = idx === 0;
            const isSaturday = idx === 6;
            return (
              <span 
                key={day} 
                className={`text-[11px] font-bold tracking-wider ${
                  isSunday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-slate-400'
                }`}
              >
                {day}
              </span>
            );
          })}
        </div>

        {/* Main Grid Calendar Cells */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex-1 grid grid-cols-7 grid-rows-6 p-1 bg-slate-100/50 overflow-y-auto"
        >
          {calendarCells.map((cell, idx) => {
            const cellDateStr = formatDateStr(cell.date);
            const isSelected = cellDateStr === selectedDateStr;
            const dayNum = cell.date.getDate();
            const cellSessions = getSessionsForDate(cell.date);

            // Style Sunday/Saturday
            const isSunday = cell.date.getDay() === 0;
            const isSaturday = cell.date.getDay() === 6;

            return (
              <div
                key={idx}
                onClick={() => setSelectedDate(cell.date)}
                className={`min-h-[75px] bg-white border border-slate-100 p-1 flex flex-col justify-between transition-all cursor-pointer relative group hover:z-10 hover:shadow-md hover:border-indigo-100 ${
                  isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50/20' : ''
                } ${!cell.isCurrentMonth ? 'opacity-40 bg-slate-50/40' : ''}`}
              >
                {/* Cell Header: Day Number */}
                <div className="flex justify-between items-center mb-1">
                  <span 
                    className={`text-[11px] font-extrabold w-5 h-5 flex items-center justify-center rounded-full ${
                      isSelected 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : isSunday 
                        ? 'text-red-500' 
                        : isSaturday 
                        ? 'text-blue-500' 
                        : 'text-slate-600'
                    }`}
                  >
                    {dayNum}
                  </span>
                  
                  {/* Overlap density badge */}
                  {cellSessions.length > 0 && (
                    <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.2 rounded-full scale-90 opacity-0 group-hover:opacity-100 transition-opacity">
                      {cellSessions.length}개 세션
                    </span>
                  )}
                </div>

                {/* Overlapping Sessions List (가로 바) */}
                <div className="flex-1 flex flex-col gap-0.5 overflow-hidden justify-end">
                  {cellSessions.slice(0, 3).map(sess => {
                    const colorClass = sess.color || 'bg-slate-600';
                    const isConfirmed = sess.status === '확정';
                    return (
                      <div 
                        key={sess.id}
                        className={`text-[8px] font-bold text-white px-1.5 py-0.5 rounded flex items-center justify-between gap-1 line-clamp-1 truncate ${colorClass}`}
                        title={`${sess.title} (${sess.category})`}
                      >
                        <span className="truncate">{sess.title}</span>
                        {isConfirmed && <CheckCircle className="w-2.5 h-2.5 text-white shrink-0" />}
                      </div>
                    );
                  })}
                  {cellSessions.length > 3 && (
                    <div className="text-[8px] font-bold text-slate-400 pl-1 text-right">
                      외 {cellSessions.length - 3}개 더보기
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sliding Drawer Backdrop for Right Sidebar */}
      {isRightAgendaOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-200 lg:hidden"
          onClick={() => setIsRightAgendaOpen(false)}
        />
      )}

      {/* 3. RIGHT SIDEBAR: Day Schedule details (일별 일정) - Always visible on desktop (lg), slide-over drawer on tablet/mobile */}
      <aside 
        className={`fixed inset-y-0 right-0 w-80 sm:w-96 bg-slate-50 border-l border-slate-200 p-5 z-50 flex flex-col overflow-y-auto space-y-4 transform transition-transform duration-300 ease-out lg:static lg:inset-auto lg:w-96 lg:shrink-0 lg:z-0 lg:transform-none ${
          isRightAgendaOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        
        {/* Selected Date Header */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2 relative">
          {/* Close button for mobile */}
          <button 
            onClick={() => setIsRightAgendaOpen(false)}
            className="absolute top-3 right-3 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition lg:hidden"
            title="상세 닫기"
          >
            <X className="w-4 h-4" />
          </button>

          <p className="text-[10px] text-indigo-600 font-extrabold tracking-widest uppercase">
            SELECTED DATE AGENDA
          </p>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>
              {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
              ({daysOfWeek[selectedDate.getDay()]}요일)
            </span>
          </h3>
          <p className="text-xs text-slate-400 font-semibold">
            이 날짜에 활성화된 세션 일정이 총 <span className="text-indigo-600 font-bold">{activeSessionsForSelectedDate.length}개</span> 존재합니다.
          </p>
        </div>

        {/* 3. 일별 일정 리스트 (Day schedule items) */}
        <div className="space-y-3 flex-1">
          <div className="flex justify-between items-center px-1">
            <h4 className="text-xs font-bold text-slate-700">3. 일별 일련 세션 상세</h4>
            <span className="text-[10px] text-slate-400 font-bold">참여 현황 요약</span>
          </div>

          <div className="space-y-3">
            {activeSessionsForSelectedDate.map(sess => {
              const colorClass = sess.color || 'bg-indigo-600';
              const submittedCount = sess.guests.filter(g => g.submitted).length;
              const totalGuests = sess.guests.length;
              const isConfirmed = sess.status === '확정';

              return (
                <div 
                  key={sess.id}
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition space-y-3"
                >
                  {/* Title & Category with dynamic Badge */}
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-xs font-extrabold text-slate-800 line-clamp-2 leading-snug">
                        {sess.title}
                      </h5>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold shrink-0 text-white ${
                        isConfirmed ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}>
                        {sess.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${colorClass}`} />
                      <span className="text-[10px] text-slate-400 font-bold">{sess.category}</span>
                    </div>
                  </div>

                  {/* Period & Interval */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 bg-slate-50 p-2 rounded-xl">
                    <div>
                      <p className="text-slate-400 scale-95 origin-left">조율 기간</p>
                      <p className="text-slate-700 mt-0.5">{sess.startDate} ~ {sess.endDate}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 scale-95 origin-left">타임슬롯 간격</p>
                      <p className="text-slate-700 mt-0.5">{sess.time_interval}분 단위</p>
                    </div>
                  </div>

                  {/* Confirmed Information or Progress details */}
                  {isConfirmed ? (
                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2.5 rounded-xl flex items-center gap-2 text-xs font-bold">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-[9px] text-emerald-500 font-extrabold scale-90 origin-left">확정된 타임라인 슬롯</p>
                        <p className="text-emerald-700">{sess.confirmedSlot || '미지정'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 text-amber-800 border border-amber-100 p-2.5 rounded-xl flex items-center gap-2 text-xs font-bold">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <p className="text-[9px] text-amber-500 font-extrabold scale-90 origin-left">일정 취합 마감시한</p>
                        <p className="text-amber-700">{sess.expiry.replace('T', ' ')}</p>
                      </div>
                    </div>
                  )}

                  {/* Guest Submission Status */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>설문 참여 게스트</span>
                      </span>
                      <span className="text-indigo-600">
                        {submittedCount} / {totalGuests} 제출 완료
                      </span>
                    </div>

                    {/* Guest name badges */}
                    <div className="flex flex-wrap gap-1">
                      {sess.guests.map((g, gi) => (
                        <div 
                          key={gi}
                          className={`px-2 py-0.5 rounded-md text-[9px] font-semibold flex items-center gap-1 ${
                            g.submitted 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          <User className="w-2.5 h-2.5 shrink-0" />
                          <span>{g.name}</span>
                        </div>
                      ))}
                      {sess.guests.length === 0 && (
                        <p className="text-[10px] text-slate-400 italic">참여자 명단이 지정되지 않았습니다.</p>
                      )}
                    </div>
                  </div>

                  {/* Actions to Go To analysis dashboard or Share link */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => openShareSurveyLink(sess.id)}
                      className="py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      <span>설문지 링크</span>
                    </button>
                    <button
                      onClick={() => goToDetail(sess.id)}
                      className="py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1"
                    >
                      <span>통합 대시보드</span>
                      <ChevronRight className="w-3 h-3 text-white/80" />
                    </button>
                  </div>

                </div>
              );
            })}

            {activeSessionsForSelectedDate.length === 0 && (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                <CalendarDays className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-500">선택한 날짜에 예정된 일정이 없습니다.</p>
                <p className="text-[10px] text-slate-400">좌측 필터에서 카테고리 또는 세션을 활성화해 보세요.</p>
              </div>
            )}
          </div>
        </div>

      </aside>

    </section>
  );
}
