import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a RFC4122 version 4 UUID
 * @returns A new UUID string
 */
export function generateUUID(): string {
  return uuidv4();
}
