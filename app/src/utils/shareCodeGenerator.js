// Share Code Generator - Generate unique 6-character codes for canvas sharing

// Character pool (excluding confusing characters like O, 0, I, 1, l)
const CHAR_POOL = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a random 6-character share code
 * @returns {string} 6-character uppercase code
 */
export function generateShareCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * CHAR_POOL.length);
    code += CHAR_POOL[randomIndex];
  }
  return code;
}

/**
 * Validate share code format
 * @param {string} code - Code to validate
 * @returns {boolean} True if valid format
 */
export function validateShareCodeFormat(code) {
  if (!code || typeof code !== 'string') return false;
  if (code.length !== 6) return false;
  
  // Check if all characters are in the pool
  const upperCode = code.toUpperCase();
  return [...upperCode].every(char => CHAR_POOL.includes(char));
}

/**
 * Format share code for display (with spaces)
 * @param {string} code - Raw code
 * @returns {string} Formatted code (e.g., "XY7 K2M")
 */
export function formatShareCode(code) {
  if (!code || code.length !== 6) return code;
  return `${code.substring(0, 3)} ${code.substring(3)}`;
}

/**
 * Check if code is unique in database
 * @param {string} code - Code to check
 * @param {Function} checkFn - Async function to check database
 * @returns {Promise<boolean>} True if unique
 */
export async function isCodeUnique(code, checkFn) {
  try {
    return await checkFn(code);
  } catch (error) {
    console.error('Error checking code uniqueness:', error);
    return false;
  }
}

/**
 * Generate unique share code (checks database)
 * @param {Function} checkFn - Async function to check if code exists
 * @param {number} maxAttempts - Maximum generation attempts
 * @returns {Promise<string>} Unique code
 */
export async function generateUniqueShareCode(checkFn, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateShareCode();
    const isUnique = await isCodeUnique(code, checkFn);
    
    if (isUnique) {
      return code;
    }
  }
  
  // If we couldn't generate unique code after max attempts, throw error
  throw new Error('Failed to generate unique share code. Please try again.');
}

export default {
  generateShareCode,
  validateShareCodeFormat,
  formatShareCode,
  isCodeUnique,
  generateUniqueShareCode,
};

