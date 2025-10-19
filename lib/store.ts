// Client-side state management using localStorage for prototype
// This will be replaced with real database integration later

import type {
  User,
  ScriptStep,
  Tabulation,
  ServiceSituation,
  Channel,
  Note,
  CallSession,
  Product,
  LoginSession,
} from "./types"
import { loadHabitacionalScript, loadScriptFromJson } from "./habitacional-loader"

// Mock data for demonstration
const MOCK_USERS: User[] = [
  {
    id: "1",
    username: "admin",
    fullName: "Administrador Sistema",
    role: "admin",
    isOnline: true,
    createdAt: new Date(),
  },
  {
    id: "2",
    username: "Monitoria1",
    fullName: "Monitoria 1",
    role: "admin",
    isOnline: true,
    createdAt: new Date(),
  },
  {
    id: "3",
    username: "Monitoria2",
    fullName: "Monitoria 2",
    role: "admin",
    isOnline: true,
    createdAt: new Date(),
  },
  {
    id: "4",
    username: "Monitoria3",
    fullName: "Monitoria 3",
    role: "admin",
    isOnline: true,
    createdAt: new Date(),
  },
  {
    id: "5",
    username: "Monitoria4",
    fullName: "Monitoria 4",
    role: "admin",
    isOnline: true,
    createdAt: new Date(),
  },
]

const MOCK_SCRIPT_STEPS: ScriptStep[] = loadHabitacionalScript()

