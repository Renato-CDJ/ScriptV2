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

async function seedAttendances() {
  console.log("💬 Criando atendimentos de exemplo...")

  const attendances = [
    {
      id: "attendance1",
      contactId: "contact1",
      operatorId: "operator1",
      attendanceTypeId: "attendance1",
      status: "in_progress",
      startTime: Timestamp.now(),
      channelId: "channel1",
      notes: "Cliente interessado em conhecer os produtos",
      createdAt: Timestamp.now()
    },
    {
      id: "attendance2",
      contactId: "contact2",
      operatorId: "operator1",
      attendanceTypeId: "attendance1",
      status: "completed",
      startTime: Timestamp.fromDate(new Date(Date.now() - 3600000)),
      endTime: Timestamp.now(),
      channelId: "channel1",
      tabulationId: "tabulation1",
      notes: "Venda realizada com sucesso",
      createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000))
    }
  ]

  try {
    for (const attendance of attendances) {
      await setDoc(doc(db, "attendances", attendance.id), attendance)
      console.log(`✅ Atendimento criado: ${attendance.id}`)
    }

    console.log("\n🎉 Atendimentos criados com sucesso!")
  } catch (error) {
    console.error("❌ Erro ao criar atendimentos:", error)
  }
}

seedAttendances()
