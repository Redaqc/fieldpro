import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { placeId, provider } = await req.json();

    // Get provider settings
    const settingsList = await base44.asServiceRole.entities.IntegrationSettings.filter({ 
      integration_type: 'address_autocomplete' 
    });
    const settings = settingsList[0];

    if (!settings || !settings.is_active) {
      return Response.json({ 
        error: 'Aucune configuration trouvée.',
        instruction: 'Veuillez configurer l\'API d\'autocomplétion dans : Paramètres → Address Autocomplete'
      }, { status: 400 });
    }

    const apiKey = settings.api_key;
    const providerType = settings.provider_type || 'google';

    if (!apiKey) {
      return Response.json({ 
        error: 'Clé API manquante',
        instruction: 'Veuillez configurer votre clé API dans : Paramètres → Address Autocomplete'
      }, { status: 400 });
    }

    let addressData = {};

    if (providerType === 'google' && placeId) {
      // Google Places Details API
      const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
      url.searchParams.append('place_id', placeId);
      url.searchParams.append('key', apiKey);
      url.searchParams.append('fields', 'address_components,formatted_address,geometry');

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const result = data.result;
        const components = result.address_components || [];

        const getComponent = (types) => {
          const comp = components.find(c => types.some(t => c.types.includes(t)));
          return comp ? comp.long_name : '';
        };

        const getShortComponent = (types) => {
          const comp = components.find(c => types.some(t => c.types.includes(t)));
          return comp ? comp.short_name : '';
        };

        addressData = {
          full_address: result.formatted_address || '',
          street_number: getComponent(['street_number']),
          street_name: getComponent(['route']),
          city: getComponent(['locality', 'sublocality', 'postal_town']),
          province: getShortComponent(['administrative_area_level_1']),
          postal_code: getComponent(['postal_code']),
          country: getComponent(['country']),
          latitude: result.geometry?.location?.lat || null,
          longitude: result.geometry?.location?.lng || null
        };
      }
    } else if (providerType === 'mapbox' && placeId) {
      // Mapbox already provides details in the search response
      // But we can fetch full details if needed
      const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(placeId)}.json`);
      url.searchParams.append('access_token', apiKey);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.features && data.features[0]) {
        const feature = data.features[0];
        const context = feature.context || [];

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
          latitude: feature.center[1] || null,
          longitude: feature.center[0] || null
        };
      }
    }

    return Response.json({ address: addressData });
  } catch (error) {
    console.error('Address details error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});