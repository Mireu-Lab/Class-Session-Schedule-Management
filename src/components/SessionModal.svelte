<script lang="ts">
  import { X } from 'lucide-svelte';
  import type { Category } from '../types';

  let {
    visible = false,
    title = $bindable(''),
    category = $bindable(''),
    interval = $bindable(60),
    startDate = $bindable(''),
    endDate = $bindable(''),
    guestMode = $bindable('unspecified'),
    guestsText = $bindable(''),
    categories = [],
    onSave,
    onCancel,
    editMode = false
  } = $props();
</script>

{#if visible}
  <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
    <div class="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-base font-bold text-slate-900">{editMode ? '세션 일정 속성 수정' : '새 세션 개설'}</h3>
        <button onclick={onCancel} class="text-slate-400 p-1 hover:bg-slate-50 rounded-lg transition">
          <X class="w-4 h-4" />
        </button>
      </div>
      <form onsubmit={(e) => { e.preventDefault(); onSave(e); }} class="space-y-3">
        <div>
          <label for="session-title-input" class="block text-[10px] font-bold text-slate-600 mb-1">세션 이름</label>
          <input id="session-title-input"
            type="text"
            bind:value={title}
            required
            class="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label for="session-start-date" class="block text-[10px] font-bold text-slate-600 mb-1">시작일</label>
            <div class="flex gap-1">
              <input id="session-start-date"
                type="date"
                value={startDate ? startDate.split('T')[0] : ''}
                onchange={(e) => startDate = e.currentTarget.value + 'T' + (startDate.includes('T') ? startDate.split('T')[1] : '00:00')}
                required
                class="w-2/3 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <select
                value={startDate.includes('T') ? startDate.split('T')[1].slice(0, 2) : '00'}
                onchange={(e) => startDate = (startDate ? startDate.split('T')[0] : '') + 'T' + e.currentTarget.value + ':00'}
                required
                class="w-1/3 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {#each Array.from({length: 24}, (_, i) => String(i).padStart(2, '0')) as h}
                  <option value={h}>{h}시</option>
                {/each}
              </select>
            </div>
          </div>
          <div>
            <label for="session-end-date" class="block text-[10px] font-bold text-slate-600 mb-1">종료일</label>
            <div class="flex gap-1">
              <input id="session-end-date"
                type="date"
                value={endDate ? endDate.split('T')[0] : ''}
                onchange={(e) => endDate = e.currentTarget.value + 'T' + (endDate.includes('T') ? endDate.split('T')[1] : '00:00')}
                required
                class="w-2/3 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <select
                value={endDate.includes('T') ? endDate.split('T')[1].slice(0, 2) : '00'}
                onchange={(e) => endDate = (endDate ? endDate.split('T')[0] : '') + 'T' + e.currentTarget.value + ':00'}
                required
                class="w-1/3 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {#each Array.from({length: 24}, (_, i) => String(i).padStart(2, '0')) as h}
                  <option value={h}>{h}시</option>
                {/each}
              </select>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label for="session-category" class="block text-[10px] font-bold text-slate-600 mb-1">카테고리</label>
            <select id="session-category"
              bind:value={category}
              required
              class="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">-- 선택 --</option>
              {#each categories.filter(c => !c.archived) as c (c.id)}
                <option value={c.name}>{c.name}</option>
              {/each}
            </select>
          </div>
          <div>
            <label for="session-interval" class="block text-[10px] font-bold text-slate-600 mb-1">타임 슬롯 간격</label>
            <select id="session-interval"
              bind:value={interval}
              required
              class="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value={30}>30분 단위</option>
              <option value={60}>60분 단위</option>
              <option value={120}>120분 단위</option>
            </select>
          </div>
        </div>
        <div>
          <label for="session-guest-mode" class="block text-[10px] font-bold text-slate-600 mb-1">게스트 지정 옵션</label>
          <select id="session-guest-mode"
            bind:value={guestMode}
            class="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          >
            <option value="unspecified">비지정 (실명 자율)</option>
            <option value="specified">지정 (아래 명단으로 제한)</option>
          </select>
        </div>
        <div>
          <label for="session-guests" class="block text-[10px] font-bold text-slate-600 mb-1">게스트 명단 (쉼표 구분)</label>
          <input id="session-guests"
            type="text"
            bind:value={guestsText}
            placeholder="예: 홍길동, 김철수, 이영희"
            class="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div class="flex gap-2 pt-2">
          <button
            type="button"
            onclick={onCancel}
            class="flex-1 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition hover:bg-slate-200"
          >
            취소
          </button>
          <button
            type="submit"
            class="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-xs transition hover:bg-indigo-700"
          >
            저장
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
