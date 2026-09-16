import React, { useState } from 'react';
import { Shield, Key, X, Pin, Trash2, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { soundManager } from '../utils/sound';

export default function AdminDrawer({ isOpen, onClose, packs, onDataChange }) {
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    soundManager.playClick();

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.success) {
        setIsAdmin(true);
      } else {
        setError('管理密码错误');
      }
    } catch (err) {
      setError('网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async (packId) => {
    soundManager.playClick();
    try {
      const res = await fetch('/api/admin/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId, password })
      });
      const data = await res.json();
      if (data.success) {
        onDataChange();
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('操作失败');
    }
  };

  const handleDelete = async (packId, packName) => {
    if (!window.confirm(`确定要移除整合包【${packName}】吗？`)) return;
    soundManager.playClick();
    try {
      const res = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId, password })
      });
      const data = await res.json();
      if (data.success) {
        onDataChange();
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('删除失败');
    }
  };

  const handleResetVotes = async () => {
    soundManager.playClick();
    try {
      const res = await fetch('/api/admin/reset-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.success) {
        setConfirmReset(false);
        alert('所有选票已清空并归零！');
        onDataChange();
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('重置失败');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="mc-panel w-full max-w-lg p-6 relative rounded border-2 border-stone-600 bg-[#1e2229] max-h-[90vh] flex flex-col">
        {/* Close */}
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

        {/* Title */}
        <div className="flex items-center gap-3 mb-5 border-b border-stone-700 pb-3 shrink-0">
          <div className="w-10 h-10 rounded bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400">
            <Shield size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-400 flex items-center gap-2">
              <span>服主 / 管理后台控制台</span>
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              清理恶意灌水、置顶主推候选或重置开盘投票
            </p>
          </div>
        </div>

        {!isAdmin ? (
          /* Password verification screen */
          <form onSubmit={handleVerify} className="space-y-4 py-3">
            <div>
              <label className="block text-sm font-semibold text-stone-300 mb-1.5 flex items-center gap-1.5">
                <Key size={16} className="text-amber-400" />
                输入管理员密码
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="默认: mcadmin888"
                className="w-full px-3.5 py-2.5 bg-[#14161b] border border-stone-600 rounded text-stone-100 focus:outline-hidden focus:border-red-500 text-sm"
              />
              <p className="text-xs text-stone-500 mt-1">
                默认初始密码为 <code className="text-amber-300">mcadmin888</code>（服务端环境变量 ADMIN_PASSWORD 可自定义）
              </p>
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-950/50 p-2.5 rounded border border-red-800">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="mc-btn mc-btn-stone px-4 py-2 text-sm"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="mc-btn mc-btn-redstone px-5 py-2 text-sm"
              >
                {loading ? '验证中...' : '解锁管理权限'}
              </button>
            </div>
          </form>
        ) : (
          /* Admin dashboard */
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="bg-emerald-950/40 border border-emerald-700/50 p-3 rounded flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>已获取管理员权限。可在下方管理候选整合包或重置投票。</span>
            </div>

            {/* List of modpacks for quick pin / delete */}
            <div>
              <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                候选整合包管理 ({packs.length} 个)
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {packs.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded bg-[#14161b] border border-stone-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-stone-200 truncate flex items-center gap-1.5">
                        {p.isPinned && (
                          <span className="text-[10px] px-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">
                            置顶
                          </span>
                        )}
                        <span className="truncate">{p.name}</span>
                      </div>
                      <div className="text-stone-500 text-[11px] mt-0.5">
                        {p.version} · {p.votes?.length || 0} 票 · {p.isPreset ? '预设' : `提议人: ${p.suggestedBy}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleTogglePin(p.id)}
                        className={`px-2 py-1 rounded border text-xs flex items-center gap-1 transition ${
                          p.isPinned
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                            : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'
                        }`}
                        title="切换置顶状态"
                      >
                        <Pin size={12} />
                        <span>{p.isPinned ? '取消置顶' : '置顶'}</span>
                      </button>

                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="px-2 py-1 rounded bg-red-950/60 border border-red-800/60 text-red-300 hover:bg-red-900/60 text-xs flex items-center gap-1 transition"
                        title="删除此整合包"
                      >
                        <Trash2 size={12} />
                        <span>删除</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-3 border-t border-stone-700/80">
              <div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle size={14} />
                高危区域 (Danger Zone)
              </div>

              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="mc-btn mc-btn-stone text-xs text-red-300 border-red-900/50 hover:bg-red-950/50 px-3 py-1.5 flex items-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>清空所有投票记录 (新轮次重启)</span>
                </button>
              ) : (
                <div className="p-3 bg-red-950/80 border border-red-600 rounded space-y-2">
                  <p className="text-xs text-red-200">
                    ⚠️ 确定要清空全部群友的投票记录吗？所有整合包得票将归零，保留整合包词条本身。此操作不可逆！
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleResetVotes}
                      className="mc-btn mc-btn-redstone text-xs px-3 py-1.5"
                    >
                      确认清空票数
                    </button>
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="mc-btn mc-btn-stone text-xs px-3 py-1.5"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
