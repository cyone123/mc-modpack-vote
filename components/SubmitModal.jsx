'use client';

import React, { useState } from 'react';
import { PlusCircle, X, Sparkles, AlertCircle } from 'lucide-react';
import { soundManager } from '@/lib/sound';
import { getApiUrl } from '@/lib/api';
import { getClientFingerprint } from '@/lib/fingerprint';

export default function SubmitModal({ isOpen, onClose, playerName, onSubmitSuccess }) {
  const [name, setName] = useState('');
  const [version, setVersion] = useState('1.20.1');
  const [customVersion, setCustomVersion] = useState('');
  const [loader, setLoader] = useState('Forge');
  const [memoryReq, setMemoryReq] = useState('6GB - 8GB');
  const [category, setCategory] = useState('科技 / 自动化');
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = name.trim();
    if (!cleanName) {
      setError('请输入整合包名称');
      return;
    }

    const finalVersion = version === 'custom' ? customVersion.trim() : version;
    if (!finalVersion) {
      setError('请输入或选择适用 Minecraft 版本');
      return;
    }

    const cleanDesc = description.trim();
    if (!cleanDesc) {
      setError('请简单填写推荐理由或核心玩法特色');
      return;
    }

    setSubmitting(true);
    soundManager.playClick();

    try {
      const { deviceId, fingerprint } = getClientFingerprint();
      const res = await fetch(getApiUrl('/api/suggest'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          version: finalVersion,
          loader,
          memoryReq,
          category,
          tags: tags.split(/[,，、\s]+/).filter(Boolean),
          description: cleanDesc,
          link: link.trim(),
          suggestedBy: (playerName || '热心群友').trim(),
          deviceId,
          fingerprint
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || '提交失败');
      }

      soundManager.playSuccess();
      onSubmitSuccess(data.pack, data.stats);
      onClose();

      // Reset form
      setName('');
      setDescription('');
      setTags('');
      setLink('');
    } catch (err) {
      setError(err.message || '网络连接异常');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="mc-panel w-full max-w-xl p-6 relative rounded border-2 border-stone-600 bg-[#1e2229] my-6">
        {/* Close Button */}
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
        <div className="flex items-center gap-3 mb-5 border-b border-stone-700 pb-3">
          <div className="w-10 h-10 rounded bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
            <PlusCircle size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
              <span>提议我想玩的整合包</span>
              <Sparkles size={16} className="text-amber-300" />
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              提交后将直接加入群内候选投票池，并自动为你投上第 1 票！
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-950/80 border border-red-700/80 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Modpack Name */}
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1">
              整合包全称 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如: 机械动力：理想大陆 / 重力反转科技包"
              className="w-full px-3 py-2 bg-[#14161b] border border-stone-600 rounded text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-amber-500 text-sm"
            />
          </div>

          {/* Grid: Version, Loader, Memory */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1">
                MC 版本 <span className="text-red-400">*</span>
              </label>
              <select
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full px-2.5 py-2 bg-[#14161b] border border-stone-600 rounded text-stone-100 focus:outline-hidden focus:border-amber-500 text-sm"
              >
                <option value="1.20.1">1.20.1 (主流新版)</option>
                <option value="1.21">1.21 (最新版)</option>
                <option value="1.19.2">1.19.2</option>
                <option value="1.18.2">1.18.2</option>
                <option value="1.16.5">1.16.5 (成熟科技)</option>
                <option value="1.12.2">1.12.2 (经典巨作)</option>
                <option value="1.7.10">1.7.10 (硬核工业)</option>
                <option value="custom">其他自填版本...</option>
              </select>
              {version === 'custom' && (
                <input
                  type="text"
                  placeholder="自填版本 如: 1.20.4"
                  value={customVersion}
                  onChange={(e) => setCustomVersion(e.target.value)}
                  className="w-full mt-1.5 px-2.5 py-1.5 bg-[#14161b] border border-stone-600 rounded text-xs text-stone-100"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1">
                加载器 (Loader)
              </label>
              <select
                value={loader}
                onChange={(e) => setLoader(e.target.value)}
                className="w-full px-2.5 py-2 bg-[#14161b] border border-stone-600 rounded text-stone-100 focus:outline-hidden focus:border-amber-500 text-sm"
              >
                <option value="Forge">Forge</option>
                <option value="Fabric">Fabric</option>
                <option value="NeoForge">NeoForge</option>
                <option value="Quilt">Quilt</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1">
                配置/内存要求
              </label>
              <select
                value={memoryReq}
                onChange={(e) => setMemoryReq(e.target.value)}
                className="w-full px-2.5 py-2 bg-[#14161b] border border-stone-600 rounded text-stone-100 focus:outline-hidden focus:border-amber-500 text-sm"
              >
                <option value="4GB (低配友好)">4GB (低配友好)</option>
                <option value="6GB - 8GB (标准配置)">6GB - 8GB (标准)</option>
                <option value="10GB - 12GB (高配)">10GB - 12GB (高配)</option>
                <option value="16GB+ (巨无霸全家桶)">16GB+ (巨无霸)</option>
              </select>
            </div>
          </div>

          {/* Category & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1">
                分类倾向
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-2 bg-[#14161b] border border-stone-600 rounded text-stone-100 focus:outline-hidden focus:border-amber-500 text-sm"
              >
                <option value="科技 / 自动化">科技 / 自动化</option>
                <option value="综合 / 全能全家桶">综合 / 全能全家桶</option>
                <option value="魔法 / 修仙">魔法 / 修仙</option>
                <option value="RPG / 地牢刷宝">RPG / 地牢刷宝</option>
                <option value="生存 / 硬核天灾">生存 / 硬核天灾</option>
                <option value="休闲 / 宝可梦养老">休闲 / 宝可梦养老</option>
                <option value="生电 / 原版增强">生电 / 原版增强</option>
                <option value="特色 / 模组混搭">特色 / 模组混搭</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1">
                特征标签 (逗号分隔)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="例如: 机械动力, 太空, 任务驱动"
                className="w-full px-3 py-2 bg-[#14161b] border border-stone-600 rounded text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-amber-500 text-sm"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1">
              推荐理由 / 核心玩法特色 <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="介绍一下这个整合包为什么好玩？有哪些吸引大家一起联机的亮点？"
              className="w-full px-3 py-2 bg-[#14161b] border border-stone-600 rounded text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-amber-500 text-sm"
            />
          </div>

          {/* Link */}
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1">
              整合包链接 / CurseForge / MC百科 (选填)
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://www.curseforge.com/... 或 MC百科链接"
              className="w-full px-3 py-2 bg-[#14161b] border border-stone-600 rounded text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-amber-500 text-sm"
            />
          </div>

          {/* Submitter info notice */}
          <div className="bg-[#14161b] p-2.5 rounded border border-stone-700/60 text-xs text-stone-400 flex items-center justify-between">
            <span>提议人署名: <strong className="text-emerald-400">{playerName || '热心群友'}</strong></span>
            <span className="text-[11px] text-stone-500">将展示为推荐者并计入首票</span>
          </div>

          {/* Submit buttons */}
          <div className="flex justify-end gap-3 pt-2">
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
              disabled={submitting}
              className={`mc-btn mc-btn-gold px-6 py-2 text-sm flex items-center gap-1.5 ${
                submitting ? 'opacity-50 cursor-wait' : ''
              }`}
            >
              <Sparkles size={16} />
              {submitting ? '提交中...' : '立即提交并投票'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
