const bcrypt = require('bcrypt');

async function testPassword() {
  const storedHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
  
  console.log('Stored hash:', storedHash);
  
  // Test common passwords
  const testPasswords = [
    'password',
    'CallDocker2024!',
    'admin',
    'adminpass',
    'agentpass',
    'agent1',
    'test',
    '123456',
    'password123'
  ];
  
  for (const password of testPasswords) {
    const isValid = await bcrypt.compare(password, storedHash);
    if (isValid) {
      console.log(`✅ Found matching password: "${password}"`);
      return;
    }
  }
  
  console.log('❌ No matching password found for the stored hash');
  
  // Generate correct hash for CallDocker2024!
  const correctPassword = 'CallDocker2024!';
  const newHash = await bcrypt.hash(correctPassword, 10);
  console.log(`🔄 Correct hash for "${correctPassword}": ${newHash}`);
}

testPassword().catch(console.error); 