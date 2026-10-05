import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function devApiPlugin(): Plugin {
  return {
    name: 'dev-api-provider',
    configureServer(server) {
      server.middlewares.use('/api/provider', async (req: any, res: any) => {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });
        req.on('end', async () => {
          try {
            req.body = body ? JSON.parse(body) : {};
          } catch {
            req.body = {};
          }
          res.status = (code: number) => {
            res.statusCode = code;
            return res;
          };
          res.json = (data: any) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          };
          try {
            const { default: handler } = await import('./api/provider.ts');
            await handler(req, res);
          } catch (err: any) {
            res.status(500).json({ success: false, error: err?.message || 'Server error' });
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), devApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR disabled in AI Studio environment to prevent continuous red WebSocket connection errors
      hmr: false,
      watch: null,
    },
  };
});
