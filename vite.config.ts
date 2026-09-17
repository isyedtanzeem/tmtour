import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function logoUploadPlugin(): Plugin {
  return {
    name: 'logo-uploader',
    configureServer(server) {
      server.middlewares.use('/api/upload-logo', (req, res) => {
        if (req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', chunk => chunks.push(chunk));
          req.on('end', () => {
            try {
              const body = JSON.parse(Buffer.concat(chunks).toString());
              if (!body.dataUrl) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Missing dataUrl' }));
                return;
              }
              const base64Data = body.dataUrl.replace(/^data:image\/\w+;base64,/, '');
              const targetPath = path.resolve(process.cwd(), 'public/logo.png');
              fs.writeFileSync(targetPath, Buffer.from(base64Data, 'base64'));
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Logo saved to public/logo.png' }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err?.message || 'Server error' }));
            }
          });
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        }
      });
    },
  };
}

function leadEmailPlugin(): Plugin {
  const dataDir = path.resolve(process.cwd(), 'data');
  const settingsFile = path.join(dataDir, 'lead-email-settings.json');

  if (!fs.existsSync(dataDir)) {
    try { fs.mkdirSync(dataDir, { recursive: true }); } catch { /* ignore */ }
  }

  return {
    name: 'lead-email-api',
    configureServer(server) {
      // Manage settings persistence
      server.middlewares.use('/api/lead-email-settings', (req, res) => {
        if (req.method === 'GET') {
          if (fs.existsSync(settingsFile)) {
            try {
              const content = fs.readFileSync(settingsFile, 'utf-8');
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(content);
              return;
            } catch { /* fallback */ }
          }
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ found: false }));
        } else if (req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', chunk => chunks.push(chunk));
          req.on('end', () => {
            try {
              const body = JSON.parse(Buffer.concat(chunks).toString());
              fs.writeFileSync(settingsFile, JSON.stringify(body, null, 2), 'utf-8');
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Settings saved to server' }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err?.message || 'Server error' }));
            }
          });
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        }
      });

      // Handle notification dispatches
      server.middlewares.use('/api/lead-email-notify', (req, res) => {
        if (req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', chunk => chunks.push(chunk));
          req.on('end', () => {
            try {
              const payload = JSON.parse(Buffer.concat(chunks).toString());
              console.log(`[TripMyTour Lead Engine] Dispatched ${payload.type} alert to:`, payload.recipients);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                message: `Lead alert logged and routed to ${payload.recipients?.length || 0} recipient(s)`,
                deliveredAt: new Date().toISOString(),
              }));
            } catch (err: any) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err?.message || 'Invalid payload' }));
            }
          });
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), logoUploadPlugin(), leadEmailPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
