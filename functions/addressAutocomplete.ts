import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, provider, sessionToken } = await req.json();

    if (!query || query.length < 3) {
      return Response.json({ suggestions: [] });
    }

    // Get provider settings
    const settingsList = await base44.asServiceRole.entities.IntegrationSettings.filter({ 
      integration_type: 'address_autocomplete' 
    });
    const settings = settingsList[0];

    if (!settings || !settings.is_active) {
      return Response.json({ error: 'Address autocomplete not configured' }, { status: 400 });
    }

    const apiKey = settings.api_key;
    const providerType = settings.provider_type || 'google';
    const countryBias = settings.country_bias || 'ca';
    const language = settings.language || 'fr';

    let suggestions = [];

    if (providerType === 'google') {
      // Google Places Autocomplete API
      const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
      url.searchParams.append('input', query);
      url.searchParams.append('key', apiKey);
      url.searchParams.append('language', language);
      url.searchParams.append('components', `country:${countryBias}`);
      if (sessionToken) {
        url.searchParams.append('sessiontoken', sessionToken);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status === 'OK' && data.predictions) {
        suggestions = data.predictions.map(p => ({
          id: p.place_id,
          description: p.description,
          place_id: p.place_id
        }));
      }
    } else if (providerType === 'mapbox') {
      // Mapbox Geocoding API
      const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
      url.searchParams.append('access_token', apiKey);
      url.searchParams.append('country', countryBias);
      url.searchParams.append('language', language);
      url.searchParams.append('types', 'address');
      url.searchParams.append('limit', '10');

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.features) {
        suggestions = data.features.map(f => ({
          id: f.id,
          description: f.place_name,
          place_id: f.id,
          coordinates: f.center
        }));
      }
    }

    return Response.json({ suggestions, provider: providerType });
  } catch (error) {
    console.error('Address autocomplete error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});