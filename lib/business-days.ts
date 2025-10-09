// Brazilian national holidays for 2025 (you can extend this list)
const HOLIDAYS_2025 = [
  new Date(2025, 0, 1), // Ano Novo
  new Date(2025, 1, 17), // Carnaval
  new Date(2025, 1, 18), // Carnaval
  new Date(2025, 3, 18), // Sexta-feira Santa
  new Date(2025, 3, 21), // Tiradentes
  new Date(2025, 4, 1), // Dia do Trabalho
  new Date(2025, 5, 19), // Corpus Christi
  new Date(2025, 8, 7), // Independência
  new Date(2025, 9, 12), // Nossa Senhora Aparecida
  new Date(2025, 10, 2), // Finados
  new Date(2025, 10, 15), // Proclamação da República
  new Date(2025, 11, 25), // Natal
]

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday or Saturday
}

export function isHoliday(date: Date): boolean {
  return HOLIDAYS_2025.some(
    (holiday) =>
      holiday.getDate() === date.getDate() &&
      holiday.getMonth() === date.getMonth() &&
      holiday.getFullYear() === date.getFullYear(),
  )
}

export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isHoliday(date)
}

export function addBusinessDays(startDate: Date, businessDays: number): Date {
  const currentDate = new Date(startDate)
  let daysAdded = 0

  while (daysAdded < businessDays) {
    currentDate.setDate(currentDate.getDate() + 1)

    if (isBusinessDay(currentDate)) {
      daysAdded++
    }
  }

  return currentDate
}

export function getMaxPromiseDate(productType: "cartao" | "comercial" | "habitacional"): Date {
  const today = new Date()
  const businessDays = productType === "cartao" ? 7 : 10

  return addBusinessDays(today, businessDays)
}
