import { createFirebaseUser } from "./firebase-auth"
import { setDoc, doc, collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { db } from "./firebase"
import type { User } from "./types"

/**
 * Registra o usuário admin do localStorage no Firebase
 * Execute esta função uma vez para migrar o admin para Firebase
 */
export async function setupAdminInFirebase(password: string): Promise<User> {
  try {
    console.log("[v0] Setting up admin user in Firebase...")

    const adminData = {
      username: "admin",
      email: "admin@scriptv2.local", // Email padrão para o admin
      password: password,
      name: "Administrador Sistema",
      role: "admin" as const,
    }

    // Criar usuário no Firebase
    const newUser = await createFirebaseUser(adminData)

    console.log("[v0] Admin user created in Firebase:", newUser.username)
    return newUser
  } catch (error: any) {
    console.error("[v0] Error setting up admin:", error)
    throw error
  }
}

/**
 * Verifica se o admin já existe no Firebase
 */
export async function adminExistsInFirebase(): Promise<boolean> {
  try {
    const usernamesRef = collection(db, "usernames")
    const q = query(usernamesRef, where("username", "==", "admin"))
    const snapshot = await getDocs(q)
    return !snapshot.empty
  } catch (error) {
    console.error("[v0] Error checking admin existence:", error)
    return false
  }
}

/**
 * Lista de credenciais recomendadas para seu admin
 */
export function getAdminSetupInstructions() {
  return {
    username: "admin",
    email: "admin@scriptv2.local",
    fullName: "Administrador Sistema",
    role: "admin",
    instructions: `
      1. Você precisa definir uma SENHA para o admin.
      2. Esta senha será usada para fazer login no Firebase.
      3. Recomendações de senha:
         - Mínimo 6 caracteres
         - Use letras maiúsculas e minúsculas
         - Adicione números e símbolos para maior segurança
         - Exemplo: "Admin@2024!"
      4. Após configurar, você poderá fazer login com:
         - Username: admin (será convertido para email automaticamente)
         - Password: [sua senha]
      5. Ou usar o email diretamente:
         - Email: admin@scriptv2.local
         - Password: [sua senha]
    `,
  }
}
