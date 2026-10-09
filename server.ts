import express, { type Request, type Response, type NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
process.env.DISABLE_HMR = 'true';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

// Security Hardening 1: Disable server fingerprinting
app.disable('x-powered-by');

// Security Hardening 2: Trust upstream reverse proxies (Cloud Run, Render, Railway, Nginx)
app.set('trust proxy', 1);

// Security Hardening 3: Production Security & Privacy Headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  // Safe CORS for same-origin and standard requests
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Handle CORS Preflight OPTIONS requests
app.options('*', (_req: Request, res: Response) => {
  res.sendStatus(204);
});

// Security Hardening 4: Strict Request Payload Limit (256 KB)
app.use(express.json({ limit: '256kb' }));

// Security Hardening 5: Global JSON Syntax Error Handler
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Malformed JSON payload in request' });
    return;
  }
  next(err);
});

// ==============================================================================
// API Endpoints
// ==============================================================================

// Health check endpoint for cloud monitoring & load balancers
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    application: 'PB CivilLab',
    author: 'Prokash Biswas',
    version: '1.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Explicit 404 handler for unmatched /api/* requests
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API route not found' });
});

// ==============================================================================
// Static Assets & Production Vite Setup
// ==============================================================================
async function setupViteOrStatic() {
  if (process.env.NODE_ENV === 'production') {
    app.use('/PB-CivilLab', express.static(path.join(__dirname, 'dist')));
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Fallback catch-all error middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled express error:', err?.message || err);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`[PB CivilLab] Server running on http://localhost:${port}`);
  });
}

setupViteOrStatic().catch(err => {
  console.error('[PB CivilLab] Failed to start server:', err);
  process.exit(1);
});
