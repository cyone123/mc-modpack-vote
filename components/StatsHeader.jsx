'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Flame, 
  Vote, 
  Users, 
  Box, 
  PlusCircle, 
  Volume2, 
  VolumeX, 
  Settings, 
  UserCheck, 
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

export default function StatsHeader({
  stats,
  playerName,
  onOpenIdentity,
  onOpenSubmit,
  onOpenAdmin,
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  sortBy,
  onSortChange
}) {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(soundManager.isMuted);
  }, []);

  const toggleSound = () => {
    const next = soundManager.toggleMute();
    setMuted(next);
    if (!next) soundManager.playClick();
  };

  const categories = [
    '全部',
    '官方候选',
    '群友自荐',
    '科技',
    '综合',
    '魔法',
    'RPG',
    '硬核',
    '休闲',
    '生电'
  ];

  const cleanPlayerName = playerName || '未设置身份';

  return (
    <header className="space-y-5">
      {/* Top Navbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#2e5339] border-2 border-[#588157] flex items-center justify-center text-white shadow-md relative overflow-hidden">
            <span className="text-xl">⛏️</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
                <span>Minecraft 群服周目整合包大选</span>
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700/60 rounded">
                LIVE VOTE
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              投票决定下周目服务器换什么包 · 数据服务端持久化存盘
            </p>
          </div>
        </div>

        {/* User Identity & Utility Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Identity Capsule */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenIdentity();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#1c1f26] border border-stone-700 hover:border-emerald-500/80 transition text-left cursor-pointer group shadow-xs"
            title="点击修改游戏ID或群昵称"
          >
            <div className="w-6 h-6 rounded bg-stone-800 border border-stone-600 flex items-center justify-center overflow-hidden shrink-0">
              <img
                src={`https://mc-heads.net/avatar/${encodeURIComponent(cleanPlayerName)}/24`}
                alt="Avatar"
                className="w-5 h-5 image-rendering-pixelated"
                onError={(e) => {
                  e.currentTarget.src = 'https://mc-heads.net/avatar/Steve/24';
                }}
              />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[10px] text-stone-400 leading-tight">当前投票身份</div>
              <div className="text-xs font-bold text-stone-200 group-hover:text-emerald-400 transition-colors">
                {cleanPlayerName}
              </div>
            </div>
            <UserCheck size={14} className="text-emerald-400 ml-1 hidden sm:block" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded border transition cursor-pointer ${
              muted
                ? 'bg-stone-800/80 border-stone-700 text-stone-500'
                : 'bg-emerald-950/60 border-emerald-700/60 text-emerald-400'
            }`}
            title={muted ? '开启经典MC音效' : '静音模式'}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {/* Admin console button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenAdmin();
            }}
            className="p-2 rounded bg-stone-800/80 border border-stone-700 text-stone-400 hover:text-red-400 hover:border-red-500/60 transition cursor-pointer"
            title="服主 / 管理员后台"
          >
            <Settings size={16} />
          </button>

          {/* Propose / Submit Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenSubmit();
            }}
            className="mc-btn mc-btn-gold text-xs px-3.5 py-2 flex items-center gap-1.5 shadow-md"
          >
            <PlusCircle size={15} />
            <span className="hidden sm:inline">提议我想玩的整合包</span>
            <span className="sm:hidden">自荐整合包</span>
          </button>
        </div>
      </div>

      {/* Stats KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Total Packs */}
        <div className="mc-panel p-3 rounded flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-blue-950/80 border border-blue-600/50 flex items-center justify-center text-blue-400 shrink-0">
            <Box size={18} />
          </div>
          <div>
            <div className="text-[11px] text-stone-400 font-medium">候选整合包</div>
            <div className="text-lg font-black text-white font-mono flex items-baseline gap-1">
              <span>{stats.totalPacks || 0}</span>
              <span className="text-[11px] font-normal text-stone-500">
                ({stats.customPacks || 0} 自荐)
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Votes */}
        <div className="mc-panel p-3 rounded flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-emerald-950/80 border border-emerald-600/50 flex items-center justify-center text-emerald-400 shrink-0">
            <Vote size={18} />
          </div>
          <div>
            <div className="text-[11px] text-stone-400 font-medium">累计选票数</div>
            <div className="text-lg font-black text-emerald-400 font-mono">
              {stats.totalVotes || 0} <span className="text-xs font-normal text-emerald-600">票</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Unique Voters */}
        <div className="mc-panel p-3 rounded flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-purple-950/80 border border-purple-600/50 flex items-center justify-center text-purple-400 shrink-0">
            <Users size={18} />
          </div>
          <div>
            <div className="text-[11px] text-stone-400 font-medium">参投群友</div>
            <div className="text-lg font-black text-purple-300 font-mono">
              {stats.uniqueVoters || 0} <span className="text-xs font-normal text-purple-500">人</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Leader */}
        <div className="mc-panel p-3 rounded flex items-center gap-3 relative overflow-hidden">
          <div className="w-9 h-9 rounded bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1">
              <Flame size={12} className="text-amber-500" />
              <span>当前领跑周目</span>
            </div>
            <div className="text-xs font-bold text-white truncate mt-0.5" title={stats.leader?.name}>
              {stats.leader ? stats.leader.name : '等待首次出票'}
            </div>
            {stats.leader && (
              <div className="text-[10px] text-amber-400 font-mono">
                已斩获 {stats.leader.votes} 票
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Categories pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                soundManager.playClick();
                onCategoryChange(cat);
              }}
              className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-emerald-500 text-stone-950 font-bold shadow-xs'
                  : 'bg-stone-800/90 text-stone-300 hover:bg-stone-700 hover:text-white border border-stone-700/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索整合包或关键词..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#14161b] border border-stone-700 rounded text-xs text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Sort selector */}
          <div className="shrink-0 flex items-center gap-1 bg-[#14161b] border border-stone-700 rounded px-2 py-1">
            <Filter size={13} className="text-stone-400" />
            <select
              value={sortBy}
              onChange={(e) => {
                soundManager.playClick();
                onSortChange(e.target.value);
              }}
              className="bg-transparent text-xs text-stone-300 focus:outline-hidden cursor-pointer"
            >
              <option value="votes" className="bg-stone-900">得票最多</option>
              <option value="newest" className="bg-stone-900">最新添加</option>
              <option value="version" className="bg-stone-900">MC版本</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
