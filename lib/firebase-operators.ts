import type { User } from "./store"

// Parse CSV file content
export function parseOperatorsCSV(
  csvContent: string,
): Omit<User, "id" | "createdAt" | "isOnline" | "permissions" | "loginSessions">[] {
  const lines = csvContent.trim().split("\n")
  const headers = lines[0].split(",").map((h) => h.trim())

  const operators: Omit<User, "id" | "createdAt" | "isOnline" | "permissions" | "loginSessions">[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim())
    if (values.length < 4) continue

    operators.push({
      username: values[0],
      fullName: values[1],
      password: values[2],
      role: values[3] as "admin" | "operator",
    })
  }

  return operators
}

// Load operators from CSV file in data folder
export async function loadOperatorsFromFile(): Promise<
  Omit<User, "id" | "createdAt" | "isOnline" | "permissions" | "loginSessions">[]
> {
  try {
    const response = await fetch("/data/operators-list.csv")
    if (!response.ok) {
      console.error("[v0] Could not load operators-list.csv")
      return []
    }

    const csvContent = await response.text()
    return parseOperatorsCSV(csvContent)
  } catch (error) {
    console.error("[v0] Error loading operators from CSV:", error)
    return []
  }
}
