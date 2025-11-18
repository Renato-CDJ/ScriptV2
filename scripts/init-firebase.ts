import { initializeApp } from "firebase/app"
import { getFirestore, collection, doc, setDoc, Timestamp } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBH6Zrnkn0SVA2t4-56EJd02mJXRPM66EM",
  authDomain: "scriptv2-f0f7f.firebaseapp.com",
  projectId: "scriptv2-f0f7f",
  storageBucket: "scriptv2-f0f7f.firebasestorage.app",
  messagingSenderId: "565324216652",
  appId: "1:565324216652:web:432748016f06b169b437e9",
  measurementId: "G-TBV385KG5S"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function initializeFirebase() {
  console.log("🔥 Iniciando configuração do Firebase...")

  try {
    // 1. Criar usuário admin padrão
    await setDoc(doc(db, "users", "admin"), {
      username: "admin",
      password: "admin123", // Em produção, use hash de senha!
      role: "admin",
      email: "admin@sistema.com",
      createdAt: Timestamp.now(),
      isActive: true
    })
    console.log("✅ Usuário admin criado")

    // 2. Criar usuário operador exemplo
    await setDoc(doc(db, "users", "operator1"), {
      username: "operador",
      password: "op123",
      role: "operator",
      email: "operador@sistema.com",
      createdAt: Timestamp.now(),
      isActive: true
    })
    console.log("✅ Usuário operador criado")

    // 3. Criar canal exemplo
    const channelId = "channel1"
    await setDoc(doc(db, "channels", channelId), {
      name: "Canal WhatsApp Principal",
      type: "whatsapp",
      status: "active",
      config: {
        phoneNumber: "+5511999999999",
        apiKey: ""
      },
      createdAt: Timestamp.now()
    })
    console.log("✅ Canal criado")

    // 4. Criar tipo de atendimento exemplo
    const attendanceTypeId = "attendance1"
    await setDoc(doc(db, "attendanceTypes", attendanceTypeId), {
      name: "Vendas",
      description: "Atendimento de vendas",
      color: "#10b981",
      icon: "shopping-cart",
      isActive: true,
      createdAt: Timestamp.now()
    })
    console.log("✅ Tipo de atendimento criado")

    // 5. Criar situação exemplo
    const situationId = "situation1"
    await setDoc(doc(db, "situations", situationId), {
      name: "Novo Lead",
      description: "Cliente em primeiro contato",
      color: "#3b82f6",
      order: 1,
      isActive: true,
      createdAt: Timestamp.now()
    })
    console.log("✅ Situação criada")

    // 6. Criar tabulação exemplo
    const tabulationId = "tabulation1"
    await setDoc(doc(db, "tabulations", tabulationId), {
      name: "Venda Realizada",
      category: "success",
      description: "Cliente realizou a compra",
      isActive: true,
      createdAt: Timestamp.now()
    })
    console.log("✅ Tabulação criada")

    // 7. Criar script exemplo
    const scriptId = "script1"
    await setDoc(doc(db, "scripts", scriptId), {
      name: "Script de Boas-vindas",
      description: "Script inicial para novos contatos",
      content: "Olá! Bem-vindo ao nosso atendimento. Como posso ajudá-lo hoje?",
      category: "greeting",
      isActive: true,
      attendanceTypeId: attendanceTypeId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    console.log("✅ Script criado")

    // 8. Criar produto exemplo
    const productId = "product1"
    await setDoc(doc(db, "products", productId), {
      name: "Produto Exemplo",
      description: "Descrição do produto",
      price: 99.90,
      sku: "PROD-001",
      stock: 100,
      isActive: true,
      imageUrl: "/generic-product-display.png",
      createdAt: Timestamp.now()
    })
    console.log("✅ Produto criado")

    // 9. Criar apresentação exemplo
    const presentationId = "presentation1"
    await setDoc(doc(db, "presentations", presentationId), {
      title: "Apresentação de Vendas",
      description: "Material para apresentação de produtos",
      type: "slides",
      content: {
        slides: [
          {
            title: "Bem-vindo",
            content: "Apresentação dos nossos produtos"
          }
        ]
      },
      isActive: true,
      createdAt: Timestamp.now()
    })
    console.log("✅ Apresentação criada")

    // 10. Criar mensagem/quiz exemplo
    const messageId = "message1"
    await setDoc(doc(db, "messages", messageId), {
      type: "quiz",
      title: "Quiz de Qualificação",
      content: "Qual seu interesse principal?",
      options: [
        { id: "1", text: "Comprar produto", value: "buy" },
        { id: "2", text: "Suporte técnico", value: "support" },
        { id: "3", text: "Informações", value: "info" }
      ],
      isActive: true,
      createdAt: Timestamp.now()
    })
    console.log("✅ Mensagem/Quiz criada")

    // 11. Criar nota exemplo
    const noteId = "note1"
    await setDoc(doc(db, "notes", noteId), {
      title: "Nota Importante",
      content: "Lembrete sobre promoção de fim de ano",
      category: "general",
      userId: "admin",
      isImportant: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    console.log("✅ Nota criada")

    // 12. Criar configuração do sistema
    await setDoc(doc(db, "settings", "system"), {
      companyName: "Minha Empresa",
      timezone: "America/Sao_Paulo",
      language: "pt-BR",
      theme: "light",
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      updatedAt: Timestamp.now()
    })
    console.log("✅ Configurações do sistema criadas")

    console.log("\n🎉 Firebase inicializado com sucesso!")
    console.log("\n📝 Credenciais de acesso:")
    console.log("   Admin: admin / admin123")
    console.log("   Operador: operador / op123")
    console.log("\n⚠️  IMPORTANTE: Altere as senhas em produção!")

  } catch (error) {
    console.error("❌ Erro ao inicializar Firebase:", error)
  }
}

initializeFirebase()
