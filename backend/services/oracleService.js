// services/oracleService.js (simplificado para usar apenas o backup)
const fs = require('fs');
const path = require('path');
const { User } = require('../models');

// Caminho para o arquivo de backup
const BACKUP_FILE_PATH = path.join(__dirname, '../data/usuarios_backup.json');

// Garantir que o diretório de backup exista
const backupDir = path.dirname(BACKUP_FILE_PATH);
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  //console.log(`Diretório para backup criado: ${backupDir}`);
}

// Criar arquivo de backup inicial se não existir
if (!fs.existsSync(BACKUP_FILE_PATH)) {
  //console.log('Arquivo de backup não encontrado, criando um novo...');
  const dadosIniciais = [
    {
      "CHAPA": "PJ",
      "NOME": "RAFAEL ALMEIDA FELIX",
      "CPF": "11027478662",
      "FUNCAO": "A CLASSIFICAR",
      "SETOR": "A CLASSIFICAR",
      "FILIAL": "MATRIZ",
      "DATAADMISSAO": null,
      "DTNASCIMENTO": null
    }
  ];
  fs.writeFileSync(BACKUP_FILE_PATH, JSON.stringify(dadosIniciais, null, 2), 'utf8');
  //console.log('Arquivo de backup criado com sucesso');
}

// Função para verificar CPF no arquivo de backup
async function verificarCpfNoBackup(cpf) {
  //console.log('Buscando usuário no arquivo de backup...');
  
  try {
    // Verificar se o arquivo de backup existe
    if (!fs.existsSync(BACKUP_FILE_PATH)) {
      //console.log('Arquivo de backup não encontrado, criando um novo...');
      const dadosIniciais = [
        {
          "CHAPA": "PJ",
          "NOME": "RAFAEL ALMEIDA FELIX",
          "CPF": "11027478662",
          "FUNCAO": "A CLASSIFICAR",
          "SETOR": "A CLASSIFICAR",
          "FILIAL": "MATRIZ",
          "DATAADMISSAO": null,
          "DTNASCIMENTO": null
        }
      ];
      fs.writeFileSync(BACKUP_FILE_PATH, JSON.stringify(dadosIniciais, null, 2), 'utf8');
      //console.log('Arquivo de backup criado com sucesso');
    }
    
    // Ler arquivo de backup
    const backupData = JSON.parse(fs.readFileSync(BACKUP_FILE_PATH, 'utf8'));
    
    // Buscar usuário no backup
    const usuario = backupData.find(user => user.CPF === cpf);
    
    if (usuario) {
      //console.log('Usuário encontrado no backup:', usuario.NOME);
      return {
        success: true,
        data: usuario,
        source: 'backup'
      };
    }
    
    //console.log(`CPF ${cpf} não encontrado no backup`);
    return { success: false, msg: 'CPF não encontrado no arquivo de backup' };
    
  } catch (error) {
    console.error('Erro ao buscar no backup:', error);
    return { success: false, msg: 'Erro ao consultar arquivo de backup', error };
  }
}

// Função que será chamada pelo controlador (usa apenas o backup)
async function verificarCpfOracle(cpf) {
  //console.log(`Verificando CPF ${cpf} no modo de backup...`);
  return verificarCpfNoBackup(cpf);
}

module.exports = {
  verificarCpfOracle,
  verificarCpfNoBackup,
  // Exportamos funções fictícias para manter compatibilidade
  sincronizarUsuarios: async () => ({ success: true, message: 'Modo de backup ativado' }),
  atualizarOuCriarUsuario: async () => ({ success: true })
};