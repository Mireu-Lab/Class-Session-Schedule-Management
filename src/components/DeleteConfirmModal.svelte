<script lang="ts">
  import { AlertOctagon, Archive, Trash2 } from 'lucide-svelte';

  let { visible = false, onDeleteOption, onCancel } = $props();
</script>

{#if visible}
  <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-slate-100 text-center">
      <div class="mx-auto w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-3">
        <AlertOctagon class="w-5 h-5" />
      </div>
      <h3 class="text-base font-bold text-slate-900">세션 삭제 방법 선택</h3>
      <p class="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
        해당 일정을 즉시 비공개(보관함 이동) 처리하거나 데이터베이스에서 물리적으로 영구 파괴할 수 있습니다.
      </p>
      <div class="space-y-2 mt-4">
        <button
          onclick={() => onDeleteOption('soft')}
          class="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Archive class="w-4 h-4" />
          <span>소프트 삭제 (Archive 보관)</span>
        </button>
        <button
          onclick={() => onDeleteOption('deep')}
          class="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md"
        >
          <Trash2 class="w-4 h-4" />
          <span>Deep Delete (영구 물리 삭제)</span>
        </button>
        <button onclick={onCancel} class="w-full text-slate-400 hover:text-slate-600 text-xs py-1.5 font-semibold transition">
          취소
        </button>
      </div>
    </div>
  </div>
{/if}
