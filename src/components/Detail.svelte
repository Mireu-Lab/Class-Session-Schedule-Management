<script lang="ts">
  import { 
    Clock, Zap, FileText, FileSpreadsheet, Cloud, FileDown, Image as ImageIcon, Settings, Users, Download, Share2, X, Menu, Info 
  } from 'lucide-svelte';
  import type { Session } from '../types';
  import { getSessionDatesForWeek, getTotalWeeks } from '../utils/date';

  let {
    session,
    canEditSession = false,
    currentActiveWeek = $bindable(1),
    selectedAnalysisView = $bindable('heatmap'),
    onBackToDashboard,
    onUpdateSessionSettings,
    onExport,
    onConfirmTimeslot,
    onConfirmTimeslotsUpdate,
    onTriggerReminder,
    onShareSurveyLink
  } = $props();

  let expiry = $state('');
  let preventDup = $state(false);
  let allowMutation = $state(false);
  let isMenuOpen = $state(false);

  // Drag to select state
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
  let isSaving = $state(false);

  // We manage the confirmed slots locally while dragging
  let localConfirmedSlots = $state<Record<string, boolean>>({});

  $effect(() => {
    if (!isTouchActive && !dragReady && !didDragOrHold) {
      const arr = Array.isArray(session.confirmedSlot) ? session.confirmedSlot : (session.confirmedSlot ? [session.confirmedSlot] : []);
      const nextState: Record<string, boolean> = {};
      arr.forEach(k => nextState[k] = true);
      localConfirmedSlots = nextState;
    }
  });

  import { onMount } from 'svelte';
  onMount(() => {
    const handleGlobalMouseUp = () => {
      if (dragReady || didDragOrHold) {
        saveConfirmedSlots();
      }
      dragReady = false;
      lockedDay = null;
      holdingCell = null;
      setTimeout(() => {
        didDragOrHold = false;
        isTouchActive = false;
      }, 50);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  });

  function toggleSlot(key: string, forceState: boolean) {
    if (!canEditSession) return;
    localConfirmedSlots = { ...localConfirmedSlots, [key]: forceState };
  }

  function handleMouseDown(e: MouseEvent, key: string, day: string) {
    if (!canEditSession || isTouchActive) return;
    e.preventDefault();
    holdingCell = key;
    dragReady = true;
    didDragOrHold = false;
    lockedDay = day;
    const startState = !localConfirmedSlots[key];
    dragStartState = startState;
    toggleSlot(key, startState);
  }

  function handleMouseEnter(key: string, day: string) {
    if (!canEditSession || isTouchActive) return;
    if (dragReady && day === lockedDay) {
      didDragOrHold = true;
      toggleSlot(key, dragStartState);
    }
  }

  function handleTouchStart(e: TouchEvent, key: string, day: string) {
    if (!canEditSession) return;
    isTouchActive = true;
    const touch = e.touches[0];
    touchStartPos = { x: touch.clientX, y: touch.clientY };
    holdingCellRef = key;
    holdingCell = key;
    dragReady = false;
    touchMoved = false;
    didDragOrHold = false;

    if (holdTimer) clearTimeout(holdTimer);

    holdTimer = setTimeout(() => {
      if (!touchMoved) {
        dragReady = true;
        didDragOrHold = true;
        lockedDay = day;
        const startState = !localConfirmedSlots[key];
        dragStartState = startState;
        toggleSlot(key, startState);
        if (navigator.vibrate) navigator.vibrate(50);
      }
    }, 400);
  }

  function handleTouchMove(e: TouchEvent) {
    if (!canEditSession || !touchStartPos || !holdingCellRef) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.x);
    const dy = Math.abs(touch.clientY - touchStartPos.y);

    if (dx > 10 || dy > 10) {
      touchMoved = true;
      if (!dragReady && holdTimer) {
        clearTimeout(holdTimer);
        holdingCell = null;
        holdingCellRef = null;
      }
    }

    if (dragReady) {
      e.preventDefault();
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const slotEl = el?.closest('[data-admin-slot]');
      if (slotEl) {
        const slotKey = slotEl.getAttribute('data-admin-slot');
        const slotDay = slotEl.getAttribute('data-admin-day');
        if (slotKey && slotDay === lockedDay) {
          didDragOrHold = true;
          toggleSlot(slotKey, dragStartState);
        }
      }
    }
  }

  function handleTouchEnd(e: TouchEvent, key: string) {
    if (!canEditSession) return;
    if (holdTimer) clearTimeout(holdTimer);

    if (dragReady || didDragOrHold) {
      e.preventDefault();
      saveConfirmedSlots();
    } else if (!touchMoved) {
      // It was a short tap
      const startState = !localConfirmedSlots[key];
      toggleSlot(key, startState);
      saveConfirmedSlots();
    }

    dragReady = false;
    lockedDay = null;
    holdingCell = null;
    touchStartPos = null;
    holdingCellRef = null;

    setTimeout(() => {
      didDragOrHold = false;
      isTouchActive = false;
    }, 50);
  }
  
  function saveConfirmedSlots() {
    if (isSaving) return;
    isSaving = true;
    const confirmedList = Object.keys(localConfirmedSlots).filter(k => localConfirmedSlots[k]);
    if (onConfirmTimeslotsUpdate) {
      onConfirmTimeslotsUpdate(confirmedList);
    }
    setTimeout(() => isSaving = false, 200);
  }


  // Sync state if session changes
  $effect(() => {
    expiry = session.expiry;
    preventDup = session.preventDuplicate;
    allowMutation = session.allowGuestMutation;
  });

  const daysEng = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daysKor = ["일", "월", "화", "수", "목", "금", "토"];

  function handleRecommendClick(slot: string) {
    const [weekDayPrefix, day, time] = slot.split('-');
    const weekNum = parseInt(weekDayPrefix.replace('W', ''), 10);
    if (!isNaN(weekNum) && getTotalWeeks(session.startDate, session.endDate) > 1) {
      currentActiveWeek = weekNum;
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
  }

  let activeDates = $derived(getSessionDatesForWeek(session.startDate, session.endDate, currentActiveWeek));
  
  // Optimization: Pre-compute schedule counts to prevent re-calculating inside the grid loop
  let scheduleCountMap = $derived.by(() => {
    const map = new Map();
    session.guests.forEach(g => {
      if (g.submitted) {
        Object.keys(g.schedule).forEach(key => {
          if (g.schedule[key]) {
            map.set(key, (map.get(key) || 0) + 1);
          }
        });
      }
    });
    return map;
  });
  
  // Optimization: Pre-compute guest names per slot
  let scheduleGuestsMap = $derived.by(() => {
    const map = new Map();
    session.guests.forEach(g => {
      if (g.submitted) {
        Object.keys(g.schedule).forEach(key => {
          if (g.schedule[key]) {
            const list = map.get(key) || [];
            list.push(g);
            map.set(key, list);
          }
        });
      }
    });
    return map;
  });

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

  // Calculate overlap scores for AI recommendations
  let optimalSlots = $derived.by(() => {
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
  });

  let submittedCount = $derived(session.guests.filter(g => g.submitted).length);
  let totalCount = $derived(session.guests.length);
  let respondPercent = $derived(totalCount > 0 ? (submittedCount / totalCount) * 100 : 0);
</script>

<section id="view-admin-detail" class="absolute inset-0 flex flex-col lg:flex-row bg-slate-50 overflow-hidden">
  <!-- Sliding Drawer Backdrop -->
  {#if isMenuOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-200 lg:hidden"
      onclick={() => isMenuOpen = false}
    ></div>
  {/if}

  <!-- Slide-over Management Menu Drawer (Focuses on session management) - Always visible on desktop (lg), slide-over drawer on tablet/mobile -->
  <aside 
    class="fixed inset-y-0 left-0 lg:static lg:inset-auto w-80 sm:w-96 lg:w-80 shrink-0 bg-white border-r border-slate-200 p-5 shadow-2xl lg:shadow-none z-50 lg:z-0 flex flex-col justify-between transform lg:transform-none transition-transform duration-300 ease-out {
      isMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    }"
  >
    <div class="flex-1 flex flex-col overflow-y-auto custom-scrollbar space-y-5">
      <!-- Drawer Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="bg-indigo-600 text-white p-2 rounded-xl shadow-md">
            <Settings class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-extrabold text-slate-900 tracking-tight">세션 상세 관리 메뉴</h3>
            <p class="text-[10px] text-indigo-600 font-bold">오버랩 조율 통합 제어</p>
          </div>
        </div>
        <button 
          onclick={() => isMenuOpen = false}
          class="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition lg:hidden"
          title="메뉴 닫기"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Session Summary Card -->
      <div class="bg-slate-50 rounded-2xl p-4 border border-slate-200/65">
        <h4 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">선택된 일정 세션</h4>
        <h2 class="text-sm font-extrabold text-slate-900 leading-snug">{session.title}</h2>
        <div class="flex gap-1.5 mt-2 flex-wrap mb-3.5">
          <span class="inline-block bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
            {session.category}
          </span>
          <span class="inline-block bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
            {session.time_interval}분 단위
          </span>
        </div>
        <button
          onclick={() => {
            onShareSurveyLink(session.id);
            isMenuOpen = false;
          }}
          class="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-[0.98]"
        >
          <Share2 class="w-3.5 h-3.5 text-indigo-200" />
          <span>설문 참여 링크 복사 및 공유</span>
        </button>
      </div>

      <!-- 1. 최적 시간 자동 추천 (AI) -->
      <div class="space-y-2">
        <h3 class="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
          <Zap class="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>1. 최적 시간 자동 추천 (AI)</span>
        </h3>
        <div class="space-y-1.5">
          {#if optimalSlots.length === 0}
            <div class="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-400 text-center">
              수집된 일정이 없습니다.
            </div>
          {:else}
            {#each optimalSlots as [slot, count], idx}
              {@const [weekDayPrefix, day, time] = slot.split('-')}
              {@const weekNum = weekDayPrefix.replace('W', '')}
              {@const dayIndex = daysEng.indexOf(day)}
              {@const displayDay = dayIndex !== -1 ? daysKor[dayIndex] : day}
              {@const displayWeek = getTotalWeeks(session.startDate, session.endDate) > 1 ? `${weekNum}주차 ` : ''}
              {@const cleanSlot = `${displayWeek}${displayDay}요일 ${time}`}
              {@const confirmedArr1 = Array.isArray(session.confirmedSlot) ? session.confirmedSlot : (session.confirmedSlot ? [session.confirmedSlot] : [])}
              {@const isConfirmed = session.status === '확정' && confirmedArr1.includes(slot)}

              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div
                onclick={() => {
                  handleRecommendClick(slot);
                  isMenuOpen = false;
                }}
                title="클릭하면 캘린더에서 이 시간대로 이동하고 강조 표시합니다"
                class="flex items-center justify-between bg-amber-50/50 hover:bg-amber-50 px-3 py-2.5 rounded-xl border border-amber-100 text-[10px] font-bold text-slate-800 cursor-pointer transition-all duration-200 active:scale-[0.98] hover:shadow-sm"
              >
                <div class="flex items-center gap-1.5 select-none">
                  <span>👑 {idx + 1}위: {cleanSlot}</span>
                  <span class="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[8px] font-extrabold">
                    {count}명 가능
                  </span>
                </div>
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div>
                  {#if canEditSession}
                  {#if isConfirmed}
                    <button class="bg-indigo-600 text-white px-2 py-0.5 rounded text-[8px] font-bold cursor-pointer hover:bg-indigo-700 active:scale-95 transition-all inline-block select-none shadow-md" onclick={(e) => { e.stopPropagation(); toggleSlot(slot, !localConfirmedSlots[slot]); saveConfirmedSlots(); }} title="클릭하여 확정 취소">
                      확정됨 (취소)
                    </button>
                  {:else}
                    <button
                      onclick={(e) => {
                        e.stopPropagation();
                        toggleSlot(slot, true);
                        saveConfirmedSlots();
                        isMenuOpen = false;
                      }}
                      class="bg-white border border-amber-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 text-amber-700 transition px-2 py-0.5 rounded text-[8px] font-bold shadow-sm cursor-pointer"
                    >
                      확정하기
                    </button>
                  {/if}
                  {/if}
                </div>
              </div>
            {/each}
          {/if}
        </div>
      </div>

      <!-- 2. 마감 시한 및 정책 설정 -->
      {#if canEditSession}
      <div class="space-y-2">
        <h3 class="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
          <Clock class="w-4 h-4 text-indigo-500" />
          <span>2. 마감 시한 및 정책 설정</span>
        </h3>
        <div class="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-3 text-xs">
          <div>
            <label for="expiry-input" class="block font-bold text-slate-700 mb-1">설문 수집 마감 시한</label>
            <input id="expiry-input"
              type="datetime-local"
              bind:value={expiry}
              class="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-700"
            />
          </div>
          <div class="space-y-2 text-[10px] font-extrabold text-slate-600">
            <label class="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-100 rounded transition">
              <input
                type="checkbox"
                bind:checked={preventDup}
                class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span>실시간 중복 제출 제어</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-100 rounded transition">
              <input
                type="checkbox"
                bind:checked={allowMutation}
                class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span>게스트 재수정 허용 (설문 정정)</span>
            </label>
          </div>
          <button
            onclick={() => {
              onUpdateSessionSettings(expiry, preventDup, allowMutation);
              isMenuOpen = false;
            }}
            class="w-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold py-2.5 rounded-lg transition shadow-sm hover:shadow"
          >
            업데이트 저장 및 적용
          </button>
        </div>
      </div>
      {/if}

      <!-- 3. 게스트 제출 현황 -->
      <div class="space-y-2">
        <h3 class="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
          <Users class="w-4 h-4 text-emerald-500" />
          <span>3. 게스트 제출 현황</span>
        </h3>
        <div class="space-y-2">
          <div class="flex justify-between items-center text-xs font-bold text-slate-700">
            <span>실시간 수집율</span>
            <span class="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-[10px]">
              {submittedCount} / {totalCount || '무제한'}명 제출
            </span>
          </div>
          <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              class="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style="width: {respondPercent}%"
            ></div>
          </div>
          <div class="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar border border-slate-100 rounded-xl p-2 bg-slate-50/50">
            {#if session.guests.length === 0}
              <p class="text-[10px] text-slate-400 text-center py-4">등록된 참여자가 없습니다.</p>
            {:else}
              {#each session.guests as g}
                <div class="flex justify-between items-center py-1 border-b border-slate-100/50 last:border-0">
                  <span class="text-[10px] font-bold flex items-center gap-1.5 text-slate-700">
                    <span class="w-1.5 h-1.5 rounded-full {g.submitted ? 'bg-emerald-500' : 'bg-slate-300'}"></span>
                    {g.name}
                  </span>
                  <div class="flex items-center gap-2">
                    <span class="text-[8px] px-1.5 py-0.5 rounded font-bold {g.submitted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                      {g.submitted ? '완료' : '미응답'}
                    </span>
                    {#if canEditSession}
                    {#if !g.submitted}
                      <button
                        onclick={() => {
                          onTriggerReminder(g.name);
                          isMenuOpen = false;
                        }}
                        class="text-[8px] font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-slate-200 hover:bg-indigo-50 px-1.5 py-0.5 rounded transition shrink-0 shadow-sm"
                      >
                        Nudge 독촉
                      </button>
                    {/if}
                    {/if}
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        </div>
      </div>

      {#if canEditSession}
      <!-- 4. 통합 파일 내보내기 -->
      <div class="space-y-2">
        <h3 class="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
          <Download class="w-4 h-4 text-rose-500" />
          <span>4. 통합 파일 내보내기 (Export)</span>
        </h3>
        <div class="grid grid-cols-4 gap-1.5 text-[9px] font-bold">
          <button
            onclick={() => {
              onExport('CSV');
              isMenuOpen = false;
            }}
            class="flex flex-col items-center p-2 bg-slate-50 hover:bg-emerald-50 rounded-xl text-slate-700 border border-slate-200 transition"
          >
            <FileText class="w-4 h-4 text-emerald-600 mb-1" />
            <span>CSV</span>
          </button>
          <button
            onclick={() => {
              onExport('XLSX');
              isMenuOpen = false;
            }}
            class="flex flex-col items-center p-2 bg-slate-50 hover:bg-blue-50 rounded-xl text-slate-700 border border-slate-200 transition"
          >
            <FileSpreadsheet class="w-4 h-4 text-blue-600 mb-1" />
            <span>Excel</span>
          </button>
          <!-- <button
            onclick={() => {
              onExport('Sheets');
              isMenuOpen = false;
            }}
            class="flex flex-col items-center p-2 bg-slate-50 hover:bg-indigo-50 rounded-xl text-slate-700 border border-slate-200 transition"
          >
            <Cloud class="w-4 h-4 text-indigo-600 mb-1" />
            <span>시트</span>
          </button> -->
          <button
            onclick={() => {
              onExport('PDF');
              isMenuOpen = false;
            }}
            class="flex flex-col items-center p-2 bg-slate-50 hover:bg-rose-50 rounded-xl text-slate-700 border border-slate-200 transition"
          >
            <FileDown class="w-4 h-4 text-rose-500 mb-1" />
            <span>PDF</span>
          </button>
          <button
            onclick={() => {
              onExport('PNG');
              isMenuOpen = false;
            }}
            class="flex flex-col items-center p-2 bg-slate-50 hover:bg-amber-50 rounded-xl text-slate-700 border border-slate-200 transition"
          >
            <ImageIcon class="w-4 h-4 text-amber-500 mb-1" />
            <span>이미지</span>
          </button>
        </div>
      </div>
      {/if}
    </div>

    <!-- Drawer Footer -->
    <div class="pt-4 border-t border-slate-100 text-center shrink-0">
      <p class="text-[10px] text-slate-400 font-bold">Scheduler Premium v2.2</p>
    </div>
  </aside>

  <!-- Main View Area: Focused strictly on the Calendar Schedule Heatmap -->
  <div id="detail-export-area" class="flex-1 p-4 sm:p-6 flex flex-col overflow-hidden relative bg-slate-50">
    
    <!-- View Header with beautiful actions -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 mb-4 gap-4 shrink-0">
      <div class="flex items-center gap-3 w-full sm:w-auto">
        <!-- Hamburger Button to Open Management Menu Drawer -->
        <button
          onclick={() => isMenuOpen = true}
          class="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 shadow-sm transition flex items-center justify-center shrink-0 lg:hidden"
          title="상세 관리 메뉴 열기"
        >
          <Menu class="w-5 h-5" />
        </button>

        <button
          onclick={onBackToDashboard}
          class="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition flex items-center justify-center shrink-0"
          title="대시보드로 가기"
        >
          <X class="w-4 h-4" />
        </button>

        <div class="truncate">
          <div class="flex items-center gap-2 flex-wrap">
            <h2 class="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate max-w-[200px] sm:max-w-[300px]">
              {session.title}
            </h2>
            <span class="text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 {
              session.status === '확정' 
                ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                : 'bg-amber-50 text-amber-700 border-amber-100'
            }">
              {session.status === '확정' ? '확정 완료' : '조율 중'}
            </span>
          </div>
          <p class="text-[10px] text-slate-400 font-semibold mt-0.5">
            오버랩 기간: {session.startDate.replace('T', ' ')} ~ {session.endDate.replace('T', ' ')} ({session.time_interval}분 단위)
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
        <!-- Quick Access Share Survey Link Button -->
        <button
          onclick={() => onShareSurveyLink(session.id)}
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 shadow-sm hover:shadow transition"
          title="설문지 참여 링크 복사 및 공유"
        >
          <Share2 class="w-4 h-4 text-indigo-200" />
          <span>설문 공유 링크</span>
        </button>

        <!-- Week Tabs for 4-weeks session -->
        {#if getTotalWeeks(session.startDate, session.endDate) > 1}
          <div id="admin-week-tabs-container" class="flex bg-white p-1 rounded-xl border border-slate-200 text-[10px] font-bold gap-1 shadow-sm">
            {#each Array.from({length: getTotalWeeks(session.startDate, session.endDate)}, (_, i) => i + 1) as w}
              <button
                onclick={() => currentActiveWeek = w}
                class="px-3 py-1.5 rounded-lg text-[10px] font-bold transition {
                  currentActiveWeek === w
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }"
              >
                {w}주차
              </button>
            {/each}
          </div>
        {/if}

        <!-- Analysis View Toggles -->
        <div class="flex bg-white p-1 rounded-xl border border-slate-200 text-[10px] font-bold gap-1 shadow-sm">
          <button
            onclick={() => selectedAnalysisView = 'heatmap'}
            class="px-3 py-1.5 rounded-lg text-[10px] font-bold transition {
              selectedAnalysisView === 'heatmap' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }"
          >
            오버랩 히트맵
          </button>
          <button
            onclick={() => selectedAnalysisView = 'individual'}
            class="px-3 py-1.5 rounded-lg text-[10px] font-bold transition {
              selectedAnalysisView === 'individual' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }"
          >
            명단 개별분석
          </button>
        </div>
      </div>
    </div>

    <!-- Dynamic Legend / Status Bar -->
    <div class="mb-3 px-3.5 py-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-wrap justify-between items-center text-[10px] font-bold text-slate-700 gap-2 shrink-0">
      <div class="flex items-center gap-1">
        <Info class="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span>상단의 <strong class="text-indigo-600">햄버거 메뉴(Menu)</strong>를 클릭하여 AI 자동 추천 확인, 권한 설정 및 파일 내보내기를 실행할 수 있습니다.</span>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-200 inline-block"></span> 0명</span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-200 inline-block"></span> 1명</span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-emerald-300 inline-block"></span> 2명</span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> 3명+</span>
      </div>
    </div>

    <!-- Calendar Heatmap Container -->
    <div class="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden relative">
      <div class="flex-1 overflow-auto custom-scrollbar relative animate-in fade-in duration-300" id="admin-calendar-container">
        <div class="grid select-none" id="admin-heatmap-grid" style="grid-template-columns: 50px repeat({activeDates.length}, minmax(50px, 1fr))" ontouchmove={handleTouchMove} role="presentation">
          <!-- Header corner -->
          <div class="header-corner-sticky flex items-center justify-center">
            <Clock class="w-3.5 h-3.5 text-slate-400" />
          </div>

          <!-- Day headers with actual date labels -->
          {#each activeDates as dateInfo (dateInfo.dateStr)}
            <div
              class="header-row-sticky flex items-center justify-center text-[10px] font-bold text-slate-600 py-2 border-r border-slate-100"
            >
              {dateInfo.formatted}
            </div>
          {/each}

          <!-- Grid content rows -->
          {#each timeslots as time}
            <div class="time-col-sticky text-[9px] font-bold text-slate-500 flex items-start justify-center pt-1 border-b border-slate-100">{time}</div>
            {#each activeDates as dateInfo (dateInfo.dateStr)}
              {@const prefix = getTotalWeeks(session.startDate, session.endDate) > 1 ? `W${currentActiveWeek}-` : `W1-`}
              {@const key = `${prefix}${dateInfo.dayNameEng}-${time}`}
              {@const matched = scheduleGuestsMap.get(key) || []}
              {@const count = scheduleCountMap.get(key) || 0}
              {@const confirmedArr2 = Array.isArray(session.confirmedSlot) ? session.confirmedSlot : (session.confirmedSlot ? [session.confirmedSlot] : [])}
              {@const isSel = localConfirmedSlots[key] || false}
              {@const isAvailable = isSlotAvailable(dateInfo.dateStr, time)}
              {@const isHoldingThis = holdingCell === key}

              <div
                id="admin-slot-{key}"
                data-admin-slot={key}
                data-admin-day={dateInfo.dayNameEng}
                class="min-h-[28px] border-r border-b border-slate-100 p-0.5 flex items-center justify-center relative cursor-pointer group {
                  !isAvailable ? 'bg-red-50/60 pointer-events-none cursor-not-allowed' : (isSel ? 'bg-indigo-50/80' : 'hover:bg-slate-50')
                } {isHoldingThis ? 'ring-2 ring-indigo-500 ring-inset' : ''}"
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
                title={!isAvailable ? '예약 불가 시간' : '드래그하여 확정'}
              >
                <div class="w-full h-full flex flex-col justify-center items-center relative pointer-events-none">
                  {#if !isAvailable}
                    <span class="text-red-300 text-[9px] pointer-events-none font-bold">불가</span>
                  {:else if isSel}
                    <div class="absolute inset-0 bg-indigo-600 text-white rounded-lg flex justify-center items-center text-[9px] font-bold shadow-md m-0.5 hover:bg-indigo-700 active:scale-95 transition-all">
                      <span>확정됨</span>
                    </div>
                  {:else}
                    {#if selectedAnalysisView === 'heatmap' && count > 0}
                      {@const colorClass = count >= 3 ? 'bg-emerald-500 text-white font-bold' : count >= 2 ? 'bg-emerald-300 text-emerald-900' : 'bg-emerald-100 text-emerald-800'}
                      <div class="absolute inset-0 {colorClass} rounded-lg flex justify-center items-center text-[9px] shadow-sm m-0.5 opacity-90 group-hover:opacity-100">
                        <span>{count}명</span>
                      </div>
                    {:else if selectedAnalysisView === 'individual' && count > 0}
                      <div class="w-full h-full flex flex-col gap-0.5 overflow-y-auto max-h-[40px] custom-scrollbar z-0">
                        {#each matched as m}
                          <span class="bg-indigo-100 text-indigo-700 text-[8px] rounded px-0.5 truncate text-center font-bold">
                            {m.name}
                          </span>
                        {/each}
                      </div>
                    {/if}
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

<style>
  #admin-heatmap-grid {
    touch-action: none;
  }
</style>
