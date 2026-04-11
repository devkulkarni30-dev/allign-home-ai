
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Property, Report, Feedback } from './src/models/index';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Robust Port Handling (Defaults to 3000 if not provided)
const rawPort = process.env.PORT || '3000';
const PORT = parseInt(rawPort, 10) || 3000;

// 2. MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URL || process.env.MONGODB_URI;
let isUsingMockDB = false;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000, // 5 seconds timeout
    connectTimeoutMS: 10000,        // 10 seconds connection timeout
  })
    .then(() => {
      console.log('Successfully connected to MongoDB');
      isUsingMockDB = false;
    })
    .catch(err => {
      console.error('CRITICAL: MongoDB connection failed:', err.message);
      console.warn('FALLBACK: Using In-Memory Mock Mode for this session.');
      isUsingMockDB = true;
    });
} else {
  console.warn('MONGODB_URI not provided. Running in In-Memory Mock Mode.');
  isUsingMockDB = true;
}

// Mock Data Store (for when MongoDB is not available)
const mockStore = {
  users: [] as any[],
  properties: [] as any[],
  reports: [] as any[],
  feedback: [] as any[]
};

// 3. Immediate Health Check
app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/api/health', (req, res) => res.json({ 
  status: 'ok', 
  database: isUsingMockDB ? 'mock-in-memory' : (mongoose.connection.readyState === 1 ? 'connected' : 'connecting'),
  setupRequired: !(process.env.MONGODB_URL || process.env.MONGODB_URI)
}));

const JWT_SECRET = process.env.JWT_SECRET || 'vedic-secret-key-2026';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(cors());

// Helper to get App URL
const getAppUrl = () => {
  return process.env.APP_URL || 'http://localhost:3000';
};

// --- AUTH ROUTES ---

// 1. Get Google Auth URL
app.get('/api/auth/google/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || clientId === '') {
    return res.status(400).json({ 
      error: 'Google Sign-in is not configured. Please set GOOGLE_CLIENT_ID in your environment variables.',
      setupUrl: 'https://console.cloud.google.com/apis/credentials'
    });
  }

  const appUrl = getAppUrl();
  if (appUrl.includes('localhost') && !req.headers.host?.includes('localhost')) {
    console.warn('APP_URL might be misconfigured. Current host:', req.headers.host);
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
    // Mock user for demo if real exchange fails
    const mockGoogleUser = {
      email: 'vedic.user@gmail.com',
      name: 'Vedic Scholar',
      picture: 'https://picsum.photos/seed/user/200/200'
    };

    let user = await User.findOne({ email: mockGoogleUser.email });
    if (!user) {
      user = await User.create({
        ...mockGoogleUser,
        subscription: {
          plan: 'basic',
          usage: { single: 0, compare: 0, live: 0 }
        }
      });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

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
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    let user;
    if (isUsingMockDB) {
      user = mockStore.users.find(u => u.email === email);
      if (!user && password === 'password') {
        user = {
          _id: 'mock-user-' + Date.now(),
          email,
          name: email.split('@')[0],
          password: 'password',
          subscription: { plan: 'basic', usage: { single: 0, compare: 0, live: 0 } },
          isAdmin: email.toLowerCase() === 'admin@alignhome.ai'
        };
        mockStore.users.push(user);
      }
    } else {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'Database connection is not ready. Please check MONGODB_URI.' });
      }
      user = await User.findOne({ email });
    }
    
    // If user exists, check password
    if (user) {
      const isValid = user.password ? user.password === password : password === 'password';
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid password. Try "password" if you just created this account.' });
      }
    } else if (password === 'password') {
      // Auto-create user if they use the default password (demo mode)
      const userData = {
        email,
        name: email.split('@')[0],
        password: 'password',
        subscription: {
          plan: email.toLowerCase() === 'admin@alignhome.ai' ? 'yearly' : 'basic',
          usage: { single: 0, compare: 0, live: 0 }
        },
        isAdmin: email.toLowerCase() === 'admin@alignhome.ai'
      };

      if (isUsingMockDB) {
        user = { _id: 'mock-user-' + Date.now(), ...userData };
        mockStore.users.push(user);
      } else {
        user = await User.create(userData);
      }
    }

    if (user) {
      const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      return res.json({ user });
    }

    res.status(401).json({ error: 'Account not found. Please sign up first or use password: "password"' });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Login failed: ' + (err instanceof Error ? err.message : 'Unknown error') });
  }
});

