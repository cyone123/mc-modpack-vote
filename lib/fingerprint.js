// Client-side lightweight fingerprint and device ID generator
export function getClientFingerprint() {
  if (typeof window === 'undefined') return { deviceId: '', fingerprint: '' };

  // 1. Persistent Device UUID from localStorage
  let deviceId = '';
  try {
    deviceId = localStorage.getItem('mc_device_id') || '';
    if (!deviceId) {
      deviceId = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('mc_device_id', deviceId);
    }
  } catch (e) {}

  // 2. Hardware / Browser Canvas Fingerprint (survives Incognito mode & cache clear)
  let fingerprint = '';
  try {
    const screenInfo = `${window.screen?.width || 0}x${window.screen?.height || 0}x${window.screen?.colorDepth || 0}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const language = navigator.language || '';
    const cores = navigator.hardwareConcurrency || '';
    
    // Canvas fingerprinting
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px "Arial", sans-serif';
      ctx.fillStyle = '#f60';
      ctx.fillRect(10, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('MinecraftVote#1', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('MinecraftVote#1', 4, 17);
    }
    const canvasData = canvas.toDataURL();
    
    // Fast string hash
    const raw = `${screenInfo}|${timezone}|${language}|${cores}|${canvasData}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    fingerprint = 'fp_' + Math.abs(hash).toString(36);
  } catch (e) {
    fingerprint = deviceId;
  }

  return { deviceId, fingerprint };
}