const MOCK_TABULATIONS: Tabulation[] = [
  // Identification Issues
  {
    id: "tab-1",
    name: "PESSOA NÃO CONFIRMA OS DADOS",
    description:
      "Pessoa informa os números do CPF, porém os dados não conferem com os números registrados no CRM ou a pessoa se recusa a informar os números do CPF para realização da identificação positiva ou pessoa não.",
    color: "#f59e0b",
    createdAt: new Date(),
  },

  // Third Party Contact
  {
    id: "tab-2",
    name: "RECADO COM TERCEIRO",
    description:
      "Terceiro/cliente informa que a empresa entrou em falência/concordata ou terceiro informa que conhece o cliente, anota o recado ou não, ou terceiro pede para ligar outro dia/horário ou em outro telefone.",
    color: "#3b82f6",
    createdAt: new Date(),
  },
  {
    id: "tab-3",
    name: "FALECIDO",
    description: "Terceiro informa que o titular faleceu.",
    color: "#ef4444",
    createdAt: new Date(),
  },
  {
    id: "tab-4",
    name: "FALÊNCIA OU CONCORDATA",
    description: "Utilizamos quando o sócio ou responsável financeiro informar que a empresa entrou em falência.",
    color: "#dc2626",
    createdAt: new Date(),
  },
  {
    id: "tab-5",
    name: "DESCONHECIDO",
    description: "Terceiro informa que não conhece ninguém com o nome do cliente no telefone do cadastro.",
    color: "#6b7280",
    createdAt: new Date(),
  },

  // Contact Without Negotiation
  {
    id: "tab-6",
    name: "CONTATO SEM NEGOCIAÇÃO",
    description:
      "Cliente impossibilitado de falar no momento, faz promessa de pagamento para uma data que ultrapassa o período permitido (data definida para ações especiais, data fixa de boleto, etc). Ou informa que não se lembra se foi feito o pagamento ou débito.",
    color: "#8b5cf6",
    createdAt: new Date(),
  },
  {
    id: "tab-7",
    name: "CONTATO INTERROMPIDO APÓS IP, MAS SEM RESULTADO",
    description: "Se após identificação positiva a ligação for interrompida.",
    color: "#f97316",
    createdAt: new Date(),
  },
  {
    id: "tab-8",
    name: "PESSOA SOLICITA RETORNO EM OUTRO MOMENTO",
    description: "Cliente pede para o operador retornar a ligação em outro dia/horário.",
    color: "#06b6d4",
    createdAt: new Date(),
  },

  // Payment Related
  {
    id: "tab-9",
    name: "PAGAMENTO JÁ EFETUADO",
    description: "Cliente informa que já efetuou o pagamento.",
    color: "#10b981",
    createdAt: new Date(),
  },
  {
    id: "tab-10",
    name: "RECUSA AÇÃO/CAMPANHA",
    description: "Cliente não aceita a ação/campanha ofertada.",
    color: "#ef4444",
    createdAt: new Date(),
  },
  {
    id: "tab-11",
    name: "TRANSBORDO PARA ATENDIMENTO ENTRE CANAIS",
    description:
      "Quando o atendimento é iniciado em um canal e precisa ser transbordado para resolução por outro canal.",
    color: "#8b5cf6",
    createdAt: new Date(),
  },
  {
    id: "tab-12",
    name: "SEM CAPACIDADE DE PAGAMENTO",
    description:
      "Cliente se recusa a efetuar o pagamento por qualquer motivo: não tem recurso disponível, desemprego, mudanças econômicas ou não pode fazer o pagamento naquele momento.",
    color: "#f59e0b",
    createdAt: new Date(),
  },
  {
    id: "tab-13",
    name: "NEGOCIAÇÃO EM OUTRO CANAL",
    description: "Cliente informa que já está negociando em outro canal.",
    color: "#3b82f6",
    createdAt: new Date(),
  },

  // Contract and Debt Issues
  {
    id: "tab-14",
    name: "SEM CONTRATO EM COBRANÇA",
    description: "O cliente está na base da Telecobrança, mas não constam contratos ativos (em cobrança).",
    color: "#6b7280",
    createdAt: new Date(),
  },
  {
    id: "tab-15",
    name: "DÍVIDA NÃO RECONHECIDA",
    description: "Cliente alega que desconhece a dívida.",
    color: "#f59e0b",
    createdAt: new Date(),
  },

  // Payment Promises
  {
    id: "tab-16",
    name: "PROMESSA DE PAGAMENTO SEM EMISSÃO DE BOLETO",
    description: "Cliente informa que irá depositar o valor para regularização do atraso dentro do prazo estabelecido.",
    color: "#10b981",
    createdAt: new Date(),
  },
  {
    id: "tab-17",
    name: "PROMESSA DE PAGAMENTO COM EMISSÃO DE BOLETO",
    description: "Cliente solicita boleto e informa data de pagamento.",
    color: "#22c55e",
    createdAt: new Date(),
  },

  // Campaign Acceptance
  {
    id: "tab-18",
    name: "ACEITA AÇÃO/CAMPANHA SEM EMISSÃO DE BOLETO",
    description: "Cliente aceita ação/ campanha sem emissão de boleto.",
    color: "#10b981",
    createdAt: new Date(),
  },
  {
    id: "tab-19",
    name: "ACEITA AÇÃO/CAMPANHA COM EMISSÃO DE BOLETO",
    description: "Cliente aceita ação/ campanha com emissão de boleto.",
    color: "#22c55e",
    createdAt: new Date(),
  },
  {
    id: "tab-20",
    name: "CLIENTE COM ACORDO ATIVO RETORNA NO RECEPTIVO",
    description:
      "Quando o cliente retorna no receptivo tendo acordo vigente para solicitar esclarecimentos ou solicitar o boleto.",
    color: "#06b6d4",
    createdAt: new Date(),
  },
  {
    id: "tab-21",
    name: "PROMESSA DE PAGAMENTO ACORDO DE PARCELAMENTO",
    description: "Cliente confirma o pagamento parcelado do CARTÃO DE CRÉDITO.",
    color: "#10b981",
    createdAt: new Date(),
  },

  // Technical Issues
  {
    id: "tab-22",
    name: "SINAL DE FAX",
    description: "Ligação direcionada: sinal de FAX.",
    color: "#6b7280",
    createdAt: new Date(),
  },
  {
    id: "tab-23",
    name: "CAIXA POSTAL",
    description: "Devemos utilizar quando a ligação é direcionada diretamente à caixa postal.",
    color: "#6b7280",
    createdAt: new Date(),
  },
  {
    id: "tab-24",
    name: "LIGAÇÃO CAIU",
    description:
      "São ligações que não conseguimos extrair uma informação para usar outra tabulação durante o atendimento.",
    color: "#f97316",
    createdAt: new Date(),
  },
  {
    id: "tab-25",
    name: "LIGAÇÃO MUDA",
    description:
      "Devemos utilizar quando a ligação se iniciar muda. Lembrando que se a pessoa atender e houver ruídos ou vozes que não se direcionar a você será considerada uma ligação muda.",
    color: "#f97316",
    createdAt: new Date(),
  },
]

