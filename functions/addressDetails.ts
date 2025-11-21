import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Address Details API Function
 * Fetches full address details from placeId
 * Supports Google Places and Mapbox providers
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authentication check
    const user = await base44.auth.me();
    if (!user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { placeId, provider } = await req.json();

    // Validate placeId
    if (!placeId || typeof placeId !== 'string') {
      return Response.json(
        { error: 'Invalid placeId' },
        { status: 400 }
      );
    }

    // Get provider settings
    const settingsList = await base44.asServiceRole.entities.IntegrationSettings.filter({ 
      integration_type: 'address_autocomplete' 
    });
    const settings = settingsList[0];

    if (!settings || !settings.is_active) {
      return Response.json({ 
        error: 'No configuration found',
        instruction: 'Configure API in: Settings → Address Autocomplete'
      }, { status: 400 });
    }

    const apiKey = settings.api_key;
    const providerType = provider || settings.provider_type || 'google';

    if (!apiKey) {
      return Response.json({ 
        error: 'Missing API key',
        instruction: 'Configure API key in: Settings → Address Autocomplete'
      }, { status: 400 });
    }

    let addressData = {};

    // Google Places Details API
    if (providerType === 'google') {
      const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
      url.searchParams.append('place_id', placeId);
      url.searchParams.append('key', apiKey);
      url.searchParams.append('fields', 'address_components,formatted_address,geometry');

      const response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`Google API returned ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const result = data.result;
        const components = result.address_components || [];

        // Helper to get component by type
        const getComponent = (types, shortName = false) => {
          const comp = components.find(c => 
            types.some(t => c.types.includes(t))
          );
          return comp ? (shortName ? comp.short_name : comp.long_name) : '';
        };

        addressData = {
          full_address: result.formatted_address || '',
          street_number: getComponent(['street_number']),
          street_name: getComponent(['route']),
          city: getComponent(['locality', 'sublocality', 'postal_town']),
          province: getComponent(['administrative_area_level_1'], true),
          postal_code: getComponent(['postal_code']),
          country: getComponent(['country']),
          latitude: result.geometry?.location?.lat || null,
          longitude: result.geometry?.location?.lng || null
        };
      } else if (data.status === 'REQUEST_DENIED' || data.error_message) {
        return Response.json({ 
          error: 'Invalid API key or missing permissions',
          instruction: 'Enable Places API in Google Cloud Console'
        }, { status: 400 });
      }
    } 
    // Mapbox Geocoding API
    else if (providerType === 'mapbox') {
      const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(placeId)}.json`);
      url.searchParams.append('access_token', apiKey);

      const response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Mapbox API returned ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data.features) && data.features[0]) {
        const feature = data.features[0];
        const context = feature.context || [];

        // Helper to get context by ID prefix
        const getContext = (id) => {
          const item = context.find(c => c.id.startsWith(id));
          return item ? item.text : '';
        };

        addressData = {
          full_address: feature.place_name || '',
          street_number: feature.address || '',
          street_name: feature.text || '',
          city: getContext('place') || getContext('locality'),
          province: getContext('region'),
          postal_code: getContext('postcode'),
          country: getContext('country'),
          latitude: feature.center?.[1] || null,
          longitude: feature.center?.[0] || null
        };
      }
    }

    return Response.json({ address: addressData });

  } catch (error) {
    console.error('[addressDetails] Error:', error);
    
    // Handle timeout errors
    if (error.name === 'TimeoutError') {
      return Response.json({ 
        error: 'Request timeout'
      }, { status: 504 });
    }

    return Response.json({ 
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
});