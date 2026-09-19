import fs from 'fs';
import path from 'path';
import Redis from 'ioredis';
import { defaultPacks } from './defaultPacks.js';

// Determine storage paths based on runtime environment
const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel
  ? path.join('/tmp', 'data')
  : path.resolve(process.cwd(), 'data');

const DB_FILE = path.join(DATA_DIR, 'votes_db.json');
const SEED_DB_FILE = path.resolve(process.cwd(), 'data', 'votes_db.json');

// Memory cache & promise queue for atomic writes
let dbCache = null;
let writePromise = Promise.resolve();

// 1. Standard TCP Redis (from Vercel Marketplace REDIS_URL)
let redisClient = null;

function getRedisClient() {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!redisClient) {
    try {
      redisClient = new Redis(url, {
        maxRetriesPerRequest: 2,
        connectTimeout: 8000,
        lazyConnect: false,
      });
      redisClient.on('error', (err) => {
        console.warn('[Redis] Connection warning:', err.message);
      });
    } catch (err) {
      console.warn('[Redis] Failed to initialize client:', err.message);
      redisClient = null;
    }
  }
  return redisClient;
}

// 2. Optional Upstash / Vercel KV REST integration
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function fetchKV(command, ...args) {
  if (!KV_URL || !KV_TOKEN) return null;
  try {
    const res = await fetch(`${KV_URL}/${command}/${args.map(encodeURIComponent).join('/')}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
      cache: 'no-store'
    });
    const json = await res.json();
    return json.result;
  } catch (err) {
    console.error('[Storage KV Error]', err);
    return null;
  }
}

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn('[Storage] Could not create directory:', e.message);
  }
}

function getInitialData() {
  return {
    meta: {
      serverName: "Minecraft 交流群服务器换周目投票",
      title: "新周目玩什么整合包？群友说了算！",
      updatedAt: new Date().toISOString(),
      adminPassword: process.env.ADMIN_PASSWORD || "mcadmin888",
      deletedPackIds: []
    },
    packs: defaultPacks.map(p => ({
      ...p,
      isPinned: false,
      votes: []
    }))
  };
}

function loadDB() {
  ensureDataDir();

  // If in Vercel environment and local /tmp/votes_db.json does not exist yet,
  // try copying from project root's data/votes_db.json as seed
  if (isVercel && !fs.existsSync(DB_FILE) && fs.existsSync(SEED_DB_FILE)) {
    try {
      const seedContent = fs.readFileSync(SEED_DB_FILE, 'utf-8');
      fs.writeFileSync(DB_FILE, seedContent, 'utf-8');
      dbCache = JSON.parse(seedContent);
      return dbCache;
    } catch (e) {
      console.warn('[Storage] Failed to copy seed DB in Vercel:', e.message);
    }
  }

  if (!fs.existsSync(DB_FILE)) {
    if (fs.existsSync(SEED_DB_FILE)) {
      try {
        const raw = fs.readFileSync(SEED_DB_FILE, 'utf-8');
        dbCache = JSON.parse(raw);
        return dbCache;
      } catch (err) {
        console.error('[Storage] Error reading seed file:', err);
      }
    }

    const initialData = getInitialData();
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[Storage] Failed to write initial DB file:', e.message);
    }
    dbCache = initialData;
    return dbCache;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    dbCache = JSON.parse(raw);

    // Ensure all default packs exist (skip explicitly deleted presets)
    const deletedSet = new Set(dbCache.meta?.deletedPackIds || []);
    let hasNewPreset = false;
    defaultPacks.forEach(preset => {
      if (deletedSet.has(preset.id)) return;
      const exists = dbCache.packs.some(p => p.id === preset.id);
      if (!exists) {
        dbCache.packs.push({
          ...preset,
          isPinned: false,
          votes: []
        });
        hasNewPreset = true;
      }
    });

    if (hasNewPreset) {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf-8');
      } catch (e) {
        console.warn('[Storage] Failed to persist new presets:', e.message);
      }
    }

    return dbCache;
  } catch (err) {
    console.error("[Storage] Error reading database, using defaults:", err);
    return getInitialData();
  }
}

async function ensureLoaded() {
  // 1. Try loading from REDIS_URL via ioredis
  const redis = getRedisClient();
  if (redis) {
    try {
      const raw = await redis.get('mc_votes_db');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.packs)) {
          dbCache = parsed;
          return dbCache;
        }
      }
    } catch (e) {
      console.warn('[Storage] Could not load from REDIS_URL, falling back:', e.message);
    }
  }

  // 2. Try loading from Upstash / Vercel KV REST
  if (KV_URL && KV_TOKEN) {
    try {
      const remote = await fetchKV('get', 'mc_votes_db');
      if (remote) {
        const parsed = typeof remote === 'string' ? JSON.parse(remote) : remote;
        if (parsed && Array.isArray(parsed.packs)) {
          dbCache = parsed;
          return dbCache;
        }
      }
    } catch (e) {
      console.warn('[Storage] Could not load from KV, falling back:', e.message);
    }
  }

  // 3. Fallback to local / tmp file
  if (!dbCache) loadDB();
  return dbCache;
}

function saveDB() {
  writePromise = writePromise.then(async () => {
    try {
      ensureDataDir();
      if (!dbCache.meta) dbCache.meta = {};
      dbCache.meta.updatedAt = new Date().toISOString();

      // 1. Sync to REDIS_URL if present
      const redis = getRedisClient();
      if (redis) {
        try {
          await redis.set('mc_votes_db', JSON.stringify(dbCache));
        } catch (rErr) {
          console.error('[Storage] REDIS_URL save error:', rErr.message);
        }
      }

      // 2. Sync to Upstash / Vercel KV REST if present
      if (KV_URL && KV_TOKEN) {
        try {
          await fetch(`${KV_URL}/set/mc_votes_db`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${KV_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(JSON.stringify(dbCache))
          });
        } catch (kvErr) {
          console.error('[Storage] KV sync error:', kvErr);
        }
      }

      // 3. Persist to local / tmp file
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      await fs.promises.writeFile(tmpFile, JSON.stringify(dbCache, null, 2), 'utf-8');
      await fs.promises.rename(tmpFile, DB_FILE);
    } catch (err) {
      console.error("[Storage] Failed to save database atomically:", err);
    }
  });
  return writePromise;
}

export const storage = {
  async init() {
    await ensureLoaded();
  },

  async getPacks() {
    await ensureLoaded();
    return [...dbCache.packs].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const votesDiff = (b.votes?.length || 0) - (a.votes?.length || 0);
      if (votesDiff !== 0) return votesDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },

  async getStats() {
    await ensureLoaded();
    const packs = dbCache.packs;
    const allVotes = packs.flatMap(p => p.votes || []);
    const uniqueVoters = new Set(allVotes.map(v => (v.playerName || v.playerId || "").toLowerCase().trim())).size;

    const sorted = [...packs].sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));
    const leader = sorted.length > 0 && (sorted[0].votes?.length || 0) > 0 ? sorted[0] : null;

    return {
      totalPacks: packs.length,
      customPacks: packs.filter(p => !p.isPreset).length,
      totalVotes: allVotes.length,
      uniqueVoters,
      leader: leader ? { id: leader.id, name: leader.name, votes: leader.votes.length } : null
    };
  },

  async vote({ packId, playerId, playerName, ip }) {
    await ensureLoaded();
    const pack = dbCache.packs.find(p => p.id === packId);
    if (!pack) {
      throw new Error("整合包不存在");
    }

    if (!pack.votes) pack.votes = [];
    const normalizedName = (playerName || playerId || "群友").trim();

    const existingIndex = pack.votes.findIndex(v =>
      (v.playerName && v.playerName.toLowerCase() === normalizedName.toLowerCase()) ||
      (v.playerId && v.playerId.toLowerCase() === normalizedName.toLowerCase())
    );

    let action = 'added';
    if (existingIndex >= 0) {
      pack.votes.splice(existingIndex, 1);
      action = 'removed';
    } else {
      pack.votes.push({
        playerId: normalizedName,
        playerName: normalizedName,
        ip: ip || 'unknown',
        timestamp: new Date().toISOString()
      });
      action = 'added';
    }

    await saveDB();
    return {
      action,
      pack,
      voteCount: pack.votes.length
    };
  },

  async suggestPack({ name, version, loader, memoryReq, category, tags, description, link, suggestedBy, ip }) {
    await ensureLoaded();

    const cleanName = (name || "").trim();
    if (!cleanName) {
      throw new Error("整合包名称不能为空");
    }

    const exists = dbCache.packs.some(p => p.name.toLowerCase() === cleanName.toLowerCase());
    if (exists) {
      throw new Error("该整合包已在候选列表中，请直接搜索并为它投票！");
    }

    const id = 'custom-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

    let processedTags = [];
    if (Array.isArray(tags)) {
      processedTags = tags.map(t => t.trim()).filter(Boolean);
    } else if (typeof tags === 'string') {
      processedTags = tags.split(/[,，、\s]+/).map(t => t.trim()).filter(Boolean);
    }
    if (processedTags.length === 0) {
      processedTags = ["群友推荐"];
    }

    const newPack = {
      id,
      name: cleanName,
      version: (version || "1.20.1").trim(),
      loader: (loader || "Forge").trim(),
      memoryReq: (memoryReq || "6GB - 8GB").trim(),
      category: (category || "群友推荐").trim(),
      tags: processedTags.slice(0, 5),
      description: (description || "推荐大家一起玩这个整合包！").trim(),
      link: (link || "").trim(),
      isPreset: false,
      suggestedBy: (suggestedBy || "群友").trim(),
      votes: [
        {
          playerId: (suggestedBy || "群友").trim(),
          playerName: (suggestedBy || "群友").trim(),
          ip: ip || 'unknown',
          timestamp: new Date().toISOString()
        }
      ],
      isPinned: false,
      createdAt: new Date().toISOString()
    };

    dbCache.packs.unshift(newPack);
    await saveDB();
    return newPack;
  },

  async deletePack(packId, adminPass) {
    await ensureLoaded();
    const currentPass = process.env.ADMIN_PASSWORD || dbCache.meta?.adminPassword || "mcadmin888";
    if (adminPass !== currentPass) {
      throw new Error("管理密码错误");
    }

    const index = dbCache.packs.findIndex(p => p.id === packId);
    if (index === -1) {
      throw new Error("未找到该整合包");
    }

    if (!dbCache.meta) dbCache.meta = {};
    if (!Array.isArray(dbCache.meta.deletedPackIds)) {
      dbCache.meta.deletedPackIds = [];
    }
    if (!dbCache.meta.deletedPackIds.includes(packId)) {
      dbCache.meta.deletedPackIds.push(packId);
    }

    const [deleted] = dbCache.packs.splice(index, 1);
    await saveDB();
    return deleted;
  },

  async togglePin(packId, adminPass) {
    await ensureLoaded();
    const currentPass = process.env.ADMIN_PASSWORD || dbCache.meta?.adminPassword || "mcadmin888";
    if (adminPass !== currentPass) {
      throw new Error("管理密码错误");
    }

    const pack = dbCache.packs.find(p => p.id === packId);
    if (!pack) {
      throw new Error("未找到该整合包");
    }

    pack.isPinned = !pack.isPinned;
    await saveDB();
    return pack;
  },

  async resetAllVotes(adminPass) {
    await ensureLoaded();
    const currentPass = process.env.ADMIN_PASSWORD || dbCache.meta?.adminPassword || "mcadmin888";
    if (adminPass !== currentPass) {
      throw new Error("管理密码错误");
    }

    dbCache.packs.forEach(p => {
      p.votes = [];
    });
    await saveDB();
    return { success: true };
  },

  async verifyAdmin(password) {
    await ensureLoaded();
    const currentPass = process.env.ADMIN_PASSWORD || dbCache.meta?.adminPassword || "mcadmin888";
    return password === currentPass;
  }
};
