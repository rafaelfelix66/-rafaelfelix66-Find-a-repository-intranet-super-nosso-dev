// backend/scripts/addBirthdayFields.js
// Script para adicionar os novos campos aos usuários existentes

const mongoose = require('mongoose');
const { User } = require('../models');
require('dotenv').config();

async function addBirthdayFields() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado ao MongoDB');
    
    // Atualizar todos os usuários para incluir os novos campos
    const result = await User.updateMany(
      { 
        $or: [
          { chapa: { $exists: false } },
		  { filial: { $exists: false } },
		  { dataNascimento: { $exists: false } },
          { dataAdmissao: { $exists: false } }
        ]
      },
      { 
        $set: { 
		  chapa: null,
          filial: null,
          dataNascimento: null,
          dataAdmissao: null
        } 
      }
    );
    
    console.log(`${result.modifiedCount} usuários atualizados com os novos campos`);
    
    // Exemplo: adicionar datas de teste para alguns usuários (opcional)
    // const users = await User.find().limit(5);
    // for (const user of users) {
    //   user.dataNascimento = new Date(1990, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    //   user.dataAdmissao = new Date(2020, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    //   await user.save();
    //   console.log(`Usuário ${user.nome} atualizado com datas de exemplo`);
    // }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado do MongoDB');
  }
}

// Executar o script
addBirthdayFields();