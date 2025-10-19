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
const TABULATION_MAP: Record<string, Array<{ name: string; description: string }>> = {
  hab_nao_conhece: [
    {
      name: "DESCONHECIDO",
      description: "Terceiro informa que não conhece ninguém com o nome do cliente no telefone do cadastro.",
    },
  ],
  hab_faleceu: [
    {
      name: "FALECIDO",
      description: "Terceiro informa que o titular faleceu.",
    },
  ],
  hab_recado: [
    {
      name: "RECADO COM TERCEIRO",
      description:
        "Terceiro/cliente informa que a empresa entrou em falência/concordata ou terceiro informa que conhece o cliente, anota o recado ou não, ou terceiro pede para ligar outro dia/horário ou em outro telefone.",
    },
  ],
  hab_finalizacao_terceiro: [
    {
      name: "RECADO COM TERCEIRO",
      description:
        "Terceiro/cliente informa que a empresa entrou em falência/concordata ou terceiro informa que conhece o cliente, anota o recado ou não, ou terceiro pede para ligar outro dia/horário ou em outro telefone.",
    },
  ],
  hab_nao_confirmou: [
    {
      name: "PESSOA NÃO CONFIRMA OS DADOS",
      description:
        "Pessoa informa os números do CPF, porém os dados não conferem com os números registrados no CRM ou a pessoa se recusa a informar os números do CPF para realização da identificação positiva ou pessoa não.",
    },
  ],
  hab_questiona_origem: [
    {
      name: "CONTATO SEM NEGOCIAÇÃO",
      description:
        "Cliente impossibilitado de falar no momento, faz promessa de pagamento para uma data que ultrapassa o período permitido (data definida para ações especiais, data fixa de boleto, etc). Ou informa que não se lembra se foi feito o pagamento ou débito.",
    },
  ],
  hab_pagamento_efetuado: [
    {
      name: "PAGAMENTO JÁ EFETUADO",
      description: "Cliente informa que já efetuou o pagamento.",
    },
  ],
  hab_fgts_recusa: [
    {
      name: "RECUSA AÇÃO/CAMPANHA",
      description: "Cliente não aceita a ação/campanha ofertada.",
    },
  ],
  hab_pesquisa_satisfacao_recusa: [
    {
      name: "SEM CAPACIDADE DE PAGAMENTO",
      description:
        "Cliente se recusa a efetuar o pagamento por qualquer motivo: não tem recurso disponível, desemprego, mudanças econômicas ou não pode fazer o pagamento naquele momento.",
    },
  ],
  hab_pesquisa_satisfacao_aceite: [
    {
      name: "PROMESSA DE PAGAMENTO COM EMISSÃO DE BOLETO",
      description: "Cliente solicita boleto e informa data de pagamento.",
    },
    {
      name: "ACEITA AÇÃO/CAMPANHA COM EMISSÃO DE BOLETO",
      description: "Cliente aceita ação/ campanha com emissão de boleto.",
    },
  ],
  hab_pesquisa_satisfacao: [
    {
      name: "CONTATO SEM NEGOCIAÇÃO",
      description:
        "Cliente impossibilitado de falar no momento, faz promessa de pagamento para uma data que ultrapassa o período permitido (data definida para ações especiais, data fixa de boleto, etc). Ou informa que não se lembra se foi feito o pagamento ou débito.",
    },
  ],
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

      const tabulations = TABULATION_MAP[jsonStep.id]?.map((tab, idx) => ({
        id: `tab-${jsonStep.id}-${idx}`,
        name: tab.name,
        description: tab.description,
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
        tabulations,
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
