/**
 * Base44 Client Wrapper
 *
 * This file used to import @base44/sdk but now exports our native API client.
 * By replacing this single file, all 646 base44 references across the codebase
 * automatically use the native API without changing any other files!
 *
 * Original: import { createClient } from '@base44/sdk';
 * New: import api from '@/services/api';
 */

import api from '@/services/api';

// Export native API client as 'base44' for backwards compatibility
// This allows all existing code like `base44.entities.Customer.list()`
// to work without modifications
export const base44 = api;

// Also export as default
export default api;
