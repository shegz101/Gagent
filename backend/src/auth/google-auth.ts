import { google } from 'googleapis';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

// Load credentials from file or environment variables
const CREDENTIALS_PATH = join(process.cwd(), 'credentials.json');
let credentials: any = {
  client_id: process.env.GOOGLE_CLIENT_ID,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  redirect_uris: [process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback'],
};

try {
  const credentialsContent = readFileSync(CREDENTIALS_PATH, 'utf8');
  const parsedCredentials = JSON.parse(credentialsContent);
  // Support both 'web' and 'installed' credential types
  const fileCredentials = parsedCredentials.web || parsedCredentials.installed;
  if (fileCredentials) {
    credentials = fileCredentials;
  }
} catch (error) {
  console.warn('credentials.json not found. Using environment variables.');
}

// Always use the correct redirect URI for our app
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback';

const oauth2Client = new google.auth.OAuth2(
  credentials.client_id,
  credentials.client_secret,
  REDIRECT_URI
);

// Set refresh token if available
if (process.env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
}

/**
 * Automatically refresh access tokens
 */
oauth2Client.on('tokens', (tokens) => {
  if (tokens.refresh_token) {
    console.log('🔄 New refresh token received. Add to .env:');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
  }
  if (tokens.access_token) {
    console.log('✅ Access token refreshed successfully');
  }
});

/**
 * Generate auth URL for initial OAuth flow
 */
export function getAuthUrl() {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent screen to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  
  return tokens;
}

/**
 * Get authenticated client
 */
export function getAuthClient() {
  return oauth2Client;
}

/**
 * Check if client is authenticated
 */
export function isAuthenticated() {
  return !!process.env.GOOGLE_REFRESH_TOKEN || !!oauth2Client.credentials.refresh_token;
}

/**
 * Handle API errors (token expiry, auth errors)
 */
export async function handleApiError(error: any) {
  if (error.code === 401 || error.message?.includes('invalid_grant') || error.message?.includes('Invalid Credentials')) {
    console.error('❌ Token expired or invalid. Please re-authenticate.');
    console.error('📍 Visit: http://localhost:3001/api/auth/google');
    throw new Error('Authentication required. Please visit http://localhost:3001/api/auth/google to authenticate.');
  }
  throw error;
}

export { google };

