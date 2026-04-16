// Firebase Initialization Script
// Run with: node --env-file-if-exists=/vercel/share/.env.project scripts/seed-firebase.js

import { initializeApp } from "firebase/app"
import { getFirestore, collection, doc, setDoc, getDocs } from "firebase/firestore"
import { getAuth, signInAnonymously } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyC5uxT0E3gkjhxGgMGfwZV2t8NH626nlqg",
  authDomain: "scriptv2-92ba3.firebaseapp.com",
  databaseURL: "https://scriptv2-92ba3-default-rtdb.firebaseio.com",
  projectId: "scriptv2-92ba3",
  storageBucket: "scriptv2-92ba3.firebasestorage.app",
  messagingSenderId: "256429010558",
  appId: "1:256429010558:web:61dc70c135c68849f8722f",
  measurementId: "G-9FWPYCLSR6"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

const COLLECTIONS = {
  USERS: "users",
  SCRIPTS: "scripts",
  PRODUCTS: "products",
  TABULATIONS: "tabulations",
  SITUATIONS: "situations",
  CHANNELS: "channels",
}

function toFirestoreDate(date) {
  return date.toISOString()
}

async function seedUsers() {
  console.log("Seeding users...")
  
  const users = [
    {
      id: "admin",
      username: "admin",
      name: "Administrador",
      email: "admin@sistema.com",
      password: "admin123",
      role: "admin",
      admin_type: "gestao",
      is_active: true,
      is_online: false,
      allowed_tabs: ["scripts", "products", "operators", "tabulations", "situations", "channels", "settings", "messages", "presentations", "access-control", "initial-guide", "feedback", "quality-questions", "result-codes"],
      created_at: toFirestoreDate(new Date()),
      updated_at: toFirestoreDate(new Date()),
    },
    {
      id: "monitoria",
      username: "monitoria",
      name: "Monitoria",
      email: "monitoria@sistema.com",
      password: "monitoria123",
      role: "admin",
      admin_type: "monitoria",
      is_active: true,
      is_online: false,
      allowed_tabs: ["scripts", "products", "operators", "tabulations", "situations", "channels", "messages", "presentations", "feedback", "quality-questions", "result-codes"],
      created_at: toFirestoreDate(new Date()),
      updated_at: toFirestoreDate(new Date()),
    },
    {
      id: "supervisor",
      username: "supervisor",
      name: "Supervisor",
      email: "supervisor@sistema.com",
      password: "supervisor123",
      role: "admin",
      admin_type: "supervisao",
      is_active: true,
      is_online: false,
      allowed_tabs: ["operator-view", "scripts", "products", "operators", "feedback"],
      created_at: toFirestoreDate(new Date()),
      updated_at: toFirestoreDate(new Date()),
    },
    {
      id: "qualidade",
      username: "qualidade",
      name: "Qualidade",
      email: "qualidade@sistema.com",
      password: "qualidade123",
      role: "admin",
      admin_type: "qualidade",
      is_active: true,
      is_online: false,
      allowed_tabs: ["scripts", "products", "operators", "feedback", "quality-questions"],
      created_at: toFirestoreDate(new Date()),
      updated_at: toFirestoreDate(new Date()),
    },
    {
      id: "operador_teste",
      username: "operador",
      name: "Operador Teste",
      email: "operador@sistema.com",
      role: "operator",
      is_active: true,
      is_online: false,
      allowed_tabs: ["dashboard", "scripts", "products", "notes", "chat"],
      created_at: toFirestoreDate(new Date()),
      updated_at: toFirestoreDate(new Date()),
    },
  ]

  for (const user of users) {
    const { id, ...userData } = user
    await setDoc(doc(db, COLLECTIONS.USERS, id), userData)
    console.log(`  Created user: ${user.username}`)
  }
}

async function seedProducts() {
  console.log("Seeding products...")
  
  const products = [
    {
      id: "habitacional",
      name: "HABITACIONAL",
      description: "Produto Habitacional",
      category: "habitacional",
      is_active: true,
      price: 0,
      details: {
        description: "Produto para financiamento habitacional",
        attendanceTypes: ["ativo", "receptivo"],
        personTypes: ["fisica", "juridica"],
        scriptId: "abordagem_habitacional",
      },
      created_at: toFirestoreDate(new Date()),
      updated_at: toFirestoreDate(new Date()),
    },
    {
      id: "comercial",
      name: "COMERCIAL",
      description: "Produto Comercial",
      category: "comercial",
      is_active: true,
      price: 0,
      details: {
        description: "Produto para financiamento comercial",
        attendanceTypes: ["ativo", "receptivo"],
        personTypes: ["fisica", "juridica"],
        scriptId: "abordagem_comercial",
      },
      created_at: toFirestoreDate(new Date()),
      updated_at: toFirestoreDate(new Date()),
    },
  ]

  for (const product of products) {
    const { id, ...productData } = product
    await setDoc(doc(db, COLLECTIONS.PRODUCTS, id), productData)
    console.log(`  Created product: ${product.name}`)
  }
}

