import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  // Create .env file dynamically on start to pass process.env to Vite client
  try {
    const envLines = [];
    if (process.env.VITE_SUPABASE_URL) {
      envLines.push(`VITE_SUPABASE_URL=${process.env.VITE_SUPABASE_URL}`);
    }
    if (process.env.VITE_SUPABASE_ANON_KEY) {
      envLines.push(`VITE_SUPABASE_ANON_KEY=${process.env.VITE_SUPABASE_ANON_KEY}`);
    }
    if (process.env.VITE_BACKEND_URL) {
      envLines.push(`VITE_BACKEND_URL=${process.env.VITE_BACKEND_URL}`);
    }
    if (envLines.length > 0) {
      fs.writeFileSync(path.join(process.cwd(), '.env'), envLines.join('\n'));
      console.log('Successfully generated .env file from process.env');
    }
  } catch (err) {
    console.error('Failed to write .env file:', err);
  }

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // CORS middleware (enable for Vercel & general requests)
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // API Route: Get Kakao Auth URL
  app.get('/api/auth/kakao/url', (req, res) => {
    const origin = (req.query.origin as string) || 'http://localhost:3000';
    let redirectUri = `${origin}/auth/callback`;
    if (req.query.redirect_uri) {
      redirectUri = req.query.redirect_uri as string;
    }
    
    const params = new URLSearchParams({
      client_id: 'bec6867f03cfcf7a7b0b8adeb8376f98',
      redirect_uri: redirectUri,
      response_type: 'code',
    });
    
    const authUrl = `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
    res.json({ url: authUrl });
  });

  // API Route: Exchange authorization code for user info (supports client-side flow on external domains like Vercel)
  app.post('/api/auth/kakao/exchange', async (req, res) => {
    try {
      const { code, redirectUri } = req.body;
      if (!code) {
        return res.status(400).json({ error: 'Authorization code is missing.' });
      }
      if (!redirectUri) {
        return res.status(400).json({ error: 'Redirect URI is missing.' });
      }

      console.log('Exchanging code for token with redirectUri:', redirectUri);

      // 1. Exchange authorization code for token
      const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: 'bec6867f03cfcf7a7b0b8adeb8376f98',
          client_secret: process.env.KAKAO_CLIENT_SECRET || 'bzz7Zg2DMho0BPN0aprWtOpxmayUiQlG',
          redirect_uri: redirectUri,
          code: code as string,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Failed to exchange code for token:', errorText);
        return res.status(400).json({ error: 'Token exchange failed', details: errorText });
      }

      const tokenData = await tokenResponse.json() as any;
      const accessToken = tokenData.access_token;

      // 2. Fetch Kakao user profile
      const profileResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.error('Failed to fetch user profile:', errorText);
        return res.status(400).json({ error: 'Failed to fetch user profile', details: errorText });
      }

      const profileData = await profileResponse.json() as any;

      // Map to local User type
      const user = {
        id: `kakao-${profileData.id}`,
        nickname: profileData.properties?.nickname || profileData.kakao_account?.profile?.nickname || '카카오 사용자',
        profileImage: profileData.properties?.profile_image || profileData.kakao_account?.profile?.profile_image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        email: profileData.kakao_account?.email || `${profileData.id}@kakao.com`,
        role: 'user', // default
        favoriteArtists: [],
        fanUsers: []
      };

      res.json({ success: true, user });
    } catch (error: any) {
      console.error('Exchange error:', error);
      res.status(500).json({ error: 'Internal server error during exchange', details: error.message });
    }
  });

  // Callback Route (traditional SSR flow for standard redirects)
  const handleCallback = async (req: express.Request, res: express.Response) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).send('Authorization code is missing.');
      }

      // Get protocol (support proxy x-forwarded-proto)
      const proto = req.headers['x-forwarded-proto'] || 'http';
      const host = req.get('host') || 'localhost:3000';
      const redirectUri = `${proto}://${host}/auth/callback`;

      // 1. Exchange authorization code for token
      const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: 'bec6867f03cfcf7a7b0b8adeb8376f98',
          client_secret: process.env.KAKAO_CLIENT_SECRET || 'bzz7Zg2DMho0BPN0aprWtOpxmayUiQlG',
          redirect_uri: redirectUri,
          code: code as string,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Failed to exchange code for token:', errorText);
        return res.status(500).send(`Token exchange failed: ${errorText}`);
      }

      const tokenData = await tokenResponse.json() as any;
      const accessToken = tokenData.access_token;

      // 2. Fetch Kakao user profile
      const profileResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.error('Failed to fetch user profile:', errorText);
        return res.status(500).send(`Failed to fetch user profile: ${errorText}`);
      }

      const profileData = await profileResponse.json() as any;

      // Map to local User type
      const user = {
        id: `kakao-${profileData.id}`,
        nickname: profileData.properties?.nickname || profileData.kakao_account?.profile?.nickname || '카카오 사용자',
        profileImage: profileData.properties?.profile_image || profileData.kakao_account?.profile?.profile_image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        email: profileData.kakao_account?.email || `${profileData.id}@kakao.com`,
        role: 'user', // default
        favoriteArtists: [],
        fanUsers: []
      };

      // Send success message to opener window and close popup
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  user: ${JSON.stringify(user)} 
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>로그인에 성공했습니다. 이 창은 자동으로 닫힙니다.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error('Callback error:', error);
      res.status(500).send(`Authentication error: ${error.message}`);
    }
  };

  app.get('/auth/callback', handleCallback);
  app.get('/auth/callback/', handleCallback);

  // Serve static assets or mount Vite dev server
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