const MOCK_SITUATIONS: ServiceSituation[] = [
  {
    id: "sit-1",
    name: "EM CASOS DE FALÊNCIA/CONCORDATA",
    description:
      "É necessário que o sócio ou responsável entre em contato com a CAIXA acessando www.caixa.gov.br/negociar e pelo WhatsApp 0800 104 0104.\n\nTabulação correta: Recado com terceiro",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-2",
    name: "FALECIDO",
    description:
      "Pessoa informa que o titular faleceu. É necessário que compareça à agência levando a certidão de óbito para que as ligações de cobrança sejam interrompidas.\n\nTabulação correta: FALECIDO",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-3",
    name: "SE O CLIENTE CITAR A LGPD OU PERGUNTAR POR QUE TEMOS OS SEUS DADOS",
    description:
      '"(NOME DO CLIENTE), seguindo a lei LGPD, n°13.709, possuímos alguns dados representando a CAIXA ECONÔMICA FEDERAL, para garantir sua segurança. Caso você possua qualquer dúvida ou solicitação em relação a isso, pedimos que entre em contato conosco enviando um e-mail para: dpo@gruporoveri.com.br ."\n\nEXEMPLOS DE QUESTIONAMENTOS FEITOS PELOS CLIENTES:\n- Como você possui meus dados pessoais?\n- Vocês têm o direito de me ligar?\n- Isso está conforme a LGPD?\n- Quero que excluam meus dados!',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-4",
    name: "O CLIENTE SOLICITA O PROTOCOLO DA LIGAÇÃO",
    description:
      "Informar que nós somos uma central de negócios, ou seja, nosso atendimento não possui caráter de SAC. Entretanto, como mencionamos no início do contato, todas as ligações são gravadas e para que você tenha acesso a elas é necessário que as solicite na sua agência de relacionamento.\n\nPORQUE NÃO PODEMOS REPASSAR ESSA INFORMAÇÃO PARA O CLIENTE?\nNossa assessoria não é SAC.",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-5",
    name: 'Se o cliente informar que "Não reside no Imóvel"',
    description:
      "Orientação - Embora o senhor(a) não resida no local, a dívida está registrada em seu nome e CPF, o que o(a) mantém como responsável pela regularização. Para resolver essa situação de forma rápida e eficiente, sugerimos que entre em contato com a pessoa que realiza o pagamento dessa dívida. Isso pode ajudar a esclarecer se o pagamento já foi efetuado, se há uma data prevista para a quitação ou outras informações relevantes.",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-6",
    name: "CLIENTE SOLICITOU A LIGAÇÃO DO ATENDIMENTO",
    description:
      'CASO O CONTRATO SEJA DOS ESTADOS:\nPARANÁ - DDD (41,42,43,44,45 e 46)\nRIO DE JANEIRO - DDD (21)\nSÃO PAULO - DDD (11)\nMATO GROSSO - DDD (65)\n\nDevemos informar: "A solicitação será repassada à CAIXA para verificação e atendimento no prazo de até 7 (sete) dias úteis."\n\n(PARA OUTROS ESTADOS)\nNesses casos, o que deve ser repassado para o cliente é: "Você pode solicitar a escuta da ligação na sua agência de relacionamento."',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-7",
    name: "QUANDO O CLIENTE DO FIES DISSER QUE QUER PAUSAR O PAGAMENTO DAS SUAS PARCELAS",
    description:
      'Caso o cliente do FIES questione a possibilidade de renegociar ou solicite o desconto para seu contrato, informar:\n\n1. "Você pode verificar se o seu contrato tem a possibilidade de realizar renegociação no site http://sifesweb.caixa.gov.br, APP FIES CAIXA ou na sua agência."\n\nATENÇÃO! Lembrando que essa orientação só deve ser repassada para aqueles clientes que já fizeram a confirmação positiva.',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-8",
    name: "CONTRATOS DE EMPRÉSTIMO CONSIGNADO",
    description:
      'Devemos orientar o cliente pedindo para que ele verifique novamente se o valor foi de fato descontado da folha de pagamento. Caso ele fale que vai verificar, podemos aguardar em linha este retorno. Se o cliente disser que não pode fazer essa verificação durante o atendimento, podemos solicitar o melhor horário e telefone para realizar um contato futuro.\n\nQUESTIONAMENTO NORMALMENTE REALIZADO PELO CLIENTE:\n"Isso é descontado na minha folha de pagamento, não está aparecendo no sistema?"',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-9",
    name: "NÃO RECONHECE A DÍVIDA",
    description:
      "Orientações: Orientar o cliente a procurar uma agência da CAIXA para mais informações ou ligar no 0800 101 0104. Para cartão de crédito, indicar a central de atendimento que está no verso do cartão para contestação das despesas.",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-10",
    name: "O QUE FAZER QUANDO CAIR UM PRODUTO QUE NÃO ATENDO?",
    description:
      'PASSO A PASSO:\n1. ABORDAGEM PADRÃO;\n2. CONFIRMAÇÃO DE DADOS - IDENTIFICAÇÃO POSITIVA;\n3. INFORMAR AO CLIENTE: "PEÇO QUE AGUARDE UM INSTANTE QUE IREI TRANSFERIR AO SETOR RESPONSÁVEL";\n4. TRANSFERIR NA SEGUNDA ABA DO WEDOO EM "CAMPANHA RECEPTIVO";\n5. TABULAR: TRANSFERÊNCIA DE LIGAÇÃO.',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-11",
    name: "O QUE FAZER QUANDO CAIR ATENDIMENTO CNPJ?",
    description:
      "ABORDAGEM PADRÃO: FALAR NOME DO SÓCIO QUE CONSTA EM DADOS DO CLIENTE;\n\n● SE CONSTAR NOME DA EMPRESA EM DADOS DO CLIENTE, SOLICITE PARA FALAR COM SÓCIO OU RESPONSÁVEL FINANCEIRO DA EMPRESA;\n\n● VERIFIQUE O NOME DO SÓCIO OU RESPONSÁVEL FINANCEIRO DA EMPRESA EM: DETALHES DO CLIENTE;\n\n● SE NÃO CONSTAR ESSA INFORMAÇÃO SOLICITE O NOME COMPLETO E REALIZE A INCLUSÃO.",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-12",
    name: "EM CASOS DE SINEB 2.0",
    description:
      'A CAIXA está te oferecendo a proposta de renegociar o contrato para que você possa quitar seu(s) contrato(s) vencido(s).\n\n"Lembramos que o pagamento efetuado permite a exclusão do seu CPF dos cadastros restritivos dentro de até 10 dias úteis."\n\n- Alerto que as ligações terão continuidade e que os juros do(s) seu(s) contrato(s) são corrigidos diariamente.\n\n- "A CAIXA não garante que as condições dessa proposta serão mantidas para um acordo futuro."\n\n- "É importante regularizar a sua dívida para a exclusão do seu CPF dos cadastros restritivos."',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "sit-13",
    name: "A Lei 12395/2024 do Estado do Mato Grosso e a Lei 16276/2025 do Rio Grande Sul",
    description:
      "A Lei 12395/2024 do Estado do Mato Grosso e a Lei 16276/2025 do Rio Grande Sul também determinam que deve ser informado a composição dos valores cobrados quanto ao que efetivamente correspondem, destacando-se o valor originário e seus adicionais (juros, multas, taxas, custas, honorários e outros que, somados, correspondam ao valor total cobrado do consumidor) ao cliente desse estado que solicitar.",
    isActive: true,
    createdAt: new Date(),
  },
]

