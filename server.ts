import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

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
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
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

// Security Hardening 6: In-Memory Token Bucket Rate Limiting for Public AI Endpoints
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // Max 30 requests per minute per IP

function apiRateLimiter(req: Request, res: Response, next: NextFunction) {
  // Use client IP from proxy or direct socket
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  // Periodically evict expired entries to prevent memory leaks
  if (rateLimitMap.size > 5000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) rateLimitMap.delete(key);
    }
  }

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    res.setHeader('Retry-After', retryAfter);
    res.status(429).json({
      error: 'Too many requests. Please wait a moment before sending another inquiry.',
      retryAfter,
    });
    return;
  }

  entry.count++;
  next();
}

// Utility: Sanitize user input by removing null bytes and non-printable control characters
function sanitizeInput(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

// Initialize Gemini Client dynamically with secure runtime environment key
function getAiClient() {
  const key = process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'pb-civillab-app/1.0.0',
      },
    },
  });
}

const CIVIL_SYSTEM_INSTRUCTION = `
You are the AI Civil & Structural Engineering Consultant for "PB CivilLab - Civil Engineering Tools by Prokash Biswas".
Tagline: "Calculate Smarter. Build Better."

Your role:
- Provide authoritative, high-precision technical answers on Civil Engineering, Structural Design, Concrete Technology, Masonry, Geotechnical & Earthworks, Surveying, and Construction Cost Estimation.
- Reference recognized building codes and standards where relevant:
  - BNBC (Bangladesh National Building Code)
  - ACI 318 (American Concrete Institute - Building Code Requirements for Structural Concrete)
  - IS 456 & IS 1786 (Bureau of Indian Standards)
  - BS 8110 / Eurocode 2 (BS EN 1992)
  - ASTM Standards (ASTM A615, C150, C33, etc.)
  - AASHTO for road and highway pavement design.
- Offer actionable site recommendations: clear cover requirements, maximum aggregate sizes, water-cement ratios, development length Ld, lap splice rules, temperature/shrinkage reinforcement, compaction percentages, and safety margins.
- When reviewing or auditing calculations, verify the physical plausibility, highlight any assumptions or critical edge cases, and note practical construction site tolerances.
- Format responses clearly with markdown, using bold headings, concise bullet points, and code/math blocks for equations where appropriate.
- Maintain an encouraging, strictly professional engineering tone.
`;

// Helper: Resilient AI generation with automatic fallback
async function generateWithFallback(
  ai: GoogleGenAI,
  contents: any,
  systemInstruction: string,
  temperature: number = 0.4
): Promise<string> {
  const primaryModel = 'gemini-2.5-flash';
  const fallbackModel = 'gemini-2.0-flash';

  try {
    const response = await ai.models.generateContent({
      model: primaryModel,
      contents,
      config: {
        systemInstruction,
        temperature,
      },
    });
    return response.text || 'No response generated from the engineering advisor.';
  } catch (primaryErr: any) {
    const isRateOrBusy =
      primaryErr?.status === 429 ||
      primaryErr?.message?.includes('RESOURCE_EXHAUSTED') ||
      primaryErr?.message?.includes('overloaded') ||
      primaryErr?.status === 503;

    if (isRateOrBusy) {
      console.warn(`Primary model ${primaryModel} busy, attempting fallback to ${fallbackModel}...`);
      // Brief 600ms backoff
      await new Promise(r => setTimeout(r, 600));
      const fallbackResponse = await ai.models.generateContent({
        model: fallbackModel,
        contents,
        config: {
          systemInstruction,
          temperature,
        },
      });
      return fallbackResponse.text || 'No response generated from the engineering advisor.';
    }
    throw primaryErr;
  }
}

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

// Endpoint 1: General Engineering Q&A and Site Consulting
app.post('/api/ai/ask', apiRateLimiter, async (req: Request, res: Response) => {
  try {
    if (!req.is('application/json')) {
      res.status(415).json({ error: 'Unsupported Media Type: application/json required' });
      return;
    }

    const { prompt, conversationContext } = req.body;
    const sanitizedPrompt = sanitizeInput(prompt);

    if (!sanitizedPrompt) {
      res.status(400).json({ error: 'Valid prompt text is required' });
      return;
    }

    if (sanitizedPrompt.length > 4000) {
      res.status(400).json({ error: 'Prompt exceeds maximum length of 4000 characters' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      res.status(503).json({
        error: 'AI Engineering Advisor is currently offline. GEMINI_API_KEY is not configured on the server.',
      });
      return;
    }

    const contents = [];
    if (conversationContext && Array.isArray(conversationContext) && conversationContext.length > 0) {
      for (const msg of conversationContext.slice(-6)) {
        if (msg && typeof msg.content === 'string') {
          const sanitizedContent = sanitizeInput(msg.content).slice(0, 2000);
          if (sanitizedContent) {
            contents.push({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: sanitizedContent }],
            });
          }
        }
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: sanitizedPrompt }],
    });

    const ai = getAiClient();
    const answer = await generateWithFallback(ai, contents, CIVIL_SYSTEM_INSTRUCTION, 0.4);
    res.json({ answer });
  } catch (error: any) {
    console.error('Error in /api/ai/ask:', error?.message || error);
    const msg = error?.message?.includes('RESOURCE_EXHAUSTED')
      ? 'AI query quota is temporarily busy. Please wait a moment and try again.'
      : 'An error occurred while generating engineering recommendations. Please try again.';
    res.status(500).json({ error: msg });
  }
});

