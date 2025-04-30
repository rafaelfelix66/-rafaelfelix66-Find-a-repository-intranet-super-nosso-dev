// Script de teste (save-as test-bcrypt.js)
const bcrypt = require('bcryptjs');

async function testBcrypt() {
  const password = '478662';
  
  // Gerar hash
  console.log('Gerando hash para:', password);
  const salt = await bcrypt.genSalt(10);
  console.log('Salt gerado:', salt);
  
  const hash = await bcrypt.hash(password, salt);
  console.log('Hash gerado:', hash);
  
  // Testar comparação
  const isMatch = await bcrypt.compare(password, hash);
  console.log('Comparação com senha original:', isMatch);
  
  // Testar com uma senha diferente
  const wrongPassword = '123456';
  const isMatchWrong = await bcrypt.compare(wrongPassword, hash);
  console.log('Comparação com senha errada:', isMatchWrong);
}

testBcrypt().catch(console.error);