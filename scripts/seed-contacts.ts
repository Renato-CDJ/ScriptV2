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

async function seedContacts() {
  console.log("📞 Criando contatos de exemplo...")

  const contacts = [
    {
      id: "contact1",
      name: "João Silva",
      phone: "+5511987654321",
      email: "joao@email.com",
      tags: ["lead", "interessado"],
      situationId: "situation1",
      channelId: "channel1",
      lastContact: Timestamp.now(),
      createdAt: Timestamp.now()
    },
    {
      id: "contact2",
      name: "Maria Santos",
      phone: "+5511876543210",
      email: "maria@email.com",
      tags: ["cliente"],
      situationId: "situation1",
      channelId: "channel1",
      lastContact: Timestamp.now(),
      createdAt: Timestamp.now()
    },
    {
      id: "contact3",
      name: "Pedro Oliveira",
      phone: "+5511765432109",
      email: "pedro@email.com",
      tags: ["lead"],
      situationId: "situation1",
      channelId: "channel1",
      lastContact: Timestamp.now(),
      createdAt: Timestamp.now()
    }
  ]

  try {
    for (const contact of contacts) {
      await setDoc(doc(db, "contacts", contact.id), contact)
      console.log(`✅ Contato criado: ${contact.name}`)
    }

    console.log("\n🎉 Contatos criados com sucesso!")
  } catch (error) {
    console.error("❌ Erro ao criar contatos:", error)
  }
}

seedContacts()
