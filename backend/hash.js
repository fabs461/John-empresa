const bcrypt = require('bcryptjs');

async function generarHash() {
  const passwordOriginal = 'johnempresa2026';
  const saltRounds = 10;
  const hash = await bcrypt.hash(passwordOriginal, saltRounds);
  console.log('Copia este hash y pégalo en tu base de datos:');
  console.log(hash);
}

generarHash();