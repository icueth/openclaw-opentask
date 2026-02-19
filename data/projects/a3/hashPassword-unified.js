/**
 * hashPassword-unified.js
 * Unified Password Hashing API - Combines bcrypt (v1), scrypt (v2), and PBKDF2 (v3)
 * 
 * Features:
 * - Single unified API for all algorithms
 * - Auto-detection of available algorithms with fallback chain
 * - Automatic format detection for compare operations
 * - Backward compatible with all existing hash formats
 */

const crypto = require('crypto');

// ============================================
// ALGORITHM DETECTION & AVAILABILITY
// ============================================

let bcrypt = null;
let bcryptAvailable = false;

try {
  bcrypt = require('bcrypt');
  bcryptAvailable = true;
} catch (e) {
  // bcrypt not installed
  bcryptAvailable = false;
}

// Native crypto is always available in Node.js
const scryptAvailable = typeof crypto.scrypt === 'function';
const pbkdf2Available = typeof crypto.pbkdf2 === 'function';

// ============================================
// DEFAULT CONFIGURATIONS
// ============================================

const DEFAULTS = {
  bcrypt: {
    saltRounds: 10
  },
  scrypt: {
    saltLength: 32,
    keyLength: 64,
    iterations: 16384,
    blockSize: 8,
    parallelization: 1
  },
  pbkdf2: {
    iterations: 100000,
    saltLength: 32,
    keyLength: 64,
    digest: 'sha256'
  }
};

// Fallback chain: bcrypt → scrypt → pbkdf2
const FALLBACK_CHAIN = ['bcrypt', 'scrypt', 'pbkdf2'];

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get list of available algorithms on this system
 * @returns {string[]} - Array of available algorithm names
 */
function getAvailableAlgorithms() {
  const available = [];
  if (bcryptAvailable) available.push('bcrypt');
  if (scryptAvailable) available.push('scrypt');
  if (pbkdf2Available) available.push('pbkdf2');
  return available;
}

/**
 * Detect the algorithm used in a hashed password
 * @param {string} hashedPassword - The hashed password to analyze
 * @returns {string|null} - Detected algorithm name or null
 */
function detectAlgorithm(hashedPassword) {
  if (!hashedPassword || typeof hashedPassword !== 'string') {
    return null;
  }

  // bcrypt format: $2b$10$... or $2a$... etc.
  if (hashedPassword.match(/^\$2[abyx]\$\d+\$/)) {
    return 'bcrypt';
  }

  // scrypt format: scrypt$iterations$salt$hash
  if (hashedPassword.startsWith('scrypt$')) {
    return 'scrypt';
  }

  // pbkdf2 format: pbkdf2_sha256$iterations$salt$hash
  if (hashedPassword.startsWith('pbkdf2_')) {
    const algoPart = hashedPassword.split('$')[0];
    if (algoPart === 'pbkdf2_sha256') {
      return 'pbkdf2';
    }
  }

  return null;
}

/**
 * Get the best available algorithm (first in fallback chain)
 * @returns {string} - Best available algorithm name
 */
function getBestAlgorithm() {
  for (const algo of FALLBACK_CHAIN) {
    if (algo === 'bcrypt' && bcryptAvailable) return algo;
    if (algo === 'scrypt' && scryptAvailable) return algo;
    if (algo === 'pbkdf2' && pbkdf2Available) return algo;
  }
  throw new Error('No password hashing algorithms available');
}

// ============================================
// INDIVIDUAL ALGORITHM IMPLEMENTATIONS
// ============================================

/**
 * Hash using bcrypt (v1)
 */
async function hashBcrypt(password, options = {}) {
  if (!bcryptAvailable) {
    throw new Error('bcrypt is not available. Install with: npm install bcrypt');
  }

  const saltRounds = options.saltRounds || DEFAULTS.bcrypt.saltRounds;
  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(password, salt);
}

/**
 * Compare using bcrypt
 */
