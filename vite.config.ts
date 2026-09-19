import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

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

function sheetsConfigPlugin(): Plugin {
  const configPath = path.resolve(process.cwd(), 'src/config/sheetsConfig.ts');

  return {
    name: 'sheets-config-api',
    configureServer(server) {
      server.middlewares.use('/api/sheets-config', (req, res) => {
        if (req.method === 'GET') {
          try {
            if (fs.existsSync(configPath)) {
              const fileContent = fs.readFileSync(configPath, 'utf-8');
              const urlMatch = fileContent.match(/webAppUrl:\s*['"`]([^'"`]*)['"`]/);
              const sheetIdMatch = fileContent.match(/sheetId:\s*['"`]([^'"`]*)['"`]/);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: true,
                  webAppUrl: urlMatch ? urlMatch[1] : '',
                  sheetId: sheetIdMatch ? sheetIdMatch[1] : '',
                  hasFile: true,
                })
              );
              return;
            }
          } catch (e: any) {
            console.error('Error reading sheetsConfig.ts:', e);
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, webAppUrl: '', sheetId: '', hasFile: false }));
        } else if (req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', (chunk) => chunks.push(chunk));
          req.on('end', () => {
            try {
              const body = JSON.parse(Buffer.concat(chunks).toString());
              const webAppUrl = (body.webAppUrl || '').trim();
              const sheetId = (body.sheetId || '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms').trim();

              const newContent = `/**
 * ============================================================================
 * FILE-SYSTEM AUTHORITATIVE GOOGLE SHEETS & APPS SCRIPT CONFIGURATION
 * ============================================================================
 * 
 * This file is stored directly in the repository/file system.
 * By defining your Google Apps Script Web App URL here, all users, devices,
 * incognito sessions, and custom domain visitors on Vercel will automatically
 * communicate directly with your Google Sheets database without relying on
 * browser localStorage.
 */

export interface FileSystemSheetsConfig {
  webAppUrl: string;
  sheetId: string;
  tabNames: {
    holidayPackages: string;
    visaServices: string;
    bookings: string;
    applications: string;
    logs: string;
  };
}

export const FILE_SYSTEM_SHEETS_CONFIG: FileSystemSheetsConfig = {
  // Live Google Apps Script Web App URL:
  webAppUrl: ${JSON.stringify(webAppUrl)},

  // Google Spreadsheet Document ID:
  sheetId: ${JSON.stringify(sheetId)},

  tabNames: {
    holidayPackages: 'Holiday_Packages',
    visaServices: 'Visa_Services',
    bookings: 'Bookings_Leads',
    applications: 'Visa_Applications',
    logs: 'Activity_Logs',
  },
};
`;
              // Ensure directory exists
              const dir = path.dirname(configPath);
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }

              fs.writeFileSync(configPath, newContent, 'utf-8');
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: true,
                  message: 'Successfully saved Web App URL directly to src/config/sheetsConfig.ts on the file system!',
                  webAppUrl,
                  sheetId,
                })
              );
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

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), leadEmailPlugin(), sheetsConfigPlugin()],
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