async function seedScripts() {
  console.log("Seeding scripts...")
  
  const scripts = [
    {
      id: "abordagem_habitacional",
      title: "Abordagem",
      content: "<p>Olá, <strong>[Operador]</strong>! Este é o script de abordagem para o produto Habitacional.</p><p>Inicie o atendimento cumprimentando o cliente e apresentando-se.</p>",
      product_id: "habitacional",
      product_name: "HABITACIONAL",
      step_order: 1,
      buttons: [
        { id: "btn-1", label: "Cliente Interessado", nextStepId: "proposta_habitacional", order: 0, primary: true },
        { id: "btn-2", label: "Cliente Sem Interesse", nextStepId: "objecao_habitacional", order: 1, primary: false },
        { id: "btn-3", label: "FINALIZAR ATENDIMENTO", nextStepId: null, order: 2, primary: false },
      ],
      tabulations: [],
      is_active: true,
      created_at: toFirestoreDate(new Date()),
      updated_at: toFirestoreDate(new Date()),
    },
    {
      id: "proposta_habitacional",
      title: "Proposta",
      content: "<p>O cliente demonstrou interesse!</p><p>Apresente os benefícios do produto e explique as condições de pagamento.</p>",
      product_id: "habitacional",
      product_name: "HABITACIONAL",
      step_order: 2,
      buttons: [
        { id: "btn-1", label: "Cliente Aceitou", nextStepId: "fechamento_habitacional", order: 0, primary: true },
        { id: "btn-2", label: "Voltar para Abordagem", nextStepId: "abordagem_habitacional", order: 1, primary: false },
        { id: "btn-3", label: "FINALIZAR ATENDIMENTO", nextStepId: null, order: 2, primary: false },
      ],
      tabulations: [],
      is_active: true,
      created_at: toFirestoreDate(new Date()),
      updated_at: toFirestoreDate(new Date()),
    },
    {
      id: "objecao_habitacional",
      title: "Objeção",
      content: "<p>O cliente apresentou objeção.</p><p>Tente contornar a objeção com os seguintes argumentos:</p><ul><li>Taxas competitivas</li><li>Processo simplificado</li><li>Atendimento personalizado</li></ul>",
      product_id: "habitacional",
      product_name: "HABITACIONAL",
      step_order: 3,
      buttons: [
        { id: "btn-1", label: "Cliente Reconsiderou", nextStepId: "proposta_habitacional", order: 0, primary: true },
        { id: "btn-2", label: "Voltar para Abordagem", nextStepId: "abordagem_habitacional", order: 1, primary: false },
        { id: "btn-3", label: "FINALIZAR ATENDIMENTO", nextStepId: null, order: 2, primary: false },
      ],
      tabulations: [],
      is_active: true,
      created_at: toFirestoreDate(new Date()),
      updated_at: toFirestoreDate(new Date()),
    },
    {
      id: "fechamento_habitacional",
      title: "Fechamento",
      content: "<p><strong>Parabéns!</strong> O cliente aceitou a proposta.</p><p>Prossiga com o cadastro e finalização do atendimento.</p>",
      product_id: "habitacional",
      product_name: "HABITACIONAL",
      step_order: 4,
      buttons: [
        { id: "btn-1", label: "FINALIZAR ATENDIMENTO", nextStepId: null, order: 0, primary: true },
      ],
      tabulations: [],
      is_active: true,
      created_at: toFirestoreDate(new Date()),
      updated_at: toFirestoreDate(new Date()),
    },
    {
      id: "abordagem_comercial",
      title: "Abordagem",
      content: "<p>Olá, <strong>[Operador]</strong>! Este é o script de abordagem para o produto Comercial.</p><p>Inicie o atendimento cumprimentando o cliente empresarial.</p>",
      product_id: "comercial",
      product_name: "COMERCIAL",
      step_order: 1,
      buttons: [
        { id: "btn-1", label: "Empresa Interessada", nextStepId: "proposta_comercial", order: 0, primary: true },
        { id: "btn-2", label: "FINALIZAR ATENDIMENTO", nextStepId: null, order: 1, primary: false },
      ],
      tabulations: [],
      is_active: true,
      created_at: toFirestoreDate(new Date()),
      updated_at: toFirestoreDate(new Date()),
    },
    {
      id: "proposta_comercial",
      title: "Proposta Comercial",
      content: "<p>A empresa demonstrou interesse!</p><p>Apresente as soluções comerciais disponíveis.</p>",
      product_id: "comercial",
      product_name: "COMERCIAL",
      step_order: 2,
      buttons: [
        { id: "btn-1", label: "Voltar para Abordagem", nextStepId: "abordagem_comercial", order: 0, primary: false },
        { id: "btn-2", label: "FINALIZAR ATENDIMENTO", nextStepId: null, order: 1, primary: true },
      ],
      tabulations: [],
      is_active: true,
      created_at: toFirestoreDate(new Date()),
      updated_at: toFirestoreDate(new Date()),
    },
  ]

  for (const script of scripts) {
    const { id, ...scriptData } = script
    await setDoc(doc(db, COLLECTIONS.SCRIPTS, id), scriptData)
    console.log(`  Created script: ${script.title} (${script.product_name})`)
  }
}

