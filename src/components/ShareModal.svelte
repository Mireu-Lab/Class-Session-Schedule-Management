<script lang="ts">
  import { X, Mail } from 'lucide-svelte';

  let {
    visible = false,
    adminEmailsText = $bindable(''),
    viewerEmailsText = $bindable(''),
    cascadeCategory = $bindable(false),
    onSave,
    onCancel
  } = $props();
</script>

{#if visible}
  <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
    <div class="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl">
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <Mail class="w-4 h-4 text-indigo-600" />
          <span>공유 및 메일 권한 설정</span>
        </h3>
        <button onclick={onCancel} class="text-slate-400 p-1 hover:bg-slate-50 rounded-lg transition">
          <X class="w-4 h-4" />
        </button>
      </div>
      <div class="space-y-3 text-xs">
        <div>
          <label for="share-admin-emails" class="block text-[10px] font-bold text-slate-400 mb-1">세션 관리자 할당 메일 (쉼표 구분)</label>
          <input id="share-admin-emails"
            type="text"
            bind:value={adminEmailsText}
            placeholder="admin1@co.com, admin2@co.com"
            class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label for="share-viewer-emails" class="block text-[10px] font-bold text-slate-400 mb-1">보기 권한 공유 대상 메일 (쉼표 구분)</label>
          <input id="share-viewer-emails"
            type="text"
            bind:value={viewerEmailsText}
            placeholder="viewer1@co.com, viewer2@co.com"
            class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div class="bg-indigo-50 p-3 rounded-lg text-[10px] text-indigo-800 font-semibold space-y-1">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              bind:checked={cascadeCategory}
              class="rounded border-slate-300"
            />
            이 카테고리 내 모든 세션에 일괄 권한 적용
          </label>
        </div>
        <button onclick={onSave} class="w-full bg-indigo-600 hover:bg-indigo-700 transition text-white font-bold py-2.5 rounded-xl text-xs">
          권한 저장 및 이메일 발송
        </button>
      </div>
    </div>
  </div>
{/if}
