import React, { useState, useEffect, useRef } from 'react';
import { Clock, Info, Check, AlertTriangle, Lock, ShieldCheck, ArrowLeft, User, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import { Session } from '../types';
import { getSessionDatesForWeek } from '../utils/date';

interface SurveyProps {
  session: Session;
  currentActiveWeek: number;
  setCurrentActiveWeek: (week: number) => void;
  guestName: string;
  setGuestName: (name: string) => void;
  localGuestSchedule: Record<string, boolean>;
  setLocalGuestSchedule: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onSubmitReview: () => void;
  showToast: (msg: string, icon?: string) => void;
}

export default function Survey({
  session,
  currentActiveWeek,
  setCurrentActiveWeek,
  guestName,
  setGuestName,
  localGuestSchedule,
  setLocalGuestSchedule,
  onSubmitReview,
  showToast
}: SurveyProps) {
  const daysEng = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daysKor = ["일", "월", "화", "수", "목", "금", "토"];

  const activeDates = getSessionDatesForWeek(session.startDate, session.endDate, currentActiveWeek);

  // Drag-and-Hold state
  const [holdingCell, setHoldingCell] = useState<string | null>(null);
  const [dragReady, setDragReady] = useState(false);
  const [dragStartState, setDragStartState] = useState(true);
  const [lockedDay, setLockedDay] = useState<string | null>(null);

  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchMovedRef = useRef(false);
  const didDragOrHoldRef = useRef(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isTouchActiveRef = useRef(false);
  const holdingCellRef = useRef<string | null>(null);

  const localScheduleRef = useRef(localGuestSchedule);
  useEffect(() => {
    localScheduleRef.current = localGuestSchedule;
  }, [localGuestSchedule]);

  const dragReadyRef = useRef(false);
  const lockedDayRef = useRef<string | null>(null);
  const dragStartStateRef = useRef(true);

  useEffect(() => {
    dragReadyRef.current = dragReady;
  }, [dragReady]);

  useEffect(() => {
    lockedDayRef.current = lockedDay;
  }, [lockedDay]);

  useEffect(() => {
    dragStartStateRef.current = dragStartState;
  }, [dragStartState]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setDragReady(false);
      dragReadyRef.current = false;
      setLockedDay(null);
      lockedDayRef.current = null;
      setHoldingCell(null);
      setTimeout(() => {
        didDragOrHoldRef.current = false;
      }, 100);
    };

    const handleGlobalMouseMove = () => {
      isTouchActiveRef.current = false;
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      isTouchActiveRef.current = true;
      if (dragReadyRef.current) {
        if (e.cancelable) {
          e.preventDefault();
        }
        didDragOrHoldRef.current = true;

        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const cell = element?.closest('.guest-slot-cell');
        if (cell) {
          const key = cell.getAttribute('data-slot');
          if (key) {
            const parts = key.split('-');
            if (parts.length === 3) {
              const day = parts[1];
              if (day === lockedDayRef.current && localScheduleRef.current[key] !== dragStartStateRef.current) {
                toggleSlot(key, dragStartStateRef.current);
              }
            }
          }
        }
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
    };
  }, []);

  const [isMobile, setIsMobile] = useState(false);
  const [mobileStep, setMobileStep] = useState<'login' | 'date-select' | 'time-select' | 'review'>('login');
  const [selectedDays, setSelectedDays] = useState<Record<string, boolean>>({});
  const [isCalendarFullscreen, setIsCalendarFullscreen] = useState(false);

  // Sub-steps for the split login overlay
  const [loginSubStep, setLoginSubStep] = useState<'social' | 'name'>('social');
  const [selectedSnsProvider, setSelectedSnsProvider] = useState<string | null>(null);
  const [isSnsVerifying, setIsSnsVerifying] = useState(false);

  const handleSnsLoginClick = (provider: string) => {
    setSelectedSnsProvider(provider);
    setIsSnsVerifying(true);
    showToast(`${provider} 계정으로 본인 인증을 진행 중입니다...`, 'Clock');
    
    setTimeout(() => {
      setIsSnsVerifying(false);
      setLoginSubStep('name');
      showToast(`${provider} 간편인증 성공! 본명을 입력해 주세요.`, 'Check');
    }, 1000);
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync selected days from schedule
  useEffect(() => {
    const days: Record<string, boolean> = {};
    Object.keys(localGuestSchedule).forEach(slotKey => {
      const parts = slotKey.split('-');
      if (parts.length >= 2) {
        const dayKey = `${parts[0]}-${parts[1]}`;
        days[dayKey] = true;
      }
    });
    setSelectedDays(prev => ({ ...days, ...prev }));
  }, [localGuestSchedule]);

  // Sync mobile step on guestName changes
  useEffect(() => {
    if (!guestName.trim()) {
      setMobileStep('login');
      setLoginSubStep('social');
      setSelectedSnsProvider(null);
      setIsSnsVerifying(false);
    }
  }, [guestName]);

  const getFormattedDateFromDayKey = (dayKey: string) => {
    const parts = dayKey.split('-');
    if (parts.length !== 2) return dayKey;
    const weekNum = parseInt(parts[0].replace('W', '')) || 1;
    const dayEng = parts[1];
    
    const datesForWeek = getSessionDatesForWeek(session.startDate, session.endDate, weekNum);
    const match = datesForWeek.find(d => d.dayNameEng === dayEng);
    if (match) {
      return `${weekNum}주차 ${match.formatted} (${match.dayNameKor})`;
    }
    return `${weekNum}주차 ${dayEng}`;
  };

  // Generate dynamic time slots based on interval (30, 60, 120 minutes)
  const getTimeslots = (interval: number) => {
    const slots: string[] = [];
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

  // Sync / Load existing guest schedule if name matches
  const handleNameChange = (name: string) => {
    setGuestName(name);
    const trimmed = name.trim();
    if (!trimmed) {
      setLocalGuestSchedule({});
      return;
    }

    const existingGuest = session.guests.find(g => g.name === trimmed);
    if (existingGuest && existingGuest.submitted) {
      setLocalGuestSchedule({ ...existingGuest.schedule });
      showToast(`기존 일정 정보가 성공적으로 복원되었습니다. 수정 후 다시 제출해 주세요.`, "check");
    } else {
      setLocalGuestSchedule({});
    }
  };

  // Toggle single cell helper
  const toggleSlot = (key: string, forceState?: boolean) => {
    setLocalGuestSchedule(prev => {
      const next = { ...prev };
      const nextState = forceState !== undefined ? forceState : !next[key];
      if (nextState) {
        next[key] = true;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  // 0.5s Hold & Press Event Handlers (Mouse)
  const handleMouseDown = (e: React.MouseEvent, key: string, day: string) => {
    if (isTouchActiveRef.current) return;
    
    e.preventDefault();
    setHoldingCell(key);
    
    setDragReady(true);
    dragReadyRef.current = true;
    
    didDragOrHoldRef.current = false;
    
    setLockedDay(day);
    lockedDayRef.current = day;
    
    const startState = !localGuestSchedule[key];
    setDragStartState(startState);
    dragStartStateRef.current = startState;
    
    toggleSlot(key, startState);
  };

  const handleMouseEnter = (key: string, day: string) => {
    if (isTouchActiveRef.current) return;

    if (dragReadyRef.current && day === lockedDayRef.current) {
      didDragOrHoldRef.current = true;
      toggleSlot(key, dragStartStateRef.current);
    }
  };

  // Touch handlers for mobile/tablet responsive touch target support
  const handleTouchStart = (e: React.TouchEvent, key: string, day: string) => {
    isTouchActiveRef.current = true;
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    holdingCellRef.current = key;
    setHoldingCell(key);
    
    setDragReady(false);
    dragReadyRef.current = false;
    
    touchMovedRef.current = false;
    didDragOrHoldRef.current = false;

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }

    holdTimerRef.current = setTimeout(() => {
      if (!touchMovedRef.current) {
        setDragReady(true);
        dragReadyRef.current = true;
        didDragOrHoldRef.current = true;
        
        setLockedDay(day);
        lockedDayRef.current = day;
        
        const startState = !localScheduleRef.current[key];
        setDragStartState(startState);
        dragStartStateRef.current = startState;
        
        toggleSlot(key, startState);

        if (navigator.vibrate) {
          navigator.vibrate(40);
        }
        showToast("세로 방향 연속 터치 선택 모드가 실행되었습니다.", "move");
      }
    }, 150); // High responsiveness: 150ms hold to activate dragging
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    isTouchActiveRef.current = true;
    const touch = e.touches[0];
    
    // Calculate distance moved from start position
    let distance = 0;
    if (touchStartPos.current) {
      const dx = touch.clientX - touchStartPos.current.x;
      const dy = touch.clientY - touchStartPos.current.y;
      distance = Math.sqrt(dx * dx + dy * dy);
    }

    if (!dragReadyRef.current) {
      // If they moved significantly before the 150ms timeout, they are scrolling, so cancel long-press
      if (distance > 10) {
        touchMovedRef.current = true;
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
        holdingCellRef.current = null;
        setHoldingCell(null);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, key: string) => {
    isTouchActiveRef.current = true;
    e.preventDefault(); // Prevent simulated mouse and click events to avoid double toggles on mobile

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (dragReadyRef.current || touchMovedRef.current) {
      didDragOrHoldRef.current = true;
    }

    // Toggle on simple quick tap
    if (holdingCellRef.current === key && !dragReadyRef.current && !touchMovedRef.current) {
      toggleSlot(key);
    }

    holdingCellRef.current = null;
    setHoldingCell(null);
    setDragReady(false);
    dragReadyRef.current = false;
    setLockedDay(null);
    lockedDayRef.current = null;

    // Reset dragging ref after click event duration
    setTimeout(() => {
      didDragOrHoldRef.current = false;
    }, 100);
  };

  // Group selected slots by day
  const selectedSlotsGroupedByDay: Record<string, string[]> = {};
  Object.keys(localGuestSchedule).forEach(slotKey => {
    const parts = slotKey.split('-'); // ["W1", "Mon", "18:00"]
    if (parts.length === 3) {
      const dayKey = `${parts[0]}-${parts[1]}`;
      const time = parts[2];
      if (!selectedSlotsGroupedByDay[dayKey]) {
        selectedSlotsGroupedByDay[dayKey] = [];
      }
      selectedSlotsGroupedByDay[dayKey].push(time);
    }
  });

  const prefix = session.duration === '4weeks' ? `W${currentActiveWeek}-` : `W1-`;
  const filteredActiveDates = activeDates.filter(dateInfo => {
    const dayKey = `${prefix}${dateInfo.dayNameEng}`;
    return selectedDays[dayKey];
  });

  // Render Login Popup Overlay
  const renderLoginOverlay = () => {
    if (guestName.trim() && mobileStep !== 'login') return null;

    if (isSnsVerifying) {
      return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white/10 p-4 rounded-full mb-4 animate-pulse">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center space-x-2 text-white mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-white font-extrabold text-sm">{selectedSnsProvider} 간편인증 정보 처리 중...</p>
          <p className="text-slate-300 text-[11px] mt-1">안전하게 사용자 본인 인증 세션을 연결하고 있습니다.</p>
        </div>
      );
    }

    if (loginSubStep === 'social') {
      return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-3">
              일정 조율 참여 로그인
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 mb-1.5 leading-tight">
              {session.title}
            </h3>
            <p className="text-[11px] text-slate-400 mb-6">
              원활한 일정 조율과 중복 입력 방지를 위해 먼저 간편 로그인을 진행해 주세요.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => handleSnsLoginClick('카카오톡')}
                className="w-full bg-[#FEE500] hover:bg-[#FDD101] text-[#191919] font-bold py-3 px-4 rounded-xl shadow-sm transition flex items-center justify-center gap-2 text-xs"
              >
                <span className="w-2 h-2 rounded-full bg-[#191919] inline-block mr-1"></span>
                <span>카카오계정으로 간편로그인</span>
              </button>

              <button
                onClick={() => handleSnsLoginClick('네이버')}
                className="w-full bg-[#03C75A] hover:bg-[#02b350] text-white font-bold py-3 px-4 rounded-xl shadow-sm transition flex items-center justify-center gap-2 text-xs"
              >
                <span className="font-extrabold text-xs">N</span>
                <span>네이버 아이디로 로그인</span>
              </button>

              <button
                onClick={() => handleSnsLoginClick('Google')}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl border border-slate-200 shadow-sm transition flex items-center justify-center gap-2 text-xs"
              >
                <span className="text-red-500 font-extrabold text-xs">G</span>
                <span>Google 계정으로 계속하기</span>
              </button>
            </div>

            <p className="text-[9px] text-slate-400 mt-5 leading-normal">
              * 입력하신 일정 정보는 다른 서비스에 유출되지 않으며,<br />
              본 일정 조율 참여 확인용으로만 안전하게 사용됩니다.
            </p>
          </div>
        </div>
      );
    }

    // loginSubStep === 'name'
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
            <User className="w-6 h-6 text-emerald-600" />
          </div>

          <div className="flex justify-center items-center gap-1.5 mb-2">
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              {selectedSnsProvider} 인증됨
            </span>
          </div>

          <h3 className="text-sm font-extrabold text-slate-900 mb-1.5 leading-tight">
            참여자 본명 확인
          </h3>
          <p className="text-[11px] text-slate-400 mb-6">
            캘린더 취합 시 다른 참여자가 본인을 알아볼 수 있도록 실제 이름을 사용해 주세요.
          </p>

          <div className="space-y-4 text-left mb-6">
            <label className="block font-bold text-slate-700 text-[11px]">참여자 본명 입력</label>
            <div>
              {session.guestMode === 'specified' ? (
                <select
                  value={guestName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">-- 성함 선택 --</option>
                  {session.guests.map(g => (
                    <option key={g.name} value={g.name}>
                      {g.name} ({g.submitted ? '기제출-수정' : '미제출'})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="예: 홍길동 (정확한 본명 기입)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              )}
            </div>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => {
                setLoginSubStep('social');
                setSelectedSnsProvider(null);
              }}
              className="px-3.5 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold text-slate-500 transition flex items-center justify-center gap-1 shrink-0"
              title="이전 단계로 돌아가기"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>이전</span>
            </button>
            
            <button
              onClick={() => {
                if (!guestName.trim()) {
                  showToast('본명을 정확히 입력해 주세요.', 'AlertTriangle');
                  return;
                }
                setMobileStep('date-select');
                showToast(`${guestName}님 환영합니다! 이제 일정 조율을 시작합니다.`, 'check');
              }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl shadow-lg hover:shadow-xl transition flex justify-center items-center gap-1.5 text-xs"
            >
              <span>입력 완료 및 참여하기</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderLoginOverlay()}
      
      {isMobile ? (
        <section id="view-guest-survey-mobile" className="absolute inset-0 flex flex-col bg-slate-50 overflow-hidden select-none">
          {/* Mobile Header */}
          <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm z-30">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[150px] sm:max-w-[200px]">{session.title}</h2>
                <p className="text-[9px] text-indigo-600 font-bold">
                  {mobileStep === 'date-select' && '단계 1: 가능한 날짜 선택'}
                  {mobileStep === 'time-select' && '단계 2: 가능한 시간대 조율'}
                  {mobileStep === 'review' && '단계 3: 최종 검토 및 제출'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full">
                {guestName || '게스트'} 님
              </span>
              <button
                onClick={() => {
                  setGuestName('');
                  setLocalGuestSchedule({});
                  setMobileStep('login');
                }}
                className="text-[9px] text-red-500 font-bold border border-red-200 bg-red-50 px-1.5 py-1 rounded-lg"
              >
                로그아웃
              </button>
            </div>
          </div>

          {/* Step Indicator Bar */}
          <div className="bg-white px-4 py-2 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${mobileStep === 'date-select' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>1</span>
              <span className={mobileStep === 'date-select' ? 'text-indigo-600' : ''}>날짜 선택</span>
            </div>
            <div className="h-px bg-slate-200 flex-1 mx-3"></div>
            <div className="flex items-center gap-1.5">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${mobileStep === 'time-select' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>2</span>
              <span className={mobileStep === 'time-select' ? 'text-indigo-600' : ''}>시간대 조율</span>
            </div>
            <div className="h-px bg-slate-200 flex-1 mx-3"></div>
            <div className="flex items-center gap-1.5">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${mobileStep === 'review' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>3</span>
              <span className={mobileStep === 'review' ? 'text-indigo-600' : ''}>최종 검토</span>
            </div>
          </div>

          {/* Step 1: Date Selection */}
          {mobileStep === 'date-select' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Week Tabs */}
              {session.duration === '4weeks' && (
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex gap-1.5 shrink-0 overflow-x-auto custom-scrollbar">
                  {[1, 2, 3, 4].map(w => (
                    <button
                      key={w}
                      onClick={() => setCurrentActiveWeek(w)}
                      className={`flex-1 min-w-[60px] py-1.5 rounded-lg text-[10px] font-bold border transition ${
                        currentActiveWeek === w
                          ? 'border-indigo-200 bg-indigo-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {w}주차
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-[11px] leading-relaxed text-indigo-900">
                  <span className="font-extrabold text-indigo-700 block mb-0.5">📅 조율 가능한 캘린더 날짜 선택</span>
                  이번 일정 조율에서 조율을 원하는 날짜들을 아래에서 모두 체크해 주세요. 해당 날짜들에 대해서 다음 단계에서 상세 시간을 맞추게 됩니다.
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {activeDates.map(dateInfo => {
                    const prefix = session.duration === '4weeks' ? `W${currentActiveWeek}-` : `W1-`;
                    const dayKey = `${prefix}${dateInfo.dayNameEng}`;
                    const isSel = selectedDays[dayKey] || false;
                    const selectedSlotsForDayCount = Object.keys(localGuestSchedule).filter(k => k.startsWith(`${dayKey}-`)).length;

                    return (
                      <button
                        key={dayKey}
                        onClick={() => {
                          setSelectedDays(prev => {
                            const next = { ...prev };
                            if (next[dayKey]) {
                              delete next[dayKey];
                              setLocalGuestSchedule(prevSchedule => {
                                const nextSchedule = { ...prevSchedule };
                                Object.keys(nextSchedule).forEach(slotKey => {
                                  if (slotKey.startsWith(`${dayKey}-`)) {
                                    delete nextSchedule[slotKey];
                                  }
                                });
                                return nextSchedule;
                              });
                            } else {
                              next[dayKey] = true;
                            }
                            return next;
                          });
                        }}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition text-left ${
                          isSel
                            ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            isSel ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white text-transparent'
                          }`}>
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800">{dateInfo.formatted}</span>
                            <span className="text-[10px] text-slate-400 ml-1.5">({dateInfo.dayNameKor}요일)</span>
                          </div>
                        </div>
                        {isSel && selectedSlotsForDayCount > 0 && (
                          <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-sm">
                            시간 {selectedSlotsForDayCount}개 선택됨
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border-t border-slate-200 p-4 shrink-0">
                <button
                  onClick={() => {
                    const selectedCount = Object.keys(selectedDays).filter(k => selectedDays[k]).length;
                    if (selectedCount === 0) {
                      showToast('최소 하나의 날짜를 선택해 주세요.', 'AlertTriangle');
                      return;
                    }
                    setMobileStep('time-select');
                    showToast('선택하신 날짜의 상세 가능 시간대를 드래그하여 조율해 주세요.', 'check');
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl shadow-md transition flex justify-center items-center gap-1.5 text-xs"
                >
                  <span>다음 단계: 시간대 조율</span>
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Time Selection */}
          {mobileStep === 'time-select' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Week Tabs if 4 weeks */}
              {session.duration === '4weeks' && (
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex gap-1.5 shrink-0 overflow-x-auto custom-scrollbar">
                  {[1, 2, 3, 4].map(w => (
                    <button
                      key={w}
                      onClick={() => setCurrentActiveWeek(w)}
                      className={`flex-1 min-w-[60px] py-1.5 rounded-lg text-[10px] font-bold border transition ${
                        currentActiveWeek === w
                          ? 'border-indigo-200 bg-indigo-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {w}주차
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 bg-white border-y border-slate-200 flex flex-col overflow-hidden relative">
                {filteredActiveDates.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
                    <p className="text-xs font-bold text-slate-700">현재 {currentActiveWeek}주차에 선택된 조율 날짜가 없습니다.</p>
                    <p className="text-[10px] text-slate-400 mt-1 mb-4">다른 주차의 탭을 터치하시거나, 날짜 선택 단계로 돌아가서 날짜를 선택해 주세요.</p>
                    <button
                      onClick={() => setMobileStep('date-select')}
                      className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow"
                    >
                      이전 날짜 선택 단계로 돌아가기
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto custom-scrollbar relative" onTouchMove={handleTouchMove}>
                    <div className="p-3 bg-emerald-50 border-b border-emerald-100 flex flex-col gap-2">
                      <div className="text-[10px] text-emerald-800 leading-normal flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>원하는 칸을 <span className="font-extrabold text-emerald-700">0.5초 꾹 누르고 아래로 긁어내리면</span> 연속 세로 마스킹 선택이 가능합니다.</span>
                      </div>
                      <button
                        onClick={() => setIsCalendarFullscreen(true)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-[0.98]"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-indigo-200" />
                        <span>📱 모바일 전체화면으로 넓게 조율하기</span>
                      </button>
                    </div>
                    
                    <div className="grid" style={{ gridTemplateColumns: `50px repeat(${filteredActiveDates.length}, minmax(70px, 1fr))` }}>
                      <div className="header-corner-sticky flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      {filteredActiveDates.map((dateInfo) => (
                        <div
                          key={dateInfo.dateStr}
                          className="header-row-sticky flex items-center justify-center text-[10px] font-bold text-slate-600 py-2 border-r border-slate-100"
                        >
                          {dateInfo.formatted}
                        </div>
                      ))}

                      {/* Grid content rows */}
                      {timeslots.map(time => {
                        const cols = [
                          <div key={`time-${time}`} className="time-col-sticky text-[9px] font-semibold text-slate-500 flex items-start justify-center pt-1 border-b border-slate-100">
                            {time}
                          </div>
                        ];

                        filteredActiveDates.forEach((dateInfo) => {
                          const prefix = session.duration === '4weeks' ? `W${currentActiveWeek}-` : `W1-`;
                          const key = `${prefix}${dateInfo.dayNameEng}-${time}`;
                          const isSel = localGuestSchedule[key] || false;
                          const isHoldingThis = holdingCell === key;

                          cols.push(
                            <div
                              key={key}
                              data-slot={key}
                              onTouchStart={(e) => handleTouchStart(e, key, dateInfo.dayNameEng)}
                              onTouchEnd={(e) => handleTouchEnd(e, key)}
                              onClick={(e) => {
                                if (didDragOrHoldRef.current) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }
                              }}
                              className={`guest-slot-cell border-r border-b border-slate-100 p-0.5 min-h-[44px] cursor-pointer flex items-center justify-center select-none ${
                                isSel ? 'bg-emerald-100/60' : 'bg-white'
                              } ${isHoldingThis ? 'holding' : ''}`}
                            >
                              <div className="hold-indicator"></div>
                              <div className="cell-content w-full h-full flex items-center justify-center">
                                {isSel ? (
                                  <div className="w-full h-full bg-emerald-300 text-emerald-900 rounded flex items-center justify-center font-bold text-[9px] pointer-events-none shadow-sm">
                                    가능
                                  </div>
                                ) : (
                                  <span className="text-slate-200 text-[9px] hover:text-slate-400 pointer-events-none select-none">
                                    선택
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        });

                        return cols;
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white border-t border-slate-200 p-4 shrink-0 flex gap-2.5">
                <button
                  onClick={() => setMobileStep('date-select')}
                  className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl transition text-xs"
                >
                  뒤로 (날짜 수정)
                </button>
                <button
                  onClick={() => {
                    setMobileStep('review');
                    showToast('입력하신 전체 가능 일정을 최종 검토 후 제출해 주세요.', 'check');
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl shadow-md transition flex justify-center items-center gap-1.5 text-xs"
                >
                  <span>일정 최종 검토</span>
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Final Review */}
          {mobileStep === 'review' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl text-[11px] leading-relaxed text-emerald-900">
                  <span className="font-extrabold text-emerald-700 block mb-0.5">🔍 선택한 일정 최종 검토</span>
                  {guestName}님이 입력하신 날짜별 조율 시간대 내역입니다. 잘못 기재된 부분이 없는지 꼼꼼하게 검토 후 최종 제출을 완료해 주세요.
                </div>

                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">선택된 가용 스케줄 리스트</h3>
                  
                  {Object.keys(selectedSlotsGroupedByDay).length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                      선택된 가능 시간대가 없습니다. 이전 단계로 가셔서 시간대를 드래그하여 선택해 주세요!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(selectedSlotsGroupedByDay).map(([dayKey, times]) => (
                        <div key={dayKey} className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                          <div className="text-xs font-extrabold text-indigo-700 mb-1.5">
                            {getFormattedDateFromDayKey(dayKey)}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {times.sort().map(t => (
                              <span key={t} className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-lg border border-emerald-200 shadow-sm">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border-t border-slate-200 p-4 shrink-0 flex gap-2.5">
                <button
                  onClick={() => setMobileStep('time-select')}
                  className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl transition text-xs"
                >
                  뒤로 (시간대 수정)
                </button>
                <button
                  onClick={onSubmitReview}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-2xl shadow-lg transition flex justify-center items-center gap-1.5 text-xs"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>최종 제출 완료하기</span>
                </button>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section id="view-guest-survey" className="absolute inset-0 flex flex-col lg:flex-row bg-slate-50 overflow-hidden">
          {/* Left side info */}
          <div className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-4 shrink-0 flex flex-col justify-between overflow-y-auto max-h-[45vh] lg:max-h-none z-10 shadow-sm lg:shadow-none">
            <div className="space-y-4">
              <div>
                <span className="bg-pink-100 text-pink-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">일정 취합 양식</span>
                <h2 id="guest-survey-title" className="text-base font-bold text-slate-900 mt-1 leading-tight">{session.title}</h2>
                <p className="text-[10px] text-slate-400 mt-1" id="guest-survey-date-info">
                  기간: {session.startDate} ~ {session.endDate}
                </p>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] leading-relaxed">
                <span className="font-bold text-indigo-700 block mb-1">💡 세로 마스킹 제스처 가이드</span>
                원하는 시간대 셀을 <span className="font-bold text-indigo-600">0.5초 동안 꾹 누르고 계세요.</span> 그 상태에서 아래로 부드럽게 긁어내리면 연속된 일정이 한 번에 마스킹 처리됩니다.
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="block font-bold text-slate-700">참여자 성함 (본명 필수)</label>
                <div id="guest-name-input-container">
                  {session.guestMode === 'specified' ? (
                    <select
                      value={guestName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">-- 성함 선택 --</option>
                      {session.guests.map(g => (
                        <option key={g.name} value={g.name}>
                          {g.name} ({g.submitted ? '기제출-수정' : '미제출'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="정확한 본명 기입"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-2 shrink-0">
              <button
                onClick={onSubmitReview}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-md transition flex justify-center items-center gap-1.5 text-xs"
              >
                <Check className="w-4 h-4" />
                <span>내 일정 제출하기</span>
              </button>
            </div>
          </div>

          {/* Right side Calendar View */}
          <div className="flex-1 p-0 sm:p-5 flex flex-col overflow-hidden relative bg-slate-50 z-0">
            <div className="hidden sm:flex justify-between items-center mb-2 shrink-0">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                세로 마스킹 슬라이드 캘린더{' '}
                <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded font-bold">
                  0.5s Hold & Vertical Drag
                </span>
              </h3>
            </div>

            {/* Week Tabs */}
            {session.duration === '4weeks' && (
              <div id="guest-week-tabs-container" className="px-4 sm:px-0 mb-3 flex gap-1 shrink-0">
                {[1, 2, 3, 4].map(w => (
                  <button
                    key={w}
                    onClick={() => setCurrentActiveWeek(w)}
                    className={`guest-week-tab flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                      currentActiveWeek === w
                        ? 'border-indigo-200 bg-indigo-600 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {w}주차
                  </button>
                ))}
              </div>
            )}

            {/* Swipe-friendly Calendar */}
            <div className="flex-1 bg-white sm:rounded-xl shadow-sm border-y sm:border border-slate-200 flex flex-col overflow-hidden relative">
              <div className="flex-1 overflow-auto custom-scrollbar relative" id="guest-calendar-container" onTouchMove={handleTouchMove}>
                <div className="grid" id="guest-drag-grid" style={{ gridTemplateColumns: `50px repeat(${activeDates.length}, minmax(70px, 1fr))` }}>
                  <div className="header-corner-sticky flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                  </div>
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
                    const cols = [
                      <div key={`time-${time}`} className="time-col-sticky text-[9px] font-semibold text-slate-500 flex items-start justify-center pt-1 border-b border-slate-100">
                        {time}
                      </div>
                    ];

                    activeDates.forEach((dateInfo) => {
                      const prefix = session.duration === '4weeks' ? `W${currentActiveWeek}-` : `W1-`;
                      const key = `${prefix}${dateInfo.dayNameEng}-${time}`;
                      const isSel = localGuestSchedule[key] || false;
                      const isHoldingThis = holdingCell === key;

                      cols.push(
                        <div
                          key={key}
                          data-slot={key}
                          onMouseDown={(e) => handleMouseDown(e, key, dateInfo.dayNameEng)}
                          onMouseEnter={() => handleMouseEnter(key, dateInfo.dayNameEng)}
                          onTouchStart={(e) => handleTouchStart(e, key, dateInfo.dayNameEng)}
                          onTouchEnd={(e) => handleTouchEnd(e, key)}
                          onClick={(e) => {
                            if (didDragOrHoldRef.current) {
                              e.preventDefault();
                              e.stopPropagation();
                            }
                          }}
                          className={`guest-slot-cell border-r border-b border-slate-100 p-0.5 min-h-[44px] cursor-pointer flex items-center justify-center select-none ${
                            isSel ? 'bg-emerald-100/60' : 'bg-white'
                          } ${isHoldingThis ? 'holding' : ''}`}
                        >
                          <div className="hold-indicator"></div>
                          <div className="cell-content w-full h-full flex items-center justify-center">
                            {isSel ? (
                              <div className="w-full h-full bg-emerald-300 text-emerald-900 rounded flex items-center justify-center font-bold text-[9px] pointer-events-none shadow-sm">
                                가능
                              </div>
                            ) : (
                              <span className="text-slate-200 text-[9px] hover:text-slate-400 pointer-events-none select-none">
                                선택
                              </span>
                            )}
                          </div>
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
      )}

      {/* 9. Mobile Immersive Fullscreen Calendar */}
      {isMobile && isCalendarFullscreen && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-fade-in select-none">
          {/* Fullscreen Header */}
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <h3 className="text-xs font-bold leading-tight truncate max-w-[150px] sm:max-w-xs">{session.title}</h3>
                <span className="text-[9px] text-indigo-300 font-extrabold block">전체화면 몰입 조율 모드</span>
              </div>
            </div>
            
            <button
              onClick={() => setIsCalendarFullscreen(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition"
            >
              <Minimize2 className="w-3.5 h-3.5 text-slate-400" />
              <span>전체화면 종료</span>
            </button>
          </div>

          {/* Week Tabs if 4 weeks */}
          {session.duration === '4weeks' && (
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex gap-1.5 shrink-0 overflow-x-auto custom-scrollbar">
              {[1, 2, 3, 4].map(w => (
                <button
                  key={w}
                  onClick={() => setCurrentActiveWeek(w)}
                  className={`flex-1 min-w-[60px] py-2 rounded-xl text-[10px] font-bold border transition ${
                    currentActiveWeek === w
                      ? 'border-indigo-300 bg-indigo-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {w}주차 조율
                </button>
              ))}
            </div>
          )}

          {/* Core Calendar Grid in Fullscreen */}
          <div className="flex-1 bg-white flex flex-col overflow-hidden relative">
            {filteredActiveDates.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
                <p className="text-xs font-bold text-slate-700">현재 {currentActiveWeek}주차에 선택된 조율 날짜가 없습니다.</p>
                <p className="text-[10px] text-slate-400 mt-1 mb-4">날짜 선택 화면에서 조율할 날짜를 체크해 주세요.</p>
                <button
                  onClick={() => {
                    setIsCalendarFullscreen(false);
                    setMobileStep('date-select');
                  }}
                  className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow"
                >
                  날짜 선택 화면으로 가기
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-auto custom-scrollbar relative" onTouchMove={handleTouchMove}>
                <div className="p-3 bg-emerald-50 border-b border-emerald-100 text-[10px] text-emerald-800 leading-normal flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>원하는 시간대를 <span className="font-extrabold text-emerald-700">0.5초 꾹 누르고 세로로 긁으시면</span> 연속 선택이 됩니다.</span>
                </div>
                
                <div className="grid" style={{ gridTemplateColumns: `50px repeat(${filteredActiveDates.length}, minmax(70px, 1fr))` }}>
                  <div className="header-corner-sticky flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  {filteredActiveDates.map((dateInfo) => (
                    <div
                      key={dateInfo.dateStr}
                      className="header-row-sticky flex items-center justify-center text-[10px] font-bold text-slate-600 py-2.5 border-r border-slate-100"
                    >
                      {dateInfo.formatted}
                    </div>
                  ))}

                  {/* Grid content rows */}
                  {timeslots.map(time => {
                    const cols = [
                      <div key={`time-${time}`} className="time-col-sticky text-[9px] font-semibold text-slate-500 flex items-start justify-center pt-1 border-b border-slate-100">
                        {time}
                      </div>
                    ];

                    filteredActiveDates.forEach((dateInfo) => {
                      const prefix = session.duration === '4weeks' ? `W${currentActiveWeek}-` : `W1-`;
                      const key = `${prefix}${dateInfo.dayNameEng}-${time}`;
                      const isSel = localGuestSchedule[key] || false;
                      const isHoldingThis = holdingCell === key;

                      cols.push(
                        <div
                          key={key}
                          data-slot={key}
                          onTouchStart={(e) => handleTouchStart(e, key, dateInfo.dayNameEng)}
                          onTouchEnd={(e) => handleTouchEnd(e, key)}
                          onClick={(e) => {
                            if (didDragOrHoldRef.current) {
                              e.preventDefault();
                              e.stopPropagation();
                            }
                          }}
                          className={`guest-slot-cell border-r border-b border-slate-100 p-0.5 min-h-[46px] cursor-pointer flex items-center justify-center select-none ${
                            isSel ? 'bg-emerald-100/60' : 'bg-white'
                          } ${isHoldingThis ? 'holding' : ''}`}
                        >
                          <div className="hold-indicator"></div>
                          <div className="cell-content w-full h-full flex items-center justify-center">
                            {isSel ? (
                              <div className="w-full h-full bg-emerald-300 text-emerald-900 rounded-lg flex items-center justify-center font-bold text-[9px] pointer-events-none shadow-sm">
                                가능
                              </div>
                            ) : (
                              <span className="text-slate-200 text-[9px] hover:text-slate-400 pointer-events-none select-none">
                                선택
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    });

                    return cols;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen Action Footer */}
          <div className="bg-slate-50 border-t border-slate-200 p-4 shrink-0 flex items-center justify-between gap-3">
            <div className="text-left">
              <span className="text-[9px] text-slate-400 block font-bold leading-none mb-1">총 선택 시간대</span>
              <span className="text-xs font-extrabold text-indigo-600">
                {Object.keys(localGuestSchedule).length}개 선택됨
              </span>
            </div>
            
            <button
              onClick={() => {
                setIsCalendarFullscreen(false);
                showToast('캘린더 조율이 정상 완료되었습니다!');
              }}
              className="flex-1 max-w-[200px] bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl shadow-md transition flex justify-center items-center gap-1.5 text-xs active:scale-[0.98]"
            >
              <Check className="w-4 h-4" />
              <span>조율 완료 및 복귀</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
