/**
 * hashPassword-v3.js
 * Password hashing utility using PBKDF2 with SHA256
 * 
 * ⚠️ SECURITY WARNING ⚠️
 * ======================
 * 
 * WHY PLAIN SHA256 IS NOT RECOMMENDED FOR PASSWORDS:
 * - SHA256 is designed to be FAST, which is the opposite of what password hashing needs
 * - Fast hashing allows attackers to try billions of passwords per second with GPU/ASIC
 * - A modern GPU can compute billions of SHA256 hashes per second
 * - Without key stretching, simple passwords are cracked in minutes or hours
 * 
 * WHY PBKDF2 WITH HIGH ITERATIONS IS BETTER:
 * - PBKDF2 (Password-Based Key Derivation Function 2) applies HMAC-SHA256 repeatedly
 * - High iteration count (default 100,000) dramatically slows down brute-force attacks
 * - Each password guess requires 100,000 HMAC operations, reducing attack speed
 * - Uses cryptographically secure random salt to prevent rainbow table attacks
 * 
 * RECOMMENDATION FOR PRODUCTION:
 * - Consider using V1 (bcrypt) or V2 (scrypt) instead:
 *   - V1 (bcrypt): Industry standard, extensively audited, widely supported
 *   - V2 (scrypt): Memory-hard algorithm, resistant to GPU/ASIC attacks
 * - PBKDF2 is acceptable but scrypt/Argon2 are generally preferred for new systems
 * - If using PBKDF2, consider even higher iterations (300,000+ per OWASP 2023)
 * 
 * This implementation is provided for:
 * - Educational purposes (understanding key stretching)
 * - Compatibility with systems requiring PBKDF2-SHA256
 * - Environments where PBKDF2 is specifically required
 */

const crypto = require('crypto');

// Default configuration options
const DEFAULT_OPTIONS = {
  iterations: 100000,    // Number of PBKDF2 iterations (OWASP recommends 600,000 for SHA256 in 2023)
  saltLength: 32,        // Length of random salt in bytes
  keyLength: 64,         // Length of derived key in bytes (512 bits)
  digest: 'sha256'       // Hash digest algorithm
};

// Algorithm identifier for storage format
const ALGORITHM = 'pbkdf2_sha256';

/**
 * Hash a password string using PBKDF2 with SHA256
 * @param {string} password - The plain text password to hash
 * @param {Object} options - Optional configuration
 * @param {number} options.iterations - Number of PBKDF2 iterations (default: 100000)
 * @param {number} options.saltLength - Length of salt in bytes (default: 32)
 * @param {number} options.keyLength - Length of derived key in bytes (default: 64)
 * @returns {Promise<string>} - The hashed password in format: pbkdf2_sha256$iterations$salt$hash
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

  // Validate iterations
  if (!Number.isInteger(config.iterations) || config.iterations < 1000) {
    throw new Error('Iterations must be an integer >= 1000');
  }

  try {
    // Generate cryptographically secure random salt
    const salt = crypto.randomBytes(config.saltLength);
    
    // Hash password using PBKDF2
    const hash = await new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        config.iterations,
        config.keyLength,
        config.digest,
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey);
        }
      );
    });

    // Format: algorithm$iterations$salt$hash (base64url encoded)
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
    
    if (isNaN(iterations) || iterations < 1) {
      throw new Error('Invalid iterations value');
    }

    const salt = Buffer.from(saltBase64, 'base64url');
    const originalHash = Buffer.from(hashBase64, 'base64url');

    // Hash the provided password with the same salt and parameters
    const computedHash = await new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        iterations,
        originalHash.length,
        DEFAULT_OPTIONS.digest,
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
 * Validate if a hash string is in the correct PBKDF2-SHA256 format
 * @param {string} hashedPassword - The hashed password to validate
 * @returns {boolean} - True if format is valid
 */
function isValidHashFormat(hashedPassword) {
  if (!hashedPassword || typeof hashedPassword !== 'string') {
    return false;
  }

  const parts = hashedPassword.split('$');
  if (parts.length !== 4) {
    return false;
  }

  const [algorithm, iterationsStr, saltBase64, hashBase64] = parts;

  if (algorithm !== ALGORITHM) {
    return false;
  }

  const iterations = parseInt(iterationsStr, 10);
  if (isNaN(iterations) || iterations < 1) {
    return false;
  }

  // Check if salt and hash are valid base64url
  try {
    Buffer.from(saltBase64, 'base64url');
    Buffer.from(hashBase64, 'base64url');
  } catch {
    return false;
  }

  return true;
}

/**
 * Get current configuration defaults
 * @returns {Object} - Current default options
 */
function getDefaults() {
  return { ...DEFAULT_OPTIONS };
}

/**
 * Get algorithm identifier
 * @returns {string} - Algorithm name
 */
function getAlgorithm() {
  return ALGORITHM;
}

// Export functions
module.exports = {
  hashPassword,
  comparePassword,
  isValidHashFormat,
  getDefaults,
  getAlgorithm,
  ALGORITHM,
  DEFAULT_OPTIONS
};

// Example usage (uncomment to test)
/*
async function example() {
  try {
    console.log('=== PBKDF2-SHA256 Password Hashing Demo ===\n');
    
    // Hash a password
    const plainPassword = 'mySecurePassword123';
    console.log('Original password:', plainPassword);
    
    const hashed = await hashPassword(plainPassword);
    console.log('Hashed:', hashed);
    console.log();

    // Verify correct password
    const isValid = await comparePassword('mySecurePassword123', hashed);
    console.log('Correct password valid:', isValid);

    // Verify wrong password
    const isInvalid = await comparePassword('wrongPassword', hashed);
    console.log('Wrong password valid:', isInvalid);
    console.log();

    // Custom higher iterations (more secure but slower)
    console.log('--- Higher Iterations Demo ---');
    const startTime = Date.now();
    const secureHashed = await hashPassword(plainPassword, {
      iterations: 300000  // OWASP 2023 recommendation
    });
    const duration = Date.now() - startTime;
    console.log(`Hash with 300k iterations took: ${duration}ms`);
    console.log('Hash:', secureHashed);
    
    const secureValid = await comparePassword(plainPassword, secureHashed);
    console.log('Password valid:', secureValid);
    console.log();

    // Test format validation
    console.log('--- Format Validation ---');
    console.log('Is valid format:', isValidHashFormat(hashed));
    console.log('Is valid format (wrong algo):', isValidHashFormat('bcrypt$10$salt$hash'));
    console.log('Is valid format (invalid):', isValidHashFormat('invalid'));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

example();
*/
