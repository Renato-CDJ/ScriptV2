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
          <span className="text-xs truncate w-full">Prazo</span>
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
                  <p className="text-xs text-muted-foreground mt-1 break-words">
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
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Todas as Tabulações</DialogTitle>
            <DialogDescription>Lista completa de tabulações disponíveis</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto space-y-4 py-4 max-h-[calc(90vh-200px)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar..."
                value={tabulationSearchQuery}
                onChange={(e) => setTabulationSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-3">
              {filteredTabulations.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabulationClick(tab)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                    index === 0
                      ? "border-orange-500 dark:border-white bg-orange-50 dark:bg-zinc-800"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <svg
                        className="h-5 w-5 text-orange-500 dark:text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`font-bold text-base mb-1 ${
                          index === 0 ? "text-orange-600 dark:text-white" : "text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {tab.name}
                      </h3>
                      <p
                        className={`text-sm ${
                          index === 0 ? "text-orange-700 dark:text-gray-300" : "text-gray-600 dark:text-gray-400"
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
          <div className="pt-4 border-t">
            <Button
              onClick={() => {
                setShowTabulationFullView(false)
                setTabulationSearchQuery("")
              }}
              className="w-full bg-orange-500 hover:bg-orange-600 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black"
            >
              <span className="mr-2">📋</span>
              Voltar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSituationFullView} onOpenChange={setShowSituationFullView}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Todas as Situações</DialogTitle>
            <DialogDescription>Lista completa de situações disponíveis</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto space-y-4 py-4 max-h-[calc(90vh-200px)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar..."
                value={situationSearchQuery}
                onChange={(e) => setSituationSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-3">
              {filteredSituations.map((situation, index) => (
                <button
                  key={situation.id}
                  onClick={() => handleSituationClick(situation)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                    index === 0
                      ? "border-orange-500 dark:border-white bg-orange-50 dark:bg-zinc-800"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <svg
                        className="h-5 w-5 text-orange-500 dark:text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`font-bold text-base mb-1 ${
                          index === 0 ? "text-orange-600 dark:text-white" : "text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {situation.name}
                      </h3>
                      <p
                        className={`text-sm ${
                          index === 0 ? "text-orange-700 dark:text-gray-300" : "text-gray-600 dark:text-gray-400"
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
          <div className="pt-4 border-t">
            <Button
              onClick={() => {
                setShowSituationFullView(false)
                setSituationSearchQuery("")
              }}
              className="w-full bg-orange-500 hover:bg-orange-600 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black"
            >
              <span className="mr-2">📋</span>
              Voltar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showChannelFullView} onOpenChange={setShowChannelFullView}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Todas os Canais</DialogTitle>
            <DialogDescription>Lista completa de canais disponíveis</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto space-y-4 py-4 max-h-[calc(90vh-200px)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar..."
                value={channelSearchQuery}
                onChange={(e) => setChannelSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-3">
              {filteredChannels.map((channel, index) => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelClick(channel)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                    index === 0
                      ? "border-orange-500 dark:border-white bg-orange-50 dark:bg-zinc-800"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <svg
                        className="h-5 w-5 text-orange-500 dark:text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`font-bold text-base mb-1 ${
                          index === 0 ? "text-orange-600 dark:text-white" : "text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {channel.name}
                      </h3>
                      <p
                        className={`text-sm ${
                          index === 0 ? "text-orange-700 dark:text-gray-300" : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {channel.contact}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t">
            <Button
              onClick={() => {
                setShowChannelFullView(false)
                setChannelSearchQuery("")
              }}
              className="w-full bg-orange-500 hover:bg-orange-600 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black"
            >
              <span className="mr-2">📋</span>
              Voltar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTabulationModal} onOpenChange={setShowTabulationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-orange-600 dark:text-white text-xl">
              {selectedTabulationForModal?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">{selectedTabulationForModal?.description}</p>
          </div>
          <Button
            onClick={() => setShowTabulationModal(false)}
            className="w-full bg-orange-500 hover:bg-orange-600 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black"
          >
            Fechar
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showSituationModal} onOpenChange={setShowSituationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-orange-600 dark:text-white text-xl">
              {selectedSituationForModal?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">{selectedSituationForModal?.description}</p>
          </div>
          <Button
            onClick={() => setShowSituationModal(false)}
            className="w-full bg-orange-500 hover:bg-orange-600 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black"
          >
            Fechar
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showChannelModal} onOpenChange={setShowChannelModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-orange-600 dark:text-white text-xl">
              {selectedChannelForModal?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {selectedChannelForModal?.contact}
            </p>
          </div>
          <Button
            onClick={() => setShowChannelModal(false)}
            className="w-full bg-orange-500 hover:bg-orange-600 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black"
          >
            Fechar
          </Button>
        </DialogContent>
      </Dialog>

      {/* Original situation dialog (from sidebar buttons) */}
      <Dialog open={showSituationDialog} onOpenChange={setShowSituationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              {selectedSituationData?.name}
            </DialogTitle>
            <DialogDescription>Descrição da situação de atendimento</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/30 p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">{selectedSituationData?.description}</p>
            </div>
          </div>
          <Button
            onClick={() => setShowSituationDialog(false)}
            className="w-full bg-orange-500 hover:bg-orange-600 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black"
          >
            Fechar
          </Button>
        </DialogContent>
      </Dialog>

      {/* Original channel dialog (from sidebar buttons) */}
      <Dialog open={showChannelDialog} onOpenChange={setShowChannelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-green-600" />
              {selectedChannelData?.name}
            </DialogTitle>
            <DialogDescription>Informações de contato do canal</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border-2 border-green-200 bg-green-50 dark:bg-green-950/30 p-4">
              <p className="text-sm font-mono text-green-900 dark:text-green-100 whitespace-pre-wrap">
                {selectedChannelData?.contact}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowChannelDialog(false)}
            className="w-full bg-orange-500 hover:bg-orange-600 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black"
          >
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
