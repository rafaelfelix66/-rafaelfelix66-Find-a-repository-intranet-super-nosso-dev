// services/oracleService.js
const oracledb = require('oracledb');
const fs = require('fs');
const path = require('path');
const { User } = require('../models');

// Caminho para o arquivo de backup
const BACKUP_FILE_PATH = path.join(__dirname, '../data/usuarios_backup.json');

// Garantir que o diretório de backup exista
const backupDir = path.dirname(BACKUP_FILE_PATH);
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`Diretório para backup criado: ${backupDir}`);
}

// Criar arquivo de backup inicial se não existir
if (!fs.existsSync(BACKUP_FILE_PATH)) {
  console.log('Arquivo de backup não encontrado, criando um novo...');
  const dadosIniciais = [
    {
      "NOME": "RAFAEL ALMEIDA FELIX",
      "CPF": "11027478662",
      "FUNCAO": "A CLASSIFICAR",
      "SETOR": "A CLASSIFICAR"
    }
  ];
  fs.writeFileSync(BACKUP_FILE_PATH, JSON.stringify(dadosIniciais, null, 2), 'utf8');
  console.log('Arquivo de backup criado com sucesso');
}

// Inicialização do Oracle - melhorar configuração
oracledb.initOracleClient({ libDir: process.env.ORACLE_CLIENT_PATH }); // Opcional, comentar se não necessário
oracledb.autoCommit = true;
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// Configuração da conexão Oracle com timeout aumentado
const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECTION_STRING,
  poolTimeout: 60, // Aumento do timeout para 60 segundos
  poolMin: 0,
  poolMax: 5,
  poolIncrement: 1,
  queueTimeout: 60000, // 60 segundos de timeout na fila
  poolPingInterval: 60 // ping a cada 60 segundos
};

// Função para verificar CPF no Oracle
async function verificarCpfOracle(cpf) {
  let connection;
  console.log(`Verificando CPF ${cpf} no Oracle...`);
  
  try {
    // Tentar apenas se as variáveis de ambiente estiverem configuradas
    if (!process.env.ORACLE_USER || !process.env.ORACLE_PASSWORD || !process.env.ORACLE_CONNECTION_STRING) {
      console.log('Variáveis de ambiente Oracle não configuradas, usando modo de simulação');
      throw new Error('Configuração Oracle incompleta');
    }

    console.log('Tentando conexão Oracle com as credenciais configuradas');
    
    try {
      // Estabelecendo conexão com timeout reduzido
      connection = await oracledb.getConnection({
        ...dbConfig,
        connectTimeout: 15000 // 15 segundos de timeout para conexão
      });
      
      // Consulta SQL para buscar usuário pelo CPF
      const query = `
        SELECT NOME, CPF, FUNCAO, SETOR 
        FROM CONSINCO.STAV_LOG_INTR 
        WHERE CPF = :cpf
      `;
      
      console.log('Executando consulta Oracle:', query.replace(/\s+/g, ' ').trim());
      
      const result = await connection.execute(
        query,
        { cpf },
        { maxRows: 1 }
      );
      
      // Se encontrou o usuário
      if (result.rows && result.rows.length > 0) {
        console.log('Usuário encontrado no Oracle:', result.rows[0].NOME);
        return {
          success: true,
          data: result.rows[0]
        };
      }
      
      console.log(`CPF ${cpf} não encontrado no Oracle`);
      return { success: false, msg: 'CPF não encontrado na base Oracle' };
      
    } catch (err) {
      // Erro específico de conexão ou consulta
      console.error('Erro na operação Oracle:', err);
      throw err;
    }
    
  } catch (error) {
    console.error('Erro ao consultar Oracle:', error);
    console.log('Caindo para o backup devido a erro na consulta Oracle');
    return verificarCpfNoBackup(cpf);
    
  } finally {
    // Fechar conexão se estiver aberta
    if (connection) {
      try {
        await connection.close();
        console.log('Conexão Oracle fechada com sucesso');
      } catch (err) {
        console.error('Erro ao fechar conexão Oracle:', err);
      }
    }
  }
}

