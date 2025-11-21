import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const DEFAULT_API_KEY = 'AIzaSyAhVb41m9MwDmI_D0YelvxdNNkAdfTJBc4';
const MIN_QUERY_LENGTH = 3;
const MAX_SUGGESTIONS = 20;

/**
 * Address Autocomplete API Function
 * Supports Google Places and Mapbox providers
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authentication check
    const user = await base44.auth.me();
    if (!user) {
      return Response.json(
        { error: 'Unauthorized', suggestions: [] },
        { status: 401 }
      );
    }

    // Parse request body
    const { query, sessionToken } = await req.json();

    // Validate query
    if (!query || typeof query !== 'string' || query.length < MIN_QUERY_LENGTH) {
      return Response.json({ suggestions: [] });
    }

    // Get or create provider settings
    const settingsList = await base44.asServiceRole.entities.IntegrationSettings.filter({ 
      integration_type: 'address_autocomplete' 
    });
    let settings = settingsList[0];

    // Auto-create settings with default configuration
    if (!settings) {
      try {
        settings = await base44.asServiceRole.entities.IntegrationSettings.create({
          integration_type: 'address_autocomplete',
          provider_type: 'google',
          api_key: DEFAULT_API_KEY,
          country_bias: 'ca',
          language: 'fr',
          is_active: true,
          max_results: 8
        });
      } catch (createError) {
        console.error('[addressAutocomplete] Failed to create settings:', createError);
        return Response.json({ 
          error: 'Configuration initialization failed',
          instruction: 'Please contact support',
          suggestions: []
        }, { status: 500 });
      }
    }

    // Check if autocomplete is active
    if (!settings.is_active) {
      return Response.json({ 
        error: 'Address autocomplete is disabled',
        instruction: 'Enable in: Settings → Address Autocomplete',
        suggestions: []
      });
    }

    // Extract settings
    const apiKey = settings.api_key || DEFAULT_API_KEY;
    const providerType = settings.provider_type || 'google';
    const countryBias = settings.country_bias || 'ca';
    const language = settings.language || 'fr';
    const maxResults = Math.min(settings.max_results || 8, MAX_SUGGESTIONS);

    let suggestions = [];

    // Google Places API
    if (providerType === 'google') {
      const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
      url.searchParams.append('input', query);
      url.searchParams.append('key', apiKey);
      url.searchParams.append('language', language);
      url.searchParams.append('components', `country:${countryBias}`);
      
      if (sessionToken) {
        url.searchParams.append('sessiontoken', sessionToken);
      }

      const response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`Google API returned ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'OK' && Array.isArray(data.predictions)) {
        suggestions = data.predictions.slice(0, maxResults).map(p => ({
          id: p.place_id,
          description: p.description,
          place_id: p.place_id
        }));
      } else if (data.status === 'REQUEST_DENIED' || data.error_message) {
        return Response.json({ 
          error: 'Invalid API key or missing permissions',
          instruction: 'Enable Places API in Google Cloud Console',
          status: data.status,
          suggestions: [] 
        });
      } else if (data.status === 'ZERO_RESULTS') {
        suggestions = [];
      }
    } 
    // Mapbox Geocoding API
    else if (providerType === 'mapbox') {
      const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
      url.searchParams.append('access_token', apiKey);
      url.searchParams.append('country', countryBias);
      url.searchParams.append('language', language);
      url.searchParams.append('types', 'address');
      url.searchParams.append('limit', maxResults.toString());

      const response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Mapbox API returned ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data.features)) {
        suggestions = data.features.map(f => ({
          id: f.id,
          description: f.place_name,
          place_id: f.id,
          coordinates: f.center
        }));
      }
    }

    return Response.json({ 
      suggestions, 
      provider: providerType 
    });

  } catch (error) {
    console.error('[addressAutocomplete] Error:', error);
    
    // Handle timeout errors
    if (error.name === 'TimeoutError') {
      return Response.json({ 
        error: 'Request timeout',
        suggestions: []
      }, { status: 504 });
    }

    return Response.json({ 
      error: error.message || 'Internal server error',
      suggestions: []
    }, { status: 500 });
  }
});