import React from 'react';
import { Users, X, Clock, Award } from 'lucide-react';
import { soundManager } from '../utils/sound';

export default function VotersModal({ isOpen, onClose, pack }) {
  if (!isOpen || !pack) return null;

  const votes = pack.votes || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="mc-panel w-full max-w-lg p-6 relative rounded border-2 border-stone-600 bg-[#1e2229] max-h-[85vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-stone-400 hover:text-white p-1"
          aria-label="关闭"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-4 pb-3 border-b border-stone-700 shrink-0">
          <div className="w-10 h-10 rounded bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
            <Users size={22} />
          </div>
          <div className="pr-6">
            <div className="text-xs text-emerald-400 font-mono font-semibold uppercase tracking-wider">
              支持者名单 · 共 {votes.length} 票
            </div>
            <h2 className="text-lg font-bold text-white leading-snug mt-0.5 line-clamp-2">
              {pack.name}
            </h2>
          </div>
        </div>

        {/* Voters List */}
        <div className="overflow-y-auto space-y-2 pr-1 flex-1 min-h-[150px]">
          {votes.length === 0 ? (
            <div className="text-center py-10 text-stone-500">
              <Award size={36} className="mx-auto mb-2 opacity-30 text-emerald-400" />
              <p className="text-sm">暂无群友投票，快来投出首张神圣的一票！</p>
            </div>
          ) : (
            votes.map((voter, index) => {
              const name = voter.playerName || voter.playerId || '匿名群友';
              const dateStr = voter.timestamp
                ? new Date(voter.timestamp).toLocaleDateString('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : '刚刚';

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 rounded bg-[#15171d] border border-stone-800 hover:border-stone-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9 bg-stone-900 border border-stone-700 rounded flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={`https://mc-heads.net/avatar/${encodeURIComponent(name)}/36`}
                        alt={name}
                        className="w-8 h-8 image-rendering-pixelated"
                        onError={(e) => {
                          e.currentTarget.src = 'https://mc-heads.net/avatar/Steve/36';
                        }}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-stone-200 flex items-center gap-1.5">
                        <span>{name}</span>
                        {index === 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            首位支持
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                        <Clock size={11} />
                        <span>{dateStr} 投票</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-1 rounded">
                    +1 票
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-3 border-t border-stone-700/60 flex justify-end shrink-0">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="mc-btn mc-btn-stone px-5 py-2 text-sm"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