async function seedTabulations() {
  console.log("Seeding tabulations...")
  
  const tabulations = [
    { id: "tab_venda", name: "Venda Realizada", description: "Venda concluída com sucesso", color: "#22c55e", is_active: true },
    { id: "tab_sem_interesse", name: "Sem Interesse", description: "Cliente sem interesse no produto", color: "#ef4444", is_active: true },
    { id: "tab_callback", name: "Callback", description: "Cliente pediu retorno", color: "#f59e0b", is_active: true },
    { id: "tab_nao_atendeu", name: "Não Atendeu", description: "Ligação não atendida", color: "#6b7280", is_active: true },
  ]

  for (const tab of tabulations) {
    const { id, ...tabData } = tab
    await setDoc(doc(db, COLLECTIONS.TABULATIONS, id), {
      ...tabData,
      created_at: toFirestoreDate(new Date()),
      updated_at: toFirestoreDate(new Date()),
    })
    console.log(`  Created tabulation: ${tab.name}`)
  }
}

async function seedSituations() {
  console.log("Seeding situations...")
  
  const situations = [
    { id: "sit_disponivel", name: "Disponível", description: "Disponível para atendimento", color: "#22c55e", is_active: true },
    { id: "sit_em_ligacao", name: "Em Ligação", description: "Em atendimento telefônico", color: "#3b82f6", is_active: true },
    { id: "sit_pausa", name: "Pausa", description: "Em pausa", color: "#f59e0b", is_active: true },
    { id: "sit_offline", name: "Offline", description: "Desconectado", color: "#6b7280", is_active: true },
  ]

  for (const sit of situations) {
    const { id, ...sitData } = sit
    await setDoc(doc(db, COLLECTIONS.SITUATIONS, id), {
      ...sitData,
      created_at: toFirestoreDate(new Date()),
      updated_at: toFirestoreDate(new Date()),
    })
    console.log(`  Created situation: ${sit.name}`)
  }
}

async function seedChannels() {
  console.log("Seeding channels...")
  
  const channels = [
    { id: "ch_telefone", name: "Telefone", description: "Atendimento telefônico", icon: "phone", is_active: true },
    { id: "ch_chat", name: "Chat", description: "Atendimento via chat", icon: "message-circle", is_active: true },
    { id: "ch_email", name: "E-mail", description: "Atendimento via e-mail", icon: "mail", is_active: true },
    { id: "ch_whatsapp", name: "WhatsApp", description: "Atendimento via WhatsApp", icon: "message-square", is_active: true },
  ]

  for (const ch of channels) {
    const { id, ...chData } = ch
    await setDoc(doc(db, COLLECTIONS.CHANNELS, id), {
      ...chData,
      created_at: toFirestoreDate(new Date()),
      updated_at: toFirestoreDate(new Date()),
    })
    console.log(`  Created channel: ${ch.name}`)
  }
}

async function checkExistingData() {
  const usersRef = collection(db, COLLECTIONS.USERS)
  const snapshot = await getDocs(usersRef)
  return snapshot.docs.length > 0
}

async function main() {
  console.log("========================================")
  console.log("Firebase Seed Script")
  console.log("========================================")
  console.log("")
  
  try {
    // Sign in anonymously first
    console.log("Signing in to Firebase...")
    await signInAnonymously(auth)
    console.log("Signed in successfully!")
    console.log("")
    
    // Check if data already exists
    const hasData = await checkExistingData()
    if (hasData) {
      console.log("Data already exists in Firebase. Skipping seed.")
      console.log("To re-seed, delete the existing data first.")
      process.exit(0)
    }
    
    // Seed all collections
    await seedUsers()
    await seedProducts()
    await seedScripts()
    await seedTabulations()
    await seedSituations()
    await seedChannels()
    
    console.log("")
    console.log("========================================")
    console.log("Seed completed successfully!")
    console.log("========================================")
    console.log("")
    console.log("You can now login with:")
    console.log("  Admin:      admin / admin123")
    console.log("  Monitoria:  monitoria / monitoria123")
    console.log("  Supervisor: supervisor / supervisor123")
    console.log("  Qualidade:  qualidade / qualidade123")
    console.log("  Operador:   operador (no password needed)")
    console.log("")
    
    process.exit(0)
  } catch (error) {
    console.error("Error seeding Firebase:", error)
    process.exit(1)
  }
}

main()
