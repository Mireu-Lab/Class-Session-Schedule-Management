<script lang="ts">
  import { X, Edit3, Archive, Trash2 } from 'lucide-svelte';

  let { visible = false, title = '', onAction, onCancel } = $props();
</script>

{#if visible}
  <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl">
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-sm font-bold text-slate-900 truncate pr-4">{title} 제어</h3>
        <button onclick={onCancel} class="text-slate-400 p-1 transition hover:bg-slate-50 rounded-lg">
          <X class="w-4 h-4" />
        </button>
      </div>
      <div class="space-y-1">
        <button
          onclick={() => onAction('edit')}
          class="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl transition"
        >
          <Edit3 class="w-4 h-4 text-slate-500" />
          <span>속성 및 일정 수정</span>
        </button>
        <button
          onclick={() => onAction('archive')}
          class="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl transition"
        >
          <Archive class="w-4 h-4 text-slate-500" />
          <span>보관 처리 (숨김)</span>
        </button>
        <button
          onclick={() => onAction('delete')}
          class="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 text-xs font-bold text-red-600 rounded-xl transition"
        >
          <Trash2 class="w-4 h-4 text-red-500" />
          <span>영구 삭제 (Deep Delete)</span>
        </button>
      </div>
    </div>
  </div>
{/if}