const MOCK_CHANNELS: Channel[] = [
  {
    id: "ch-1",
    name: "Alô CAIXA",
    contact: "4004 0 104 (Capitais e Regiões Metropolitanas) | 0800 104 0 104 (Demais regiões)",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "ch-2",
    name: "Atendimento CAIXA Cidadão",
    contact: "0800 726 0207",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "ch-3",
    name: "Agência Digital",
    contact: "4004 0 104 (Capitais) | 0800 104 0 104 (Demais regiões)",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "ch-4",
    name: "Atendimento para Pessoas Surdas",
    contact: "https://icom.app/8AG8Z | www.caixa.gov.br/libras",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "ch-5",
    name: "SAC CAIXA",
    contact: "0800 726 0101",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "ch-6",
    name: "Ouvidoria CAIXA",
    contact: "0800 725 7474",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "ch-7",
    name: "Canal de Denúncias",
    contact: "0800 721 0738 | https://www.caixa.gov.br/denuncia",
    isActive: true,
    createdAt: new Date(),
  },
]

// Storage keys
const STORAGE_KEYS = {
  USERS: "callcenter_users",
  CURRENT_USER: "callcenter_current_user",
  SCRIPT_STEPS: "callcenter_script_steps",
  TABULATIONS: "callcenter_tabulations",
  SITUATIONS: "callcenter_situations",
  CHANNELS: "callcenter_channels",
  NOTES: "callcenter_notes",
  SESSIONS: "callcenter_sessions",
  PRODUCTS: "callcenter_products",
  LAST_UPDATE: "callcenter_last_update", // Track last update for real-time sync
}

