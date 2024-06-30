import { Hono } from 'hono';

const app = new Hono();

const clientId = Deno.env.get('CLIENT_ID');
const clientSecret = Deno.env.get('CLIENT_SECRET');

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

type DiscordTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
};

app.get('/auth', async (c) => {
  const code = c.req.query('code');
  if (!code) {
    return c.json(
      {
        success: false,
        error: 'Invalid code',
      },
      400
    );
  }
  if (!clientId || !clientSecret) {
    return c.json(
      {
        success: false,
        error: 'Failed to get client info',
      },
      500
    );
  }
  const res = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'http://localhost',
    }),
  });
  try {
    const tokenInfo: DiscordTokenResponse = await res.json();
    return c.json({
      success: true,
      access_token: tokenInfo.access_token,
      refresh_token: tokenInfo.refresh_token,
    });
  } catch {
    return c.json(
      {
        success: false,
        error: 'Invalid code',
      },
      400
    );
  }
});

app.get('/refresh', async (c) => {
  const refreshToken = c.req.query('refresh_token');
  if (!refreshToken) {
    return c.json(
      {
        success: false,
        error: 'Invalid token',
      },
      400
    );
  }
  if (!clientId || !clientSecret) {
    return c.json(
      {
        success: false,
        error: 'Failed to get client info',
      },
      500
    );
  }
  const res = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: JSON.stringify({
      grant_type: 'refresh_tokne',
      refresh_token: refreshToken,
    }),
  });
  try {
    const tokenInfo: DiscordTokenResponse = await res.json();
    return c.json({
      success: true,
      access_token: tokenInfo.access_token,
      refresh_token: tokenInfo.refresh_token,
    });
  } catch {
    return c.json(
      {
        success: false,
        error: 'Invalid token',
      },
      400
    );
  }
});

Deno.serve(app.fetch);