async function compareBcrypt(password, hashedPassword) {
  if (!bcryptAvailable) {
    throw new Error('bcrypt is not available. Install with: npm install bcrypt');
  }
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Hash using scrypt (v2)
 */
async function hashScrypt(password, options = {}) {
  const config = { ...DEFAULTS.scrypt, ...options };
  
  const salt = crypto.randomBytes(config.saltLength);
  const passwordBuffer = Buffer.from(password, 'utf8');
  
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

  const saltBase64 = salt.toString('base64url');
  const hashBase64 = hash.toString('base64url');
  
  return `scrypt$${config.iterations}$${saltBase64}$${hashBase64}`;
}

/**
 * Compare using scrypt
 */
async function compareScrypt(password, hashedPassword) {
  const parts = hashedPassword.split('$');
  if (parts.length !== 4) {
    throw new Error('Invalid scrypt hash format');
  }

  const [, iterationsStr, saltBase64, hashBase64] = parts;
  const iterations = parseInt(iterationsStr, 10);
  const salt = Buffer.from(saltBase64, 'base64url');
  const originalHash = Buffer.from(hashBase64, 'base64url');

  const passwordBuffer = Buffer.from(password, 'utf8');
  
  const computedHash = await new Promise((resolve, reject) => {
    crypto.scrypt(
      passwordBuffer,
      salt,
      originalHash.length,
      {
        N: iterations,
        r: DEFAULTS.scrypt.blockSize,
        p: DEFAULTS.scrypt.parallelization
      },
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      }
    );
  });

  return crypto.timingSafeEqual(originalHash, computedHash);
}

/**
 * Hash using PBKDF2 (v3)
 */
async function hashPbkdf2(password, options = {}) {
  const config = { ...DEFAULTS.pbkdf2, ...options };
  
  const salt = crypto.randomBytes(config.saltLength);
  
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

  const saltBase64 = salt.toString('base64url');
  const hashBase64 = hash.toString('base64url');
  
  return `pbkdf2_sha256$${config.iterations}$${saltBase64}$${hashBase64}`;
}

/**
 * Compare using PBKDF2
 */
async function comparePbkdf2(password, hashedPassword) {
  const parts = hashedPassword.split('$');
  if (parts.length !== 4) {
    throw new Error('Invalid PBKDF2 hash format');
  }

  const [, iterationsStr, saltBase64, hashBase64] = parts;
  const iterations = parseInt(iterationsStr, 10);
  const salt = Buffer.from(saltBase64, 'base64url');
  const originalHash = Buffer.from(hashBase64, 'base64url');

  const computedHash = await new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      iterations,
      originalHash.length,
      DEFAULTS.pbkdf2.digest,
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      }
    );
  });

  return crypto.timingSafeEqual(originalHash, computedHash);
}

// ============================================
// UNIFIED API
// ============================================

/**
 * Hash a password using the specified algorithm
 * @param {string} password - The plain text password to hash
 * @param {string} algorithm - Algorithm to use: 'bcrypt', 'scrypt', 'pbkdf2', or 'auto' (default)
 * @param {Object} options - Algorithm-specific options
 * @returns {Promise<string>} - The hashed password
 * @throws {Error} - If password is invalid or algorithm unavailable
 * 
 * @example
 * // Auto-select best available algorithm
 * const hash = await hashPassword('myPassword');
 * 
 * // Explicitly use bcrypt
 * const hash = await hashPassword('myPassword', 'bcrypt');
 * 
 * // Use scrypt with custom iterations
 * const hash = await hashPassword('myPassword', 'scrypt', { iterations: 32768 });
 */
async function hashPassword(password, algorithm = 'auto', options = {}) {
  // Input validation
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  // Auto-select algorithm if not specified
  if (algorithm === 'auto') {
    algorithm = getBestAlgorithm();
  }

  const algo = algorithm.toLowerCase();

  try {
    switch (algo) {
      case 'bcrypt':
        return await hashBcrypt(password, options);
      case 'scrypt':
        return await hashScrypt(password, options);
      case 'pbkdf2':
        return await hashPbkdf2(password, options);
      default:
        throw new Error(`Unknown algorithm: ${algorithm}. Available: ${getAvailableAlgorithms().join(', ')}`);
    }
  } catch (error) {
    if (error.message.startsWith('Password must be') || error.message.startsWith('Unknown algorithm')) {
      throw error;
    }
    throw new Error(`Failed to hash password with ${algo}: ${error.message}`);
  }
}

