import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defaultPacks } from './defaultPacks.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'votes_db.json');

// Memory cache & write queue to ensure atomicity
let dbCache = null;
let writePromise = Promise.resolve();

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDB() {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      meta: {
        serverName: "Minecraft 交流群服务器换周目投票",
        title: "新周目玩什么整合包？群友说了算！",
        updatedAt: new Date().toISOString(),
        adminPassword: process.env.ADMIN_PASSWORD || "mcadmin888"
      },
      packs: defaultPacks.map(p => ({
        ...p,
        isPinned: false,
        votes: []
      }))
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    dbCache = initialData;
    return dbCache;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    dbCache = JSON.parse(raw);
    
    // Ensure all default packs exist in case of initial presets
    let hasNewPreset = false;
    defaultPacks.forEach(preset => {
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
      fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf-8');
    }

    return dbCache;
  } catch (err) {
    console.error("Error reading database, restoring backup...", err);
    return { meta: {}, packs: defaultPacks };
  }
}

function saveDB() {
  writePromise = writePromise.then(async () => {
    try {
      ensureDataDir();
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      dbCache.meta.updatedAt = new Date().toISOString();
      await fs.promises.writeFile(tmpFile, JSON.stringify(dbCache, null, 2), 'utf-8');
      await fs.promises.rename(tmpFile, DB_FILE);
    } catch (err) {
      console.error("Failed to save database atomically:", err);
    }
  });
  return writePromise;
}

export const storage = {
  init() {
    loadDB();
    console.log(`[Storage] Initialized. Loaded ${dbCache.packs.length} modpacks.`);
  },

  getPacks() {
    if (!dbCache) loadDB();
    // Return sorted: pinned first, then by vote count desc, then by createdAt desc
    return [...dbCache.packs].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const votesDiff = (b.votes?.length || 0) - (a.votes?.length || 0);
      if (votesDiff !== 0) return votesDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },

  getStats() {
    if (!dbCache) loadDB();
    const packs = dbCache.packs;
    const allVotes = packs.flatMap(p => p.votes || []);
    const uniqueVoters = new Set(allVotes.map(v => (v.playerName || v.playerId || "").toLowerCase().trim())).size;
    
    // Find highest voted
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

  vote({ packId, playerId, playerName, ip }) {
    if (!dbCache) loadDB();
    const pack = dbCache.packs.find(p => p.id === packId);
    if (!pack) {
      throw new Error("整合包不存在");
    }

    if (!pack.votes) pack.votes = [];
    const normalizedName = (playerName || playerId || "群友").trim();

    // Check if player has already voted for this pack
    // Identification matches either normalized playerName/playerId or same IP with same name
    const existingIndex = pack.votes.findIndex(v => 
      (v.playerName && v.playerName.toLowerCase() === normalizedName.toLowerCase()) ||
      (v.playerId && v.playerId.toLowerCase() === normalizedName.toLowerCase())
    );

    let action = 'added';
    if (existingIndex >= 0) {
      // Retract / toggle off vote
      pack.votes.splice(existingIndex, 1);
      action = 'removed';
    } else {
      // Add vote
      pack.votes.push({
        playerId: normalizedName,
        playerName: normalizedName,
        ip: ip || 'unknown',
        timestamp: new Date().toISOString()
      });
      action = 'added';
    }

    saveDB();
    return {
      action,
      pack,
      voteCount: pack.votes.length
    };
  },

  suggestPack({ name, version, loader, memoryReq, category, tags, description, link, suggestedBy, ip }) {
    if (!dbCache) loadDB();

    const cleanName = (name || "").trim();
    if (!cleanName) {
      throw new Error("整合包名称不能为空");
    }

    // Check duplicate
    const exists = dbCache.packs.some(p => p.name.toLowerCase() === cleanName.toLowerCase());
    if (exists) {
      throw new Error("该整合包已在候选列表中，请直接搜索并为它投票！");
    }

    const id = 'custom-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    
    // Clean tags
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
        // The proposer automatically casts the first vote!
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
    saveDB();
    return newPack;
  },

  deletePack(packId, adminPass) {
    if (!dbCache) loadDB();
    if (adminPass !== (dbCache.meta.adminPassword || "mcadmin888")) {
      throw new Error("管理密码错误");
    }

    const index = dbCache.packs.findIndex(p => p.id === packId);
    if (index === -1) {
      throw new Error("未找到该整合包");
    }

    const [deleted] = dbCache.packs.splice(index, 1);
    saveDB();
    return deleted;
  },

  togglePin(packId, adminPass) {
    if (!dbCache) loadDB();
    if (adminPass !== (dbCache.meta.adminPassword || "mcadmin888")) {
      throw new Error("管理密码错误");
    }

    const pack = dbCache.packs.find(p => p.id === packId);
    if (!pack) {
      throw new Error("未找到该整合包");
    }

    pack.isPinned = !pack.isPinned;
    saveDB();
    return pack;
  },

  resetAllVotes(adminPass) {
    if (!dbCache) loadDB();
    if (adminPass !== (dbCache.meta.adminPassword || "mcadmin888")) {
      throw new Error("管理密码错误");
    }

    dbCache.packs.forEach(p => {
      p.votes = [];
    });
    saveDB();
    return { success: true };
  },

  verifyAdmin(password) {
    if (!dbCache) loadDB();
    return password === (dbCache.meta.adminPassword || "mcadmin888");
  }
};
