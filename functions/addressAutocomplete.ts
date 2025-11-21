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
    let settings = settingsList[0];

    // Auto-create settings with default API key if not exists
    if (!settings) {
      try {
        settings = await base44.asServiceRole.entities.IntegrationSettings.create({
          integration_type: 'address_autocomplete',
          provider_type: 'google',
          api_key: 'AIzaSyAhVb41m9MwDmI_D0YelvxdNNkAdfTJBc4',
          country_bias: 'ca',
          language: 'fr',
          is_active: true,
          max_results: 8
        });
        console.log('Auto-created address autocomplete settings');
      } catch (error) {
        console.error('Failed to auto-create settings:', error);
        return Response.json({ 
          error: 'Impossible de créer la configuration automatiquement',
          instruction: error.message,
          suggestions: []
        });
      }
    }

    if (!settings.is_active) {
      return Response.json({ 
        error: 'L\'autocomplétion est désactivée.',
        instruction: 'Activez-la dans : Paramètres → Address Autocomplete',
        suggestions: []
      });
    }

    const apiKey = settings.api_key || 'AIzaSyAhVb41m9MwDmI_D0YelvxdNNkAdfTJBc4';
    const providerType = settings.provider_type || 'google';
    const countryBias = settings.country_bias || 'ca';
    const language = settings.language || 'fr';

    console.log('Address autocomplete settings:', { providerType, countryBias, language, hasApiKey: !!apiKey });

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

      console.log('Calling Google API:', url.toString().replace(apiKey, 'API_KEY_HIDDEN'));

      const response = await fetch(url.toString());
      const data = await response.json();

      console.log('Google API response:', { status: data.status, error_message: data.error_message, predictions_count: data.predictions?.length || 0 });

      if (data.status === 'OK' && data.predictions) {
        suggestions = data.predictions.map(p => ({
          id: p.place_id,
          description: p.description,
          place_id: p.place_id
        }));
      } else if (data.error_message) {
        return Response.json({ 
          error: 'Votre clé API semble incorrecte ou n\'a pas les permissions nécessaires.',
          instruction: 'Vérifiez que l\'API Places est activée dans votre projet Google Cloud.',
          status: data.status, 
          suggestions: [] 
        });
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