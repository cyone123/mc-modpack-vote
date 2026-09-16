import React from 'react';
import { 
  Pin, 
  Check, 
  ExternalLink, 
  Cpu, 
  Layers, 
  HardDrive, 
  Users, 
  Sparkles,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/sound';

export default function ModpackCard({ 
  pack, 
  maxVotes = 1, 
  totalVotes = 0,
  currentPlayerName = '', 
  onVote, 
  onViewVoters,
  rank = 1
}) {
  const votes = pack.votes || [];
  const voteCount = votes.length;
  
  // Check if current user has voted for this pack
  const hasVoted = Boolean(
    currentPlayerName && 
    votes.some(v => 
      (v.playerName && v.playerName.toLowerCase() === currentPlayerName.toLowerCase().trim()) ||
      (v.playerId && v.playerId.toLowerCase() === currentPlayerName.toLowerCase().trim())
    )
  );

  // Compute XP progress percentage relative to top candidate (or at least 1)
  const percent = maxVotes > 0 ? Math.min(100, Math.round((voteCount / maxVotes) * 100)) : 0;

  const handleVoteClick = (e) => {
    soundManager.playClick();
    
    // Trigger confetti if casting vote
    if (!hasVoted) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { x, y },
        colors: ['#22c55e', '#86efac', '#eab308', '#38bdf8']
      });
      soundManager.playXp();
    } else {
      soundManager.playPop();
    }

    onVote(pack.id);
  };

  return (
    <div 
      className={`mc-panel relative rounded-lg p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:border-stone-500/80 group ${
        pack.isPinned ? 'border-amber-500/60 bg-[#1c1e24]' : 'bg-[#181a20]'
      } ${hasVoted ? 'ring-2 ring-emerald-500/60 shadow-[0_0_20px_rgba(34,197,94,0.15)]' : ''}`}
    >
      {/* Top Banner / Pin Badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {pack.isPinned && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50">
              <Pin size={12} className="rotate-45" />
              服主置顶
            </span>
          )}

          {pack.isPreset ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
              <Award size={12} />
              官方候选
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-950/70 text-purple-300 border border-purple-800/60">
              <Sparkles size={12} />
              群友自荐 · @{pack.suggestedBy || '群友'}
            </span>
          )}

          <span className="text-[11px] px-2 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">
            {pack.category || '综合模组'}
          </span>
        </div>

        {/* Rank indicator */}
        <div className="shrink-0 flex items-center">
          {voteCount > 0 && rank <= 3 ? (
            <div className={`mc-font-pixel text-[11px] px-2 py-0.5 rounded font-bold ${
              rank === 1 ? 'bg-amber-400 text-stone-950' : 
              rank === 2 ? 'bg-stone-300 text-stone-950' : 
              'bg-amber-700 text-white'
            }`}>
              NO.{rank}
            </div>
          ) : (
            <div className="text-[11px] text-stone-500 font-mono">
              #{rank}
            </div>
          )}
        </div>
      </div>

      {/* Title & Description */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white leading-snug group-hover:text-emerald-300 transition-colors flex items-start justify-between gap-2">
          <span>{pack.name}</span>
          {pack.link && (
            <a
              href={pack.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-500 hover:text-emerald-400 p-0.5 transition-colors shrink-0"
              title="查看整合包主页/百科"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={15} />
            </a>
          )}
        </h3>

        {/* Modpack meta specs */}
        <div className="flex flex-wrap gap-2 text-xs text-stone-400 mt-2.5">
          <span className="inline-flex items-center gap-1 bg-[#121419] px-2 py-1 rounded border border-stone-800">
            <Layers size={13} className="text-stone-400" />
            <strong className="text-stone-200">{pack.version}</strong>
          </span>

          <span className="inline-flex items-center gap-1 bg-[#121419] px-2 py-1 rounded border border-stone-800">
            <Cpu size={13} className="text-stone-400" />
            <span>{pack.loader || 'Forge'}</span>
          </span>

          <span className="inline-flex items-center gap-1 bg-[#121419] px-2 py-1 rounded border border-stone-800">
            <HardDrive size={13} className="text-stone-400" />
            <span>{pack.memoryReq || '6GB+'}</span>
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-stone-300 mt-3 leading-relaxed line-clamp-3 bg-[#13151a]/50 p-2.5 rounded border border-stone-800/80">
          {pack.description}
        </p>

        {/* Tags */}
        {pack.tags && pack.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {pack.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800/60 text-stone-400 border border-stone-700/50"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Minecraft XP Bar / Voting Progress */}
      <div className="pt-2 border-t border-stone-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-stone-400 flex items-center gap-1 text-[11px]">
            <span>竞选热度</span>
            <span className="text-stone-500">({percent}%)</span>
          </span>

          <div className="flex items-center gap-1.5">
            <span className="mc-xp-number text-sm font-bold">
              {voteCount} 票
            </span>
            <span className="text-[10px] text-stone-500">
              / 总计 {totalVotes}
            </span>
          </div>
        </div>

        {/* The XP Track */}
        <div className="mc-xp-track w-full">
          <div 
            className="mc-xp-fill" 
            style={{ width: `${Math.max(percent > 0 ? percent : 0, voteCount > 0 ? 6 : 0)}%` }}
          />
        </div>

        {/* Supporters Avatar Row */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => onViewVoters(pack)}
            className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-emerald-400 transition cursor-pointer py-1"
            title="查看所有投票群友"
          >
            <Users size={12} />
            {voteCount === 0 ? (
              <span>暂无支持者</span>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1.5 overflow-hidden">
                  {votes.slice(0, 4).map((v, i) => {
                    const name = v.playerName || v.playerId || 'Player';
                    return (
                      <img
                        key={i}
                        src={`https://mc-heads.net/avatar/${encodeURIComponent(name)}/24`}
                        alt={name}
                        title={name}
                        className="inline-block w-5 h-5 rounded-full ring-1 ring-stone-900 bg-stone-800 image-rendering-pixelated"
                        onError={(e) => {
                          e.currentTarget.src = 'https://mc-heads.net/avatar/Steve/24';
                        }}
                      />
                    );
                  })}
                </div>
                <span>{voteCount} 位支持者 ➔</span>
              </div>
            )}
          </button>

          {/* Big Vote / Unvote Button */}
          <button
            onClick={handleVoteClick}
            className={`mc-btn text-xs px-4 py-2 ${
              hasVoted ? 'mc-btn-emerald' : 'mc-btn-stone hover:border-emerald-500/50'
            }`}
          >
            {hasVoted ? (
              <span className="flex items-center gap-1">
                <Check size={14} className="stroke-[3]" />
                已投此包
              </span>
            ) : (
              <span>投它一票</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
