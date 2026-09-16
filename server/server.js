import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { storage } from './storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize persistent storage
storage.init();

// Helper to get client IP
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1'
  );
}

// Routes
// 1. Get all modpacks
app.get('/api/packs', (req, res) => {
  try {
    const packs = storage.getPacks();
    const stats = storage.getStats();
    res.json({ success: true, packs, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get statistics
app.get('/api/stats', (req, res) => {
  try {
    const stats = storage.getStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Vote or retract vote
app.post('/api/vote', (req, res) => {
  try {
    const { packId, playerId, playerName } = req.body;
    if (!packId) {
      return res.status(400).json({ success: false, error: "缺少整合包ID" });
    }
    const ip = getClientIp(req);
    const result = storage.vote({ packId, playerId, playerName, ip });
    const stats = storage.getStats();
    res.json({ success: true, ...result, stats });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 4. Suggest new modpack
app.post('/api/suggest', (req, res) => {
  try {
    const {
      name,
      version,
      loader,
      memoryReq,
      category,
      tags,
      description,
      link,
      suggestedBy
    } = req.body;

    const ip = getClientIp(req);
    const newPack = storage.suggestPack({
      name,
      version,
      loader,
      memoryReq,
      category,
      tags,
      description,
      link,
      suggestedBy,
      ip
    });

    const stats = storage.getStats();
    res.json({ success: true, pack: newPack, stats });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. Admin verification
app.post('/api/admin/verify', (req, res) => {
  const { password } = req.body;
  const valid = storage.verifyAdmin(password);
  res.json({ success: valid, message: valid ? "密码正确" : "管理密码错误" });
});

// 6. Admin toggle pin
app.post('/api/admin/pin', (req, res) => {
  try {
    const { packId, password } = req.body;
    const pack = storage.togglePin(packId, password);
    res.json({ success: true, pack });
  } catch (err) {
    res.status(403).json({ success: false, error: err.message });
  }
});

// 7. Admin delete pack
app.post('/api/admin/delete', (req, res) => {
  try {
    const { packId, password } = req.body;
    const deleted = storage.deletePack(packId, password);
    res.json({ success: true, deleted });
  } catch (err) {
    res.status(403).json({ success: false, error: err.message });
  }
});

// 8. Admin reset all votes
app.post('/api/admin/reset-votes', (req, res) => {
  try {
    const { password } = req.body;
    const result = storage.resetAllVotes(password);
    res.json({ success: true, result });
  } catch (err) {
    res.status(403).json({ success: false, error: err.message });
  }
});

// Serve static frontend build in production
const clientDistPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res) => {
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send("Minecraft Modpack Voting API is running. Client is not built yet (use 'npm run dev' or 'npm run build').");
    }
  });
});

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`⛏️ Minecraft 群服换整合包投票系统已启动!`);
  console.log(`📡 服务端端口: http://localhost:${PORT}`);
  console.log(`🔑 默认管理密码: mcadmin888 (可在环境变量 ADMIN_PASSWORD 自定义)`);
  console.log(`=========================================`);
});
