<script lang="ts">
  import { X, Share2 } from 'lucide-svelte';
  import type { SnsAccount, User } from '../types';

  let { visible = false, snsAccounts = [], currentUser = null, onToggleLink, onCancel } = $props<{
    visible?: boolean;
    snsAccounts?: SnsAccount[];
    currentUser?: User | null;
    onToggleLink: (idx: number) => void;
    onCancel: () => void;
  }>();
</script>

{#if visible}
  <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl">
      <div class="flex justify-between items-center mb-3.5">
        <h3 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <Share2 class="w-4 h-4 text-indigo-600" />
          <span>관리자 SNS 연동 설정</span>
        </h3>
        <button onclick={onCancel} class="text-slate-400 p-1 hover:bg-slate-50 rounded-lg transition">
          <X class="w-4 h-4" />
        </button>
      </div>
      <div class="space-y-3">
        {#each snsAccounts as acc, idx}
          {#if acc.provider === 'Google'}
          <div class="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
            <div class="flex items-center gap-2.5">
              <span
                class="w-2.5 h-2.5 rounded-full {
                  acc.linked ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'
                }"
              ></span>
              <div>
                <p class="text-xs font-bold text-slate-800">{acc.linked ? (currentUser?.displayName || '시스템 관리자') : acc.provider} 계정</p>
                <p class="text-[10px] text-slate-400 mt-0.5">{acc.linked ? acc.email : '미연동'}</p>
              </div>
            </div>
            <button
              onclick={() => onToggleLink(idx)}
              class="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition {
                acc.linked ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'
              }"
            >
              {acc.linked ? '연동해제' : '연동등록'}
            </button>
          </div>
          {:else}
          <!-- 비활성화
          <div class="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-sm opacity-50 pointer-events-none">
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
              <div>
                <p class="text-xs font-bold text-slate-800">{acc.provider} 계정</p>
                <p class="text-[10px] text-slate-400 mt-0.5">{acc.email}</p>
              </div>
            </div>
            <button class="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition bg-slate-100 text-slate-400">
              지원예정
            </button>
          </div>
          -->
          {/if}
        {/each}
      </div>
    </div>
  </div>
{/if}
