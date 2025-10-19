import habitacionalData from "@/data/habitacional-script.json"
import type { ScriptStep, ScriptButton } from "./types"

interface JsonButton {
  label: string
  next: string
  primary?: boolean
}

interface JsonStep {
  id: string
  title: string
  body: string
  buttons: JsonButton[]
}

// Tabulation mapping for each screen
const TABULATION_MAP: Record<string, { name: string; description: string }> = {
  hab_nao_conhece: { name: "Número Errado", description: "Contato não conhece o cliente" },
  hab_faleceu: { name: "Cliente Falecido", description: "Informar sobre procedimentos de inventário" },
  hab_recado: { name: "Recado Deixado", description: "Solicitado retorno do cliente" },
  hab_finalizacao_terceiro: { name: "Terceiro - Sem Informação", description: "Terceiro não forneceu informações" },
  hab_nao_confirmou: { name: "Recusa de Identificação", description: "Cliente não confirmou dados" },
  hab_questiona_origem: { name: "Dúvida sobre Empresa", description: "Cliente questionou legitimidade" },
  hab_pagamento_efetuado: { name: "Pagamento Já Realizado", description: "Cliente informou pagamento" },
  hab_fgts_recusa: { name: "Recusa de Negociação", description: "Cliente recusou proposta" },
  hab_pesquisa_satisfacao_recusa: { name: "Finalizado - Recusa", description: "Atendimento finalizado sem acordo" },
  hab_pesquisa_satisfacao_aceite: { name: "Acordo Fechado", description: "Cliente aceitou proposta de pagamento" },
  hab_pesquisa_satisfacao: { name: "Finalizado - Informativo", description: "Atendimento informativo concluído" },
}

interface JsonData {
  marcas?: Record<string, Record<string, JsonStep>>
}

export function loadScriptFromJson(jsonData: JsonData, productName: string): ScriptStep[] {
  if (!jsonData.marcas || !jsonData.marcas[productName]) {
    console.error(`[v0] Product ${productName} not found in JSON`)
    return []
  }

  const marca = jsonData.marcas[productName]
  const steps: ScriptStep[] = []
  let order = 1

  const productId = `prod-${productName.toLowerCase().replace(/\s+/g, "-")}`

  try {
    Object.entries(marca).forEach(([key, value]) => {
      const jsonStep = value as JsonStep

      const buttons: ScriptButton[] = jsonStep.buttons.map((btn, index) => ({
        id: `${jsonStep.id}-btn-${index}`,
        label: btn.label,
        nextStepId: btn.next === "fim" ? null : btn.next,
        variant: btn.primary ? "default" : btn.label.includes("VOLTAR") ? "secondary" : "default",
        order: index + 1,
        primary: btn.primary,
      }))

      const step: ScriptStep = {
        id: jsonStep.id,
        title: jsonStep.title,
        content: jsonStep.body,
        order: order++,
        buttons,
        productId,
        createdAt: new Date(),
        updatedAt: new Date(),
        tabulationInfo: TABULATION_MAP[jsonStep.id]
          ? {
              id: `tab-${jsonStep.id}`,
              ...TABULATION_MAP[jsonStep.id],
            }
          : undefined,
      }

      steps.push(step)
    })

    console.log(`[v0] Loaded ${steps.length} steps for product ${productName}`)
  } catch (error) {
    console.error(`[v0] Error loading script for product ${productName}:`, error)
  }

  return steps
}

export function loadHabitacionalScript(): ScriptStep[] {
  return loadScriptFromJson(habitacionalData, "HABITACIONAL")
}

export function getHabitacionalStartStep(): string {
  return "hab_abordagem"
}
