/**
 * hashPassword-v2.js
 * Password hashing utility using Node.js native crypto module (scrypt)
 * Alternative to bcrypt-based v1 - no external dependencies
 */

const crypto = require('crypto');

// Default configuration options
const DEFAULT_OPTIONS = {
  saltLength: 32,        // Length of random salt in bytes
  keyLength: 64,         // Length of derived key in bytes
  iterations: 16384,     // Scrypt N parameter (CPU/memory cost) ~16MB memory
  blockSize: 8,          // Scrypt r parameter (block size)
  parallelization: 1     // Scrypt p parameter (parallelization)
};

// Algorithm identifier for storage format
const ALGORITHM = 'scrypt';

/**
 * Hash a password string using crypto.scrypt
 * @param {string} password - The plain text password to hash
 * @param {Object} options - Optional configuration
 * @param {number} options.saltLength - Length of salt in bytes (default: 32)
 * @param {number} options.keyLength - Length of derived key in bytes (default: 64)
 * @param {number} options.iterations - Scrypt N parameter (default: 16384)
 * @param {number} options.blockSize - Scrypt r parameter (default: 8)
 * @param {number} options.parallelization - Scrypt p parameter (default: 1)
 * @returns {Promise<string>} - The hashed password in format: algorithm$iterations$salt$hash
 * @throws {Error} - If password is invalid or hashing fails
 */
async function hashPassword(password, options = {}) {
  // Input validation
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  // Merge options with defaults
  const config = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Generate cryptographically secure random salt
    const salt = crypto.randomBytes(config.saltLength);
    
    // Convert password to buffer
    const passwordBuffer = Buffer.from(password, 'utf8');
    
    // Hash password using scrypt
    const hash = await new Promise((resolve, reject) => {
      crypto.scrypt(
        passwordBuffer,
        salt,
        config.keyLength,
        {
          N: config.iterations,
          r: config.blockSize,
          p: config.parallelization
        },
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey);
        }
      );
    });

    // Format: algorithm$iterations$salt$hash (all base64url encoded)
    const saltBase64 = salt.toString('base64url');
    const hashBase64 = hash.toString('base64url');
    
    return `${ALGORITHM}$${config.iterations}$${saltBase64}$${hashBase64}`;
  } catch (error) {
    throw new Error(`Failed to hash password: ${error.message}`);
  }
}

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - The plain text password
 * @param {string} hashedPassword - The hashed password to compare against
 * @returns {Promise<boolean>} - True if passwords match, false otherwise
 * @throws {Error} - If comparison fails
 */
async function comparePassword(password, hashedPassword) {
  // Input validation
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  if (!hashedPassword || typeof hashedPassword !== 'string') {
    throw new Error('Hashed password must be a non-empty string');
  }

  try {
    // Parse the hashed password format: algorithm$iterations$salt$hash
    const parts = hashedPassword.split('$');
    
    if (parts.length !== 4) {
      throw new Error('Invalid hashed password format');
    }

    const [algorithm, iterationsStr, saltBase64, hashBase64] = parts;

    // Verify algorithm
    if (algorithm !== ALGORITHM) {
      throw new Error(`Unsupported algorithm: ${algorithm}. Expected: ${ALGORITHM}`);
    }

    const iterations = parseInt(iterationsStr, 10);
    const salt = Buffer.from(saltBase64, 'base64url');
    const originalHash = Buffer.from(hashBase64, 'base64url');

    // Hash the provided password with the same salt and parameters
    const passwordBuffer = Buffer.from(password, 'utf8');
    
    const computedHash = await new Promise((resolve, reject) => {
      crypto.scrypt(
        passwordBuffer,
        salt,
        originalHash.length,
        {
          N: iterations,
          r: DEFAULT_OPTIONS.blockSize,
          p: DEFAULT_OPTIONS.parallelization
        },
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey);
        }
      );
    });

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(originalHash, computedHash);
  } catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('Unsupported')) {
      throw error;
    }
    throw new Error(`Failed to compare passwords: ${error.message}`);
  }
}

/**
 * Get current configuration defaults
 * @returns {Object} - Current default options
 */
function getDefaults() {
  return { ...DEFAULT_OPTIONS };
}

// Export functions
module.exports = {
  hashPassword,
  comparePassword,
  getDefaults,
  ALGORITHM,
  DEFAULT_OPTIONS
};

// Example usage (uncomment to test)
/*
async function example() {
  try {
    // Hash a password
    const plainPassword = 'mySecurePassword123';
    const hashed = await hashPassword(plainPassword);
    console.log('Original:', plainPassword);
    console.log('Hashed:', hashed);

    // Verify password
    const isValid = await comparePassword('mySecurePassword123', hashed);
    console.log('Password valid:', isValid);

    // Test wrong password
    const isInvalid = await comparePassword('wrongPassword', hashed);
    console.log('Wrong password valid:', isInvalid);

    // Custom options example
    const customHashed = await hashPassword(plainPassword, {
      iterations: 32768,  // Higher cost
      keyLength: 32       // Shorter key
    });
    console.log('Custom hashed:', customHashed);
    
    const customValid = await comparePassword(plainPassword, customHashed);
    console.log('Custom password valid:', customValid);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

example();
*/
