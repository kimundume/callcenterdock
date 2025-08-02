const bcrypt = require('bcrypt');

const password = 'CallDocker2024!';
const storedHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

console.log('🔐 Testing password hash...');
console.log(`📝 Password: ${password}`);
console.log(`🔑 Stored hash: ${storedHash}`);

// Test if the stored hash matches the password
bcrypt.compare(password, storedHash).then(isValid => {
  console.log(`✅ Hash validation result: ${isValid}`);
  
  if (isValid) {
    console.log('🎉 Password hash is correct!');
  } else {
    console.log('❌ Password hash is incorrect!');
    
    // Generate a new hash for the password
    bcrypt.hash(password, 10).then(newHash => {
      console.log(`🔄 New hash for "${password}": ${newHash}`);
    });
  }
});

// Also test with a different password to make sure bcrypt is working
bcrypt.compare('wrongpassword', storedHash).then(isValid => {
  console.log(`❌ Wrong password validation: ${isValid} (should be false)`);
}); 