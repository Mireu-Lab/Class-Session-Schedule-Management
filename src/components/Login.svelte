<script lang="ts">
  import { Lock, ChevronRight, LogIn } from 'lucide-svelte';

  let { onLogin } = $props();
</script>

<section id="view-login" class="absolute inset-0 flex items-center justify-center p-6 bg-slate-50 overflow-y-auto">
  <div class="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 w-full max-w-sm transition-all duration-300 transform hover:scale-[1.01]">
    <div class="text-center mb-8">
      <div class="inline-flex bg-indigo-50 text-indigo-600 p-4 rounded-2xl mb-4 shadow-sm ring-1 ring-indigo-100/50">
        <Lock class="w-8 h-8" />
      </div>
      <h2 class="text-xl font-extrabold text-slate-900 tracking-tight">세션 일정 통합 시스템</h2>
      <p class="text-slate-500 mt-2 text-xs font-medium">관리자 및 게스트 본인 인증을 위해<br/>구글 계정 로그인이 필요합니다.</p>
    </div>
    <div class="space-y-3">
      <button
        onclick={() => onLogin('Google')}
        class="w-full flex items-center justify-between px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-indigo-600 transition-all text-sm font-bold text-slate-700 shadow-sm group active:scale-[0.98]"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
            <span class="text-red-500 font-extrabold text-lg">G</span>
          </div>
          <span class="group-hover:text-indigo-700 transition-colors text-[13px]">Google 계정으로 시작하기</span>
        </div>
        <LogIn class="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
      </button>
    </div>
  </div>
</section>