// Initialize mock data
export function initializeMockData() {
  if (typeof window === "undefined") return

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS))
  console.log(
    "[v0] Users initialized:",
    MOCK_USERS.map((u) => u.username),
  )

  const habitacionalSteps = loadHabitacionalScript()
  if (!localStorage.getItem(STORAGE_KEYS.SCRIPT_STEPS)) {
    localStorage.setItem(STORAGE_KEYS.SCRIPT_STEPS, JSON.stringify(habitacionalSteps))
  }

  localStorage.setItem(STORAGE_KEYS.TABULATIONS, JSON.stringify(MOCK_TABULATIONS))

  localStorage.setItem(STORAGE_KEYS.SITUATIONS, JSON.stringify(MOCK_SITUATIONS))

  if (!localStorage.getItem(STORAGE_KEYS.CHANNELS)) {
    localStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(MOCK_CHANNELS))
  }

  if (!localStorage.getItem(STORAGE_KEYS.NOTES)) {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify([]))
  }
  if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]))
  }

  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    const habitacionalProduct: Product = {
      id: "prod-habitacional",
      name: "HABITACIONAL",
      description: "Financiamento Habitacional",
      scriptId: habitacionalSteps[0]?.id || "hab_abordagem",
      category: "habitacional",
      isActive: true,
      createdAt: new Date(),
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([habitacionalProduct]))
  }

  if (!localStorage.getItem(STORAGE_KEYS.LAST_UPDATE)) {
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, Date.now().toString())
  }
}

// User authentication
export function authenticateUser(username: string, password: string): User | null {
  if (typeof window === "undefined") return null

  const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]")

  console.log(
    "[v0] Available users in storage:",
    users.map((u) => u.username),
  )
  console.log("[v0] Searching for user:", username)

  const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase())

  console.log("[v0] User found:", !!user, user?.username)

  if (user) {
    if (user.role === "admin") {
      const validPasswords = ["rcp@$", "#qualidade@$"]
      console.log("[v0] Validating admin password")

      if (!validPasswords.includes(password)) {
        console.log("[v0] Invalid password")
        return null
      }

      // Track login session
      const session: LoginSession = {
        id: `session-${Date.now()}`,
        loginAt: new Date(),
      }

      user.lastLoginAt = new Date()
      user.loginSessions = user.loginSessions || []
      user.loginSessions.push(session)

      // Update user in storage
      const updatedUsers = users.map((u) => (u.id === user.id ? user : u))
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers))

      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
      console.log("[v0] User authenticated successfully:", user.username)
      return user
    }

    // Operators don't need password
    const session: LoginSession = {
      id: `session-${Date.now()}`,
      loginAt: new Date(),
    }

    user.lastLoginAt = new Date()
    user.loginSessions = user.loginSessions || []
    user.loginSessions.push(session)

    // Update user in storage
    const updatedUsers = users.map((u) => (u.id === user.id ? user : u))
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers))

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
    console.log("[v0] Operator authenticated successfully:", user.username)
    return user
  }

  console.log("[v0] User not found in storage")
  return null
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
  return userStr ? JSON.parse(userStr) : null
}

export function logout() {
  if (typeof window === "undefined") return

  const currentUser = getCurrentUser()
  if (currentUser && currentUser.loginSessions && currentUser.loginSessions.length > 0) {
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]")
    const user = users.find((u) => u.id === currentUser.id)

    if (user && user.loginSessions) {
      // Update the last session with logout time
      const lastSession = user.loginSessions[user.loginSessions.length - 1]
      if (!lastSession.logoutAt) {
        lastSession.logoutAt = new Date()
        lastSession.duration = lastSession.logoutAt.getTime() - new Date(lastSession.loginAt).getTime()

        // Update user in storage
        const updatedUsers = users.map((u) => (u.id === user.id ? user : u))
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers))
      }
    }
  }

  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
}