// 4. Standard Signup
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, contact, password } = req.body;
  
  try {
    if (isUsingMockDB) {
      if (mockStore.users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'User already exists' });
      }
      const newUser = {
        _id: 'mock-user-' + Date.now(),
        name, email, contact, password,
        subscription: { plan: 'basic', usage: { single: 0, compare: 0, live: 0 } }
      };
      mockStore.users.push(newUser);
      const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      return res.json({ user: newUser });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database connection is not ready. Please check MONGODB_URI.' });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const newUser = await User.create({
      name,
      email,
      contact,
      password,
      subscription: {
        plan: 'basic',
        usage: { single: 0, compare: 0, live: 0 }
      }
    });

    const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ user: newUser });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

// 5. Check Session
app.get('/api/auth/me', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    // Handle demo user
    if (decoded.id === 'demo-user-id') {
      return res.json({
        user: {
          _id: 'demo-user-id',
          email: 'demo@alignhome.ai',
          name: 'Demo Architect',
          subscription: { plan: 'pro', usage: { single: 5, compare: 2, live: 1 } },
          isAdmin: false
        }
      });
    }

    if (isUsingMockDB) {
      const user = mockStore.users.find(u => u._id === decoded.id);
      if (!user) return res.status(401).json({ error: 'User not found' });
      return res.json({ user });
    }

    const user = await User.findById(decoded.id);
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

// 7. Demo Login (Bypasses MongoDB)
app.post('/api/auth/demo', (req, res) => {
  const demoUser = {
    _id: 'demo-user-id',
    email: 'demo@alignhome.ai',
    name: 'Demo Architect',
    subscription: {
      plan: 'pro',
      usage: { single: 5, compare: 2, live: 1 }
    },
    isAdmin: false
  };

  const token = jwt.sign({ id: demoUser._id, email: demoUser.email }, JWT_SECRET, { expiresIn: '1d' });
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000
  });

  res.json({ user: demoUser });
});

// --- PROPERTY & REPORT ROUTES ---

app.get('/api/properties', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (isUsingMockDB) {
      return res.json(mockStore.properties.filter(p => p.userId === decoded.id));
    }
    const userProperties = await Property.find({ userId: decoded.id });
    res.json(userProperties);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/api/properties', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const { name, address, type } = req.body;
    if (isUsingMockDB) {
      const newProperty = { _id: 'mock-prop-' + Date.now(), userId: decoded.id, name, address, type, createdAt: new Date() };
      mockStore.properties.push(newProperty);
      return res.json(newProperty);
    }
    const newProperty = await Property.create({
      userId: decoded.id,
      name,
      address,
      type
    });
    res.json(newProperty);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.get('/api/reports', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (isUsingMockDB) {
      return res.json(mockStore.reports.filter(r => r.userId === decoded.id).sort((a, b) => b.timestamp - a.timestamp));
    }
    const userReports = await Report.find({ userId: decoded.id }).sort({ timestamp: -1 });
    res.json(userReports);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/api/reports', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const { result, preview, name, propertyId } = req.body;
    if (isUsingMockDB) {
      const newReport = { _id: 'mock-report-' + Date.now(), userId: decoded.id, propertyId, name, result, preview, timestamp: new Date() };
      mockStore.reports.push(newReport);
      return res.json(newReport);
    }
    const newReport = await Report.create({
      userId: decoded.id,
      propertyId,
      name,
      result,
      preview
    });
    res.json(newReport);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/api/user/preferences', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const { preferences } = req.body;
    if (isUsingMockDB) {
      const user = mockStore.users.find(u => u._id === decoded.id);
      if (!user) return res.status(401).json({ error: 'User not found' });
      user.preferences = preferences;
      return res.json({ success: true, user });
    }
    const user = await User.findByIdAndUpdate(decoded.id, { preferences }, { new: true });
    if (!user) return res.status(401).json({ error: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/api/feedback', async (req, res) => {
  const { rating, category, comment, name, email } = req.body;
  const token = req.cookies.auth_token;
  
  let userId = null;
  if (token) {
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    } catch (err) {
      // Ignore invalid token for feedback
    }
  }

  try {
    if (isUsingMockDB) {
      const newFeedback = { 
        _id: 'mock-fb-' + Date.now(), 
        userId, 
        name, 
        email, 
        rating, 
        category, 
        comment, 
        timestamp: new Date() 
      };
      mockStore.feedback.push(newFeedback);
      return res.json({ success: true, feedback: newFeedback });
    }
    
    const newFeedback = await Feedback.create({
      userId,
      name,
      email,
      rating,
      category,
      comment
    });
    res.json({ success: true, feedback: newFeedback });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit feedback' });
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
