<script lang="ts">
  import { X, Tags, Edit3, Trash2 } from 'lucide-svelte';
  import type { Category } from '../types';

  let {
    visible = false,
    categories = [],
    newCatName = $bindable(''),
    newCatColor = $bindable('bg-blue-600'),
    onSave,
    onEdit,
    onDelete,
    onCancel,
    editingId = null,
    onReset,
    sessionsCountByCat = {}
  } = $props();
</script>

{#if visible}
  <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl flex flex-col max-h-[80vh]">
      <div class="flex justify-between items-center mb-3 shrink-0">
        <h3 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <Tags class="w-4 h-4 text-indigo-600" />
          <span>카테고리 관리</span>
        </h3>
        <button onclick={onCancel} class="text-slate-400 p-1 hover:bg-slate-50 rounded-lg transition">
          <X class="w-4 h-4" />
        </button>
      </div>
      <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3 shrink-0">
        <div class="grid grid-cols-2 gap-2 text-[10px]">
          <input
            type="text"
            bind:value={newCatName}
            placeholder="카테고리 명칭"
            class="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-xs"
          />
          <select
            bind:value={newCatColor}
            class="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-xs"
          >
            <option value="bg-blue-600">Blue (기본)</option>
            <option value="bg-indigo-600">Indigo</option>
            <option value="bg-emerald-500">Emerald</option>
            <option value="bg-slate-700">Slate</option>
            <option value="bg-rose-500">Rose</option>
            <option value="bg-amber-500">Amber</option>
          </select>
        </div>
        <div class="flex gap-2 mt-2">
          {#if editingId}
            <button
              type="button"
              onclick={onReset}
              class="flex-1 bg-slate-200 text-slate-700 font-bold py-1.5 rounded-lg text-[10px] transition hover:bg-slate-300"
            >
              취소
            </button>
          {/if}
          <button
            onclick={onSave}
            class="flex-1 bg-indigo-600 text-white font-bold py-1.5 rounded-lg text-[10px] transition hover:bg-indigo-700"
          >
            저장
          </button>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto custom-scrollbar">
        <div id="category-list-box" class="space-y-1.5">
          {#each categories as cat (cat.id)}
            {@const count = sessionsCountByCat[cat.name] || 0}
            <div
              class="flex justify-between items-center p-2.5 rounded-xl border {
                cat.archived ? 'bg-slate-100 opacity-60' : 'bg-white'
              } text-[11px] border-slate-200 shadow-sm"
            >
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full {cat.color}"></span>
                <span class="font-bold text-slate-700">
                  {cat.name} (세션: {count}개)
                </span>
              </div>
              <div class="flex gap-1.5">
                <button
                  onclick={() => onEdit(cat.id)}
                  class="p-1 hover:bg-indigo-50 rounded text-slate-400 hover:text-indigo-600 transition"
                >
                  <Edit3 class="w-3.5 h-3.5" />
                </button>
                <button
                  onclick={() => onDelete(cat.id)}
                  class="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}
