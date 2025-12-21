import { DEFAULT_OPERATORS } from "@/data/operators"
import { REGULAR_OPERATORS } from "@/data/regular-operators"
import type { User } from "./store"

// Get all operators from TypeScript files (admins + regular operators)
export function getOperatorsFromFile(): User[] {
  return [...DEFAULT_OPERATORS, ...REGULAR_OPERATORS]
}
