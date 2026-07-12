<script lang="ts">
  import { untrack } from 'svelte';
  import { 
    ChevronLeft, ChevronRight, CalendarDays, Filter, 
    CheckCircle, Clock, Users, User, ExternalLink, RefreshCw,
    X, List, Download
  } from 'lucide-svelte';
  import type { Session, Category } from '../types';

  let { 
    sessions = [], 
    categories = [], 
    goToDetail,
    openShareSurveyLink 
  } = $props();

  let currentYear = $state(2026);
  let currentMonth = $state(6); // 0-indexed (6 is July)
  let selectedDate = $state(new Date(2026, 6, 1)); // Default selected date: 2026-07-01

  let isLeftFilterOpen = $state(false);
  let isRightAgendaOpen = $state(false);
  let isExporting = $state(false);

  let calendarRef = $state<HTMLDivElement | null>(null);

  // Setup reactive filter states using Svelte 5 runes:
  let enabledCategoryIds = $state<Record<string, boolean>>({});
  let enabledSessionIds = $state<Record<number, boolean>>({});

  // Initialize filters
  $effect(() => {
    const cats = categories;
    const sess = sessions;
    
    untrack(() => {
      if (cats.length > 0 && Object.keys(enabledCategoryIds).length === 0) {
        const initialCat: Record<string, boolean> = {};
        cats.forEach(cat => {
          initialCat[cat.name] = true;
        });
        enabledCategoryIds = initialCat;
      }
      if (sess.length > 0 && Object.keys(enabledSessionIds).length === 0) {
        const initialSess: Record<number, boolean> = {};
        sess.forEach(s => {
          if (!s.is_deleted) {
            initialSess[s.id] = true;
          }
        });
        enabledSessionIds = initialSess;
      }
    });
  });

  let categorySearch = $state('');
  let sessionSearch = $state('');

  const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
  
  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
  }

  function handlePrevMonth() {
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear -= 1;
    } else {
      currentMonth -= 1;
    }
  }

  function handleNextMonth() {
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear += 1;
    } else {
      currentMonth += 1;
    }
  }

  let touchStartX: number | null = null;
  let touchStartY: number | null = null;

  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function handleTouchEnd(e: TouchEvent) {
    if (touchStartX === null || touchStartY === null) return;

    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = e.changedTouches[0].clientY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      const swipeThreshold = 50;
      if (Math.abs(diffX) > swipeThreshold) {
        if (diffX > 0) {
          handlePrevMonth();
        } else {
          handleNextMonth();
        }
      }
    }

    touchStartX = null;
    touchStartY = null;
  }

  function handleGoToToday() {
    currentYear = 2026;
    currentMonth = 6;
    selectedDate = new Date(2026, 6, 1);
  }

  let calendarCells = $derived.by(() => {
    const cells: { date: Date; isCurrentMonth: boolean }[] = [];
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);
    
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      cells.push({
        date: new Date(prevYear, prevMonth, day),
        isCurrentMonth: false
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({
        date: new Date(currentYear, currentMonth, i),
        isCurrentMonth: true
      });
    }

    const remainingCells = (7 - (cells.length % 7)) % 7;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    for (let i = 1; i <= remainingCells || cells.length < 35; i++) {
      cells.push({
        date: new Date(nextYear, nextMonth, i),
        isCurrentMonth: false
      });
      if (cells.length >= 42) break;
    }
    return cells;
  });

  function formatDateStr(d: Date) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dateVal = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${dateVal}`;
  }

  let selectedDateStr = $derived(formatDateStr(selectedDate));

  let currentMonthSessions = $derived(
    filteredSessions.filter(sess => {
      const sStart = new Date(sess.startDate);
      const sEnd = new Date(sess.endDate);
      const mStart = new Date(currentYear, currentMonth, 1);
      const mEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      return sStart <= mEnd && sEnd >= mStart;
    })
  );

  let filteredSessions = $derived(
    sessions.filter(sess => {
      if (sess.is_deleted) return false;
      const catEnabled = enabledCategoryIds[sess.category] !== false;
      const sessEnabled = enabledSessionIds[sess.id] !== false;
      return catEnabled && sessEnabled;
    })
  );

  function getSessionsForDate(date: Date) {
    const dateStr = formatDateStr(date);
    return filteredSessions.filter(sess => {
      const sDate = sess.startDate.split('T')[0];
      const eDate = sess.endDate.split('T')[0];
      return sDate <= dateStr && dateStr <= eDate;
    });
  }

  function toggleCategory(catName: string) {
    enabledCategoryIds[catName] = enabledCategoryIds[catName] === false ? true : false;
  }

  function toggleSession(id: number) {
    enabledSessionIds[id] = enabledSessionIds[id] === false ? true : false;
  }

  function toggleAllCategories(enable: boolean) {
    categories.forEach(cat => {
      enabledCategoryIds[cat.name] = enable;
    });
  }

  function toggleAllSessions(enable: boolean) {
    sessions.forEach(sess => {
      if (!sess.is_deleted) {
        enabledSessionIds[sess.id] = enable;
      }
    });
  }

  let activeSessionsForSelectedDate = $derived(getSessionsForDate(selectedDate));

  let searchedCategories = $derived(
    categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
  );

  let searchedSessions = $derived(
    sessions.filter(s => !s.is_deleted && s.title.toLowerCase().includes(sessionSearch.toLowerCase()))
  );

  const handleExportPDF = async () => {
    if (!calendarRef) return;
    isExporting = true;
    try {
      const htmlToImage = await import('html-to-image');
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default?.jsPDF || jsPDFModule.default || jsPDFModule;

      const element = calendarRef;
      
      const sessionListElem = element?.querySelector('.pdf-session-list');
      if (sessionListElem) {
        sessionListElem.classList.remove('hidden');
      }

      const filter = (node: HTMLElement) => {
        return !(node.classList?.contains?.('pdf-no-export'));
      };

      // Expand to full height
      const originalStyle = element.style.cssText;
      element.style.height = 'max-content';
      element.style.overflow = 'visible';

      const gridElement = element.querySelector(".overflow-y-auto") as HTMLElement;
      let gridOriginalStyle = '';
      if (gridElement) {
        gridOriginalStyle = gridElement.style.cssText;
        gridElement.style.height = 'max-content';
        gridElement.style.overflow = 'visible';
      }

      await new Promise(r => setTimeout(r, 100));

      const imgData = await htmlToImage.toPng(element, {
        pixelRatio: 2,
        filter: filter as any,
        backgroundColor: '#ffffff'
      });

      const pdf = new jsPDF('portrait', 'px', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      const ratio = element.offsetWidth / element.offsetHeight;
      const imgWidth = pdfWidth;
      const imgHeight = pdfWidth / ratio;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`calendar_${currentYear}_${currentMonth + 1}.pdf`);

      // Restore
      element.style.cssText = originalStyle;
      if (sessionListElem) {
        sessionListElem.classList.add('hidden');
      }
      if (gridElement) {
        gridElement.style.cssText = gridOriginalStyle;
      }
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      isExporting = false;
    }
  };
</script>

<section id="view-admin-calendar" class="absolute inset-0 flex flex-col lg:flex-row bg-slate-50 overflow-hidden">
  
  <!-- Sliding Drawer Backdrop for Left Sidebar -->
  {#if isLeftFilterOpen}
    <div 
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-200 lg:hidden"
      onclick={() => isLeftFilterOpen = false}
      onkeydown={(e) => { if (e.key === 'Escape') isLeftFilterOpen = false; }}
      role="button"
      tabindex="0"
    ></div>
  {/if}

  <!-- 1. LEFT SIDEBAR: Categories & Sessions Filter -->
  <aside 
    class="fixed inset-y-0 left-0 w-80 bg-white border-r border-slate-200 p-5 z-50 flex flex-col justify-between transform transition-transform duration-300 ease-out lg:static lg:inset-auto lg:w-80 lg:shrink-0 lg:z-0 lg:shadow-none lg:transform-none {
      isLeftFilterOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    }"
  >
    <div class="flex-1 flex flex-col overflow-y-auto custom-scrollbar space-y-6">
      
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <div class="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Filter class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-sm font-bold text-slate-800">통합 캘린더 필터</h2>
            <p class="text-[10px] text-slate-400 font-medium">카테고리 및 세션 활성화 관리</p>
          </div>
        </div>
        <button 
          onclick={() => isLeftFilterOpen = false}
          class="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition lg:hidden"
          title="필터 닫기"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Category Filters -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>1. 카테고리 필터</span>
          </h3>
          <div class="flex items-center gap-2 text-[10px] font-bold text-indigo-600">
            <button onclick={() => toggleAllCategories(true)} class="hover:underline">모두 켬</button>
            <span class="text-slate-300">|</span>
            <button onclick={() => toggleAllCategories(false)} class="hover:underline">모두 끔</button>
          </div>
        </div>
        
        <input 
          type="text" 
          placeholder="카테고리명 검색..." 
          bind:value={categorySearch} 
          class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
        />

        <div class="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
          {#each searchedCategories as cat (cat.id)}
            {@const isChecked = enabledCategoryIds[cat.name] !== false}
            <label 
              class="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl cursor-pointer text-xs transition"
            >
              <div class="flex items-center gap-2.5">
                <input 
                  type="checkbox" 
                  checked={isChecked}
                  onchange={() => toggleCategory(cat.name)}
                  class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full {cat.color || 'bg-slate-500'}"></span>
                  <span class="font-semibold text-slate-700">{cat.name}</span>
                </div>
              </div>
            </label>
          {:else}
            <p class="text-[11px] text-slate-400 py-2 text-center font-medium">검색 결과가 없습니다.</p>
          {/each}
        </div>
      </div>

      <!-- Sessions Filter -->
      <div class="space-y-3 pt-2">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>2. 세션별 일정 필터</span>
          </h3>
          <div class="flex items-center gap-2 text-[10px] font-bold text-indigo-600">
            <button onclick={() => toggleAllSessions(true)} class="hover:underline">모두 켬</button>
            <span class="text-slate-300">|</span>
            <button onclick={() => toggleAllSessions(false)} class="hover:underline">모두 끔</button>
          </div>
        </div>

        <input 
          type="text" 
          placeholder="세션 제목 검색..." 
          bind:value={sessionSearch} 
          class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
        />

        <div class="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
          {#each searchedSessions as sess (sess.id)}
            {@const isChecked = enabledSessionIds[sess.id] !== false}
            <label 
              class="flex items-start gap-2.5 p-2 hover:bg-slate-50 rounded-xl cursor-pointer text-xs transition"
            >
              <input 
                type="checkbox" 
                checked={isChecked}
                onchange={() => toggleSession(sess.id)}
                class="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div class="flex-1">
                <div class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full {sess.color || 'bg-slate-500'}"></span>
                  <p class="font-bold text-slate-700 line-clamp-1">{sess.title}</p>
                </div>
                <p class="text-[9px] text-slate-400 font-semibold mt-0.5 ml-3.5">
                  {sess.startDate.replace("T", " ")} ~ {sess.endDate.replace("T", " ")}
                </p>
              </div>
            </label>
          {:else}
            <p class="text-[11px] text-slate-400 py-2 text-center font-medium">등록된 세션이 없습니다.</p>
          {/each}
        </div>
      </div>
    </div>
  </aside>

  <!-- 2. CENTER: Main Calendar Grid -->
  <div bind:this={calendarRef} class="flex-1 flex flex-col bg-white overflow-hidden">
    
    <!-- Calendar Controller Header -->
    <header class="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
      <div class="flex items-center gap-2">
        <button
          onclick={() => isLeftFilterOpen = true}
          class="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 shadow-sm transition flex items-center justify-center shrink-0 lg:hidden pdf-no-export"
          title="필터 열기"
        >
          <Filter class="w-4 h-4 text-slate-500" />
        </button>

        <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl pdf-no-export">
          <button 
            onclick={handlePrevMonth}
            class="p-1.5 hover:bg-white rounded-lg transition text-slate-600 hover:text-slate-900 shadow-none hover:shadow-sm"
            title="이전 달"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button 
            onclick={handleNextMonth}
            class="p-1.5 hover:bg-white rounded-lg transition text-slate-600 hover:text-slate-900 shadow-none hover:shadow-sm"
            title="다음 달"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
        
        <button 
          onclick={handleGoToToday}
          class="px-3.5 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 rounded-xl text-xs font-bold transition items-center gap-1.5 shadow-sm hidden sm:flex pdf-no-export"
        >
          <CalendarDays class="w-4 h-4 text-indigo-500" />
          <span>기준 데이터(2026.07) 이동</span>
        </button>
      </div>

      <div class="text-center">
        <h2 class="text-base font-extrabold text-slate-900 tracking-tight">
          {currentYear}년 {currentMonth + 1}월
        </h2>
      </div>

      <div class="flex items-center gap-2">
        <button 
          onclick={handleExportPDF}
          disabled={isExporting}
          class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm pdf-no-export disabled:opacity-50"
        >
          {#if isExporting}
            <RefreshCw class="w-4 h-4 animate-spin" />
            <span>PDF 저장 중...</span>
          {:else}
            <Download class="w-4 h-4" />
            <span>PDF로 저장</span>
          {/if}
        </button>

        <div class="text-xs text-slate-400 font-bold bg-slate-100 px-3 py-1.5 rounded-xl hidden sm:block">
          <span class="text-slate-500">조율 세션 수:</span> <span class="text-indigo-600">{filteredSessions.length}개</span>
        </div>

        <button
          onclick={() => isRightAgendaOpen = true}
          class="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 shadow-sm transition flex items-center justify-center shrink-0 lg:hidden pdf-no-export"
          title="상세 일정 열기"
        >
          <List class="w-4 h-4 text-indigo-600" />
        </button>
      </div>
    </header>

    <!-- Days of Week Row -->
    <div class="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 py-2 text-center shrink-0">
      {#each daysOfWeek as day, idx}
        {@const isSunday = idx === 0}
        {@const isSaturday = idx === 6}
        <span 
          class="text-[11px] font-bold tracking-wider {
            isSunday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-slate-400'
          }"
        >
          {day}
        </span>
      {/each}
    </div>

    <!-- Main Grid Calendar Cells -->
    <div role="presentation"
      ontouchstart={handleTouchStart}
      ontouchend={handleTouchEnd}
      class="flex-1 grid grid-cols-7 grid-rows-6 p-1 bg-slate-100/50 overflow-y-auto"
    >
      {#each calendarCells as cell, idx}
        {@const cellDateStr = formatDateStr(cell.date)}
        {@const isSelected = cellDateStr === selectedDateStr}
        {@const dayNum = cell.date.getDate()}
        {@const cellSessions = getSessionsForDate(cell.date)}
        {@const isSunday = cell.date.getDay() === 0}
        {@const isSaturday = cell.date.getDay() === 6}

        <div
          onclick={() => selectedDate = cell.date}
          onkeydown={(e) => { if (e.key === 'Enter') selectedDate = cell.date; }}
          role="button"
          tabindex="0"
          class="min-h-[75px] bg-white border border-slate-100 p-1 flex flex-col justify-between transition-all cursor-pointer relative group hover:z-10 hover:shadow-md hover:border-indigo-100 {
            isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50/20' : ''
          } {!cell.isCurrentMonth ? 'opacity-40 bg-slate-50/40' : ''}"
        >
          <!-- Cell Header: Day Number -->
          <div class="flex justify-between items-center mb-1">
            <span 
              class="text-[11px] font-extrabold w-5 h-5 flex items-center justify-center rounded-full {
                isSelected 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : isSunday 
                  ? 'text-red-500' 
                  : isSaturday 
                  ? 'text-blue-500' 
                  : 'text-slate-600'
              }"
            >
              {dayNum}
            </span>
            
            {#if cellSessions.length > 0}
              <span class="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.2 rounded-full scale-90 opacity-0 group-hover:opacity-100 transition-opacity">
                {cellSessions.length}개 세션
              </span>
            {/if}
          </div>

          <!-- Overlapping Sessions List -->
          <div class="flex-1 flex flex-col gap-0.5 overflow-hidden justify-end">
            {#each cellSessions.slice(0, 3) as sess (sess.id)}
              {@const colorClass = sess.color || 'bg-slate-600'}
              {@const isConfirmed = sess.status === '확정'}
              <div 
                class="text-[8px] font-bold text-white px-1.5 py-0.5 rounded flex items-center justify-between gap-1 line-clamp-1 truncate {colorClass}"
                title="{sess.title} ({sess.category})"
              >
                <span class="truncate">{sess.title}</span>
                {#if isConfirmed}
                  <CheckCircle class="w-2.5 h-2.5 text-white shrink-0" />
                {/if}
              </div>
            {/each}
            {#if cellSessions.length > 3}
              <div class="text-[8px] font-bold text-slate-400 pl-1 text-right">
                외 {cellSessions.length - 3}개 더보기
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
    
    <!-- Export Only: Session List -->
    <div class="pdf-session-list hidden p-5 bg-white border-t border-slate-200">
      <h3 class="text-xl font-bold mb-4 text-slate-800">{currentYear}년 {currentMonth + 1}월 세션 목록</h3>
      <div class="space-y-3">
        {#each currentMonthSessions as sess}
          <div class="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
            <div>
              <h4 class="font-bold text-slate-800 text-sm">{sess.title}</h4>
              <p class="text-xs text-slate-500 mt-1">{sess.startDate.replace('T', ' ')} ~ {sess.endDate.replace('T', ' ')} | {sess.time_interval}분 단위</p>
            </div>
            <div class="text-right">
              <span class="inline-block px-2 py-1 rounded-md text-xs font-bold {sess.status === '확정' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">
                {sess.status}
              </span>
              {#if sess.status === '확정'}
                <p class="text-xs text-emerald-600 font-bold mt-1 max-w-[200px] truncate">{Array.isArray(sess.confirmedSlot) ? sess.confirmedSlot.join(', ') : (sess.confirmedSlot || '미지정')}</p>
              {/if}
            </div>
          </div>
        {/each}
        {#if currentMonthSessions.length === 0}
          <p class="text-sm text-slate-400">이번 달에 예정된 세션이 없습니다.</p>
        {/if}
      </div>
    </div>
  </div>

  <!-- Sliding Drawer Backdrop for Right Sidebar -->
  {#if isRightAgendaOpen}
    <div 
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-200 lg:hidden"
      onclick={() => isRightAgendaOpen = false}
      onkeydown={(e) => { if (e.key === 'Escape') isRightAgendaOpen = false; }}
      role="button"
      tabindex="0"
    ></div>
  {/if}

  <!-- 3. RIGHT SIDEBAR: Day Schedule details -->
  <aside 
    class="fixed inset-y-0 right-0 w-80 sm:w-96 bg-slate-50 border-l border-slate-200 p-5 z-50 flex flex-col overflow-y-auto space-y-4 transform transition-transform duration-300 ease-out lg:static lg:inset-auto lg:w-96 lg:shrink-0 lg:z-0 lg:transform-none {
      isRightAgendaOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
    }"
  >
    
    <!-- Selected Date Header -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2 relative">
      <button 
        onclick={() => isRightAgendaOpen = false}
        class="absolute top-3 right-3 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition lg:hidden"
        title="상세 닫기"
      >
        <X class="w-4 h-4" />
      </button>

      <p class="text-[10px] text-indigo-600 font-extrabold tracking-widest uppercase">
        SELECTED DATE AGENDA
      </p>
      <h3 class="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
        <Clock class="w-4 h-4 text-slate-500" />
        <span>
          {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
          ({daysOfWeek[selectedDate.getDay()]}요일)
        </span>
      </h3>
      <p class="text-xs text-slate-400 font-semibold">
        이 날짜에 활성화된 세션 일정이 총 <span class="text-indigo-600 font-bold">{activeSessionsForSelectedDate.length}개</span> 존재합니다.
      </p>
    </div>

    <!-- Day schedule items -->
    <div class="space-y-3 flex-1">
      <div class="flex justify-between items-center px-1">
        <h4 class="text-xs font-bold text-slate-700">3. 일별 일련 세션 상세</h4>
        <span class="text-[10px] text-slate-400 font-bold">참여 현황 요약</span>
      </div>

      <div class="space-y-3">
        {#each activeSessionsForSelectedDate as sess (sess.id)}
          {@const colorClass = sess.color || 'bg-indigo-600'}
          {@const submittedCount = sess.guests.filter(g => g.submitted).length}
          {@const totalGuests = sess.guests.length}
          {@const isConfirmed = sess.status === '확정'}

          <div 
            class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition space-y-3"
          >
            <!-- Title & Category -->
            <div class="space-y-1">
              <div class="flex items-start justify-between gap-2">
                <h5 class="text-xs font-extrabold text-slate-800 line-clamp-2 leading-snug">
                  {sess.title}
                </h5>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold shrink-0 text-white {
                  isConfirmed ? 'bg-emerald-500' : 'bg-amber-500'
                }">
                  {sess.status}
                </span>
              </div>

              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full {colorClass}"></span>
                <span class="text-[10px] text-slate-400 font-bold">{sess.category}</span>
              </div>
            </div>

            <!-- Period & Interval -->
            <div class="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 bg-slate-50 p-2 rounded-xl">
              <div>
                <p class="text-slate-400 scale-95 origin-left">조율 기간</p>
                <p class="text-slate-700 mt-0.5">{sess.startDate.replace("T", " ")} ~ {sess.endDate.replace("T", " ")}</p>
              </div>
              <div>
                <p class="text-slate-400 scale-95 origin-left">타임슬롯 간격</p>
                <p class="text-slate-700 mt-0.5">{sess.time_interval}분 단위</p>
              </div>
            </div>

            <!-- Confirmed info or Progress -->
            {#if isConfirmed}
              <div class="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2.5 rounded-xl flex items-center gap-2 text-xs font-bold">
                <CheckCircle class="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <p class="text-[9px] text-emerald-500 font-extrabold scale-90 origin-left">확정된 타임라인 슬롯</p>
                  <p class="text-emerald-700">{Array.isArray(sess.confirmedSlot) ? sess.confirmedSlot.join(', ') : (sess.confirmedSlot || '미지정')}</p>
                </div>
              </div>
            {:else}
              <div class="bg-amber-50 text-amber-800 border border-amber-100 p-2.5 rounded-xl flex items-center gap-2 text-xs font-bold">
                <Clock class="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <p class="text-[9px] text-amber-500 font-extrabold scale-90 origin-left">일정 취합 마감시한</p>
                  <p class="text-amber-700">{sess.expiry.replace('T', ' ')}</p>
                </div>
              </div>
            {/if}

            <!-- Guest Submission Status -->
            <div class="space-y-1.5">
              <div class="flex justify-between items-center text-[10px] font-bold">
                <span class="text-slate-500 flex items-center gap-1">
                  <Users class="w-3.5 h-3.5 text-slate-400" />
                  <span>설문 참여 게스트</span>
                </span>
                <span class="text-indigo-600">
                  {submittedCount} / {totalGuests} 제출 완료
                </span>
              </div>

              <!-- Guest name badges -->
              <div class="flex flex-wrap gap-1">
                {#each sess.guests as g, gi}
                  <div 
                    class="px-2 py-0.5 rounded-md text-[9px] font-semibold flex items-center gap-1 {
                      g.submitted 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }"
                  >
                    <User class="w-2.5 h-2.5 shrink-0" />
                    <span>{g.name}</span>
                  </div>
                {:else}
                  <p class="text-[10px] text-slate-400 italic">참여자 명단이 지정되지 않았습니다.</p>
                {/each}
              </div>
            </div>

            <!-- Actions -->
            <div class="grid grid-cols-2 gap-2 pt-1">
              <button
                onclick={() => openShareSurveyLink(sess.id)}
                class="py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1"
              >
                <ExternalLink class="w-3.5 h-3.5 text-slate-400" />
                <span>설문지 링크</span>
              </button>
              <button
                onclick={() => goToDetail(sess.id)}
                class="py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1"
              >
                <span>통합 대시보드</span>
                <ChevronRight class="w-3 h-3 text-white/80" />
              </button>
            </div>

          </div>
        {:else}
          <div class="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
            <CalendarDays class="w-8 h-8 text-slate-300 mx-auto" />
            <p class="text-xs font-bold text-slate-500">선택한 날짜에 예정된 일정이 없습니다.</p>
            <p class="text-[10px] text-slate-400">좌측 필터에서 카테고리 또는 세션을 활성화해 보세요.</p>
          </div>
        {/each}
      </div>
    </div>
  </aside>

</section>
