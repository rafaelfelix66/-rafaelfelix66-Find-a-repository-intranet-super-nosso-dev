// test-oracle-23c-connection.js
// Teste de conexão Oracle Client 23c com Oracle Database 19c
const path = require('path');
const dotenv = require('dotenv');
const oracledb = require('oracledb');

dotenv.config({ path: path.resolve(__dirname, '.env') });

// Configurar Oracle Client 23c
console.log('🚀 Configurando Oracle Client 23c para Oracle Database 19c...');

try {
  oracledb.initOracleClient({
    libDir: '/opt/oracle/instantclient_23_8'
  });
  console.log('✅ Oracle Client 23c inicializado com sucesso\n');
} catch (err) {
  console.error('❌ Erro ao inicializar Oracle Client:', err.message);
  console.log('💡 Verifique se o Oracle Client está em /opt/oracle/instantclient_23_8');
  process.exit(1);
}

async function testarConexaoOracle() {
  console.log('🔗 Testando conexões com Oracle Database 19c (19.26.0.0.0)...\n');

  // Configurações de conexão para testar
  const connectionConfigs = [
    {
      name: 'Configuração do .env (TNS com SID)',
      config: {
        user: process.env.ORACLE_USER,
        password: process.env.ORACLE_PASSWORD,
        connectString: process.env.ORACLE_CONNECTION_STRING
      }
    },
    {
      name: 'TNS Format com SID (explícito)',
      config: {
        user: process.env.ORACLE_USER,
        password: process.env.ORACLE_PASSWORD,
        connectString: `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=172.19.0.63)(PORT=1521))(CONNECT_DATA=(SID=desenv20)))`
      }
    },
    {
      name: 'TNS Format com SERVICE_NAME',
      config: {
        user: process.env.ORACLE_USER,
        password: process.env.ORACLE_PASSWORD,
        connectString: `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=172.19.0.63)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=desenv20)))`
      }
    },
    {
      name: 'TNS Format com SERVICE_NAME (maiúsculo)',
      config: {
        user: process.env.ORACLE_USER,
        password: process.env.ORACLE_PASSWORD,
        connectString: `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=172.19.0.63)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=DESENV20)))`
      }
    },
    {
      name: 'Easy Connect com SID',
      config: {
        user: process.env.ORACLE_USER,
        password: process.env.ORACLE_PASSWORD,
        connectString: '172.19.0.63:1521/desenv20'
      }
    },
    {
      name: 'Easy Connect com SERVICE_NAME',
      config: {
        user: process.env.ORACLE_USER,
        password: process.env.ORACLE_PASSWORD,
        connectString: '172.19.0.63:1521/DESENV20'
      }
    }
  ];

  let connection;
  let workingConfig = null;

  // Testar cada configuração
  for (const { name, config } of connectionConfigs) {
    console.log(`🔍 Testando: ${name}`);
    console.log(`   Connection: ${config.connectString}`);
    console.log(`   User: ${config.user}`);
    
    try {
      connection = await oracledb.getConnection(config);
      console.log('✅ SUCESSO! Conexão estabelecida\n');
      workingConfig = { name, config };
      break;
    } catch (err) {
      console.log(`❌ Falha: ${err.message}`);
      if (err.code) {
        console.log(`   Código Oracle: ${err.code}`);
      }
      console.log();
    }
  }

  if (!connection) {
    console.log('❌ TODAS AS TENTATIVAS DE CONEXÃO FALHARAM');
    console.log('\n🔍 Diagnósticos sugeridos:');
    console.log('1. Verificar se o Oracle Database está executando:');
    console.log('   - Conecte-se diretamente ao servidor Oracle');
    console.log('   - Execute: SELECT STATUS FROM V$INSTANCE;');
    console.log('\n2. Verificar conectividade de rede:');
    console.log('   telnet 172.19.0.63 1521');
    console.log('\n3. Verificar listener Oracle:');
    console.log('   lsnrctl status');
    console.log('\n4. Verificar credenciais:');
    console.log(`   Usuário: ${process.env.ORACLE_USER}`);
    console.log('   Senha: [OCULTA]');
    return;
  }

  try {
    console.log('🎯 CONEXÃO ESTABELECIDA! Executando testes...\n');
    
    // Teste 1: Informações básicas do Oracle Database
    console.log('1️⃣ Informações do Oracle Database:');
    const dbInfo = await connection.execute(`
      SELECT 
        BANNER as version_info,
        SYS_CONTEXT('USERENV', 'DB_NAME') as database_name,
        SYS_CONTEXT('USERENV', 'INSTANCE_NAME') as instance_name,
        SYS_CONTEXT('USERENV', 'SERVER_HOST') as server_host,
        SYS_CONTEXT('USERENV', 'SERVICE_NAME') as service_name,
        SYS_CONTEXT('USERENV', 'DATABASE_ROLE') as database_role,
        SYS_CONTEXT('USERENV', 'CON_NAME') as container_name
      FROM V$VERSION 
      WHERE BANNER LIKE 'Oracle Database%'
    `);
    
    if (dbInfo.rows.length > 0) {
      const [version, dbName, instanceName, serverHost, serviceName, dbRole, containerName] = dbInfo.rows[0];
      console.log(`   📋 Versão: ${version}`);
      console.log(`   🏛️ Database: ${dbName}`);
      console.log(`   ⚙️ Instance: ${instanceName}`);
      console.log(`   🖥️ Host: ${serverHost}`);
      console.log(`   🔗 Service: ${serviceName}`);
      console.log(`   👑 Role: ${dbRole}`);
      console.log(`   📦 Container: ${containerName || 'N/A'}`);
    }

    // Teste 2: Compatibilidade Oracle Client 23c com Database 19c
    console.log('\n2️⃣ Verificando compatibilidade Cliente 23c -> Database 19c:');
    try {
      const compatInfo = await connection.execute(`
        SELECT 
          CLIENT_DRIVER,
          CLIENT_VERSION,
          CLIENT_CHARSET,
          CLIENT_PROGRAM_NAME,
          CLIENT_MACHINE,
          CLIENT_OS_USER
        FROM V$SESSION_CONNECT_INFO 
        WHERE SID = SYS_CONTEXT('USERENV', 'SID')
      `);
      
      if (compatInfo.rows.length > 0) {
        compatInfo.rows.forEach(([driver, version, charset, program, machine, osUser]) => {
          if (driver) console.log(`   🔌 Driver: ${driver}`);
          if (version) console.log(`   📊 Client Version: ${version}`);
          if (charset) console.log(`   🔤 Charset: ${charset}`);
          if (program) console.log(`   💻 Program: ${program}`);
          if (machine) console.log(`   🖥️ Machine: ${machine}`);
          if (osUser) console.log(`   👤 OS User: ${osUser}`);
        });
      }
    } catch (compatErr) {
      console.log(`   ⚠️ Não foi possível obter info de compatibilidade: ${compatErr.message}`);
    }

    // Teste 3: Verificar acesso à tabela específica
    console.log('\n3️⃣ Testando acesso à tabela CONSINCO.STAV_LOG_INTR:');
    try {
      const tableTest = await connection.execute(`
        SELECT COUNT(*) as total_records 
        FROM CONSINCO.STAV_LOG_INTR 
        WHERE ROWNUM <= 10
      `);
      
      const totalRecords = tableTest.rows[0][0];
      console.log(`   ✅ Tabela acessível - Total de registros (amostra): ${totalRecords}`);
      
      if (totalRecords > 0) {
        // Testar consulta de exemplo
        const sampleData = await connection.execute(`
          SELECT NOME, CPF, FUNCAO, SETOR, DATAADMISSAO, DTNASCIMENTO
          FROM CONSINCO.STAV_LOG_INTR 
          WHERE ROWNUM <= 2
        `);
        
        console.log('   📄 Dados de exemplo:');
        sampleData.rows.forEach((row, index) => {
          const [nome, cpf, funcao, setor, dataAdm, dataNasc] = row;
          console.log(`      ${index + 1}. ${nome} - CPF: ${cpf} - ${funcao} - ${setor}`);
          console.log(`         Admissão: ${dataAdm} | Nascimento: ${dataNasc}`);
        });
      }
      
    } catch (tableErr) {
      console.log(`   ❌ Erro ao acessar tabela: ${tableErr.message}`);
      console.log('   💡 Verifique:');
      console.log('      - Permissões do usuário no schema CONSINCO');
      console.log('      - Se a tabela STAV_LOG_INTR existe');
      console.log('      - Se o usuário tem SELECT grants');
    }

    // Teste 4: Configurações importantes do banco
    console.log('\n4️⃣ Configurações importantes do Oracle:');
    try {
      const configInfo = await connection.execute(`
        SELECT NAME, VALUE 
        FROM V$PARAMETER 
        WHERE NAME IN (
          'service_names', 
          'db_name', 
          'instance_name',
          'compatible',
          'db_unique_name',
          'open_cursors',
          'processes',
          'sessions'
        )
        ORDER BY NAME
      `);
      
      configInfo.rows.forEach(([name, value]) => {
        console.log(`   ⚙️ ${name}: ${value}`);
      });
    } catch (configErr) {
      console.log(`   ⚠️ Erro ao obter configurações: ${configErr.message}`);
    }

    // Teste 5: Performance e limites
    console.log('\n5️⃣ Status de performance:');
    try {
      const perfInfo = await connection.execute(`
        SELECT 
          'Sessions' as metric, 
          CURRENT_UTILIZATION as current_value,
          MAX_UTILIZATION as max_value,
          LIMIT_VALUE as limit_value
        FROM V$RESOURCE_LIMIT 
        WHERE RESOURCE_NAME = 'sessions'
        UNION ALL
        SELECT 
          'Processes' as metric,
          CURRENT_UTILIZATION,
          MAX_UTILIZATION,
          LIMIT_VALUE
        FROM V$RESOURCE_LIMIT 
        WHERE RESOURCE_NAME = 'processes'
      `);
      
      perfInfo.rows.forEach(([metric, current, max, limit]) => {
        console.log(`   📊 ${metric}: ${current}/${limit} (máximo: ${max})`);
      });
    } catch (perfErr) {
      console.log(`   ⚠️ Info de performance não disponível: ${perfErr.message}`);
    }

    console.log('\n🎉 TODOS OS TESTES CONCLUÍDOS COM SUCESSO!');
    console.log('=' .repeat(60));
    console.log(`\n✅ Configuração funcional encontrada:`);
    console.log(`📝 Método: ${workingConfig.name}`);
    console.log(`🔗 Connection String: ${workingConfig.config.connectString}`);
    
    console.log('\n📋 Para seu arquivo .env:');
    console.log(`ORACLE_CLIENT_PATH=/opt/oracle/instantclient_23_8`);
    console.log(`ORACLE_CONNECTION_STRING=${workingConfig.config.connectString}`);
    
    console.log('\n🐳 Para Docker, atualize o Dockerfile com:');
    console.log('ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_23_8:$LD_LIBRARY_PATH');
    console.log('ENV ORACLE_CLIENT_PATH=/opt/oracle/instantclient_23_8');

  } catch (err) {
    console.error('\n❌ Erro durante os testes:', err.message);
    if (err.stack) {
      console.error('Stack trace:', err.stack);
    }
  } finally {
    if (connection) {
      await connection.close();
      console.log('\n🔒 Conexão fechada com sucesso');
    }
  }
}

// Executar teste
testarConexaoOracle()
  .then(() => {
    console.log('\n🎯 Teste de conexão concluído!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 Erro fatal durante o teste:', err.message);
    process.exit(1);
  });