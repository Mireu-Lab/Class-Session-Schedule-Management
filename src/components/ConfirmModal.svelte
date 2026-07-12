<script lang="ts">
  import { CheckCircle } from 'lucide-svelte';

  let { visible = false, message = '', onConfirm, onCancel } = $props();
</script>

{#if visible}
  <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-5 w-full max-w-xs shadow-2xl text-center">
      <div class="mx-auto w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
        <CheckCircle class="w-5 h-5" />
      </div>
      <h3 class="text-sm font-bold text-slate-900">최종 일정 제출 검토</h3>
      <p class="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{@html message}</p>
      <div class="flex gap-2 pt-4">
        <button
          onclick={onCancel}
          class="flex-1 bg-slate-100 text-slate-700 font-bold py-2 rounded-xl text-xs transition hover:bg-slate-200"
        >
          수정
        </button>
        <button
          onclick={onConfirm}
          class="flex-1 bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs transition hover:bg-emerald-700"
        >
          확정
        </button>
      </div>
    </div>
  </div>
{/if}
