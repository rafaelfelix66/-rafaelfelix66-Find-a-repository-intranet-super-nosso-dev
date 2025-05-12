// test-oracle-connection.js
const path = require('path');
const dotenv = require('dotenv');
const oracledb = require('oracledb');

// Configurar caminho do Oracle Client
oracledb.initOracleClient({
  libDir: 'C:\\Oracle\\instantclient_11_2_x64'
});

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function testarConexao() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: `(DESCRIPTION=
        (ADDRESS=(PROTOCOL=TCP)
        (HOST=172.19.0.63)
        (PORT=1521))
        (CONNECT_DATA=(SID=desenv20))
      )`
    });
    
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Testar consulta simples
    const result = await connection.execute('SELECT NOME, CPF, FUNCAO, SETOR, DATAADMISSAO, DTNASCIMENTO FROM CONSINCO.STAV_LOG_INTR');
    console.log('Usuário conectado:', result.rows[0]);
	
	console.log('Configuração de conexão Oracle:', {
  host: '172.19.0.63',
  port: 1521,
  sid: 'desenv20',
  user: process.env.ORACLE_USER ? 'PRESENTE' : 'AUSENTE'
});
    
    await connection.close();
  } catch (err) {
    console.error('❌ Erro de conexão:', err);
    console.error('Detalhes do erro:', {
      code: err.code,
      message: err.message,
      stack: err.stack
    });
  }
}

testarConexao();