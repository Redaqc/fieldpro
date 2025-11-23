/**
 * Address Autocomplete Service
 * Geocoding and address autocomplete using Google Maps API
 * Replaces Base44 addressAutocomplete function
 */

import axios from 'axios';
import { badRequest } from '../middleware/errorHandler.js';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

/**
 * Autocomplete address using Google Places API
 * @param {string} input - Address input
 * @param {Object} options - Autocomplete options
 * @returns {Promise<Array>} Address suggestions
 */
export async function autocompleteAddress(input, options = {}) {
  if (!input) {
    throw badRequest('Address input is required');
  }

  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key not configured');
  }

  const {
    types = 'address',
    components = null, // e.g., 'country:us'
    location = null,
    radius = null
  } = options;

  try {
    const params = {
      input,
      key: GOOGLE_MAPS_API_KEY,
      types
    };

    if (components) {
      params.components = components;
    }

    if (location && radius) {
      params.location = location;
      params.radius = radius;
    }

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/autocomplete/json',
      { params }
    );

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    return response.data.predictions.map(prediction => ({
      description: prediction.description,
      place_id: prediction.place_id,
      structured_formatting: prediction.structured_formatting,
      types: prediction.types
    }));
  } catch (error) {
    console.error('Address autocomplete error:', error);
    throw badRequest(`Address autocomplete failed: ${error.message}`);
  }
}

/**
 * Get place details by place ID
 * @param {string} placeId - Google Place ID
 * @returns {Promise<Object>} Place details
 */
export async function getPlaceDetails(placeId) {
  if (!placeId) {
    throw badRequest('Place ID is required');
  }

  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key not configured');
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          place_id: placeId,
          key: GOOGLE_MAPS_API_KEY,
          fields: 'formatted_address,address_components,geometry,name,types'
        }
      }
    );

    if (response.data.status !== 'OK') {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    const result = response.data.result;
    const components = parseAddressComponents(result.address_components);

    return {
      place_id: placeId,
      formatted_address: result.formatted_address,
      name: result.name,
      address_components: components,
      location: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng
      },
      types: result.types
    };
  } catch (error) {
    console.error('Get place details error:', error);
    throw badRequest(`Get place details failed: ${error.message}`);
  }
}

/**
 * Geocode an address to coordinates
 * @param {string} address - Address to geocode
 * @returns {Promise<Object>} Geocoding result
 */
export async function geocodeAddress(address) {
  if (!address) {
    throw badRequest('Address is required');
  }

  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key not configured');
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          address,
          key: GOOGLE_MAPS_API_KEY
        }
      }
    );

    if (response.data.status !== 'OK') {
      throw new Error(`Geocoding API error: ${response.data.status}`);
    }

    const result = response.data.results[0];
    const components = parseAddressComponents(result.address_components);

    return {
      formatted_address: result.formatted_address,
      address_components: components,
      location: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng
      },
      place_id: result.place_id,
      types: result.types
    };
  } catch (error) {
    console.error('Geocode error:', error);
    throw badRequest(`Geocoding failed: ${error.message}`);
  }
}

/**
 * Reverse geocode coordinates to address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Reverse geocoding result
 */
export async function reverseGeocode(lat, lng) {
  if (!lat || !lng) {
    throw badRequest('Latitude and longitude are required');
  }

  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key not configured');
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          latlng: `${lat},${lng}`,
          key: GOOGLE_MAPS_API_KEY
        }
      }
    );

    if (response.data.status !== 'OK') {
      throw new Error(`Reverse geocoding API error: ${response.data.status}`);
    }

    const result = response.data.results[0];
    const components = parseAddressComponents(result.address_components);

    return {
      formatted_address: result.formatted_address,
      address_components: components,
      location: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng
      },
      place_id: result.place_id,
      types: result.types
    };
  } catch (error) {
    console.error('Reverse geocode error:', error);
    throw badRequest(`Reverse geocoding failed: ${error.message}`);
  }
}

/**
 * Parse address components into structured object
 * @param {Array} components - Google address components
 * @returns {Object} Parsed components
 */
function parseAddressComponents(components) {
  const parsed = {
    street_number: '',
    route: '',
    city: '',
    state: '',
    state_short: '',
    country: '',
    country_short: '',
    postal_code: '',
    neighborhood: '',
    sublocality: ''
  };

  components.forEach(component => {
    const types = component.types;

    if (types.includes('street_number')) {
      parsed.street_number = component.long_name;
    }
    if (types.includes('route')) {
      parsed.route = component.long_name;
    }
    if (types.includes('locality')) {
      parsed.city = component.long_name;
    }
    if (types.includes('administrative_area_level_1')) {
      parsed.state = component.long_name;
      parsed.state_short = component.short_name;
    }
    if (types.includes('country')) {
      parsed.country = component.long_name;
      parsed.country_short = component.short_name;
    }
    if (types.includes('postal_code')) {
      parsed.postal_code = component.long_name;
    }
    if (types.includes('neighborhood')) {
      parsed.neighborhood = component.long_name;
    }
    if (types.includes('sublocality')) {
      parsed.sublocality = component.long_name;
    }
  });

  // Build full address
  parsed.address = `${parsed.street_number} ${parsed.route}`.trim();

  return parsed;
}

/**
 * Calculate distance between two addresses
 * @param {string} origin - Origin address
 * @param {string} destination - Destination address
 * @returns {Promise<Object>} Distance result
 */
export async function calculateDistance(origin, destination) {
  if (!origin || !destination) {
    throw badRequest('Origin and destination are required');
  }

  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key not configured');
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/distancematrix/json',
      {
        params: {
          origins: origin,
          destinations: destination,
          key: GOOGLE_MAPS_API_KEY,
          units: 'imperial'
        }
      }
    );

    if (response.data.status !== 'OK') {
      throw new Error(`Distance Matrix API error: ${response.data.status}`);
    }

    const element = response.data.rows[0].elements[0];

    if (element.status !== 'OK') {
      throw new Error(`Route calculation failed: ${element.status}`);
    }

    return {
      origin: response.data.origin_addresses[0],
      destination: response.data.destination_addresses[0],
      distance: {
        text: element.distance.text,
        value: element.distance.value, // meters
        miles: (element.distance.value / 1609.34).toFixed(2)
      },
      duration: {
        text: element.duration.text,
        value: element.duration.value, // seconds
        minutes: Math.round(element.duration.value / 60)
      }
    };
  } catch (error) {
    console.error('Calculate distance error:', error);
    throw badRequest(`Distance calculation failed: ${error.message}`);
  }
}

export default {
  autocompleteAddress,
  getPlaceDetails,
  geocodeAddress,
  reverseGeocode,
  calculateDistance
};
