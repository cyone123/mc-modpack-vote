import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('[Build] Compiling Vite client...');
execSync('npm run build --prefix client', { stdio: 'inherit' });

const clientDist = path.resolve('client/dist');
const rootDist = path.resolve('dist');

if (fs.existsSync(clientDist)) {
  console.log(`[Build] Syncing output to root dist directory (${rootDist})...`);
  fs.cpSync(clientDist, rootDist, { recursive: true });
  console.log('[Build] Success! Both client/dist and root dist are prepared for Vercel & Node.');
} else {
  console.error('[Build] Warning: client/dist not found.');
}
