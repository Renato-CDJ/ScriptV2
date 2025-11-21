# Guia de Migração para Firebase

## Visão Geral

Este documento descreve como migrar seus dados de armazenamento local (localStorage) para Firebase Firestore. A migração é segura, testada e pode ser revertida se necessário.

## Pré-requisitos

- Firebase projeto já configurado (`lib/firebase.ts`)
- Credenciais do Firebase com permissão de escrita
- Conexão estável com a internet
- Backup de seus dados (opcional, mas recomendado)

## Dados Que Serão Migrados

A migração transfere automaticamente **12 tipos de dados**:

1. **Usuários** (users) - Contas de admin e operadores
2. **Produtos** (products) - Produtos de call center
3. **Passos de Script** (script_steps) - Conteúdo dos scripts
4. **Tabulações** (tabulations) - Códigos de resultado de chamadas
5. **Situações** (situations) - Orientações e procedimentos
6. **Canais** (channels) - Canais de atendimento
7. **Mensagens** (messages) - Mensagens administrativas
8. **Quizzes** (quizzes) - Questionários de treinamento
9. **Tentativas de Quiz** (quiz_attempts) - Respostas dos operadores
10. **Mensagens de Chat** (chat_messages) - Chat interno
11. **Apresentações** (presentations) - Treinamentos em slides
12. **Notas** (notes) - Anotações de usuários

## Como Executar a Migração

### Passo 1: Acesse o Painel de Admin

1. Faça login como administrador (usuário "admin")
2. Navegue até **Configurações** → **Integração Firebase**

### Passo 2: Inicie a Migração

1. Clique no botão **"Iniciar Migração para Firebase"**
2. Leia os avisos cuidadosamente
3. Confirme que deseja prosseguir

### Passo 3: Aguarde Conclusão

- A migração pode levar alguns minutos dependendo do volume de dados
- NÃO feche a janela durante o processo
- Você verá um resumo detalhado ao final com quantidades migradas

### Passo 4: Verifique o Resultado

Após a migração:
- Verá um diálogo de sucesso com estatísticas
- Seus dados estarão disponíveis no Firebase Firestore
- O localStorage continuará funcionando como backup

## Verificação de Dados

### Via Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto "scriptv2-f0f7f"
3. Vá para **Firestore Database**
4. Verifique as seguintes coleções:
   - `users` - Deve conter seus usuários admin
   - `products` - Deve conter produtos do call center
   - `script_steps` - Deve conter todos os passos do script
   - `tabulations` - Deve conter tabulações
   - `situations` - Deve conter situações
   - `channels` - Deve conter canais
   - `messages` - Deve conter mensagens
   - `quizzes` - Deve conter quizzes
   - `quiz_attempts` - Deve conter tentativas
   - `chat_messages` - Deve conter chat
   - `presentations` - Deve conter apresentações
   - `notes` - Deve conter notas

### Via Aplicação

1. Após a migração, seus dados continuam acessíveis na aplicação
2. Crie novos dados e verifique se aparecem no Firebase
3. Teste funcionalidades como criar quizzes, mensagens e apresentações

## Estrutura de Dados no Firebase

### Exemplo: Documento de Usuário

\`\`\`json
{
  "id": "1",
  "username": "admin",
  "fullName": "Administrador Sistema",
  "role": "admin",
  "isOnline": true,
  "createdAt": "2024-11-18T10:30:00Z",
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
    "settings": true
  }
}
\`\`\`

### Exemplo: Documento de Produto

\`\`\`json
{
  "id": "prod-habitacional",
  "name": "Habitacional",
  "scriptId": "step-001",
  "category": "habitacional",
  "isActive": true,
  "createdAt": "2024-11-18T10:30:00Z"
}
\`\`\`

## Recuperação e Backup

### Backup Automático do Firebase

Firebase fornece backup automático de todos os dados. Para criar um backup manual:

1. No Firebase Console, vá para **Firestore** → **Dados Detalhados**
2. Clique em **Exportar Coleção** para qualquer coleção
3. Escolha o local de armazenamento (Cloud Storage)

### Se Algo der Errado

1. **Dados não apareceram?**
   - Verifique se o Firebase está configurado corretamente
   - Verifique permissões de Firestore (regras de segurança)
   - Tente novamente - a migração é idempotente

2. **Precisa reverter?**
   - Os dados em localStorage não foram apagados
   - Sua aplicação continuará funcionando com dados locais
   - Você pode executar a migração novamente

## Sincronização Contínua

Após a migração inicial, você pode ativar sincronização automática:

\`\`\`typescript
import { syncDataToFirebaseIfNeeded } from "@/lib/store"

// Execute periodicamente (ex: ao iniciar a aplicação)
await syncDataToFirebaseIfNeeded()
\`\`\`

## Próximos Passos

### 1. Validar Segurança (Firestore Rules)

Atualize as regras de segurança do Firestore em produção:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId || 
                         request.auth.token.role == 'admin';
    }
    
    match /products/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'admin';
    }
    
    match /script_steps/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'admin';
    }
    
    match /{document=**} {
      allow read, write: if request.auth.token.role == 'admin';
    }
  }
}
\`\`\`

### 2. Atualizar Aplicação para Usar Firebase

Gradualmente adapte sua aplicação para:
- Ler dados do Firebase em tempo real
- Usar Firebase Authentication ao invés de localStorage
- Implementar sincronização em tempo real

### 3. Monitorar Performance

Use Firebase Console para monitorar:
- Número de operações de leitura/escrita
- Tamanho total do banco de dados
- Custos de uso

## Troubleshooting

### Erro: "Firebase não está inicializado"

**Solução:** Verifique que `lib/firebase.ts` tem as credenciais corretas

### Erro: "Permissão negada" ao migrar

**Solução:** Verifique as regras de Firestore:
\`\`\`javascript
match /{document=**} {
  allow read, write: if true; // Temporário durante desenvolvimento
}
\`\`\`

### Migração lenta

**Solução:** 
- Verifique sua conexão com internet
- Se tiver muitos dados (>10k registros), isso é normal
- Pode levar 5-10 minutos

### Dados duplicados após segunda migração

**Solução:**
- A migração é idempotente (não cria duplicatas)
- Se vir duplicatas, é porque novos dados foram adicionados entre migrações
- Isso é comportamento esperado

## Suporte

Se encontrar problemas:

1. Verifique este guia novamente
2. Consulte [Documentação do Firebase](https://firebase.google.com/docs)
3. Abra um issue no seu repositório com detalhes do erro

---

**Última atualização:** 18 de Novembro de 2024
**Versão:** 1.0
