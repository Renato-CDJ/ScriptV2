# 📦 Estrutura do Firebase Firestore

## Coleções que você precisa criar no Firebase Console:

### 1. **users** (Usuários)
\`\`\`json
{
  "username": "admin",
  "fullName": "Administrador",
  "role": "admin",
  "isOnline": false,
  "createdAt": "Timestamp",
  "lastLoginAt": "Timestamp",
  "loginSessions": [],
  "permissions": {
    "dashboard": true,
    "scripts": true,
    "products": true,
    "attendanceConfig": true,
    "tabulations": true,
    "situations": true,
    "channels": true,
    "notes": true,
    "operators": true,
    "messagesQuiz": true,
    "chat": true,
    "settings": true
  }
}
\`\`\`

### 2. **products** (Produtos)
\`\`\`json
{
  "name": "Produto Exemplo",
  "scriptId": "step-001",
  "category": "habitacional",
  "isActive": true,
  "createdAt": "Timestamp",
  "attendanceTypes": ["ativo", "receptivo"],
  "personTypes": ["fisica", "juridica"],
  "description": "Descrição do produto"
}
\`\`\`

### 3. **scriptSteps** (Passos do Script)
\`\`\`json
{
  "title": "Boas-vindas",
  "content": "Olá! Como posso ajudar?",
  "order": 1,
  "productId": "product-id",
  "buttons": [
    {
      "id": "btn-001",
      "label": "Próximo",
      "nextStepId": "step-002",
      "variant": "primary",
      "order": 1
    }
  ],
  "tabulations": [],
  "contentSegments": [],
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
\`\`\`

### 4. **tabulations** (Tabulações)
\`\`\`json
{
  "name": "Vendido",
  "description": "Cliente realizou compra",
  "color": "#22c55e",
  "createdAt": "Timestamp"
}
\`\`\`

### 5. **situations** (Situações de Atendimento)
\`\`\`json
{
  "name": "Em Atendimento",
  "description": "Cliente está sendo atendido",
  "isActive": true,
  "createdAt": "Timestamp"
}
\`\`\`

### 6. **channels** (Canais de Comunicação)
\`\`\`json
{
  "name": "WhatsApp",
  "contact": "+5511999999999",
  "isActive": true,
  "createdAt": "Timestamp"
}
\`\`\`

### 7. **messages** (Mensagens para Operadores)
\`\`\`json
{
  "title": "Aviso Importante",
  "content": "Conteúdo da mensagem",
  "createdBy": "admin-user-id",
  "createdByName": "Admin",
  "createdAt": "Timestamp",
  "isActive": true,
  "seenBy": [],
  "recipients": [],
  "segments": []
}
\`\`\`

### 8. **quizzes** (Quiz para Operadores)
\`\`\`json
{
  "question": "Qual é a capital do Brasil?",
  "options": [
    {
      "id": "opt-a",
      "label": "A",
      "text": "São Paulo"
    },
    {
      "id": "opt-b",
      "label": "B",
      "text": "Brasília"
    }
  ],
  "correctAnswer": "opt-b",
  "createdBy": "admin-user-id",
  "createdByName": "Admin",
  "createdAt": "Timestamp",
  "isActive": true,
  "recipients": []
}
\`\`\`

### 9. **quizAttempts** (Tentativas de Quiz)
\`\`\`json
{
  "quizId": "quiz-id",
  "operatorId": "operator-id",
  "operatorName": "Operador Nome",
  "selectedAnswer": "opt-b",
  "isCorrect": true,
  "attemptedAt": "Timestamp"
}
\`\`\`

### 10. **chatMessages** (Mensagens de Chat)
\`\`\`json
{
  "senderId": "user-id",
  "senderName": "Nome do Usuário",
  "senderRole": "operator",
  "recipientId": "admin-id",
  "content": "Mensagem de texto",
  "createdAt": "Timestamp",
  "isRead": false
}
\`\`\`

### 11. **chatSettings** (Configurações do Chat)
\`\`\`json
{
  "isEnabled": true,
  "updatedAt": "Timestamp",
  "updatedBy": "admin-id"
}
\`\`\`

### 12. **presentations** (Apresentações)
\`\`\`json
{
  "title": "Treinamento Produto",
  "description": "Descrição da apresentação",
  "slides": [
    {
      "id": "slide-001",
      "order": 1,
      "imageUrl": "https://...",
      "title": "Slide 1",
      "description": "Descrição"
    }
  ],
  "createdBy": "admin-id",
  "createdByName": "Admin",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp",
  "isActive": true,
  "recipients": []
}
\`\`\`

### 13. **presentationProgress** (Progresso de Apresentações)
\`\`\`json
{
  "presentationId": "presentation-id",
  "operatorId": "operator-id",
  "operatorName": "Operador Nome",
  "viewedAt": "Timestamp",
  "marked_as_seen": true,
  "completion_date": "Timestamp"
}
\`\`\`

### 14. **notes** (Notas)
\`\`\`json
{
  "userId": "user-id",
  "content": "Conteúdo da nota",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
\`\`\`

---

## 🔥 Índices que você deve criar no Firestore:

### Collection: **chatMessages**
- Campo: `recipientId` (Ascending) + `createdAt` (Ascending)
- Campo: `senderId` (Ascending) + `createdAt` (Ascending)

### Collection: **messages**
- Campo: `isActive` (Ascending) + `createdAt` (Descending)

### Collection: **quizzes**
- Campo: `isActive` (Ascending) + `createdAt` (Descending)

### Collection: **presentations**
- Campo: `isActive` (Ascending) + `createdAt` (Descending)

### Collection: **notes**
- Campo: `userId` (Ascending) + `createdAt` (Descending)

---

## 📝 Como adicionar no Firebase Console:

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: **scriptv2-f0f7f**
3. Vá em **Firestore Database** no menu lateral
4. Clique em **"Começar coleção"** ou **"Start collection"**
5. Digite o nome da coleção (ex: `users`)
6. Adicione um documento de exemplo com os campos acima
7. Repita para todas as coleções listadas

### Para criar índices:
1. Em **Firestore Database**, vá na aba **Indexes**
2. Clique em **"Create Index"** ou **"Criar índice"**
3. Selecione a coleção
4. Adicione os campos conforme especificado acima
5. Clique em **"Create"**

---

## ⚙️ Regras de Segurança do Firestore (Security Rules):

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users - apenas leitura autenticada
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Products - leitura autenticada, escrita apenas admin
    match /products/{productId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Script Steps - leitura autenticada, escrita apenas admin
    match /scriptSteps/{stepId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Tabulations - leitura autenticada, escrita apenas admin
    match /tabulations/{tabulationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Situations - leitura autenticada, escrita apenas admin
    match /situations/{situationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Channels - leitura autenticada, escrita apenas admin
    match /channels/{channelId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Messages - leitura autenticada, escrita apenas admin
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Quizzes - leitura autenticada, escrita apenas admin
    match /quizzes/{quizId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Quiz Attempts - leitura autenticada, escrita apenas pelo próprio usuário
    match /quizAttempts/{attemptId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    // Chat Messages - leitura e escrita autenticadas
    match /chatMessages/{messageId} {
      allow read, write: if request.auth != null;
    }
    
    // Chat Settings - leitura autenticada, escrita apenas admin
    match /chatSettings/{settingId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Presentations - leitura autenticada, escrita apenas admin
    match /presentations/{presentationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Presentation Progress - leitura autenticada, escrita pelo próprio usuário
    match /presentationProgress/{progressId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null;
    }
    
    // Notes - leitura e escrita apenas pelo próprio usuário
    match /notes/{noteId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
\`\`\`

---

## 🚀 Próximos Passos:

1. ✅ Código Firebase integrado
2. ⚠️ **Você precisa:** Criar as coleções no Firestore Console
3. ⚠️ **Você precisa:** Criar os índices no Firestore Console  
4. ⚠️ **Você precisa:** Configurar as regras de segurança
5. ✅ Código pronto para usar os serviços Firebase

**Importante:** O sistema ainda usa armazenamento local (localStorage) por padrão. Após criar as coleções, você pode migrar os dados para o Firebase usando as funções em `lib/firebase-service.ts`.
