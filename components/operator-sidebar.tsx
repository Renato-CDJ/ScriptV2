"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { getTabulations, getSituations, getChannels } from "@/lib/store"
import { StickyNote, Tags, AlertCircle, Radio, List, Search, CalendarIcon } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PromiseCalendarInline } from "@/components/promise-calendar"

interface OperatorSidebarProps {
  isOpen: boolean
  productCategory?: "habitacional" | "comercial" | "cartao" | "outros"
}

const FilteredList = memo(function FilteredList({
  items,
  searchQuery,
  onItemClick,
  renderItem,
}: {
  items: any[]
  searchQuery: string
  onItemClick: (item: any) => void
  renderItem: (item: any, onClick: () => void) => React.ReactNode
}) {
  const filteredItems = useMemo(
    () => items.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [items, searchQuery],
  )

  return <div className="space-y-3">{filteredItems.map((item) => renderItem(item, () => onItemClick(item)))}</div>
})

export const OperatorSidebar = memo(function OperatorSidebar({ isOpen, productCategory }: OperatorSidebarProps) {
  const [activeSection, setActiveSection] = useState<"notes" | "tabulation" | "situation" | "channel" | "calendar">(
    "calendar",
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
    let timeoutId: NodeJS.Timeout | null = null

    const handleStoreUpdate = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => {
        setTabulations(getTabulations())
        setSituations(getSituations().filter((s) => s.isActive))
        setChannels(getChannels().filter((c) => c.isActive))
        timeoutId = null
      }, 150)
    }

    window.addEventListener("store-updated", handleStoreUpdate)
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      window.removeEventListener("store-updated", handleStoreUpdate)
    }
  }, [])

  const selectedSituationData = situations.find((s) => s.id === selectedSituation)
  const selectedChannelData = channels.find((c) => c.id === selectedChannel)

  const filteredTabulations = useMemo(
    () => tabulations.filter((tab) => tab.name.toLowerCase().includes(tabulationSearchQuery.toLowerCase())),
    [tabulations, tabulationSearchQuery],
  )

  const filteredSituations = useMemo(
    () => situations.filter((sit) => sit.name.toLowerCase().includes(situationSearchQuery.toLowerCase())),
    [situations, situationSearchQuery],
  )

  const filteredChannels = useMemo(
    () => channels.filter((ch) => ch.name.toLowerCase().includes(channelSearchQuery.toLowerCase())),
    [channels, channelSearchQuery],
  )

  const handleTabulationClick = useCallback((tabulation: any) => {
    setSelectedTabulationForModal(tabulation)
    setShowTabulationModal(true)
  }, [])

  const handleSituationClick = useCallback((situation: any) => {
    setSelectedSituationForModal(situation)
    setShowSituationModal(true)
  }, [])

  const handleChannelClick = useCallback((channel: any) => {
    setSelectedChannelForModal(channel)
    setShowChannelModal(true)
  }, [])

  if (!isOpen) return null

  return (
    <aside className="w-[360px] border-l bg-card flex flex-col h-full">
      <div className="border-b p-2 grid grid-cols-5 gap-1">
        {/* Calendar first, then Notes */}
        <Button
          variant={activeSection === "calendar" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSection("calendar")}
          className={`flex-col h-auto py-2 ${
            activeSection === "calendar"
              ? "bg-orange-500 hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-600 text-white dark:text-white"
              : ""
          }`}
        >
          <CalendarIcon className="h-4 w-4 mb-1" />
          <span className="text-xs truncate w-full">Calendario</span>
        </Button>
        <Button
          variant={activeSection === "tabulation" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSection("tabulation")}
          className={`flex-col h-auto py-2 ${
            activeSection === "tabulation"
              ? "bg-orange-500 hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-600 text-white dark:text-white"
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
              ? "bg-orange-500 hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-600 text-white dark:text-white"
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
              ? "bg-orange-500 hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-600 text-white dark:text-white"
              : ""
          }`}
        >
          <Radio className="h-4 w-4 mb-1" />
          <span className="text-xs truncate w-full">Canal</span>
        </Button>
        <Button
          variant={activeSection === "notes" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSection("notes")}
          className={`flex-col h-auto py-2 ${
            activeSection === "notes"
              ? "bg-orange-500 hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-600 text-white dark:text-white"
              : ""
          }`}
        >
          <StickyNote className="h-4 w-4 mb-1" />
          <span className="text-xs truncate w-full">Notas</span>
        </Button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto p-4">
        {activeSection === "notes" && (
          <Card className="border-border bg-card">
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
          <Card className="border-border bg-card">
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
                <div className="p-3 bg-slate-700 dark:bg-slate-800 rounded-lg text-white border border-border">
                  <p className="text-sm font-medium break-words">
                    {tabulations.find((t) => t.id === selectedTabulation)?.name}
                  </p>
                  <p className="text-xs text-slate-200 mt-1 break-words whitespace-pre-wrap">
                    {tabulations.find((t) => t.id === selectedTabulation)?.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeSection === "situation" && (
          <Card className="border-border bg-card">
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

              {filteredSituations.map((situation) => (
                <Button
                  key={situation.id}
                  variant={selectedSituation === situation.id ? "default" : "outline"}
                  className={`w-full justify-start text-left ${
                    selectedSituation === situation.id ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""
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
          <Card className="border-border bg-card">
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

              {filteredChannels.map((channel) => (
                <Button
                  key={channel.id}
                  variant={selectedChannel === channel.id ? "default" : "outline"}
                  className={`w-full justify-start text-left ${
                    selectedChannel === channel.id ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""
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

        {activeSection === "calendar" && <PromiseCalendarInline productCategory={productCategory} />}
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
                className="pl-10 h-12 text-base bg-muted/50 border-border focus:border-primary transition-colors"
              />
            </div>

            <FilteredList
              items={tabulations}
              searchQuery={tabulationSearchQuery}
              onItemClick={handleTabulationClick}
              renderItem={(tab, onClick) => (
                <button
                  key={tab.id}
                  onClick={onClick}
                  className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] border-slate-600 bg-slate-700 dark:bg-slate-800 hover:border-slate-500 dark:hover:border-slate-600`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="mt-1.5 w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-slate-600 shadow-sm"
                      style={{ backgroundColor: tab.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg mb-2 text-white">{tab.name}</h3>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-200">{tab.description}</p>
                    </div>
                  </div>
                </button>
              )}
            />
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
                className="pl-10 h-12 text-base bg-muted/50 border-border focus:border-primary transition-colors"
              />
            </div>

            <FilteredList
              items={situations}
              searchQuery={situationSearchQuery}
              onItemClick={handleSituationClick}
              renderItem={(situation, onClick) => (
                <button
                  key={situation.id}
                  onClick={onClick}
                  className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] border-slate-600 bg-slate-700 dark:bg-slate-800 hover:border-slate-500 dark:hover:border-slate-600`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 rounded-lg bg-background shadow-sm border border-border">
                      <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg mb-2 text-white">{situation.name}</h3>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-200">
                        {situation.description}
                      </p>
                    </div>
                  </div>
                </button>
              )}
            />
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
                className="pl-10 h-12 text-base bg-muted/50 border-border focus:border-primary transition-colors"
              />
            </div>

            <FilteredList
              items={channels}
              searchQuery={channelSearchQuery}
              onItemClick={handleChannelClick}
              renderItem={(channel, onClick) => (
                <button
                  key={channel.id}
                  onClick={onClick}
                  className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] border-slate-600 bg-slate-700 dark:bg-slate-800 hover:border-slate-500 dark:hover:border-slate-600`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 rounded-lg bg-background shadow-sm border border-border">
                      <Radio className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg mb-2 text-white">{channel.name}</h3>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-200">{channel.contact}</p>
                    </div>
                  </div>
                </button>
              )}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTabulationModal} onOpenChange={setShowTabulationModal}>
        <DialogContent className="max-w-4xl bg-card border-border">
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="text-primary text-2xl font-bold text-center">
              {selectedTabulationForModal?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-lg text-foreground leading-relaxed">{selectedTabulationForModal?.description}</div>
          <Button
            onClick={() => setShowTabulationModal(false)}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg hover:shadow-xl transition-all"
          >
            Fechar
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showSituationModal} onOpenChange={setShowSituationModal}>
        <DialogContent className="max-w-4xl bg-card border-border">
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="text-primary text-2xl font-bold text-center">
              {selectedSituationForModal?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-lg text-foreground leading-relaxed">{selectedSituationForModal?.description}</div>
          <Button
            onClick={() => setShowSituationModal(false)}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg hover:shadow-xl transition-all"
          >
            Fechar
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showChannelModal} onOpenChange={setShowChannelModal}>
        <DialogContent className="max-w-4xl bg-card border-border">
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="text-primary text-2xl font-bold text-center">
              {selectedChannelForModal?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-lg text-foreground leading-relaxed whitespace-pre-wrap">
            {selectedChannelForModal?.contact}
          </div>
          <Button
            onClick={() => setShowChannelModal(false)}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg hover:shadow-xl transition-all"
          >
            Fechar
          </Button>
        </DialogContent>
      </Dialog>

      {/* Original situation dialog (from sidebar buttons) */}
      <Dialog open={showSituationDialog} onOpenChange={setShowSituationDialog}>
        <DialogContent className="max-w-4xl bg-card border-border">
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="text-primary text-2xl font-bold text-center">
              {selectedSituationData?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-lg text-foreground leading-relaxed">{selectedSituationData?.description}</div>
          <Button
            onClick={() => setShowSituationDialog(false)}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg hover:shadow-xl transition-all"
          >
            Fechar
          </Button>
        </DialogContent>
      </Dialog>

      {/* Original channel dialog (from sidebar buttons) */}
      <Dialog open={showChannelDialog} onOpenChange={setShowChannelDialog}>
        <DialogContent className="max-w-4xl bg-card border-border">
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="text-primary text-2xl font-bold text-center">
              {selectedChannelData?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-lg text-foreground leading-relaxed whitespace-pre-wrap">
            {selectedChannelData?.contact}
          </div>
          <Button
            onClick={() => setShowChannelDialog(false)}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg hover:shadow-xl transition-all"
          >
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    </aside>
  )
})
