<script lang="ts">
  import { 
    LayoutGrid, Tags, Share2, PlusCircle, Plus, Archive, MoreVertical, Mail, ChevronRight, CheckCircle, Menu, X 
  } from 'lucide-svelte';
  import type { Session, Category } from '../types';

  let {
    sessions = [],
    categories = [],
    selectedFilterCategory = $bindable('ALL'),
    showArchived = false,
    isSystemAdmin = false,
    currentUserEmail = "",
    toggleArchivedSessions,
    openCreateSessionModal,
    openCategorySettings,
    openSnsSettingsModal,
    openShareSettings,
    openKebabControl,
    goToDetail,
    openShareSurveyLink
  } = $props();

  let isMenuOpen = $state(false);
</script>

<section id="view-admin-dashboard" class="absolute inset-0 flex flex-col lg:flex-row bg-slate-50 overflow-hidden">
  <!-- Drawer Overlay Backdrop -->
  {#if isMenuOpen}
    <div 
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-200 lg:hidden"
      onclick={() => isMenuOpen = false}
      onkeydown={(e) => { if (e.key === 'Escape') isMenuOpen = false; }}
      role="button"
      tabindex="0"
    ></div>
  {/if}

  <!-- Slide-over Drawer Menu -->
  <aside 
    class="fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-slate-200 p-5 shadow-2xl lg:shadow-none z-50 lg:z-20 flex flex-col justify-between transform lg:transform-none transition-transform lg:transition-none duration-300 ease-out {
      isMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    }"
  >
    <div>
      <div class="flex items-center justify-between pb-5 border-b border-slate-100 mb-5">
        <div class="flex items-center gap-2.5">
          <div class="bg-indigo-600 text-white p-2 rounded-xl shadow-md">
            <LayoutGrid class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-900 tracking-tight">대시보드 메뉴</h3>
            <p class="text-[10px] text-slate-400 font-semibold">설정 및 관리 기능</p>
          </div>
        </div>
        <button 
          onclick={() => isMenuOpen = false}
          class="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition lg:hidden"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="space-y-1">
        <button
          onclick={() => {
            selectedFilterCategory = 'ALL';
            isMenuOpen = false;
          }}
          class="w-full flex items-center gap-3 px-3.5 py-3 text-xs font-bold rounded-xl transition {
            selectedFilterCategory === 'ALL'
              ? 'bg-indigo-50 text-indigo-600'
              : 'text-slate-600 hover:bg-slate-50'
          }"
        >
          <LayoutGrid class="w-4 h-4" />
          <span>세션 대시보드 홈 (전체)</span>
        </button>
        {#if isSystemAdmin}
        <button
          onclick={() => {
            openCategorySettings();
            isMenuOpen = false;
          }}
          class="w-full flex items-center gap-3 px-3.5 py-3 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-50 transition"
        >
          <Tags class="w-4 h-4 text-slate-400" />
          <span>카테고리 태그 관리</span>
        </button>
<!--        <button
          onclick={() => {
            openSnsSettingsModal();
            isMenuOpen = false;
          }}
          class="w-full flex items-center gap-3 px-3.5 py-3 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-50 transition"
        >
          <Share2 class="w-4 h-4 text-indigo-500" />
          <span>관리자 SNS 연동 설정</span>
        </button>-->
        
        <hr class="my-4 border-slate-100" />

        <button
          onclick={() => {
            openCreateSessionModal();
            isMenuOpen = false;
          }}
          class="w-full flex items-center gap-3 px-3.5 py-3 text-xs font-bold rounded-xl text-emerald-600 bg-emerald-50 hover:bg-emerald-100/60 transition"
        >
          <PlusCircle class="w-4 h-4" />
          <span>새 일정 세션 생성</span>
        </button>
        {/if}
      </div>
    </div>

    <div class="pt-4 border-t border-slate-100">
      <p class="text-[10px] text-slate-400 font-medium text-center">Scheduler Premium v2.2</p>
    </div>
  </aside>

  <!-- Main Content (Wide Layout centering the sessions grid) -->
  <div class="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
      <div class="flex items-center gap-3">
        <!-- Hamburger Button -->
        <button
          onclick={() => isMenuOpen = true}
          class="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 shadow-sm transition flex items-center justify-center shrink-0 lg:hidden"
          title="대시보드 메뉴 열기"
        >
          <Menu class="w-5 h-5" />
        </button>
        <div>
          <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">정기 일정 세션 제어판</h2>
          <p class="text-xs text-slate-400 mt-0.5 font-medium">최적 시간 자동 추천 및 타임슬롯 확정 모드 활성화됨</p>
        </div>
      </div>
      {#if isSystemAdmin}
      <div class="flex gap-2 w-full sm:w-auto shrink-0">
        <button
          onclick={openCreateSessionModal}
          class="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex justify-center items-center gap-1.5 shadow-sm hover:shadow transition"
        >
          <Plus class="w-4 h-4" />
          <span>새 일정 생성</span>
        </button>
        <button
          onclick={toggleArchivedSessions}
          class="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold flex justify-center items-center gap-1.5 shadow-sm transition"
        >
          <Archive class="w-4 h-4 text-slate-400" />
          <span>{showArchived ? '보관 가리기' : '보관 세션 보기'}</span>
        </button>
      </div>
      {/if}
    </div>

    <!-- Category Filters -->
    <div class="mb-5 flex flex-wrap gap-1.5" id="category-filter-chips">
      <button
        onclick={() => selectedFilterCategory = 'ALL'}
        class="px-3 py-1.5 rounded-lg text-xs font-bold border transition {
          selectedFilterCategory === 'ALL'
            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
        }"
      >
        전체 세션
      </button>
      {#each categories as cat (cat.id)}
        <button
          onclick={() => selectedFilterCategory = cat.name}
          class="px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition {
            selectedFilterCategory === cat.name
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }"
        >
          <span class="w-2 h-2 rounded-full {cat.color}"></span>
          <span>{cat.name}</span>
        </button>
      {/each}
    </div>

    <!-- Session Card Grid -->
    <div id="session-card-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {#each sessions.filter(s => !s.is_deleted && (showArchived || !s.archived) && (selectedFilterCategory === 'ALL' || s.category === selectedFilterCategory)) as s (s.id)}
        {@const submitted = s.guests.filter(g => g.submitted).length}
        {@const total = s.guests.length}
        {@const pct = total > 0 ? Math.round((submitted / total) * 100) : 0}

        <div
          class="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md flex flex-col justify-between transition-all duration-200 {
            s.archived ? 'opacity-65 grayscale-[20%]' : ''
          }"
        >
          <div>
            <div
              class="h-28 {s.color} p-4 text-white flex flex-col justify-between relative cursor-pointer"
              onclick={() => goToDetail(s.id)}
              onkeydown={(e) => { if (e.key === 'Enter') goToDetail(s.id); }}
              role="button"
              tabindex="0"
            >
              <div class="flex justify-between items-center">
                <span class="bg-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded backdrop-blur-sm">
                  {s.category}
                </span>
                {#if s.status === '확정'}
                  <span class="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                    <CheckCircle class="w-3.5 h-3.5" />
                    <span>확정 완료</span>
                  </span>
                {:else}
                  <span class="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                    조율 중
                  </span>
                {/if}
              </div>
              <div class="flex justify-between items-end gap-2">
                <h3 class="font-bold text-sm sm:text-base truncate flex-1">{s.title}</h3>
                {#if isSystemAdmin || s.adminEmails?.includes(currentUserEmail)}
                <button
                  onclick={(e) => {
                    e.stopPropagation();
                    openKebabControl(e, s.id);
                  }}
                  class="p-1.5 hover:bg-white/20 rounded-lg transition shrink-0"
                  title="설정"
                >
                  <MoreVertical class="w-4.5 h-4.5" />
                </button>
                {/if}
              </div>
            </div>
            <div
              class="p-4 space-y-3.5 text-xs text-slate-500 font-semibold cursor-pointer"
              onclick={() => goToDetail(s.id)}
              onkeydown={(e) => { if (e.key === 'Enter') goToDetail(s.id); }}
              role="button"
              tabindex="0"
            >
              <div class="flex justify-between">
                <span class="text-slate-400">조율 기간</span>
                <span class="text-slate-800">{s.startDate.replace("T", " ")} ~ {s.endDate.replace("T", " ")}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-400">참여 수집율</span>
                <span class="text-slate-800 font-bold">{submitted} / {total || '자유 수집'}</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-indigo-600 h-full rounded-full transition-all duration-500" style="width: {pct}%"></div>
              </div>
            </div>
          </div>
          <div class="bg-slate-50 px-4 py-3 border-t border-slate-100 flex justify-between text-xs font-bold">
            {#if isSystemAdmin || s.adminEmails?.includes(currentUserEmail)}
            <button
              onclick={() => openShareSettings(s.id)}
              class="text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition"
            >
              <Mail class="w-4 h-4 text-slate-400" />
              <span>메일 권한</span>
            </button>
            {/if}
            <button
              onclick={(e) => {
                e.stopPropagation();
                openShareSurveyLink(s.id);
              }}
              class="text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition"
              title="설문지 참여 링크 복사 및 공유"
            >
              <Share2 class="w-4 h-4 text-indigo-500" />
              <span>설문 링크</span>
            </button>
            {#if isSystemAdmin || s.adminEmails?.includes(currentUserEmail) || s.viewerEmails?.includes(currentUserEmail)}
            <button
              onclick={() => goToDetail(s.id)}
              class="text-slate-600 hover:text-slate-800 transition flex items-center gap-1"
            >
              <span>상세 분석</span>
              <ChevronRight class="w-4 h-4" />
            </button>
            {/if}
          </div>
        </div>
      {:else}
        <div class="col-span-full bg-white border border-slate-200 rounded-3xl p-10 flex flex-col items-center text-center justify-center space-y-4">
          <div class="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
            <LayoutGrid class="w-8 h-8" />
          </div>
          <div>
            <h4 class="text-sm font-bold text-slate-800">등록된 일정 조율 세션이 없습니다</h4>
            <p class="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed font-medium">새로운 일정을 만들어 친구, 팀원들과 가능 시간을 조율해 보세요!</p>
          </div>
          {#if isSystemAdmin}
          <button
            onclick={openCreateSessionModal}
            class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
          >
            첫 일정 생성하기
          </button>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</section>