// Função para verificar CPF no arquivo de backup
async function verificarCpfNoBackup(cpf) {
  console.log('Tentando buscar usuário no arquivo de backup...');
  
  try {
    // Verificar se o arquivo de backup existe
    if (!fs.existsSync(BACKUP_FILE_PATH)) {
      console.log('Arquivo de backup não encontrado, criando um novo...');
      const dadosIniciais = [
        {
          "NOME": "RAFAEL ALMEIDA FELIX",
          "CPF": "11027478662",
          "FUNCAO": "A CLASSIFICAR",
          "SETOR": "A CLASSIFICAR"
        }
      ];
      fs.writeFileSync(BACKUP_FILE_PATH, JSON.stringify(dadosIniciais, null, 2), 'utf8');
      console.log('Arquivo de backup criado com sucesso');
    }
    
    // Ler arquivo de backup
    const backupData = JSON.parse(fs.readFileSync(BACKUP_FILE_PATH, 'utf8'));
    
    // Buscar usuário no backup
    const usuario = backupData.find(user => user.CPF === cpf);
    
    if (usuario) {
      console.log('Usuário encontrado no backup:', usuario.NOME);
      return {
        success: true,
        data: usuario,
        source: 'backup'
      };
    }
    
    console.log(`CPF ${cpf} não encontrado no backup`);
    return { success: false, msg: 'CPF não encontrado no arquivo de backup' };
    
  } catch (error) {
    console.error('Erro ao buscar no backup:', error);
    return { success: false, msg: 'Erro ao consultar arquivo de backup', error };
  }
}

// Função para sincronizar todos os usuários (executada pelo job semanal)
async function sincronizarUsuarios() {
  let connection;
  
  try {
    console.log('Iniciando sincronização de usuários com Oracle...');
    
    // Verificar configuração
    if (!process.env.ORACLE_USER || !process.env.ORACLE_PASSWORD || !process.env.ORACLE_CONNECTION_STRING) {
      console.log('Variáveis de ambiente Oracle não configuradas, usando modo de simulação');
      throw new Error('Configuração Oracle incompleta');
    }
    
    // Conectar ao Oracle com retry
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        connection = await oracledb.getConnection(dbConfig);
        break; // Sai do loop se conectar com sucesso
      } catch (err) {
        attempts++;
        console.error(`Tentativa ${attempts}/${maxAttempts} falhou:`, err.message);
        
        if (attempts >= maxAttempts) {
          throw new Error(`Falha após ${maxAttempts} tentativas: ${err.message}`);
        }
        
        // Esperar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    // Consulta SQL para buscar todos os usuários
    const query = `SELECT NOME, CPF, FUNCAO, SETOR FROM CONSINCO.STAV_LOG_INTR`;
    console.log('Executando consulta Oracle:', query);
    
    const result = await connection.execute(
      query,
      {},
      { prefetchRows: 1000 } // Otimização para grande volume de dados
    );
    
    if (!result.rows || result.rows.length === 0) {
      console.warn('Nenhum dado retornado do Oracle');
      return { success: false, message: 'Nenhum dado retornado' };
    }
    
    console.log(`Recebidos ${result.rows.length} registros do Oracle`);
    
    // Salvar dados no arquivo de backup
    fs.writeFileSync(BACKUP_FILE_PATH, JSON.stringify(result.rows, null, 2), 'utf8');
    console.log('Arquivo de backup atualizado com sucesso');
    
    // Array para armazenar CPFs ativos
    const cpfsAtivos = result.rows.map(row => row.CPF);
    
    // Atualizar usuários existentes e criar novos
    let usuariosProcessados = 0;
    for (const row of result.rows) {
      const resultado = await atualizarOuCriarUsuario(row);
      if (resultado.success) {
        usuariosProcessados++;
      }
    }
    
    // Inativar usuários que não estão na consulta
    const resultadoInativacao = await inativarUsuariosNaoListados(cpfsAtivos);
    
    return {
      success: true,
      count: result.rows.length,
      processados: usuariosProcessados,
      inativados: resultadoInativacao.count || 0
    };
    
  } catch (error) {
    console.error('Erro na sincronização de usuários:', error);
    
    // Se falhar, tenta usar backup
    try {
      if (fs.existsSync(BACKUP_FILE_PATH)) {
        const backupData = JSON.parse(fs.readFileSync(BACKUP_FILE_PATH, 'utf8'));
        console.log(`Usando backup com ${backupData.length} registros`);
        
        // Processar dados do backup
        const cpfsAtivos = backupData.map(row => row.CPF);
        
        let usuariosProcessados = 0;
        for (const row of backupData) {
          const resultado = await atualizarOuCriarUsuario(row);
          if (resultado.success) {
            usuariosProcessados++;
          }
        }
        
        return {
          success: true,
          source: 'backup',
          count: backupData.length,
          processados: usuariosProcessados
        };
      }
    } catch (backupError) {
      console.error('Erro ao usar backup:', backupError);
    }
    
    return { success: false, error };
    
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('Conexão Oracle fechada com sucesso');
      } catch (err) {
        console.error('Erro ao fechar conexão Oracle:', err);
      }
    }
  }
}

