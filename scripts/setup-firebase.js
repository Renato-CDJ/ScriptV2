import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBH6Zrnkn0SVA2t4-56EJd02mJXRPM66EM",
  authDomain: "scriptv2-f0f7f.firebaseapp.com",
  projectId: "scriptv2-f0f7f",
  storageBucket: "scriptv2-f0f7f.firebasestorage.app",
  messagingSenderId: "565324216652",
  appId: "1:565324216652:web:432748016f06b169b437e9",
  measurementId: "G-TBV385KG5S"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("🚀 Iniciando configuração do Firebase...\n");

// Função auxiliar para criar documento
async function createDoc(collectionName, docId, data) {
  try {
    await setDoc(doc(db, collectionName, docId), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log(`✅ ${collectionName}/${docId} criado`);
  } catch (error) {
    console.error(`❌ Erro ao criar ${collectionName}/${docId}:`, error.message);
  }
}

// 1. Criar Usuários
console.log("\n📦 Criando usuários...");
await createDoc('users', 'admin1', {
  email: 'admin@script.com',
  name: 'Admin Principal',
  role: 'admin',
  active: true
});

await createDoc('users', 'operator1', {
  email: 'operador@script.com',
  name: 'Operador 1',
  role: 'operator',
  active: true,
  channels: ['whatsapp', 'instagram']
});

// 2. Criar Canais
console.log("\n📦 Criando canais...");
await createDoc('channels', 'whatsapp', {
  name: 'WhatsApp',
  type: 'whatsapp',
  enabled: true,
  config: { apiKey: '', webhookUrl: '' }
});

await createDoc('channels', 'instagram', {
  name: 'Instagram',
  type: 'instagram',
  enabled: true,
  config: { accessToken: '', pageId: '' }
});

await createDoc('channels', 'facebook', {
  name: 'Facebook',
  type: 'facebook',
  enabled: false,
  config: {}
});

// 3. Criar Tipos de Atendimento
console.log("\n📦 Criando tipos de atendimento...");
await createDoc('attendanceTypes', 'vendas', {
  name: 'Vendas',
  color: '#10b981',
  active: true,
  order: 1
});

await createDoc('attendanceTypes', 'suporte', {
  name: 'Suporte',
  color: '#3b82f6',
  active: true,
  order: 2
});

await createDoc('attendanceTypes', 'financeiro', {
  name: 'Financeiro',
  color: '#f59e0b',
  active: true,
  order: 3
});

// 4. Criar Tabulações
console.log("\n📦 Criando tabulações...");
await createDoc('tabulations', 'venda-realizada', {
  name: 'Venda Realizada',
  attendanceTypeId: 'vendas',
  active: true
});

await createDoc('tabulations', 'nao-interessado', {
  name: 'Não Interessado',
  attendanceTypeId: 'vendas',
  active: true
});

await createDoc('tabulations', 'problema-resolvido', {
  name: 'Problema Resolvido',
  attendanceTypeId: 'suporte',
  active: true
});

// 5. Criar Situações
console.log("\n📦 Criando situações...");
await createDoc('situations', 'novo', {
  name: 'Novo',
  color: '#3b82f6',
  order: 1
});

await createDoc('situations', 'em-andamento', {
  name: 'Em Andamento',
  color: '#f59e0b',
  order: 2
});

await createDoc('situations', 'finalizado', {
  name: 'Finalizado',
  color: '#10b981',
  order: 3
});

// 6. Criar Produtos
console.log("\n📦 Criando produtos...");
await createDoc('products', 'produto1', {
  name: 'Produto Demo 1',
  description: 'Descrição do produto 1',
  price: 99.90,
  category: 'Eletrônicos',
  stock: 100,
  active: true,
  imageUrl: '/placeholder.svg?height=200&width=200'
});

await createDoc('products', 'produto2', {
  name: 'Produto Demo 2',
  description: 'Descrição do produto 2',
  price: 149.90,
  category: 'Eletrônicos',
  stock: 50,
  active: true,
  imageUrl: '/placeholder.svg?height=200&width=200'
});

// 7. Criar Scripts
console.log("\n📦 Criando scripts...");
await createDoc('scripts', 'script-vendas-1', {
  name: 'Script de Vendas Básico',
  content: 'Olá! Como posso ajudar você hoje?',
  attendanceTypeId: 'vendas',
  active: true
});

// 8. Criar Apresentações
console.log("\n📦 Criando apresentações...");
await createDoc('presentations', 'apresentacao1', {
  title: 'Apresentação de Produto',
  description: 'Slides para apresentação',
  fileUrl: '',
  thumbnailUrl: '/placeholder.svg?height=150&width=200',
  active: true
});

// 9. Criar Configurações do Sistema
console.log("\n📦 Criando configurações...");
await createDoc('settings', 'general', {
  companyName: 'Minha Empresa',
  autoAssign: true,
  maxConcurrentChats: 5,
  workingHours: {
    start: '08:00',
    end: '18:00',
    days: [1, 2, 3, 4, 5]
  }
});

// 10. Criar exemplo de Quiz/Mensagem
console.log("\n📦 Criando mensagens/quiz...");
await createDoc('messagesQuiz', 'quiz1', {
  type: 'message',
  title: 'Mensagem de Boas-vindas',
  content: 'Bem-vindo ao nosso atendimento!',
  active: true
});

console.log("\n\n✨ Configuração concluída com sucesso!");
console.log("📊 Total: 10 coleções criadas no Firestore");
console.log("\n⚠️  PRÓXIMO PASSO:");
console.log("Configure as regras de segurança no Firebase Console");
console.log("Acesse: https://console.firebase.google.com/project/scriptv2-f0f7f/firestore/rules");
