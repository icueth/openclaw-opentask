/**
 * hashPassword.js
 * Password hashing utility using bcrypt
 */

const bcrypt = require('bcrypt');

// Cost factor for hashing (10-12 is recommended, higher = more secure but slower)
const SALT_ROUNDS = 10;

/**
 * Hash a password string using bcrypt
 * @param {string} password - The plain text password to hash
 * @returns {Promise<string>} - The hashed password
 * @throws {Error} - If password is invalid or hashing fails
 */
async function hashPassword(password) {
  // Input validation
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
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
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  if (!hashedPassword || typeof hashedPassword !== 'string') {
    throw new Error('Hashed password must be a non-empty string');
  }

  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    throw new Error(`Failed to compare passwords: ${error.message}`);
  }
}

// Export functions
module.exports = {
  hashPassword,
  comparePassword,
  SALT_ROUNDS
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
  } catch (error) {
    console.error('Error:', error.message);
  }
}

example();
*/
