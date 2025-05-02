const mongoose = require('mongoose');

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/intranet', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Conectado ao MongoDB');
  
  // Carregar o modelo Post
  try {
    // Carregar o schema do Post
    const PostSchema = new mongoose.Schema({
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      text: {
        type: String,
        default: ""
      },
      targetAudience: {
        type: String,
        enum: ['TODOS', 'A CLASSIFICAR', 'ADMINISTRATIVA', 'ADMINISTRATIVO', 'LIDERANÇA', 'OPERACIONAL'],
        default: 'TODOS'
      },
      // Outros campos...
    });
    
    // Registrar o modelo
    const Post = mongoose.model('Post', PostSchema);
    
    // Criar um post de teste
    const testPost = new Post({
      text: 'Teste do modelo',
      user: '6812440767dfced299ee07c2' // Seu ID de usuário
    });
    
    console.log('Post de teste:');
    console.log('targetAudience =', testPost.targetAudience);
    
    // Consultar um post existente
    return Post.findOne().lean()
      .then(post => {
        console.log('\nPost existente do banco:');
        console.log(post);
      });
  } catch (err) {
    console.error('Erro ao manipular o modelo:', err);
  }
})
.catch(err => {
  console.error('Erro de conexão:', err);
})
.finally(() => {
  // Encerrar após 2 segundos
  setTimeout(() => {
    mongoose.disconnect();
    console.log('Desconectado do MongoDB');
  }, 2000);
});