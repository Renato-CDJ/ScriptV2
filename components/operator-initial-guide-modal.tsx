"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useCachedContracts } from "@/hooks/use-cached-data"
import { 
  FileText, 
  ZoomIn, 
  ZoomOut,
  Loader2, 
  Search,
  CreditCard,
  Home,
  GraduationCap,
  Building2,
  Users,
  Wallet,
  HandCoins,
  PiggyBank,
  ChevronDown,
  ChevronUp
} from "lucide-react"

// Mapeamento de icones por tipo de contrato
const CONTRACT_ICONS: Record<string, any> = {
  default_cdc: CreditCard,
  default_cred_senior: Users,
  default_renegociacao: HandCoins,
  default_consignacao: Wallet,
  default_microcredito: PiggyBank,
  default_girocaixa_facil: Building2,
  default_fies: GraduationCap,
  default_construcard: Home,
  default_cheque_especial: CreditCard,
  default_cheque_especial_empresa: Building2,
  default_financiamento_habitacional: Home,
  default_procred_360: Building2,
}

// Categorias dos contratos
const CONTRACT_CATEGORIES: Record<string, string> = {
  default_cdc: "Pessoa Fisica",
  default_cred_senior: "Aposentados",
  default_renegociacao: "Renegociacao",
  default_consignacao: "Consignado",
  default_microcredito: "MEI",
  default_girocaixa_facil: "Empresarial",
  default_fies: "Estudantil",
  default_construcard: "Construcao",
  default_cheque_especial: "Conta Corrente",
  default_cheque_especial_empresa: "Empresarial",
  default_financiamento_habitacional: "Habitacional",
  default_procred_360: "MEI",
}

// Contratos padrao registrados no codigo
const DEFAULT_CONTRACTS = [
  {
    id: "default_cdc",
    name: "CREDITO DIRETO CAIXA - CDC",
    description: "O Credito Direto Caixa (CDC) e uma modalidade de emprestimo pessoal oferecida pela Caixa Economica Federal. Ele funciona como um credito pre-aprovado, que pode ser contratado de forma rapida e simples, com o valor liberado diretamente na conta do cliente.",
    is_active: true,
  },
  {
    id: "default_cred_senior",
    name: "CRED SENIOR",
    description: "O Cred Senior da Caixa e uma linha de credito pessoal voltada para aposentados e pensionistas do INSS, oferecida pela Caixa Economica Federal. Ele funciona como um emprestimo consignado, com parcelas descontadas diretamente do beneficio, garantindo juros mais baixos e prazos mais longos.",
    is_active: true,
  },
  {
    id: "default_renegociacao",
    name: "RENEGOCIACAO DE DIVIDAS",
    description: "A renegociacao de dividas da Caixa e um servico oferecido pela Caixa Economica Federal para clientes que estao com dificuldades em pagar seus emprestimos, financiamentos ou outros contratos ativos. O objetivo e reorganizar o debito e facilitar o pagamento, evitando que a divida cresca ainda mais com juros e encargos.",
    is_active: true,
  },
  {
    id: "default_consignacao",
    name: "CONSIGNACAO CAIXA",
    description: "A \"consignacao Caixa\" geralmente se refere ao emprestimo consignado oferecido pela Caixa Economica Federal, uma modalidade de credito em que as parcelas sao descontadas diretamente do salario, aposentadoria ou pensao do cliente.",
    is_active: true,
  },
  {
    id: "default_microcredito",
    name: "MICROCREDITO GIRO",
    description: "O microcredito e uma modalidade de emprestimo de pequeno valor, voltada para microempreendedores individuais (MEIs), trabalhadores informais e pessoas de baixa renda que tem dificuldade em acessar credito tradicional. Ele serve para financiar atividades produtivas, como compra de equipamentos, estoque ou capital de giro.",
    is_active: true,
  },
  {
    id: "default_girocaixa_facil",
    name: "GIROCAIXA FACIL",
    description: "O GiroCaixa Facil e uma linha de credito da Caixa Economica Federal destinada a empresas com faturamento anual de ate R$ 50 milhoes, voltada para financiar capital de giro. Ele oferece limite de ate R$ 2 milhoes, com prazos flexiveis e contratacao simplificada. E um emprestimo empresarial.",
    is_active: true,
  },
  {
    id: "default_fies",
    name: "FIES",
    description: "O FIES (Fundo de Financiamento Estudantil) e um programa do governo federal que oferece financiamento das mensalidades em instituicoes privadas de ensino superior para estudantes que nao tem condicoes de arcar com os custos. Ele e administrado pelo Ministerio da Educacao (MEC) e operado por bancos como a Caixa Economica Federal.",
    is_active: true,
  },
  {
    id: "default_construcard",
    name: "CONSTRUCARD",
    description: "E um tipo de emprestimo oferecido pela Caixa Economica Federal, mas com uma caracteristica especial: ele e voltado exclusivamente para compra de materiais de construcao e reforma em lojas credenciadas. (Nao ofertamos o envio do boleto)",
    is_active: true,
  },
  {
    id: "default_cheque_especial",
    name: "CHEQUE ESPECIAL CAIXA",
    description: "O Cheque Especial e uma modalidade de credito automatico vinculada a conta corrente. Ele funciona como um \"limite extra\" que o banco disponibiliza para o cliente usar quando o saldo da conta nao e suficiente para cobrir saques, pagamentos ou transferencias. (Nao ofertamos o envio do boleto)",
    is_active: true,
  },
  {
    id: "default_cheque_especial_empresa",
    name: "CHEQUE ESPECIAL EMPRESA CAIXA",
    description: "O Cheque Especial e uma modalidade de credito automatico vinculada a conta corrente. Ele funciona como um \"limite extra\" que o banco disponibiliza para o cliente usar quando o saldo da conta nao e suficiente para cobrir saques, pagamentos ou transferencias. (Nao ofertamos o envio do boleto)",
    is_active: true,
  },
  {
    id: "default_financiamento_habitacional",
    name: "FINANCIAMENTO HABITACIONAL",
    description: "Um financiamento habitacional e um tipo de credito que os clientes utilizam para comprar um imovel (casa, apartamento ou terreno) pagando em parcelas mensais.",
    is_active: true,
  },
  {
    id: "default_procred_360",
    name: "GIROCAIXA PROCRED 360 e MICROGIRO PROCRED 360",
    description: "Programa ProCred 360, que e uma linha de capital de giro voltada exclusivamente para MEI e Microempresas com faturamento anual de ate R$ 360 mil. A emissao de 2a via de boleto e feita pelo SIFEC.",
    is_active: true,
  },
]