// Função para atualizar ou criar usuário baseado nos dados Oracle
async function atualizarOuCriarUsuario(dados) {
  try {
    // Normalizar dados
    const userData = {
      nome: dados.NOME,
      cpf: dados.CPF,
      cargo: dados.FUNCAO,
      departamento: dados.SETOR,
      ativo: true,
      ultimaSincronizacao: new Date()
    };
    
    // Verificar se usuário já existe
    const usuarioExistente = await User.findOne({ cpf: dados.CPF });
    
    if (usuarioExistente) {
      // Atualizar usuário existente
      await User.findByIdAndUpdate(usuarioExistente._id, {
        $set: userData
      });
      
      console.log(`Usuário atualizado: ${dados.NOME} (${dados.CPF})`);
      
    } else {
      // Criar novo usuário com senha padrão (últimos 6 dígitos do CPF)
      const senhaInicial = dados.CPF.slice(-6);
      
// Usar bcrypt para hash da senha
const salt = await bcrypt.genSalt(10);
const senhaHash = await bcrypt.hash(senhaInicial, salt);

const novoUsuario = new User({
  ...userData,
  email: `${dados.CPF}@supernosso.intranet`,
  password: senhaHash, // Usar a senha hasheada
  roles: ['user']
});
      
      await novoUsuario.save();
      console.log(`Novo usuário criado: ${dados.NOME} (${dados.CPF})`);
    }
    
    return { success: true };
    
  } catch (error) {
    console.error(`Erro ao processar usuário ${dados.CPF}:`, error);
    return { success: false, error };
  }
}

// Função para inativar usuários que não estão na lista de CPFs ativos
async function inativarUsuariosNaoListados(cpfsAtivos) {
  try {
    // Buscar todos os usuários ativos que não estão na lista
    const resultado = await User.updateMany(
      { 
        cpf: { $nin: cpfsAtivos },
        ativo: true 
      },
      { 
        $set: { ativo: false } 
      }
    );
    
    console.log(`${resultado.modifiedCount} usuários foram inativados`);
    return { success: true, count: resultado.modifiedCount };
    
  } catch (error) {
    console.error('Erro ao inativar usuários:', error);
    return { success: false, error };
  }
}

module.exports = {
  verificarCpfOracle,
  verificarCpfNoBackup,
  sincronizarUsuarios,
  atualizarOuCriarUsuario
};