/**
 * Compare a password with a hash - automatically detects algorithm
 * @param {string} password - The plain text password
 * @param {string} hashedPassword - The hashed password to compare
 * @returns {Promise<boolean>} - True if passwords match
 * @throws {Error} - If comparison fails
 * 
 * @example
 * const isValid = await comparePassword('myPassword', storedHash);
 */
async function comparePassword(password, hashedPassword) {
  // Input validation
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  if (!hashedPassword || typeof hashedPassword !== 'string') {
    throw new Error('Hashed password must be a non-empty string');
  }

  // Auto-detect algorithm
  const algorithm = detectAlgorithm(hashedPassword);
  
  if (!algorithm) {
    throw new Error('Unable to detect hash algorithm. Hash format not recognized.');
  }

  try {
    switch (algorithm) {
      case 'bcrypt':
        return await compareBcrypt(password, hashedPassword);
      case 'scrypt':
        return await compareScrypt(password, hashedPassword);
      case 'pbkdf2':
        return await comparePbkdf2(password, hashedPassword);
      default:
        throw new Error(`Unknown algorithm detected: ${algorithm}`);
    }
  } catch (error) {
    if (error.message.includes('not available')) {
      throw error;
    }
    if (error.message.includes('Invalid') || error.message.includes('Unable to detect')) {
      throw error;
    }
    throw new Error(`Failed to compare password: ${error.message}`);
  }
}

// ============================================
// EXPORT ALL VERSIONS FOR ADVANCED USERS
// ============================================

// Load individual implementations if they exist
let v1, v2, v3;

try {
  v1 = require('./hashPassword');
} catch (e) {
  v1 = null;
}

try {
  v2 = require('./hashPassword-v2');
} catch (e) {
  v2 = null;
}

try {
  v3 = require('./hashPassword-v3');
} catch (e) {
  v3 = null;
}

// ============================================
// MAIN EXPORTS
// ============================================

module.exports = {
  // Unified API
  hashPassword,
  comparePassword,
  getAvailableAlgorithms,
  detectAlgorithm,
  getBestAlgorithm,
  
  // Configuration defaults
  DEFAULTS,
  
  // Individual algorithm implementations (for advanced use)
  algorithms: {
    bcrypt: {
      hash: hashBcrypt,
      compare: compareBcrypt,
      available: bcryptAvailable
    },
    scrypt: {
      hash: hashScrypt,
      compare: compareScrypt,
      available: scryptAvailable
    },
    pbkdf2: {
      hash: hashPbkdf2,
      compare: comparePbkdf2,
      available: pbkdf2Available
    }
  },
  
  // Original version modules (if available)
  v1,
  v2,
  v3
};

// ============================================
// EXAMPLE USAGE (uncomment to test)
// ============================================
/*
async function example() {
  console.log('=== Unified Password Hashing API Demo ===\n');
  
  const password = 'mySecurePassword123';
  
  // Show available algorithms
  console.log('Available algorithms:', getAvailableAlgorithms());
  console.log('Best algorithm:', getBestAlgorithm());
  console.log();
  
  // Test each available algorithm
  const algorithms = getAvailableAlgorithms();
  
  for (const algo of algorithms) {
    console.log(`--- Testing ${algo} ---`);
    
    try {
      // Hash with specific algorithm
      const hashed = await hashPassword(password, algo);
      console.log(`${algo} hash:`, hashed.substring(0, 50) + '...');
      
      // Verify with auto-detection
      const isValid = await comparePassword(password, hashed);
      console.log('Valid password:', isValid);
      
      const isInvalid = await comparePassword('wrongPassword', hashed);
      console.log('Invalid password:', isInvalid);
      console.log();
    } catch (error) {
      console.error(`${algo} error:`, error.message);
    }
  }
  
  // Test auto-selection
  console.log('--- Auto-selection ---');
  const autoHash = await hashPassword(password);
  console.log('Auto-selected hash:', autoHash.substring(0, 50) + '...');
  console.log('Detected algorithm:', detectAlgorithm(autoHash));
  const autoValid = await comparePassword(password, autoHash);
  console.log('Auto hash valid:', autoValid);
}

example().catch(console.error);
*/
