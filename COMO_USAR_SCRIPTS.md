# Como Executar os Scripts do Firebase

## 📋 Passo a Passo

### 1️⃣ Primeiro Script (OBRIGATÓRIO)
Execute primeiro para criar toda a estrutura base:

\`\`\`bash
npx tsx scripts/init-firebase.ts
\`\`\`

Isso vai criar:
- ✅ Usuários (admin e operador)
- ✅ Canal WhatsApp
- ✅ Tipos de atendimento
- ✅ Situações
- ✅ Tabulações
- ✅ Scripts
- ✅ Produtos
- ✅ Apresentações
- ✅ Mensagens/Quiz
- ✅ Notas
- ✅ Configurações do sistema

### 2️⃣ Scripts Opcionais
Execute estes se quiser dados de exemplo:

**Criar contatos de exemplo:**
\`\`\`bash
npx tsx scripts/seed-contacts.ts
\`\`\`

**Criar atendimentos de exemplo:**
\`\`\`bash
npx tsx scripts/seed-attendances.ts
\`\`\`

## 🔐 Credenciais Padrão

Após executar o primeiro script, você pode fazer login com:

**Administrador:**
- Usuário: `admin`
- Senha: `admin123`

**Operador:**
- Usuário: `operador`
- Senha: `op123`

⚠️ **IMPORTANTE:** Altere estas senhas antes de usar em produção!

## 🔥 Regras de Segurança do Firebase

Adicione estas regras no Firebase Console (Firestore Database > Rules):

\`\`\`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Função auxiliar para verificar autenticação
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Função para verificar se é admin
    function isAdmin() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Função para verificar se é operador ou admin
    function isOperator() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['operator', 'admin'];
    }
    
    // Users - apenas admin pode criar/editar
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    
    // Channels - apenas admin
    match /channels/{channelId} {
      allow read: if isOperator();
      allow write: if isAdmin();
    }
    
    // Contacts - operadores podem ler/criar, admin pode tudo
    match /contacts/{contactId} {
      allow read, create: if isOperator();
      allow update, delete: if isAdmin();
    }
    
    // Attendances - operadores podem gerenciar seus próprios
    match /attendances/{attendanceId} {
      allow read: if isOperator();
      allow create: if isOperator();
      allow update: if isOperator() && 
                      (resource.data.operatorId == request.auth.uid || isAdmin());
      allow delete: if isAdmin();
    }
    
    // Messages/Chats - operadores podem ler e criar
    match /chats/{chatId} {
      allow read, create: if isOperator();
      allow update, delete: if isAdmin();
    }
    
    // Scripts, Products, Presentations - operadores leem, admin escreve
    match /scripts/{scriptId} {
      allow read: if isOperator();
      allow write: if isAdmin();
    }
    
    match /products/{productId} {
      allow read: if isOperator();
      allow write: if isAdmin();
    }
    
    match /presentations/{presentationId} {
      allow read: if isOperator();
      allow write: if isAdmin();
    }
    
    // Messages/Quiz
    match /messages/{messageId} {
      allow read: if isOperator();
      allow write: if isAdmin();
    }
    
    // Attendance Types
    match /attendanceTypes/{typeId} {
      allow read: if isOperator();
      allow write: if isAdmin();
    }
    
    // Situations
    match /situations/{situationId} {
      allow read: if isOperator();
      allow write: if isAdmin();
    }
    
    // Tabulations
    match /tabulations/{tabulationId} {
      allow read: if isOperator();
      allow write: if isAdmin();
    }
    
    // Notes - usuários podem gerenciar suas próprias
    match /notes/{noteId} {
      allow read: if isOperator();
      allow create: if isOperator();
      allow update, delete: if isOperator() && 
                              (resource.data.userId == request.auth.uid || isAdmin());
    }
    
    // Settings - apenas admin
    match /settings/{settingId} {
      allow read: if isOperator();
      allow write: if isAdmin();
    }
    
    // Analytics - apenas leitura para operadores
    match /analytics/{docId} {
      allow read: if isOperator();
      allow write: if isAdmin();
    }
  }
}
\`\`\`

## 📊 Índices Necessários

O Firebase pode solicitar a criação de índices quando você fizer consultas complexas. Você pode criá-los automaticamente clicando no link que aparece no console quando ocorrer um erro de índice faltando.

## ✅ Verificação

Após executar os scripts, verifique no Firebase Console:
1. Acesse: https://console.firebase.google.com
2. Selecione seu projeto: scriptv2-f0f7f
3. Vá em "Firestore Database"
4. Você deve ver todas as coleções criadas

## 🚀 Próximos Passos

Depois de executar os scripts, você pode:
1. Fazer login no sistema com as credenciais fornecidas
2. Começar a usar o sistema normalmente
3. Os dados de exemplo podem ser deletados ou editados conforme necessário
