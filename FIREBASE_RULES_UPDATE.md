# ⚠️ AÇÃO NECESSÁRIA: Atualizar Regras do Firebase

Você está vendo erros de "Missing or insufficient permissions" porque as regras de segurança do seu banco de dados Firestore precisam ser atualizadas para permitir que o administrador liste todos os usuários.

## Como Corrigir (Passo a Passo)

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Selecione seu projeto
3. No menu lateral esquerdo, clique em **Criação** > **Firestore Database**
4. Clique na aba **Regras** (Rules)
5. **Apague todo o código existente** e cole o código abaixo:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Função auxiliar para verificar se o usuário é admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Coleção de Usuários
    // - Admins podem ler/escrever tudo
    // - Usuários podem ler/editar apenas seu próprio documento
    match /users/{userId} {
      allow read: if request.auth.uid == userId || isAdmin();
      allow list: if isAdmin();
      allow create: if isAdmin();
      allow update: if request.auth.uid == userId || isAdmin();
      allow delete: if isAdmin();
    }

    // Lookup público de usernames (para login)
    match /usernames/{username} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Coleções que apenas Admin pode escrever, mas todos autenticados podem ler
    match /products/{document=**} { allow read: if request.auth != null; allow write: if isAdmin(); }
    match /scriptSteps/{document=**} { allow read: if request.auth != null; allow write: if isAdmin(); }
    match /tabulations/{document=**} { allow read: if request.auth != null; allow write: if isAdmin(); }
    match /situations/{document=**} { allow read: if request.auth != null; allow write: if isAdmin(); }
    match /channels/{document=**} { allow read: if request.auth != null; allow write: if isAdmin(); }
    match /messages/{document=**} { allow read: if request.auth != null; allow write: if isAdmin(); }
    match /quizzes/{document=**} { allow read: if request.auth != null; allow write: if isAdmin(); }
    match /presentations/{document=**} { allow read: if request.auth != null; allow write: if isAdmin(); }

    // Coleções onde usuários também podem escrever
    match /chatMessages/{document=**} { 
      allow read: if request.auth != null; 
      allow write: if request.auth != null; 
    }
    
    match /quizAttempts/{document=**} { 
      allow read: if request.auth != null; 
      allow write: if request.auth != null; 
    }
    
    match /notes/{noteId} { 
      allow read: if request.auth.uid == resource.data.userId || isAdmin();
      allow create: if request.auth.uid != null;
      allow write: if request.auth.uid == resource.data.userId || isAdmin();
    }

    // Bloquear acesso a qualquer outra coisa por padrão
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
\`\`\`

6. Clique em **Publicar** (Publish)

Após fazer isso, recarregue a página do seu admin e o erro desaparecerá.