interface OperatorInitialGuideModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OperatorInitialGuideModal({ open, onOpenChange }: OperatorInitialGuideModalProps) {
  const { data: contractsData, loading } = useCachedContracts()
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})
  const [globalZoom, setGlobalZoom] = useState(100)

  // Combina contratos padrao com contratos do banco de dados e filtra ativos
  const allContracts = useMemo(() => {
    const dbContracts = contractsData
      .filter((c: any) => c.is_active)
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description || "",
        isDefault: false,
      }))
    
    const defaultActive = DEFAULT_CONTRACTS
      .filter((c) => c.is_active)
      .map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        isDefault: true,
      }))
    
    return [...defaultActive, ...dbContracts]
  }, [contractsData])

  // Filtra contratos pela busca
  const filteredContracts = useMemo(() => {
    if (!searchQuery.trim()) return allContracts
    const query = searchQuery.toLowerCase()
    return allContracts.filter(
      (c) => 
        c.name.toLowerCase().includes(query) || 
        c.description.toLowerCase().includes(query)
    )
  }, [allContracts, searchQuery])

  const toggleExpand = (contractId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [contractId]: !prev[contractId],
    }))
  }

  const getIcon = (contractId: string) => {
    const IconComponent = CONTRACT_ICONS[contractId] || FileText
    return IconComponent
  }

  const getCategory = (contractId: string) => {
    return CONTRACT_CATEGORIES[contractId] || "Outros"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 gap-0 overflow-hidden">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              Guia Inicial - Contratos
            </DialogTitle>
            <DialogDescription className="text-orange-100 mt-2">
              Consulte as informacoes sobre os tipos de contratos disponiveis
            </DialogDescription>
          </DialogHeader>
          
          {/* Barra de busca e controles */}
          <div className="flex items-center gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-200" />
              <Input
                placeholder="Buscar contrato..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-orange-200 focus-visible:ring-white/30"
              />
            </div>
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setGlobalZoom(Math.max(80, globalZoom - 10))}
                className="h-8 w-8 text-white hover:bg-white/20"
                title="Diminuir texto"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-12 text-center">{globalZoom}%</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setGlobalZoom(Math.min(150, globalZoom + 10))}
                className="h-8 w-8 text-white hover:bg-white/20"
                title="Aumentar texto"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="px-6 py-3 bg-muted/50 border-b flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {filteredContracts.length} {filteredContracts.length === 1 ? "contrato encontrado" : "contratos encontrados"}
          </span>
          {searchQuery && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSearchQuery("")}
              className="text-xs h-7"
            >
              Limpar busca
            </Button>
          )}
        </div>

        {/* Lista de contratos */}
        <ScrollArea className="flex-1 h-[50vh]">
          <div className="p-6 space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-orange-500 mb-4" />
                <p className="text-muted-foreground">Carregando contratos...</p>
              </div>
            ) : filteredContracts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium">Nenhum contrato encontrado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? "Tente buscar por outro termo" : "Nenhum contrato disponivel no momento"}
                </p>
              </div>
            ) : (
              filteredContracts.map((contract) => {
                const Icon = getIcon(contract.id)
                const category = getCategory(contract.id)
                const isExpanded = expandedCards[contract.id] ?? false
                const shouldTruncate = contract.description.length > 200

                return (
                  <Card
                    key={contract.id}
                    className="group border hover:border-orange-500/50 transition-all duration-200 hover:shadow-md overflow-hidden"
                  >
                    <CardContent className="p-0">
                      <div 
                        className="flex items-start gap-4 p-4 cursor-pointer"
                        onClick={() => shouldTruncate && toggleExpand(contract.id)}
                      >
                        {/* Icone do contrato */}
                        <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                          <Icon className="h-6 w-6" />
                        </div>
                        
                        {/* Conteudo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 
                              className="font-semibold text-foreground group-hover:text-orange-500 transition-colors"
                              style={{ fontSize: `${globalZoom}%` }}
                            >
                              {contract.name}
                            </h3>
                            <Badge 
                              variant="secondary" 
                              className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                            >
                              {category}
                            </Badge>
                          </div>
                          <p
                            className={`text-muted-foreground leading-relaxed transition-all ${!isExpanded && shouldTruncate ? "line-clamp-2" : ""}`}
                            style={{ fontSize: `${globalZoom * 0.875}%` }}
                          >
                            {contract.description}
                          </p>
                          
                          {/* Botao expandir/recolher */}
                          {shouldTruncate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 h-7 text-xs text-orange-500 hover:text-orange-600 hover:bg-orange-500/10 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleExpand(contract.id)
                              }}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-3 w-3 mr-1" />
                                  Mostrar menos
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3 w-3 mr-1" />
                                  Ler mais
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
