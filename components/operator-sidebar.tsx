"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { getTabulations, getSituations, getChannels } from "@/lib/store"
import { StickyNote, Tags, AlertCircle, Radio, List, Search, CalendarIcon } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PromiseCalendar } from "@/components/promise-calendar"

interface OperatorSidebarProps {
  isOpen: boolean
}

export function OperatorSidebar({ isOpen }: OperatorSidebarProps) {
  const [activeSection, setActiveSection] = useState<"notes" | "tabulation" | "situation" | "channel" | "calendar">(
    "notes",
  )

  const [notes, setNotes] = useState("")
  const [selectedTabulation, setSelectedTabulation] = useState("")
  const [selectedSituation, setSelectedSituation] = useState("")
  const [selectedChannel, setSelectedChannel] = useState("")
  const [showSituationDialog, setShowSituationDialog] = useState(false)
  const [showChannelDialog, setShowChannelDialog] = useState(false)

  const [showTabulationFullView, setShowTabulationFullView] = useState(false)
  const [showTabulationModal, setShowTabulationModal] = useState(false)
  const [selectedTabulationForModal, setSelectedTabulationForModal] = useState<any>(null)
  const [tabulationSearchQuery, setTabulationSearchQuery] = useState("")

  const [showSituationFullView, setShowSituationFullView] = useState(false)
  const [showSituationModal, setShowSituationModal] = useState(false)
  const [selectedSituationForModal, setSelectedSituationForModal] = useState<any>(null)
  const [situationSearchQuery, setSituationSearchQuery] = useState("")

  const [showChannelFullView, setShowChannelFullView] = useState(false)
  const [showChannelModal, setShowChannelModal] = useState(false)
  const [selectedChannelForModal, setSelectedChannelForModal] = useState<any>(null)
  const [channelSearchQuery, setChannelSearchQuery] = useState("")

  const [tabulations, setTabulations] = useState(getTabulations())
  const [situations, setSituations] = useState(getSituations().filter((s) => s.isActive))
  const [channels, setChannels] = useState(getChannels().filter((c) => c.isActive))

  useEffect(() => {
    const handleStoreUpdate = () => {
      console.log("[v0] Operator sidebar: Store updated, refreshing data")
      setTabulations(getTabulations())
      setSituations(getSituations().filter((s) => s.isActive))
      setChannels(getChannels().filter((c) => c.isActive))
    }
    window.addEventListener("store-updated", handleStoreUpdate)
    return () => window.removeEventListener("store-updated", handleStoreUpdate)
  }, [])

  const selectedSituationData = situations.find((s) => s.id === selectedSituation)
  const selectedChannelData = channels.find((c) => c.id === selectedChannel)

  const filteredTabulations = tabulations.filter((tab) =>
    tab.name.toLowerCase().includes(tabulationSearchQuery.toLowerCase()),
  )

  const filteredSituations = situations.filter((sit) =>
    sit.name.toLowerCase().includes(situationSearchQuery.toLowerCase()),
  )

  const filteredChannels = channels.filter((ch) => ch.name.toLowerCase().includes(channelSearchQuery.toLowerCase()))

  const handleTabulationClick = (tabulation: any) => {
    setSelectedTabulationForModal(tabulation)
    setShowTabulationModal(true)
  }

  const handleSituationClick = (situation: any) => {
    setSelectedSituationForModal(situation)
    setShowSituationModal(true)
  }

  const handleChannelClick = (channel: any) => {
    setSelectedChannelForModal(channel)
    setShowChannelModal(true)
  }

  if (!isOpen) return null

  return (
    <aside className="w-80 border-l bg-card flex flex-col h-full">
      <div className="border-b p-2 grid grid-cols-5 gap-1">
        <Button
          variant={activeSection === "notes" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSection("notes")}
          className={`flex-col h-auto py-2 ${
            activeSection === "notes"
              ? "bg-orange-500 hover:bg-orange-600 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black"
              : ""
          }`}
        >
          <StickyNote className="h-4 w-4 mb-1" />
          <span className="text-xs truncate w-full">Notas</span>
        </Button>
        <Button
          variant={activeSection === "tabulation" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSection("tabulation")}
          className={`flex-col h-auto py-2 ${
            activeSection === "tabulation"
              ? "bg-orange-500 hover:bg-orange-600 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black"
              : ""
          }`}
        >
          <Tags className="h-4 w-4 mb-1" />
          <span className="text-xs truncate w-full px-1">Tabulação</span>
        </Button>
        <Button
          variant={activeSection === "situation" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSection("situation")}
          className={`flex-col h-auto py-2 ${
            activeSection === "situation"
              ? "bg-orange-500 hover:bg-orange-600 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black"
              : ""
          }`}
        >
          <AlertCircle className="h-4 w-4 mb-1" />
          <span className="text-xs truncate w-full px-1">Situação</span>
        </Button>
        <Button
          variant={activeSection === "channel" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSection("channel")}
          className={`flex-col h-auto py-2 ${
            activeSection === "channel"
              ? "bg-orange-500 hover:bg-orange-600 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black"
              : ""
          }`}
        >
          <Radio className="h-4 w-4 mb-1" />
          <span className="text-xs truncate w-full">Canal</span>
        </Button>
        <Button
          variant={activeSection === "calendar" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSection("calendar")}
          className={`flex-col h-auto py-2 ${
            activeSection === "calendar"
              ? "bg-orange-500 hover:bg-orange-600 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black"
              : ""
          }`}
        >
          <CalendarIcon className="h-4 w-4 mb-1" />
          <span className="text-xs truncate w-full">Calendario</span>
        </Button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto p-4">
        {activeSection === "notes" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Bloco de Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotações do atendimento..."
                className="min-h-[300px] text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">{notes.length} caracteres</p>
            </CardContent>
          </Card>
        )}

        {activeSection === "tabulation" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Selecionar Tabulação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent text-sm"
                onClick={() => setShowTabulationFullView(true)}
              >
                <List className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Visualizar todo conteúdo</span>
              </Button>

              <Select value={selectedTabulation} onValueChange={setSelectedTabulation}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Escolha uma tabulação" />
                </SelectTrigger>
                <SelectContent>
                  {tabulations.map((tab) => (
                    <SelectItem key={tab.id} value={tab.id}>
                      <div className="flex items-center gap-2 max-w-full">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tab.color }} />
                        <span className="truncate">{tab.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedTabulation && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium break-words">
                    {tabulations.find((t) => t.id === selectedTabulation)?.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 break-words whitespace-pre-wrap">
                    {tabulations.find((t) => t.id === selectedTabulation)?.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeSection === "situation" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status Atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent text-sm"
                onClick={() => setShowSituationFullView(true)}
              >
                <List className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Visualizar todo conteúdo</span>
              </Button>

              {situations.map((situation) => (
                <Button
                  key={situation.id}
                  variant={selectedSituation === situation.id ? "default" : "outline"}
                  className={`w-full justify-start text-left ${
                    selectedSituation === situation.id
                      ? "bg-orange-500 hover:bg-orange-600 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedSituation(situation.id)
                    setShowSituationDialog(true)
                  }}
                >
                  <span className="truncate w-full">{situation.name}</span>
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        {activeSection === "channel" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Canal de Atendimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent text-sm"
                onClick={() => setShowChannelFullView(true)}
              >
                <List className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Visualizar todo conteúdo</span>
              </Button>

              {channels.map((channel) => (
                <Button
                  key={channel.id}
                  variant={selectedChannel === channel.id ? "default" : "outline"}
                  className={`w-full justify-start text-left ${
                    selectedChannel === channel.id
                      ? "bg-orange-500 hover:bg-orange-600 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedChannel(channel.id)
                    setShowChannelDialog(true)
                  }}
                >
                  <span className="truncate w-full">{channel.name}</span>
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        {activeSection === "calendar" && <PromiseCalendar />}
      </div>

      <Dialog open={showTabulationFullView} onOpenChange={setShowTabulationFullView}>
        <DialogContent className="max-w-6xl max-h-[90vh] bg-card border-border">
          <DialogHeader className="space-y-3 pb-4 border-b border-border">
            <DialogTitle className="text-2xl font-bold text-foreground">Todas as Tabulações</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Lista completa de tabulações disponíveis
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto space-y-4 py-6 pr-4 max-h-[calc(90vh-200px)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Pesquisar tabulações..."
                value={tabulationSearchQuery}
                onChange={(e) => setTabulationSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base bg-muted/50 border-border focus:border-orange-500 dark:focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-3">
              {filteredTabulations.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabulationClick(tab)}
                  className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] ${
                    index === 0
                      ? "border-orange-500 dark:border-primary bg-orange-50 dark:bg-accent shadow-md"
                      : "border-border bg-card hover:border-orange-300 dark:hover:border-muted"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="mt-1.5 w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-background shadow-sm"
                      style={{ backgroundColor: tab.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-bold text-lg mb-2 ${
                          index === 0 ? "text-orange-600 dark:text-primary" : "text-foreground"
                        }`}
                      >
                        {tab.name}
                      </h3>
                      <p
                        className={`text-sm leading-relaxed whitespace-pre-wrap ${
                          index === 0 ? "text-orange-700/90 dark:text-muted-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {tab.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-border">
            <Button
              onClick={() => {
                setShowTabulationFullView(false)
                setTabulationSearchQuery("")
              }}
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 dark:bg-primary dark:hover:bg-primary/90 text-white dark:text-primary-foreground font-semibold text-base shadow-lg hover:shadow-xl transition-all"
            >
              Voltar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSituationFullView} onOpenChange={setShowSituationFullView}>
        <DialogContent className="max-w-6xl max-h-[90vh] bg-card border-border">
          <DialogHeader className="space-y-3 pb-4 border-b border-border">
            <DialogTitle className="text-2xl font-bold text-foreground">Todas as Situações</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Lista completa de situações disponíveis
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto space-y-4 py-6 pr-4 max-h-[calc(90vh-200px)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Pesquisar situações..."
                value={situationSearchQuery}
                onChange={(e) => setSituationSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base bg-muted/50 border-border focus:border-orange-500 dark:focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-3">
              {filteredSituations.map((situation, index) => (
                <button
                  key={situation.id}
                  onClick={() => handleSituationClick(situation)}
                  className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] ${
                    index === 0
                      ? "border-orange-500 dark:border-primary bg-orange-50 dark:bg-accent shadow-md"
                      : "border-border bg-card hover:border-orange-300 dark:hover:border-muted"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 rounded-lg bg-background shadow-sm border border-border">
                      <AlertCircle
                        className={`h-5 w-5 ${index === 0 ? "text-orange-500 dark:text-primary" : "text-muted-foreground"}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-bold text-lg mb-2 ${
                          index === 0 ? "text-orange-600 dark:text-primary" : "text-foreground"
                        }`}
                      >
                        {situation.name}
                      </h3>
                      <p
                        className={`text-sm leading-relaxed whitespace-pre-wrap ${
                          index === 0 ? "text-orange-700/90 dark:text-muted-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {situation.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-border">
            <Button
              onClick={() => {
                setShowSituationFullView(false)
                setSituationSearchQuery("")
              }}
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 dark:bg-primary dark:hover:bg-primary/90 text-white dark:text-primary-foreground font-semibold text-base shadow-lg hover:shadow-xl transition-all"
            >
              Voltar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showChannelFullView} onOpenChange={setShowChannelFullView}>
        <DialogContent className="max-w-6xl max-h-[90vh] bg-card border-border">
          <DialogHeader className="space-y-3 pb-4 border-b border-border">
            <DialogTitle className="text-2xl font-bold text-foreground">Todos os Canais</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Lista completa de canais disponíveis
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto space-y-4 py-6 pr-4 max-h-[calc(90vh-200px)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Pesquisar canais..."
                value={channelSearchQuery}
                onChange={(e) => setChannelSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base bg-muted/50 border-border focus:border-orange-500 dark:focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-3">
              {filteredChannels.map((channel, index) => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelClick(channel)}
                  className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] ${
                    index === 0
                      ? "border-orange-500 dark:border-primary bg-orange-50 dark:bg-accent shadow-md"
                      : "border-border bg-card hover:border-orange-300 dark:hover:border-muted"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 rounded-lg bg-background shadow-sm border border-border">
                      <Radio
                        className={`h-5 w-5 ${index === 0 ? "text-orange-500 dark:text-primary" : "text-muted-foreground"}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-bold text-lg mb-2 ${
                          index === 0 ? "text-orange-600 dark:text-primary" : "text-foreground"
                        }`}
                      >
                        {channel.name}
                      </h3>
                      <p className={`text-sm leading-relaxed text-foreground whitespace-pre-wrap`}>{channel.contact}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-border">
            <Button
              onClick={() => {
                setShowChannelFullView(false)
                setChannelSearchQuery("")
              }}
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 dark:bg-primary dark:hover:bg-primary/90 text-white dark:text-primary-foreground font-semibold text-base shadow-lg hover:shadow-xl transition-all"
            >
              Voltar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTabulationModal} onOpenChange={setShowTabulationModal}>
        <DialogContent className="max-w-3xl bg-card border-border">
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="text-orange-600 dark:text-primary text-2xl font-bold">
              {selectedTabulationForModal?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="p-6 rounded-xl bg-muted/50 border-2 border-border">
              <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">
                {selectedTabulationForModal?.description}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowTabulationModal(false)}
            className="w-full h-12 bg-orange-500 hover:bg-orange-600 dark:bg-primary dark:hover:bg-primary/90 text-white dark:text-primary-foreground font-semibold text-base shadow-lg hover:shadow-xl transition-all"
          >
            Fechar
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showSituationModal} onOpenChange={setShowSituationModal}>
        <DialogContent className="max-w-3xl bg-card border-border">
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="text-orange-600 dark:text-primary text-2xl font-bold">
              {selectedSituationForModal?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="p-6 rounded-xl bg-muted/50 border-2 border-border">
              <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">
                {selectedSituationForModal?.description}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowSituationModal(false)}
            className="w-full h-12 bg-orange-500 hover:bg-orange-600 dark:bg-primary dark:hover:bg-primary/90 text-white dark:text-primary-foreground font-semibold text-base shadow-lg hover:shadow-xl transition-all"
          >
            Fechar
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showChannelModal} onOpenChange={setShowChannelModal}>
        <DialogContent className="max-w-3xl bg-card border-border">
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="text-orange-600 dark:text-primary text-2xl font-bold">
              {selectedChannelForModal?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="p-6 rounded-xl bg-muted/50 border-2 border-border">
              <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">
                {selectedChannelForModal?.contact}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowChannelModal(false)}
            className="w-full h-12 bg-orange-500 hover:bg-orange-600 dark:bg-primary dark:hover:bg-primary/90 text-white dark:text-primary-foreground font-semibold text-base shadow-lg hover:shadow-xl transition-all"
          >
            Fechar
          </Button>
        </DialogContent>
      </Dialog>

      {/* Original situation dialog (from sidebar buttons) */}
      <Dialog open={showSituationDialog} onOpenChange={setShowSituationDialog}>
        <DialogContent className="max-w-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <DialogHeader className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              {selectedSituationData?.name}
            </DialogTitle>
            <DialogDescription className="text-base text-zinc-600 dark:text-zinc-400">
              Descrição da situação de atendimento
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="rounded-xl border-2 border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 p-6">
              <p className="text-base leading-relaxed font-mono text-blue-900 dark:text-blue-100 whitespace-pre-wrap">
                {selectedSituationData?.description}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowSituationDialog(false)}
            className="w-full h-12 bg-orange-500 hover:bg-orange-600 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-semibold text-base shadow-lg hover:shadow-xl transition-all"
          >
            Fechar
          </Button>
        </DialogContent>
      </Dialog>

      {/* Original channel dialog (from sidebar buttons) */}
      <Dialog open={showChannelDialog} onOpenChange={setShowChannelDialog}>
        <DialogContent className="max-w-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <DialogHeader className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              <Radio className="h-6 w-6 text-green-600 dark:text-green-400" />
              {selectedChannelData?.name}
            </DialogTitle>
            <DialogDescription className="text-base text-zinc-600 dark:text-zinc-400">
              Informações de contato do canal
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="rounded-xl border-2 border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/30 p-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-400 mb-3">
                  Contato
                </p>
                <p className="text-lg font-mono leading-relaxed tracking-wide text-green-900 dark:text-green-100 whitespace-pre-wrap break-all">
                  {selectedChannelData?.contact}
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => setShowChannelDialog(false)}
            className="w-full h-12 bg-orange-500 hover:bg-orange-600 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-semibold text-base shadow-lg hover:shadow-xl transition-all"
          >
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
