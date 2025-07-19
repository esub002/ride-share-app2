const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Test the password hashing
const testPassword = 'password123';
const hashedPassword = hashPassword(testPassword);
console.log('Test password:', testPassword);
console.log('Hashed password:', hashedPassword);
console.log('Expected hash:', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9');
console.log('Match:', hashedPassword === '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'); 