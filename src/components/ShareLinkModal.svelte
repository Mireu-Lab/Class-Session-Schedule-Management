<script lang="ts">
  import { X, Share2, ExternalLink, Copy, QrCode } from 'lucide-svelte';
  import type { Session } from '../types';

  let { visible = false, session = null, onCancel, showToast, onDirectGoToSurvey } = $props();

  let url = $derived(session ? `${window.location.origin}${window.location.pathname}?session=${session.id}` : '');

  const handleCopy = () => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      showToast('설문 공유 링크가 클립보드에 성공적으로 복사되었습니다.', 'CheckCircle');
    }).catch(() => {
      showToast('링크 복사에 실패했습니다.', 'X');
    });
  };

  const handleOpenLink = () => {
    if (url) window.open(url, '_blank');
  };
</script>

{#if visible && session}
  <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
    <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
          <Share2 class="w-4 h-4 text-indigo-600" />
          <span>설문지 참여 링크 배포</span>
        </h3>
        <button onclick={onCancel} class="text-slate-400 p-1 hover:bg-slate-50 rounded-lg transition">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-4">
        <div class="bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100 text-center">
          <p class="text-[10px] text-indigo-800 font-extrabold mb-1">참여자 스케줄 수집 링크</p>
          <p class="text-xs text-slate-800 font-extrabold truncate max-w-full mb-2 bg-white px-2.5 py-1.5 rounded-xl border border-indigo-200 select-all font-mono">
            {url}
          </p>
          <div class="flex gap-1.5 justify-center">
            <button
              onclick={handleCopy}
              class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition"
            >
              <Copy class="w-3.5 h-3.5" />
              <span>링크 복사</span>
            </button>
            <button
              onclick={handleOpenLink}
              class="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition"
            >
              <ExternalLink class="w-3.5 h-3.5 text-slate-500" />
              <span>설문페이지 열기</span>
            </button>
          </div>
        </div>

        <!-- Simulated QR Code representing advanced deployment options -->
        <div class="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
          <div class="bg-white p-1.5 border border-slate-200 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <QrCode class="w-12 h-12 text-slate-800" />
          </div>
          <div>
            <h4 class="text-[10px] font-bold text-slate-800 mb-0.5">QR 코드 모바일 배포</h4>
            <p class="text-[9px] text-slate-400 leading-normal">
              강의실 앞 스크린이나 안내서에 이 QR 코드를 인쇄하여 게스트들의 참여를 즉시 유도하세요.
            </p>
          </div>
        </div>

        <div class="text-[9px] text-slate-400 font-semibold space-y-1 bg-slate-50/40 p-3 rounded-xl border border-slate-100">
          <p class="text-slate-600 font-bold">💡 알아두기:</p>
          <ul class="list-disc pl-3.5 space-y-0.5">
            <li>참여자들은 로그인이 필요하고 실명을 입력 후 응답할 수 있습니다.</li>
            <li>중복 제출 방지 및 재수정 허용 옵션이 실시간 적용됩니다.</li>
          </ul>
        </div>

        <button
          onclick={onCancel}
          class="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition"
        >
          확인 및 닫기
        </button>
      </div>
    </div>
  </div>
{/if}
