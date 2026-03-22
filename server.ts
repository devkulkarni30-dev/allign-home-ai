
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Robust Port Handling (Defaults to 3000 if not provided)
const rawPort = process.env.PORT || '3000';
const PORT = parseInt(rawPort, 10) || 3000;

// 2. Immediate Health Check (Helps the cloud provider verify the app is alive)
app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const JWT_SECRET = process.env.JWT_SECRET || 'vedic-secret-key-2026';

app.use(express.json());
app.use(cookieParser());
app.use(cors());

// In-memory user store for demo purposes
const users: any[] = [];
const properties: any[] = [];
const savedReports: any[] = [];

// Helper to get App URL
const getAppUrl = () => {
  return process.env.APP_URL || 'http://localhost:3000';
};

// --- AUTH ROUTES ---

// --- PROPERTY & REPORT ROUTES ---

app.get('/api/properties', (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userProperties = properties.filter(p => p.userId === decoded.id);
    res.json(userProperties);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/api/properties', (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const { name, address, type } = req.body;
    const newProperty = {
      id: Math.random().toString(36).substr(2, 9),
      userId: decoded.id,
      name,
      address,
      type,
      createdAt: Date.now()
    };
    properties.push(newProperty);
    res.json(newProperty);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.get('/api/reports', (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userReports = savedReports.filter(r => r.userId === decoded.id);
    res.json(userReports);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/api/reports', (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const { result, preview, name, propertyId } = req.body;
    const newReport = {
      id: Math.random().toString(36).substr(2, 9),
      userId: decoded.id,
      propertyId,
      name,
      result,
      preview,
      timestamp: Date.now()
    };
    savedReports.push(newReport);
    res.json(newReport);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// 1. Get Google Auth URL
app.get('/api/auth/google/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'GOOGLE_CLIENT_ID not configured' });
  }

  const redirectUri = `${getAppUrl()}/auth/google/callback`;
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: redirectUri,
    client_id: clientId,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
  };

  const qs = new URLSearchParams(options);
  res.json({ url: `${rootUrl}?${qs.toString()}` });
});

// 2. Google Auth Callback
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.send('No code provided');
  }

  try {
    // In a real app, you would exchange the code for tokens here
    // For this demo, we'll simulate the exchange and user creation
    // since we don't have real client secrets in the environment yet.
    
    const mockGoogleUser = {
      id: 'google_' + Math.random().toString(36).substr(2, 9),
      email: 'vedic.user@gmail.com',
      name: 'Vedic Scholar',
      picture: 'https://picsum.photos/seed/user/200/200'
    };

    let user = users.find(u => u.email === mockGoogleUser.email);
    if (!user) {
      user = {
        ...mockGoogleUser,
        subscription: {
          plan: 'basic',
          usage: { single: 0, compare: 0, live: 0 }
        }
      };
      users.push(user);
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: ${JSON.stringify(user)} }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. Redirecting...</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).send('Authentication failed');
  }
});

// 3. Standard Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple check: if password is 'password', allow login
  // In real app, check against DB and hash
  let user = users.find(u => u.email === email);
  
  if (!user && password === 'password') {
    user = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name: email.split('@')[0],
      subscription: {
        plan: email.toLowerCase() === 'admin@vedic.ai' ? 'yearly' : 'basic',
        usage: { single: 0, compare: 0, live: 0 }
      },
      isAdmin: email.toLowerCase() === 'admin@vedic.ai'
    };
    users.push(user);
  }

  if (user) {
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    return res.json({ user });
  }

  res.status(401).json({ error: 'Invalid credentials. Try password: "password"' });
});

// 4. Standard Signup
app.post('/api/auth/signup', (req, res) => {
  const { name, email, contact, password } = req.body;
  
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const newUser = {
    id: Math.random().toString(36).substr(2, 9),
    name,
    email,
    contact,
    subscription: {
      plan: 'basic',
      usage: { single: 0, compare: 0, live: 0 }
    }
  };
  users.push(newUser);

  const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ user: newUser });
});

// 5. Check Session
app.get('/api/auth/me', (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// 6. Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true });
});

app.post('/api/user/preferences', (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const { preferences } = req.body;
    const user = users.find(u => u.id === decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    user.preferences = preferences;
    res.json({ success: true });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// --- VITE MIDDLEWARE ---
async function startServer() {
  // Force production mode if not explicitly set to development
  const isProd = process.env.NODE_ENV === 'production' || !fs.existsSync(path.resolve(__dirname, 'node_modules/vite'));
  
  if (!isProd) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      
      app.use(vite.middlewares);

      app.use('*all', async (req, res, next) => {
        const url = req.originalUrl;
        try {
          let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } catch (e: any) {
          vite.ssrFixStacktrace(e);
          next(e);
        }
      });
      console.log('Vite development middleware loaded');
    } catch (err) {
      console.warn('Vite not found, falling back to static serving');
      serveStatic();
    }
  } else {
    serveStatic();
  }

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Error:', err);
    res.status(500).send('Internal Server Error: ' + err.message);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is live and listening on port ${PORT}`);
  });
}

function serveStatic() {
  const distPath = path.resolve(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving static files from dist directory');
  } else {
    console.error('Critical Error: "dist" directory not found. Please run "npm run build" first.');
    app.get('*all', (req, res) => {
      res.status(500).send('Application is building... Please refresh in a moment.');
    });
  }
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