// Script steps
export function getScriptSteps(): ScriptStep[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.SCRIPT_STEPS) || "[]")
}

export function getScriptStepById(id: string, productId?: string): ScriptStep | null {
  const steps = getScriptSteps()

  // If productId is provided, filter by product first
  if (productId) {
    const productSteps = steps.filter((s) => s.productId === productId)
    return productSteps.find((s) => s.id === id) || null
  }

  return steps.find((s) => s.id === id) || null
}

export function getScriptStepsByProduct(productId: string): ScriptStep[] {
  if (typeof window === "undefined") return []
  const allSteps = getScriptSteps()
  return allSteps.filter((step) => step.productId === productId)
}

export function updateScriptStep(step: ScriptStep) {
  if (typeof window === "undefined") return

  const steps = getScriptSteps()
  const index = steps.findIndex((s) => s.id === step.id)

  if (index !== -1) {
    steps[index] = { ...step, updatedAt: new Date() }
    localStorage.setItem(STORAGE_KEYS.SCRIPT_STEPS, JSON.stringify(steps))
    notifyUpdate() // Notify about update
    console.log("[v0] Script step updated:", step.id)
  }
}

export function createScriptStep(step: Omit<ScriptStep, "id" | "createdAt" | "updatedAt">): ScriptStep {
  if (typeof window === "undefined") return { ...step, id: "", createdAt: new Date(), updatedAt: new Date() }

  const newStep: ScriptStep = {
    ...step,
    id: `step-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const steps = getScriptSteps()
  steps.push(newStep)
  localStorage.setItem(STORAGE_KEYS.SCRIPT_STEPS, JSON.stringify(steps))
  notifyUpdate() // Notify about update

  return newStep
}

export function deleteScriptStep(id: string) {
  if (typeof window === "undefined") return

  const steps = getScriptSteps().filter((s) => s.id !== id)
  localStorage.setItem(STORAGE_KEYS.SCRIPT_STEPS, JSON.stringify(steps))
  notifyUpdate() // Notify about update
}

// Tabulations
export function getTabulations(): Tabulation[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.TABULATIONS) || "[]")
}

// Situations
export function getSituations(): ServiceSituation[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.SITUATIONS) || "[]")
}

// Channels
export function getChannels(): Channel[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CHANNELS) || "[]")
}

// Notes
export function getNotes(userId: string): Note[] {
  if (typeof window === "undefined") return []
  const notes: Note[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES) || "[]")
  return notes.filter((n) => n.userId === userId)
}

export function saveNote(userId: string, content: string) {
  if (typeof window === "undefined") return

  const notes: Note[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES) || "[]")
  const newNote: Note = {
    id: `note-${Date.now()}`,
    userId,
    content,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  notes.push(newNote)
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes))
}

// Call sessions
export function createCallSession(operatorId: string, startStepId: string): CallSession {
  if (typeof window === "undefined")
    return {
      id: "",
      operatorId,
      currentStepId: startStepId,
      startedAt: new Date(),
      notes: "",
    }

  const session: CallSession = {
    id: `session-${Date.now()}`,
    operatorId,
    currentStepId: startStepId,
    startedAt: new Date(),
    notes: "",
  }

  const sessions: CallSession[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || "[]")
  sessions.push(session)
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions))

  return session
}

export function updateCallSession(session: CallSession) {
  if (typeof window === "undefined") return

  const sessions: CallSession[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || "[]")
  const index = sessions.findIndex((s) => s.id === session.id)

  if (index !== -1) {
    sessions[index] = session
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions))
  }
}

// Products
export function getProducts(): Product[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || "[]")
}

export function getProductById(id: string): Product | null {
  const products = getProducts()
  return products.find((p) => p.id === id) || null
}

export function createProduct(product: Omit<Product, "id" | "createdAt">): Product {
  if (typeof window === "undefined") return { ...product, id: "", createdAt: new Date() }

  const newProduct: Product = {
    ...product,
    id: `prod-${Date.now()}`,
    createdAt: new Date(),
  }

  const products = getProducts()
  products.push(newProduct)
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products))
  notifyUpdate() // Notify about update

  return newProduct
}

export function updateProduct(product: Product) {
  if (typeof window === "undefined") return

  const products = getProducts()
  const index = products.findIndex((p) => p.id === product.id)

  if (index !== -1) {
    products[index] = product
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products))
    notifyUpdate()
  }
}

export function deleteProduct(id: string) {
  if (typeof window === "undefined") return

  const products = getProducts().filter((p) => p.id !== id)
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products))
  notifyUpdate() // Notify about update
}

// Additional user management functions
export function getAllUsers(): User[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]")
}

export function updateUser(user: User) {
  if (typeof window === "undefined") return

  try {
    const users = getAllUsers()
    const index = users.findIndex((u) => u.id === user.id)

    if (index !== -1) {
      users[index] = user
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
      notifyUpdate()
    }
  } catch (error) {
    console.error("[v0] Error updating user:", error)
  }
}

export function deleteUser(userId: string) {
  if (typeof window === "undefined") return

  try {
    const users = getAllUsers().filter((u) => u.id !== userId)
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
    notifyUpdate()
  } catch (error) {
    console.error("[v0] Error deleting user:", error)
  }
}

export function forceLogoutUser(userId: string) {
  if (typeof window === "undefined") return

  try {
    const users = getAllUsers()
    const user = users.find((u) => u.id === userId)

    if (user && user.loginSessions && user.loginSessions.length > 0) {
      const lastSession = user.loginSessions[user.loginSessions.length - 1]
      if (!lastSession.logoutAt) {
        lastSession.logoutAt = new Date()
        lastSession.duration = lastSession.logoutAt.getTime() - new Date(lastSession.loginAt).getTime()

        const updatedUsers = users.map((u) => (u.id === user.id ? user : u))
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers))
        notifyUpdate()
      }
    }
  } catch (error) {
    console.error("[v0] Error forcing logout:", error)
  }
}

export function getTodayLoginSessions(userId: string): LoginSession[] {
  if (typeof window === "undefined") return []

  const users = getAllUsers()
  const user = users.find((u) => u.id === userId)

  if (!user || !user.loginSessions) return []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return user.loginSessions.filter((session) => {
    const sessionDate = new Date(session.loginAt)
    sessionDate.setHours(0, 0, 0, 0)
    return sessionDate.getTime() === today.getTime()
  })
}

export function getTodayConnectedTime(userId: string): number {
  const sessions = getTodayLoginSessions(userId)

  return sessions.reduce((total, session) => {
    if (session.duration) {
      return total + session.duration
    } else if (!session.logoutAt) {
      // Still logged in
      return total + (Date.now() - new Date(session.loginAt).getTime())
    }
    return total
  }, 0)
}

function notifyUpdate() {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, Date.now().toString())
  // Dispatch custom event for components to listen to
  window.dispatchEvent(new CustomEvent("store-updated"))
  console.log("[v0] Store updated, notifying all listeners")
}

export function getLastUpdate(): number {
  if (typeof window === "undefined") return 0
  return Number.parseInt(localStorage.getItem(STORAGE_KEYS.LAST_UPDATE) || "0")
}

interface JsonData {
  marcas?: Record<string, Record<string, any>>
}

export function importScriptFromJson(jsonData: JsonData): { productCount: number; stepCount: number } {
  if (typeof window === "undefined") return { productCount: 0, stepCount: 0 }

  let productCount = 0
  let stepCount = 0

  try {
    if (jsonData.marcas) {
      Object.entries(jsonData.marcas).forEach(([productName, productSteps]: [string, any]) => {
        const steps = loadScriptFromJson(jsonData, productName)

        if (steps.length > 0) {
          const existingSteps = getScriptSteps()
          const newSteps = [...existingSteps, ...steps]
          localStorage.setItem(STORAGE_KEYS.SCRIPT_STEPS, JSON.stringify(newSteps))
          stepCount += steps.length

          const productId = `prod-${productName.toLowerCase().replace(/\s+/g, "-")}`
          const product: Product = {
            id: productId,
            name: productName,
            scriptId: steps[0].id,
            category: productName.toLowerCase(),
            isActive: true,
            createdAt: new Date(),
          }

          const existingProducts = getProducts()
          const existingIndex = existingProducts.findIndex((p) => p.name === productName)
          if (existingIndex !== -1) {
            existingProducts[existingIndex] = product
          } else {
            existingProducts.push(product)
            productCount++
          }
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(existingProducts))
        }
      })

      notifyUpdate()
    }
  } catch (error) {
    console.error("[v0] Error importing script from JSON:", error)
  }

  return { productCount, stepCount }
}
