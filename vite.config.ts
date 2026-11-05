import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

function cloudflareWorkerPlugin(): Plugin {
  return {
    name: 'cloudflare-worker-dev',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (!req.url?.startsWith('/api')) {
          return next();
        }

        try {
          const { createDevD1Database } = await import('./src/worker/dev-d1.ts');
          const worker = (await import('./src/worker/index.ts')).default;
          const db = createDevD1Database();

          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
          }
          const bodyBuffer = Buffer.concat(chunks);

          const protocol = req.headers['x-forwarded-proto'] || 'http';
          const host = req.headers['host'] || 'localhost:3000';
          const fullUrl = `${protocol}://${host}${req.url}`;

          const webHeaders = new Headers();
          for (const [key, val] of Object.entries(req.headers)) {
            if (val) {
              if (Array.isArray(val)) {
                val.forEach((v) => webHeaders.append(key, v));
              } else {
                webHeaders.set(key, val);
              }
            }
          }

          const webRequest = new Request(fullUrl, {
            method: req.method,
            headers: webHeaders,
            body: ['GET', 'HEAD'].includes(req.method || 'GET') ? undefined : bodyBuffer,
          });

          const webResponse = await worker.fetch(webRequest, { DB: db } as any);

          res.statusCode = webResponse.status;
          webResponse.headers.forEach((val, key) => {
            if (key.toLowerCase() === 'set-cookie') {
              res.setHeader('Set-Cookie', val);
            } else {
              res.setHeader(key, val);
            }
          });

          const resBuffer = await webResponse.arrayBuffer();
          res.end(Buffer.from(resBuffer));
        } catch (err: any) {
          console.error('Dev Worker Middleware Error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Internal Worker Dev Error', details: err?.message }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), cloudflareWorkerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

