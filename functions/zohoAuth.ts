import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Zoho Books OAuth 2.0 Authentication
 * Handles authorization URL generation and token exchange
 */

const ZOHO_CLIENT_ID = Deno.env.get("ZOHO_CLIENT_ID");
const ZOHO_CLIENT_SECRET = Deno.env.get("ZOHO_CLIENT_SECRET");
const ZOHO_REDIRECT_URI = Deno.env.get("ZOHO_REDIRECT_URI");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const code = url.searchParams.get('code');

    // Generate authorization URL
    if (action === 'authorize') {
      const authUrl = `https://accounts.zoho.com/oauth/v2/auth?` +
        `scope=ZohoBooks.fullaccess.all&` +
        `client_id=${ZOHO_CLIENT_ID}&` +
        `response_type=code&` +
        `redirect_uri=${ZOHO_REDIRECT_URI}&` +
        `access_type=offline`;

      return Response.json({ auth_url: authUrl });
    }

    // Exchange code for tokens
    if (action === 'callback' && code) {
      const tokenResponse = await fetch('https://accounts.zoho.com/oauth/v2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: ZOHO_CLIENT_ID,
          client_secret: ZOHO_CLIENT_SECRET,
          redirect_uri: ZOHO_REDIRECT_URI,
          grant_type: 'authorization_code'
        })
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        return Response.json({ error: tokens.error }, { status: 400 });
      }

      // Get organization info
      const orgResponse = await fetch('https://www.zohoapis.com/books/v3/organizations', {
        headers: { 'Authorization': `Zoho-oauthtoken ${tokens.access_token}` }
      });

      const orgData = await orgResponse.json();
      const organization = orgData.organizations?.[0];

      // Save settings
      const settings = await base44.asServiceRole.entities.IntegrationSettings.filter({ integration_type: 'zoho_books' });
      
      const settingsData = {
        integration_type: 'zoho_books',
        zoho_organization_id: organization?.organization_id,
        zoho_access_token: tokens.access_token,
        zoho_refresh_token: tokens.refresh_token,
        zoho_token_expiry: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString(),
        is_active: true
      };

      if (settings.length > 0) {
        await base44.asServiceRole.entities.IntegrationSettings.update(settings[0].id, settingsData);
      } else {
        await base44.asServiceRole.entities.IntegrationSettings.create(settingsData);
      }

      return Response.json({ 
        success: true, 
        organization: organization?.name 
      });
    }

    // Refresh token
    if (action === 'refresh') {
      const settings = await base44.asServiceRole.entities.IntegrationSettings.filter({ integration_type: 'zoho_books' });
      
      if (settings.length === 0) {
        return Response.json({ error: 'No Zoho connection found' }, { status: 404 });
      }

      const refreshToken = settings[0].zoho_refresh_token;

      const tokenResponse = await fetch('https://accounts.zoho.com/oauth/v2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: ZOHO_CLIENT_ID,
          client_secret: ZOHO_CLIENT_SECRET,
          grant_type: 'refresh_token'
        })
      });

      const tokens = await tokenResponse.json();

      await base44.asServiceRole.entities.IntegrationSettings.update(settings[0].id, {
        zoho_access_token: tokens.access_token,
        zoho_token_expiry: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString()
      });

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});