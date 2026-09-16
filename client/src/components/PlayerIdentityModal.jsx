import React, { useState } from 'react';
import { User, Check, X, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/sound';

export default function PlayerIdentityModal({ isOpen, onClose, currentName, onSave }) {
  const [name, setName] = useState(currentName || '');
  const [avatarError, setAvatarError] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    soundManager.playClick();
    onSave(clean);
    onClose();
  };

  const cleanName = name.trim();
  const avatarUrl = cleanName
    ? `https://mc-heads.net/avatar/${encodeURIComponent(cleanName)}/64`
    : 'https://mc-heads.net/avatar/Steve/64';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="mc-panel w-full max-w-md p-6 relative rounded border-2 border-stone-600 bg-[#1e2229]">
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

        <div className="flex items-center gap-3 mb-5 border-b border-stone-700 pb-3">
          <div className="w-10 h-10 rounded bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <User size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-emerald-400 tracking-wide">
              设置群友/游戏身份
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              投票与自荐时将展示你的身份与皮肤头像
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-300 mb-1.5">
              Minecraft 游戏名 或 群昵称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setAvatarError(false);
              }}
              placeholder="例如: Steve / Alex / 你的MC游戏ID"
              maxLength={24}
              autoFocus
              className="w-full px-3.5 py-2.5 bg-[#14161b] border border-stone-600 rounded text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 text-base"
            />
            <p className="text-xs text-stone-500 mt-1.5">
              💡 提示：输入正版 Minecraft ID 将自动拉取正版皮肤头像；使用中文昵称也完全支持。
            </p>
          </div>

          {/* Skin Preview Card */}
          <div className="bg-[#15181f] border border-stone-700/80 rounded p-3.5 flex items-center gap-4">
            <div className="relative w-16 h-16 bg-stone-900 border-2 border-stone-600 rounded flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              <img
                src={avatarError ? 'https://mc-heads.net/avatar/Steve/64' : avatarUrl}
                alt="Minecraft Avatar"
                className="w-14 h-14 image-rendering-pixelated"
                onError={() => setAvatarError(true)}
              />
            </div>
            <div>
              <div className="text-xs text-stone-400 uppercase tracking-wider font-mono">
                头衔预览
              </div>
              <div className="text-base font-bold text-white flex items-center gap-1.5 mt-0.5">
                <span>{cleanName || '未命名玩家'}</span>
                {cleanName && <Sparkles size={14} className="text-amber-400" />}
              </div>
              <div className="text-xs text-emerald-400/90 mt-1">
                {cleanName ? '✓ 已就绪，投票时将展示' : '请输入昵称后保存'}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="mc-btn mc-btn-stone px-4 py-2 text-sm"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!cleanName}
              className={`mc-btn mc-btn-emerald px-6 py-2 text-sm flex items-center gap-1.5 ${
                !cleanName ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Check size={16} />
              保存身份
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
