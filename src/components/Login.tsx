import React from 'react';
import { Lock, ChevronRight, Instagram } from 'lucide-react';

interface LoginProps {
  onLogin: (platform: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  return (
    <section id="view-login" className="absolute inset-0 flex items-center justify-center p-6 bg-slate-50 overflow-y-auto">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 w-full max-w-sm transition-all duration-300 transform hover:scale-[1.01]">
        <div className="text-center mb-6">
          <div className="inline-flex bg-indigo-50 text-indigo-600 p-3.5 rounded-2xl mb-3 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">세션 일정 통합 시스템</h2>
          <p className="text-slate-400 mt-1 text-xs">수기 일정 취합의 지옥에서 탈출하세요</p>
        </div>
        <div className="space-y-2.5">
          <button
            onClick={() => onLogin('Google')}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition text-xs font-semibold text-slate-700 shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 flex items-center justify-center text-red-500 font-bold">G</span>
              <span>Google 계정으로 인증</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={() => onLogin('Naver')}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#03C75A] text-white rounded-xl hover:opacity-90 transition text-xs font-semibold shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 flex items-center justify-center font-bold">N</span>
              <span>네이버 계정으로 인증</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-white/80" />
          </button>

          <button
            onClick={() => onLogin('Kakao')}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#FEE500] text-[#191919] rounded-xl hover:opacity-90 transition text-xs font-semibold shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 flex items-center justify-center font-bold">K</span>
              <span>카카오 계정으로 인증</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
          </button>

          <button
            onClick={() => onLogin('Instagram')}
            className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#F9ED32] via-[#EE2A7B] to-[#D8019F] text-white rounded-xl hover:opacity-95 transition text-xs font-semibold shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <Instagram className="w-4 h-4 text-white" />
              <span>Instagram 계정으로 인증</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-white/80" />
          </button>
        </div>
      </div>
    </section>
  );
}

