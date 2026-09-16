import React, { useState, useEffect, useCallback, useMemo } from 'react';
import StatsHeader from './components/StatsHeader';
import ModpackCard from './components/ModpackCard';
import SubmitModal from './components/SubmitModal';
import PlayerIdentityModal from './components/PlayerIdentityModal';
import VotersModal from './components/VotersModal';
import AdminDrawer from './components/AdminDrawer';
import { Loader2, AlertCircle, Sparkles, Trophy } from 'lucide-react';

export default function App() {
  const [packs, setPacks] = useState([]);
  const [stats, setStats] = useState({
    totalPacks: 0,
    customPacks: 0,
    totalVotes: 0,
    uniqueVoters: 0,
    leader: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Player identity
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('mc_voter_name') || '';
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [sortBy, setSortBy] = useState('votes');

  // Modals
  const [isIdentityOpen, setIsIdentityOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [viewingPack, setViewingPack] = useState(null);

  // Fetch all packs from backend
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/packs');
      if (!res.ok) throw new Error('网络响应异常');
      const data = await res.json();
      if (data.success) {
        setPacks(data.packs);
        setStats(data.stats);
        setError('');
      } else {
        setError(data.error || '获取整合包失败');
      }
    } catch (err) {
      console.error(err);
      setError('无法连接到投票服务器，请检查服务端是否运行');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 12 seconds so group members see live changes
    const timer = setInterval(fetchData, 12000);
    return () => clearInterval(timer);
  }, [fetchData]);

  // Set player identity
  const handleSavePlayerName = (name) => {
    const clean = name.trim();
    setPlayerName(clean);
    localStorage.setItem('mc_voter_name', clean);
  };

  // Vote handler
  const handleVote = async (packId) => {
    // If player hasn't set their name yet, prompt them to set their IGN!
    if (!playerName) {
      setIsIdentityOpen(true);
      return;
    }

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId,
          playerName,
          playerId: playerName
        })
      });

      const data = await res.json();
      if (data.success) {
        // Update pack in local state immediately
        setPacks((prev) =>
          prev.map((p) => (p.id === packId ? data.pack : p))
        );
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        alert(data.error || '投票异常');
      }
    } catch (err) {
      alert('网络连接失败，请稍后重试');
    }
  };

  // After proposing a modpack
  const handleCustomSubmitSuccess = (newPack, newStats) => {
    setPacks((prev) => [newPack, ...prev]);
    if (newStats) {
      setStats(newStats);
    }
  };

  // Compute max votes for XP bar scaling
  const maxVotes = useMemo(() => {
    return Math.max(1, ...packs.map((p) => p.votes?.length || 0));
  }, [packs]);

  // Filter & sort modpacks
  const filteredPacks = useMemo(() => {
    let result = [...packs];

    // Category filter
    if (activeCategory === '官方候选') {
      result = result.filter((p) => p.isPreset);
    } else if (activeCategory === '群友自荐') {
      result = result.filter((p) => !p.isPreset);
    } else if (activeCategory !== '全部') {
      result = result.filter((p) => {
        const catMatch = (p.category || '').toLowerCase().includes(activeCategory.toLowerCase());
        const tagMatch = (p.tags || []).some((t) =>
          t.toLowerCase().includes(activeCategory.toLowerCase())
        );
        return catMatch || tagMatch;
      });
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((p) => {
        return (
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          (p.version || '').toLowerCase().includes(query) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(query)) ||
          (p.suggestedBy || '').toLowerCase().includes(query)
        );
      });
    }

    // Sort
    result.sort((a, b) => {
      // Pinned items always stay at top unless sorting differently
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortBy === 'votes') {
        const diff = (b.votes?.length || 0) - (a.votes?.length || 0);
        if (diff !== 0) return diff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'version') {
        return (b.version || '').localeCompare(a.version || '');
      }
      return 0;
    });

    return result;
  }, [packs, activeCategory, searchQuery, sortBy]);

  return (
    <div className="min-h-screen mc-bg-pattern flex flex-col justify-between text-stone-200">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* Top Header & Dashboard */}
        <StatsHeader
          stats={stats}
          playerName={playerName}
          onOpenIdentity={() => setIsIdentityOpen(true)}
          onOpenSubmit={() => {
            if (!playerName) {
              setIsIdentityOpen(true);
            } else {
              setIsSubmitOpen(true);
            }
          }}
          onOpenAdmin={() => setIsAdminOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded bg-red-950/80 border border-red-800 text-red-200 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchData}
              className="text-xs px-2.5 py-1 bg-red-900 rounded hover:bg-red-800 text-white"
            >
              重试
            </button>
          </div>
        )}

        {/* First visit prompt banner */}
        {!playerName && !loading && (
          <div className="mc-panel p-3.5 rounded bg-emerald-950/40 border-emerald-600/50 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-300">
              <Sparkles size={16} className="text-emerald-400 shrink-0" />
              <span>
                <strong>欢迎参与群服选包！</strong> 设定你的游戏名或群名片，即可参与投票并展示你的专属皮肤头像。
              </span>
            </div>
            <button
              onClick={() => setIsIdentityOpen(true)}
              className="mc-btn mc-btn-emerald text-xs px-3.5 py-1.5"
            >
              立即设置我的身份
            </button>
          </div>
        )}

        {/* Modpack Cards Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 size={36} className="animate-spin text-emerald-400" />
            <p className="text-sm font-mono text-stone-400">正在同步服务端整合包数据...</p>
          </div>
        ) : filteredPacks.length === 0 ? (
          <div className="mc-panel rounded-lg py-16 px-4 text-center">
            <p className="text-base text-stone-400 mb-2">未找到匹配的整合包条目</p>
            <p className="text-xs text-stone-500 mb-4">没有群友提议这个包？你可以亲自成为发起人！</p>
            <button
              onClick={() => {
                if (!playerName) setIsIdentityOpen(true);
                else setIsSubmitOpen(true);
              }}
              className="mc-btn mc-btn-gold text-xs px-4 py-2"
            >
              + 提议添加这个整合包
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPacks.map((pack, index) => (
              <ModpackCard
                key={pack.id}
                pack={pack}
                rank={index + 1}
                maxVotes={maxVotes}
                totalVotes={stats.totalVotes}
                currentPlayerName={playerName}
                onVote={handleVote}
                onViewVoters={(p) => setViewingPack(p)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-stone-800/80 py-6 text-center text-xs text-stone-500 bg-[#0e1014]/60">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            ⛏️ Minecraft 交流群服务器 · 周目整合包大选系统
          </div>
          <div className="text-[11px] text-stone-600">
            纯正MC风格 · 服务端实时存盘 · 支持群友自荐与正版皮肤联动
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PlayerIdentityModal
        isOpen={isIdentityOpen}
        onClose={() => setIsIdentityOpen(false)}
        currentName={playerName}
        onSave={handleSavePlayerName}
      />

      <SubmitModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        playerName={playerName}
        onSubmitSuccess={handleCustomSubmitSuccess}
      />

      <VotersModal
        isOpen={Boolean(viewingPack)}
        onClose={() => setViewingPack(null)}
        pack={viewingPack}
      />

      <AdminDrawer
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        packs={packs}
        onDataChange={fetchData}
      />
    </div>
  );
}