// Endpoint 2: Instant Calculation Audit & Verification
app.post('/api/ai/verify', apiRateLimiter, async (req: Request, res: Response) => {
  try {
    if (!req.is('application/json')) {
      res.status(415).json({ error: 'Unsupported Media Type: application/json required' });
      return;
    }

    const { calculation } = req.body;

    if (!calculation || typeof calculation !== 'object' || !calculation.title) {
      res.status(400).json({ error: 'Valid calculation object with title is required' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      res.status(503).json({
        error: 'AI Calculation Verification is currently offline. GEMINI_API_KEY is not configured on the server.',
      });
      return;
    }

    const title = sanitizeInput(calculation.title).slice(0, 150);
    const primaryValue = sanitizeInput(calculation.primaryValue).slice(0, 50);
    const primaryUnit = sanitizeInput(calculation.primaryUnit).slice(0, 50);
    const formula = sanitizeInput(calculation.formula || 'N/A').slice(0, 300);
    const substitutedFormula = sanitizeInput(calculation.substitutedFormula || 'N/A').slice(0, 500);

    const promptText = `
Please perform a rigorous engineering review and audit on the following civil engineering calculation result from PB CivilLab:

Calculator Title: ${title}
Computed Primary Output: ${primaryValue} ${primaryUnit}
${
  calculation.secondaryValues?.length
    ? `Secondary Outputs:\n${calculation.secondaryValues
        .slice(0, 10)
        .map(
          (v: any) =>
            `- ${sanitizeInput(v?.label).slice(0, 60)}: ${sanitizeInput(v?.value).slice(0, 50)} ${sanitizeInput(v?.unit).slice(0, 20)}`
        )
        .join('\n')}`
    : ''
}
Governing Formula: ${formula}
Substituted Formula: ${substitutedFormula}

Inputs Summary:
${
  calculation.inputsSummary?.slice(0, 15).map((i: any) => `- ${sanitizeInput(i?.label).slice(0, 60)}: ${sanitizeInput(i?.value).slice(0, 50)}`).join('\n') ||
  'N/A'
}

Stated Assumptions:
${
  calculation.assumptions?.slice(0, 10).map((a: any) => `- ${sanitizeInput(a?.label).slice(0, 60)}: ${sanitizeInput(a?.value).slice(0, 50)}`).join('\n') ||
  'N/A'
}

Engineering Notes: ${sanitizeInput(calculation.engineeringNotes || 'None').slice(0, 600)}

Please provide a structured technical review with the following sections:
1. **Mathematical & Logic Check**: Confirm whether the arithmetic and formula substitution are sound.
2. **Code Compliance & Sanity Audit**: Check against standard civil/structural engineering guidelines (e.g. BNBC, ACI 318, IS 456, ASTM). Flag if values fall outside standard ranges (e.g. steel percentage, slump, w/c ratio, tie spacing, slope stability).
3. **Site Execution Precautions**: List 2-3 vital practical tips or common quality mistakes workers/supervisors make on site regarding this specific task.
4. **Summary Verdict**: One-sentence concluding remark (e.g. "Optimal & Code-Compliant", "Acceptable for Preliminary Estimates", or "Caution: Parameter Requires Field Adjustment").
`;

    const ai = getAiClient();
    const audit = await generateWithFallback(ai, promptText, CIVIL_SYSTEM_INSTRUCTION, 0.3);
    res.json({ audit });
  } catch (error: any) {
    console.error('Error in /api/ai/verify:', error?.message || error);
    const msg = error?.message?.includes('RESOURCE_EXHAUSTED')
      ? 'Verification service is temporarily busy. Please retry in a few moments.'
      : 'Calculation audit service encountered an error. Please try again.';
    res.status(500).json({ error: msg });
  }
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

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`PB CivilLab server running on http://0.0.0.0:${port}`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('Shutting down PB CivilLab server...');
    server.close(() => {
      console.log('Server shut down cleanly.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

setupViteOrStatic().catch(err => {
  console.error('Failed to initialize PB CivilLab server:', err);
});
