<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { Clock, Info, Check, AlertTriangle, Lock, ShieldCheck, ArrowLeft, User, Sparkles, Maximize2, Minimize2 } from 'lucide-svelte';
  import type { Session } from '../types';
  import { getSessionDatesForWeek, getTotalWeeks } from '../utils/date';

  let {
    session,
    currentActiveWeek = $bindable(1),
    guestName = $bindable(''),
    localGuestSchedule = $bindable({}),
    onSubmitReview,
    currentUser,
    onLogin,
    showToast
  } = $props();

  const daysEng = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daysKor = ["일", "월", "화", "수", "목", "금", "토"];

  let activeDates = $derived(getSessionDatesForWeek(session.startDate, session.endDate, currentActiveWeek));

  // Drag-and-Hold state
  let holdingCell = $state<string | null>(null);
  let dragReady = $state(false);
  let dragStartState = $state(true);
  let lockedDay = $state<string | null>(null);

  let holdTimer: any = null;
  let touchMoved = false;
  let didDragOrHold = false;
  let touchStartPos: { x: number; y: number } | null = null;
  let isTouchActive = false;
  let holdingCellRef: string | null = null;

  onMount(() => {
    const handleGlobalMouseUp = () => {
      dragReady = false;
      lockedDay = null;
      holdingCell = null;
      setTimeout(() => {
        didDragOrHold = false;
      }, 100);
    };

    const handleGlobalMouseMove = () => {
      isTouchActive = false;
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      isTouchActive = true;
      if (dragReady) {
        if (e.cancelable) {
          e.preventDefault();
        }
        didDragOrHold = true;

        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const cell = element?.closest('.guest-slot-cell');
        if (cell) {
          const key = cell.getAttribute('data-slot');
          if (key) {
            const parts = key.split('-');
            if (parts.length === 3) {
              const day = parts[1];
              if (day === lockedDay && localGuestSchedule[key] !== dragStartState) {
                toggleSlot(key, dragStartState);
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
  });

  let isMobile = $state(false);
  let mobileStep = $state<'login' | 'date-select' | 'time-select' | 'review'>('login');
  let selectedDays = $state<Record<string, boolean>>({});
  let isCalendarFullscreen = $state(false);

  // Sub-steps for the split login overlay
  
  onMount(() => {
    const checkMobile = () => {
      isMobile = window.innerWidth < 1024;
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  });

  // Sync selected days from schedule
  $effect(() => {
    const days: Record<string, boolean> = {};
    Object.keys(localGuestSchedule).forEach(slotKey => {
      const parts = slotKey.split('-');
      if (parts.length >= 2) {
        const dayKey = `${parts[0]}-${parts[1]}`;
        days[dayKey] = true;
      }
    });
    selectedDays = { ...days, ...untrack(() => selectedDays) };
  });

  // Sync mobile step on guestName changes
  $effect(() => {
    if (currentUser?.displayName && !guestName.trim() && session.guestMode !== 'specified') {
      guestName = currentUser.displayName;
    }
    if (!guestName.trim()) {
      mobileStep = 'login';
    }
  });

  function getFormattedDateFromDayKey(dayKey: string) {
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
  }

  function getTimeslots(interval: number) {
    const slots: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += interval) {
        slots.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
      }
    }
    return slots;
  }

  let timeslots = $derived(getTimeslots(session.time_interval || 60));

  function isSlotAvailable(dateStr: string, timeStr: string) {
    if (!session.startDate || !session.endDate) return true;
    const current = `${dateStr}T${timeStr}`;
    return current >= session.startDate && current < session.endDate;
  }

  // Sync / Load existing guest schedule if name matches
  function handleNameChange(name: string) {
    guestName = name;
    const trimmed = name.trim();
    if (!trimmed) {
      localGuestSchedule = {};
      return;
    }

    const existingGuest = session.guests.find(g => g.name === trimmed);
    if (existingGuest && existingGuest.submitted) {
      localGuestSchedule = { ...existingGuest.schedule };
      showToast(`기존 일정 정보가 성공적으로 복원되었습니다. 수정 후 다시 제출해 주세요.`, "check");
    } else {
      localGuestSchedule = {};
    }
  }

  // Toggle single cell helper
  function toggleSlot(key: string, forceState?: boolean) {
    const nextState = forceState !== undefined ? forceState : !localGuestSchedule[key];
    if (nextState) {
      localGuestSchedule = { ...localGuestSchedule, [key]: true };
    } else {
      const next = { ...localGuestSchedule };
      delete next[key];
      localGuestSchedule = next;
    }
  }

  // Mouse Handlers
  function handleMouseDown(e: MouseEvent, key: string, day: string) {
    if (isTouchActive) return;
    
    e.preventDefault();
    holdingCell = key;
    
    dragReady = true;
    didDragOrHold = false;
    
    lockedDay = day;
    
    const startState = !localGuestSchedule[key];
    dragStartState = startState;
    
    toggleSlot(key, startState);
  }

  function handleMouseEnter(key: string, day: string) {
    if (isTouchActive) return;

    if (dragReady && day === lockedDay) {
      didDragOrHold = true;
      toggleSlot(key, dragStartState);
    }
  }

  // Touch Handlers
  function handleTouchStart(e: TouchEvent, key: string, day: string) {
    isTouchActive = true;
    const touch = e.touches[0];
    touchStartPos = { x: touch.clientX, y: touch.clientY };
    holdingCellRef = key;
    holdingCell = key;
    
    dragReady = false;
    touchMoved = false;
    didDragOrHold = false;

    if (holdTimer) {
      clearTimeout(holdTimer);
    }

    holdTimer = setTimeout(() => {
      if (!touchMoved) {
        dragReady = true;
        didDragOrHold = true;
        
        lockedDay = day;
        
        const startState = !localGuestSchedule[key];
        dragStartState = startState;
        
        toggleSlot(key, startState);

        if (navigator.vibrate) {
          navigator.vibrate(40);
        }
        showToast("세로 방향 연속 터치 선택 모드가 실행되었습니다.", "move");
      }
    }, 150);
  }

  function handleTouchMove(e: TouchEvent) {
    isTouchActive = true;
    const touch = e.touches[0];
    
    let distance = 0;
    if (touchStartPos) {
      const dx = touch.clientX - touchStartPos.x;
      const dy = touch.clientY - touchStartPos.y;
      distance = Math.sqrt(dx * dx + dy * dy);
    }

    if (!dragReady) {
      if (distance > 10) {
        touchMoved = true;
        if (holdTimer) {
          clearTimeout(holdTimer);
          holdTimer = null;
        }
        holdingCellRef = null;
        holdingCell = null;
      }
    }
  }

  function handleTouchEnd(e: TouchEvent, key: string) {
    isTouchActive = true;
    e.preventDefault();

    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }

    if (dragReady || touchMoved) {
      didDragOrHold = true;
    }

    if (holdingCellRef === key && !dragReady && !touchMoved) {
      toggleSlot(key);
    }

    holdingCellRef = null;
    holdingCell = null;
    dragReady = false;
    lockedDay = null;

    setTimeout(() => {
      didDragOrHold = false;
    }, 100);
  }

  // Group selected slots by day
  let selectedSlotsGroupedByDay = $derived.by(() => {
    const grouped: Record<string, string[]> = {};
    Object.keys(localGuestSchedule).forEach(slotKey => {
      const parts = slotKey.split('-');
      if (parts.length === 3) {
        const dayKey = `${parts[0]}-${parts[1]}`;
        const time = parts[2];
        if (!grouped[dayKey]) {
          grouped[dayKey] = [];
        }
        grouped[dayKey].push(time);
      }
    });
    return grouped;
  });

  let prefixStr = $derived(getTotalWeeks(session.startDate, session.endDate) > 1 ? `W${currentActiveWeek}-` : `W1-`);
  let filteredActiveDates = $derived(activeDates.filter(dateInfo => {
    const dayKey = `${prefixStr}${dateInfo.dayNameEng}`;
    return selectedDays[dayKey];
  }));

  // Render Login Overlay
  let showKakaoLogin = $derived(!currentUser || !guestName.trim() || mobileStep === 'login');
</script>

{#if showKakaoLogin}
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-200">
        {#if !currentUser}
          <div class="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
            <ShieldCheck class="w-6 h-6 text-indigo-600" />
          </div>
          <h3 class="text-sm font-extrabold text-slate-900 mb-1.5 leading-tight">
            일정 조율 참여 로그인
          </h3>
          <p class="text-[11px] text-slate-400 mb-6">
            원활한 일정 조율과 중복 입력 방지를 위해 구글 로그인이 필요합니다.
          </p>
          <div class="space-y-2.5">
            <button
              onclick={() => onLogin('Google')}
              class="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl border border-slate-200 shadow-sm transition flex items-center justify-center gap-2 text-xs"
            >
              <span class="text-red-500 font-extrabold text-xs">G</span>
              <span>Google 계정으로 계속하기</span>
            </button>
          </div>
        {:else}
          <div class="mx-auto w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
            <User class="w-6 h-6 text-emerald-600" />
          </div>

          <h3 class="text-sm font-extrabold text-slate-900 mb-1.5 leading-tight">
            참여자 본명 확인
          </h3>
          <p class="text-[11px] text-slate-400 mb-6">
            캘린더 취합 시 다른 참여자가 본인을 알아볼 수 있도록 실제 이름을 사용해 주세요.
          </p>

          <div class="space-y-4 text-left mb-6">
            <label for="guest-name-input1" class="block font-bold text-slate-700 text-[11px]">참여자 본명 입력</label>
            <div>
              {#if session.guestMode === 'specified'}
                <select
                  value={guestName}
                  onchange={(e: any) => handleNameChange(e.target.value)}
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">-- 성함 선택 --</option>
                  {#each session.guests as g}
                    <option value={g.name}>
                      {g.name} ({g.submitted ? '기제출-수정' : '미제출'})
                    </option>
                  {/each}
                </select>
              {:else}
                <input
                  type="text"
                  value={guestName}
                  oninput={(e: any) => handleNameChange(e.target.value)}
                  placeholder="예: 홍길동 (정확한 본명 기입)"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              {/if}
            </div>
          </div>

          <div class="flex gap-2.5">
            <button
              onclick={() => {
                if (!guestName.trim()) {
                  showToast('본명을 정확히 입력해 주세요.', 'AlertTriangle');
                  return;
                }
                mobileStep = 'date-select';
                showToast(`${guestName}님 환영합니다! 이제 일정 조율을 시작합니다.`, 'check');
              }}
              class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl shadow-lg hover:shadow-xl transition flex justify-center items-center gap-1.5 text-xs"
            >
              <span>입력 완료 및 참여하기</span>
            </button>
          </div>
        {/if}
      </div>
    </div>
{/if}

{#if isMobile}
  <section id="view-guest-survey-mobile" class="absolute inset-0 flex flex-col bg-slate-50 overflow-hidden select-none">
    <!-- Mobile Header -->
    <div class="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm z-30">
      <div class="flex items-center gap-2">
        <div class="bg-indigo-600 text-white p-1.5 rounded-lg">
          <Clock class="w-4 h-4" />
        </div>
        <div>
          <h2 class="text-xs font-bold text-slate-900 leading-tight truncate max-w-[150px] sm:max-w-[200px]">{session.title}</h2>
          <p class="text-[9px] text-indigo-600 font-bold">
            {#if mobileStep === 'date-select'}단계 1: 가능한 날짜 선택{/if}
            {#if mobileStep === 'time-select'}단계 2: 가능한 시간대 조율{/if}
            {#if mobileStep === 'review'}단계 3: 최종 검토 및 제출{/if}
          </p>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <span class="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full">
          {guestName || '게스트'} 님
        </span>
        <button
          onclick={() => {
            guestName = '';
            localGuestSchedule = {};
            mobileStep = 'login';
          }}
          class="text-[9px] text-red-500 font-bold border border-red-200 bg-red-50 px-1.5 py-1 rounded-lg"
        >
          로그아웃
        </button>
      </div>
    </div>

    <!-- Step Indicator Bar -->
    <div class="bg-white px-4 py-2 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 shrink-0">
      <div class="flex items-center gap-1.5">
        <span class="w-4 h-4 rounded-full flex items-center justify-center text-[9px] {mobileStep === 'date-select' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}">1</span>
        <span class={mobileStep === 'date-select' ? 'text-indigo-600' : ''}>날짜 선택</span>
      </div>
      <div class="h-px bg-slate-200 flex-1 mx-3"></div>
      <div class="flex items-center gap-1.5">
        <span class="w-4 h-4 rounded-full flex items-center justify-center text-[9px] {mobileStep === 'time-select' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}">2</span>
        <span class={mobileStep === 'time-select' ? 'text-indigo-600' : ''}>시간대 조율</span>
      </div>
      <div class="h-px bg-slate-200 flex-1 mx-3"></div>
      <div class="flex items-center gap-1.5">
        <span class="w-4 h-4 rounded-full flex items-center justify-center text-[9px] {mobileStep === 'review' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}">3</span>
        <span class={mobileStep === 'review' ? 'text-indigo-600' : ''}>최종 검토</span>
      </div>
    </div>

    <!-- Step 1: Date Selection -->
    {#if mobileStep === 'date-select'}
      <div class="flex-1 flex flex-col overflow-hidden">
        {#if getTotalWeeks(session.startDate, session.endDate) > 1}
          <div class="px-4 py-2 bg-slate-50 border-b border-slate-100 flex gap-1.5 shrink-0 overflow-x-auto custom-scrollbar">
            {#each Array.from({length: getTotalWeeks(session.startDate, session.endDate)}, (_, i) => i + 1) as w}
              <button
                onclick={() => currentActiveWeek = w}
                class="flex-1 min-w-[60px] py-1.5 rounded-lg text-[10px] font-bold border transition {
                  currentActiveWeek === w
                    ? 'border-indigo-200 bg-indigo-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }"
              >
                {w}주차
              </button>
            {/each}
          </div>
        {/if}

        <div class="flex-1 overflow-y-auto p-4 space-y-2.5">
          <div class="p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-[11px] leading-relaxed text-indigo-900">
            <span class="font-extrabold text-indigo-700 block mb-0.5">📅 조율 가능한 캘린더 날짜 선택</span>
            이번 일정 조율에서 조율을 원하는 날짜들을 아래에서 모두 체크해 주세요. 해당 날짜들에 대해서 다음 단계에서 상세 시간을 맞추게 됩니다.
          </div>

          <div class="grid grid-cols-1 gap-2">
            {#each activeDates as dateInfo (dateInfo.dateStr)}
              {@const prefix = getTotalWeeks(session.startDate, session.endDate) > 1 ? `W${currentActiveWeek}-` : `W1-`}
              {@const dayKey = `${prefix}${dateInfo.dayNameEng}`}
              {@const isSel = selectedDays[dayKey] || false}
              {@const selectedSlotsForDayCount = Object.keys(localGuestSchedule).filter(k => k.startsWith(`${dayKey}-`)).length}

              <button
                onclick={() => {
                  if (selectedDays[dayKey]) {
                    const nextDays = { ...selectedDays };
                    delete nextDays[dayKey];
                    selectedDays = nextDays;

                    const nextSched = { ...localGuestSchedule };
                    Object.keys(nextSched).forEach(slotKey => {
                      if (slotKey.startsWith(`${dayKey}-`)) {
                        delete nextSched[slotKey];
                      }
                    });
                    localGuestSchedule = nextSched;
                  } else {
                    selectedDays = { ...selectedDays, [dayKey]: true };
                  }
                }}
                class="flex items-center justify-between p-4 rounded-2xl border-2 transition text-left {
                  isSel
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }"
              >
                <div class="flex items-center gap-3">
                  <div class="w-5 h-5 rounded-full border flex items-center justify-center transition-colors {
                    isSel ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white text-transparent'
                  }">
                    <Check class="w-3 h-3 stroke-[3]" />
                  </div>
                  <div>
                    <span class="text-xs font-bold text-slate-800">{dateInfo.formatted}</span>
                    <span class="text-[10px] text-slate-400 ml-1.5">({dateInfo.dayNameKor}요일)</span>
                  </div>
                </div>
                {#if isSel && selectedSlotsForDayCount > 0}
                  <span class="bg-emerald-100 text-emerald-800 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-sm">
                    시간 {selectedSlotsForDayCount}개 선택됨
                  </span>
                {/if}
              </button>
            {/each}
          </div>
        </div>

        <div class="bg-white border-t border-slate-200 p-4 shrink-0">
          <button
            onclick={() => {
              const selectedCount = Object.keys(selectedDays).filter(k => selectedDays[k]).length;
              if (selectedCount === 0) {
                showToast('최소 하나의 날짜를 선택해 주세요.', 'AlertTriangle');
                return;
              }
              mobileStep = 'time-select';
              showToast('선택하신 날짜의 상세 가능 시간대를 드래그하여 조율해 주세요.', 'check');
            }}
            class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl shadow-md transition flex justify-center items-center gap-1.5 text-xs"
          >
            <span>다음 단계: 시간대 조율</span>
            <Check class="w-4 h-4" />
          </button>
        </div>
      </div>
    {/if}

    <!-- Step 2: Time Selection -->
    {#if mobileStep === 'time-select'}
      <div class="flex-1 flex flex-col overflow-hidden">
        {#if getTotalWeeks(session.startDate, session.endDate) > 1}
          <div class="px-4 py-2 bg-slate-50 border-b border-slate-100 flex gap-1.5 shrink-0 overflow-x-auto custom-scrollbar">
            {#each Array.from({length: getTotalWeeks(session.startDate, session.endDate)}, (_, i) => i + 1) as w}
              <button
                onclick={() => currentActiveWeek = w}
                class="flex-1 min-w-[60px] py-1.5 rounded-lg text-[10px] font-bold border transition {
                  currentActiveWeek === w
                    ? 'border-indigo-200 bg-indigo-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }"
              >
                {w}주차
              </button>
            {/each}
          </div>
        {/if}

        <div class="flex-1 bg-white border-y border-slate-200 flex flex-col overflow-hidden relative">
          {#if filteredActiveDates.length === 0}
            <div class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
              <AlertTriangle class="w-8 h-8 text-amber-500 mb-2" />
              <p class="text-xs font-bold text-slate-700">현재 {currentActiveWeek}주차에 선택된 조율 날짜가 없습니다.</p>
              <p class="text-[10px] text-slate-400 mt-1 mb-4">다른 주차의 탭을 터치하시거나, 날짜 선택 단계로 돌아가서 날짜를 선택해 주세요.</p>
              <button
                onclick={() => mobileStep = 'date-select'}
                class="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow"
              >
                이전 날짜 선택 단계로 돌아가기
              </button>
            </div>
          {:else}
            <div class="flex-1 overflow-auto custom-scrollbar relative" role="presentation" ontouchmove={handleTouchMove}>
              <div class="p-3 bg-emerald-50 border-b border-emerald-100 flex flex-col gap-2">
                <div class="text-[10px] text-emerald-800 leading-normal flex items-start gap-1.5">
                  <Info class="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>원하는 칸을 <span class="font-extrabold text-emerald-700">0.5초 꾹 누르고 아래로 긁어내리면</span> 연속 세로 마스킹 선택이 가능합니다.</span>
                </div>
                <button
                  onclick={() => isCalendarFullscreen = true}
                  class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-[0.98]"
                >
                  <Maximize2 class="w-3.5 h-3.5 text-indigo-200" />
                  <span>📱 모바일 전체화면으로 넓게 조율하기</span>
                </button>
              </div>
              
              <div class="grid" style="grid-template-columns: 50px repeat({filteredActiveDates.length}, minmax(50px, 1fr))">
                <div class="header-corner-sticky flex items-center justify-center">
                  <Clock class="w-3.5 h-3.5 text-slate-400" />
                </div>
                {#each filteredActiveDates as dateInfo}
                  <div
                    class="header-row-sticky flex items-center justify-center text-[10px] font-bold text-slate-600 py-2 border-r border-slate-100"
                  >
                    {dateInfo.formatted}
                  </div>
                {/each}

                {#each timeslots as time}
                  <div class="time-col-sticky text-[9px] font-semibold text-slate-500 flex items-start justify-center pt-1 border-b border-slate-100">
                    {time}
                  </div>
                  {#each filteredActiveDates as dateInfo}
                    {@const prefix = getTotalWeeks(session.startDate, session.endDate) > 1 ? `W${currentActiveWeek}-` : `W1-`}
                    {@const key = `${prefix}${dateInfo.dayNameEng}-${time}`}
                    {@const isSel = localGuestSchedule[key] || false}
                    {@const isHoldingThis = holdingCell === key}
                    {@const isAvailable = isSlotAvailable(dateInfo.dateStr, time)}
                    <div
                      data-slot={key}
                      ontouchstart={(e) => { if (isAvailable) handleTouchStart(e, key, dateInfo.dayNameEng); }}
                      ontouchend={(e) => { if (isAvailable) handleTouchEnd(e, key); }}
                      onclick={(e) => {
                        if (!isAvailable) return;
                        if (didDragOrHold) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      onkeydown={() => {}}
                      role="button"
                      tabindex="0"
                      class="guest-slot-cell border-r border-b border-slate-100 p-0.5 min-h-[28px] cursor-pointer flex items-center justify-center select-none {
                        !isAvailable ? 'bg-red-50/60 pointer-events-none cursor-not-allowed' : (isSel ? 'bg-emerald-100/60' : 'bg-white')
                      } {isHoldingThis ? 'holding' : ''}"
                    >
                      <div class="hold-indicator"></div>
                      <div class="cell-content w-full h-full flex items-center justify-center">
                        {#if !isAvailable}
                          <span class="text-red-300 text-[9px] pointer-events-none font-bold">불가</span>
                        {:else if isSel}
                          <div class="w-full h-full bg-emerald-300 text-emerald-900 rounded flex items-center justify-center font-bold text-[9px] pointer-events-none shadow-sm">
                            가능
                          </div>
                        {:else}
                          <span class="text-slate-200 text-[9px] hover:text-slate-400 pointer-events-none select-none">
                            선택
                          </span>
                        {/if}
                      </div>
                    </div>
                  {/each}
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <div class="bg-white border-t border-slate-200 p-4 shrink-0 flex gap-2.5">
          <button
            onclick={() => mobileStep = 'date-select'}
            class="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl transition text-xs"
          >
            뒤로 (날짜 수정)
          </button>
          <button
            onclick={() => {
              mobileStep = 'review';
              showToast('입력하신 전체 가능 일정을 최종 검토 후 제출해 주세요.', 'check');
            }}
            class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl shadow-md transition flex justify-center items-center gap-1.5 text-xs"
          >
            <span>일정 최종 검토</span>
            <Check class="w-4 h-4" />
          </button>
        </div>
      </div>
    {/if}

    <!-- Step 3: Final Review -->
    {#if mobileStep === 'review'}
      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <div class="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl text-[11px] leading-relaxed text-emerald-900">
            <span class="font-extrabold text-emerald-700 block mb-0.5">🔍 선택한 일정 최종 검토</span>
            {guestName}님이 입력하신 날짜별 조율 시간대 내역입니다. 잘못 기재된 부분이 없는지 꼼꼼하게 검토 후 최종 제출을 완료해 주세요.
          </div>

          <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 class="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">선택된 가용 스케줄 리스트</h3>
            
            {#if Object.keys(selectedSlotsGroupedByDay).length === 0}
              <div class="text-center py-6 text-slate-400 text-xs font-semibold">
                선택된 가능 시간대가 없습니다. 이전 단계로 가셔서 시간대를 드래그하여 선택해 주세요!
              </div>
            {:else}
              <div class="space-y-3">
                {#each Object.entries(selectedSlotsGroupedByDay) as [dayKey, times]}
                  <div class="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                    <div class="text-xs font-extrabold text-indigo-700 mb-1.5">
                      {getFormattedDateFromDayKey(dayKey)}
                    </div>
                    <div class="flex flex-wrap gap-1">
                      {#each times.sort() as t}
                        <span class="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-lg border border-emerald-200 shadow-sm">
                          {t}
                        </span>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <div class="bg-white border-t border-slate-200 p-4 shrink-0 flex gap-2.5">
          <button
            onclick={() => mobileStep = 'time-select'}
            class="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl transition text-xs"
          >
            뒤로 (시간대 수정)
          </button>
          <button
            onclick={onSubmitReview}
            class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-2xl shadow-lg transition flex justify-center items-center gap-1.5 text-xs"
          >
            <Check class="w-4 h-4 stroke-[2.5]" />
            <span>최종 제출 완료하기</span>
          </button>
        </div>
      </div>
    {/if}
  </section>
{:else}
  <section id="view-guest-survey" class="absolute inset-0 flex flex-col lg:flex-row bg-slate-50 overflow-hidden">
    <!-- Left side info -->
    <div class="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-4 shrink-0 flex flex-col justify-between overflow-y-auto max-h-[45vh] lg:max-h-none z-10 shadow-sm lg:shadow-none">
      <div class="space-y-4">
        <div>
          <span class="bg-pink-100 text-pink-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">일정 취합 양식</span>
          <h2 id="guest-survey-title" class="text-base font-bold text-slate-900 mt-1 leading-tight">{session.title}</h2>
          <p class="text-[10px] text-slate-400 mt-1" id="guest-survey-date-info">
            기간: {session.startDate.replace("T", " ")} ~ {session.endDate.replace("T", " ")}
          </p>
        </div>

        <div class="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] leading-relaxed">
          <span class="font-bold text-indigo-700 block mb-1">💡 세로 마스킹 제스처 가이드</span>
          원하는 시간대 셀을 <span class="font-bold text-indigo-600">0.5초 동안 꾹 누르고 계세요.</span> 그 상태에서 아래로 부드럽게 긁어내리면 연속된 일정이 한 번에 마스킹 처리됩니다.
        </div>

        <div class="space-y-1.5 text-xs">
          <label for="guest-name-input2" class="block font-bold text-slate-700">참여자 성함 (본명 필수)</label>
          <div id="guest-name-input-container">
            {#if session.guestMode === 'specified'}
              <select
                value={guestName}
                onchange={(e: any) => handleNameChange(e.target.value)}
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">-- 성함 선택 --</option>
                {#each session.guests as g}
                  <option value={g.name}>
                    {g.name} ({g.submitted ? '기제출-수정' : '미제출'})
                  </option>
                {/each}
              </select>
            {:else}
              <input
                type="text"
                value={guestName}
                oninput={(e: any) => handleNameChange(e.target.value)}
                placeholder="정확한 본명 기입"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            {/if}
          </div>
        </div>
      </div>
      <div class="pt-4 border-t border-slate-100 mt-2 shrink-0">
        <button
          onclick={onSubmitReview}
          class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-md transition flex justify-center items-center gap-1.5 text-xs"
        >
          <Check class="w-4 h-4" />
          <span>내 일정 제출하기</span>
        </button>
      </div>
    </div>

    <!-- Right side Calendar View -->
    <div class="flex-1 p-0 sm:p-5 flex flex-col overflow-hidden relative bg-slate-50 z-0">
      <div class="hidden sm:flex justify-between items-center mb-2 shrink-0">
        <h3 class="text-xs font-bold text-slate-900 flex items-center gap-2">
          세로 마스킹 슬라이드 캘린더{' '}
          <span class="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded font-bold">
            0.5s Hold & Vertical Drag
          </span>
        </h3>
      </div>

      <!-- Week Tabs -->
      {#if getTotalWeeks(session.startDate, session.endDate) > 1}
        <div id="guest-week-tabs-container" class="px-4 sm:px-0 mb-3 flex gap-1 shrink-0">
          {#each Array.from({length: getTotalWeeks(session.startDate, session.endDate)}, (_, i) => i + 1) as w}
            <button
              onclick={() => currentActiveWeek = w}
              class="guest-week-tab flex-1 py-1.5 rounded-lg text-xs font-bold border transition {
                currentActiveWeek === w
                  ? 'border-indigo-200 bg-indigo-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }"
            >
              {w}주차
            </button>
          {/each}
        </div>
      {/if}

      <!-- Swipe-friendly Calendar -->
      <div class="flex-1 bg-white sm:rounded-xl shadow-sm border-y sm:border border-slate-200 flex flex-col overflow-hidden relative">
        <div class="flex-1 overflow-auto custom-scrollbar relative" id="guest-calendar-container" role="presentation" ontouchmove={handleTouchMove}>
          <div class="grid" id="guest-drag-grid" style="grid-template-columns: 50px repeat({activeDates.length}, minmax(50px, 1fr))">
            <div class="header-corner-sticky flex items-center justify-center">
              <Clock class="w-3.5 h-3.5 text-slate-400" />
            </div>
            {#each activeDates as dateInfo (dateInfo.dateStr)}
              <div
                class="header-row-sticky flex items-center justify-center text-[10px] font-bold text-slate-600 py-2 border-r border-slate-100"
              >
                {dateInfo.formatted}
              </div>
            {/each}

            <!-- Grid content rows -->
            {#each timeslots as time}
              <div class="time-col-sticky text-[9px] font-semibold text-slate-500 flex items-start justify-center pt-1 border-b border-slate-100">
                {time}
              </div>
              {#each activeDates as dateInfo (dateInfo.dateStr)}
                {@const prefix = getTotalWeeks(session.startDate, session.endDate) > 1 ? `W${currentActiveWeek}-` : `W1-`}
                {@const key = `${prefix}${dateInfo.dayNameEng}-${time}`}
                {@const isSel = localGuestSchedule[key] || false}
                {@const isHoldingThis = holdingCell === key}
                {@const isAvailable = isSlotAvailable(dateInfo.dateStr, time)}
                <div
                  data-slot={key}
                  onmousedown={(e) => { if (isAvailable) handleMouseDown(e, key, dateInfo.dayNameEng); }}
                  onmouseenter={() => { if (isAvailable) handleMouseEnter(key, dateInfo.dayNameEng); }}
                  ontouchstart={(e) => { if (isAvailable) handleTouchStart(e, key, dateInfo.dayNameEng); }}
                  ontouchend={(e) => { if (isAvailable) handleTouchEnd(e, key); }}
                  onclick={(e) => {
                    if (!isAvailable) return;
                    if (didDragOrHold) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  onkeydown={() => {}}
                  role="button"
                  tabindex="0"
                  class="guest-slot-cell border-r border-b border-slate-100 p-0.5 min-h-[28px] cursor-pointer flex items-center justify-center select-none {
                    !isAvailable ? 'bg-red-50/60 pointer-events-none cursor-not-allowed' : (isSel ? 'bg-emerald-100/60' : 'bg-white')
                  } {isHoldingThis ? 'holding' : ''}"
                >
                  <div class="hold-indicator"></div>
                  <div class="cell-content w-full h-full flex items-center justify-center">
                    {#if !isAvailable}
                      <span class="text-red-300 text-[9px] pointer-events-none font-bold">불가</span>
                    {:else if isSel}
                      <div class="w-full h-full bg-emerald-300 text-emerald-900 rounded flex items-center justify-center font-bold text-[9px] pointer-events-none shadow-sm">
                        가능
                      </div>
                    {:else}
                      <span class="text-slate-200 text-[9px] hover:text-slate-400 pointer-events-none select-none">
                        선택
                      </span>
                    {/if}
                  </div>
                </div>
              {/each}
            {/each}
          </div>
        </div>
      </div>
    </div>
  </section>
{/if}

<!-- 9. Mobile Immersive Fullscreen Calendar -->
{#if isMobile && isCalendarFullscreen}
  <div class="fixed inset-0 bg-white z-[60] flex flex-col animate-fade-in select-none">
    <!-- Fullscreen Header -->
    <div class="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
      <div class="flex items-center gap-2">
        <div class="bg-indigo-600 text-white p-1.5 rounded-lg">
          <Clock class="w-3.5 h-3.5" />
        </div>
        <div class="text-left">
          <h3 class="text-xs font-bold leading-tight truncate max-w-[150px] sm:max-w-xs">{session.title}</h3>
          <span class="text-[9px] text-indigo-300 font-extrabold block">전체화면 몰입 조율 모드</span>
        </div>
      </div>
      
      <button
        onclick={() => isCalendarFullscreen = false}
        class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition"
      >
        <Minimize2 class="w-3.5 h-3.5 text-slate-400" />
        <span>전체화면 종료</span>
      </button>
    </div>

    <!-- Week Tabs if 4 weeks -->
    {#if getTotalWeeks(session.startDate, session.endDate) > 1}
      <div class="px-4 py-2 bg-slate-50 border-b border-slate-200 flex gap-1.5 shrink-0 overflow-x-auto custom-scrollbar">
        {#each Array.from({length: getTotalWeeks(session.startDate, session.endDate)}, (_, i) => i + 1) as w}
          <button
            onclick={() => currentActiveWeek = w}
            class="flex-1 min-w-[60px] py-2 rounded-xl text-[10px] font-bold border transition {
              currentActiveWeek === w
                ? 'border-indigo-300 bg-indigo-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }"
          >
            {w}주차 조율
          </button>
        {/each}
      </div>
    {/if}

    <!-- Core Calendar Grid in Fullscreen -->
    <div class="flex-1 bg-white flex flex-col overflow-hidden relative">
      {#if filteredActiveDates.length === 0}
        <div class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
          <AlertTriangle class="w-8 h-8 text-amber-500 mb-2" />
          <p class="text-xs font-bold text-slate-700">현재 {currentActiveWeek}주차에 선택된 조율 날짜가 없습니다.</p>
          <p class="text-[10px] text-slate-400 mt-1 mb-4">날짜 선택 화면에서 조율할 날짜를 체크해 주세요.</p>
          <button
            onclick={() => {
              isCalendarFullscreen = false;
              mobileStep = 'date-select';
            }}
            class="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow"
          >
            날짜 선택 화면으로 가기
          </button>
        </div>
      {:else}
        <div class="flex-1 overflow-auto custom-scrollbar relative" role="presentation" ontouchmove={handleTouchMove}>
          <div class="p-3 bg-emerald-50 border-b border-emerald-100 text-[10px] text-emerald-800 leading-normal flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>원하는 시간대를 <span class="font-extrabold text-emerald-700">0.5초 꾹 누르고 세로로 긁으시면</span> 연속 선택이 됩니다.</span>
          </div>
          
          <div class="grid" style="grid-template-columns: 50px repeat({filteredActiveDates.length}, minmax(50px, 1fr))">
            <div class="header-corner-sticky flex items-center justify-center">
              <Clock class="w-3.5 h-3.5 text-slate-400" />
            </div>
            {#each filteredActiveDates as dateInfo}
              <div
                class="header-row-sticky flex items-center justify-center text-[10px] font-bold text-slate-600 py-2.5 border-r border-slate-100"
              >
                {dateInfo.formatted}
              </div>
            {/each}

            <!-- Grid content rows -->
            {#each timeslots as time}
              <div class="time-col-sticky text-[9px] font-semibold text-slate-500 flex items-start justify-center pt-1 border-b border-slate-100">
                {time}
              </div>
              {#each filteredActiveDates as dateInfo}
                {@const prefix = getTotalWeeks(session.startDate, session.endDate) > 1 ? `W${currentActiveWeek}-` : `W1-`}
                {@const key = `${prefix}${dateInfo.dayNameEng}-${time}`}
                {@const isSel = localGuestSchedule[key] || false}
                {@const isHoldingThis = holdingCell === key}
                {@const isAvailable = isSlotAvailable(dateInfo.dateStr, time)}
                <div
                  data-slot={key}
                  ontouchstart={(e) => { if (isAvailable) handleTouchStart(e, key, dateInfo.dayNameEng); }}
                  ontouchend={(e) => { if (isAvailable) handleTouchEnd(e, key); }}
                  onclick={(e) => {
                    if (!isAvailable) return;
                    if (didDragOrHold) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  onkeydown={() => {}}
                  role="button"
                  tabindex="0"
                  class="guest-slot-cell border-r border-b border-slate-100 p-0.5 min-h-[28px] cursor-pointer flex items-center justify-center select-none {
                    !isAvailable ? 'bg-red-50/60 pointer-events-none cursor-not-allowed' : (isSel ? 'bg-emerald-100/60' : 'bg-white')
                  } {isHoldingThis ? 'holding' : ''}"
                >
                  <div class="hold-indicator"></div>
                  <div class="cell-content w-full h-full flex items-center justify-center">
                    {#if !isAvailable}
                      <span class="text-red-300 text-[9px] pointer-events-none font-bold">불가</span>
                    {:else if isSel}
                      <div class="w-full h-full bg-emerald-300 text-emerald-900 rounded-lg flex items-center justify-center font-bold text-[9px] pointer-events-none shadow-sm">
                        가능
                      </div>
                    {:else}
                      <span class="text-slate-200 text-[9px] hover:text-slate-400 pointer-events-none select-none">
                        선택
                      </span>
                    {/if}
                  </div>
                </div>
              {/each}
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Fullscreen Action Footer -->
    <div class="bg-slate-50 border-t border-slate-200 p-4 shrink-0 flex items-center justify-between gap-3">
      <div class="text-left">
        <span class="text-[9px] text-slate-400 block font-bold leading-none mb-1">총 선택 시간대</span>
        <span class="text-xs font-extrabold text-indigo-600">
          {Object.keys(localGuestSchedule).length}개 선택됨
        </span>
      </div>
      
      <button
        onclick={() => {
          isCalendarFullscreen = false;
          showToast('캘린더 조율이 정상 완료되었습니다!');
        }}
        class="flex-1 max-w-[200px] bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl shadow-md transition flex justify-center items-center gap-1.5 text-xs active:scale-[0.98]"
      >
        <Check class="w-4 h-4" />
        <span>조율 완료 및 복귀</span>
      </button>
    </div>
  </div>
{/if}
