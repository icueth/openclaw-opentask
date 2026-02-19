/**
 * example.js
 * Usage example for hashPassword module
 */

const { hashPassword, comparePassword } = require('./hashPassword');

async function runExample() {
  console.log('=== Password Hashing Example ===\n');

  try {
    // Example 1: Hash a password
    const plainPassword = 'mySecurePassword123';
    console.log('1. Hashing password...');
    const hashed = await hashPassword(plainPassword);
    console.log('   Original:', plainPassword);
    console.log('   Hashed:', hashed);
    console.log();

    // Example 2: Verify correct password
    console.log('2. Verifying correct password...');
    const isValid = await comparePassword('mySecurePassword123', hashed);
    console.log('   Valid:', isValid);
    console.log();

    // Example 3: Verify wrong password
    console.log('3. Verifying wrong password...');
    const isInvalid = await comparePassword('wrongPassword', hashed);
    console.log('   Valid:', isInvalid);
    console.log();

    // Example 4: Error handling
    console.log('4. Testing error handling...');
    try {
      await hashPassword('123'); // Too short
    } catch (error) {
      console.log('   Caught expected error:', error.message);
    }

    console.log('\n=== All examples completed successfully! ===');
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

runExample();
