"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ParameterSidebar, FloorPlanParams } from "@/components/editor/parameter-sidebar"
import { ActionButtons } from "@/components/editor/action-buttons"
import { VariationGallery } from "@/components/editor/variation-gallery"
import { AdvancedEditPanel } from "@/components/editor/advanced-edit-panel"
import { useToast } from "@/components/ui/use-toast"
import { ChevronLeft, ChevronRight, Eye, Code2, Download } from "lucide-react"
import { FloorPlan3DViewer } from "@/components/editor/floor-plan-3d-viewer"
import { PlotSyncLogo } from "@/components/ui/plotsync-logo"
import { FloorPlanSVGExporter, downloadFloorPlanSVG } from "@/components/editor/floor-plan-svg-exporter"

// Dynamically import FloorPlanCanvas to avoid SSR issues with Konva
const FloorPlanCanvas = dynamic(
  () => import("@/components/editor/floor-plan-canvas").then(mod => ({ default: mod.FloorPlanCanvas })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <div className="text-gray-600">Loading canvas...</div>
      </div>
    )
  }
)

interface FloorPlanData {
  walls: Array<{ x1: number; y1: number; x2: number; y2: number }>
  rooms: Array<{
    name: string
    x: number
    y: number
    width: number
    height: number
    furniture: string[]
  }>
  doors: Array<{ x: number; y: number; rotation: number }>
  windows: Array<{ x: number; y: number; width: number }>
}

export default function EditorPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [proposals, setProposals] = useState<FloorPlanData[][]>([])
  const [currentProposal, setCurrentProposal] = useState(0)
  const [currentVariation, setCurrentVariation] = useState(0)
  const [saved, setSaved] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [viewMode, setViewMode] = useState<"2d" | "3d" | "svg">("2d")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const handleGenerate = async (params: FloorPlanParams) => {
    setLoading(true)
    try {
      const response = await fetch("/api/generate-floor-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      })

      const data = await response.json()
      
      if (data.variations) {
        // Add new proposal to existing proposals (accumulate them)
        setProposals(prevProposals => {
          const newProposals = [...prevProposals, data.variations]
          // Switch to the newly created proposal
          setCurrentProposal(newProposals.length - 1)
          setCurrentVariation(0)
          return newProposals
        })
        setSaved(false)
        
        const proposalNumber = proposals.length + 1
        const ordinal = getOrdinalSuffix(proposalNumber)
        
        toast({
          title: "Success!",
          description: `${proposalNumber}${ordinal} proposal generated with ${data.variations.length} variations`,
        })
      }
    } catch (error) {
      console.error("Failed to generate floor plan:", error)
      toast({
        title: "Error",
        description: "Failed to generate floor plans. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get ordinal suffix
  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10
    const k = num % 100
    if (j === 1 && k !== 11) return "st"
    if (j === 2 && k !== 12) return "nd"
    if (j === 3 && k !== 13) return "rd"
    return "th"
  }

  const handleSave = async () => {
    if (!proposals || proposals.length === 0) return

    try {
      const response = await fetch("/api/projects/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName: `Floor Plan ${new Date().toLocaleDateString()}`,
          proposals,
        }),
      })

      if (response.ok) {
        setSaved(true)
        toast({
          title: "Saved!",
          description: "Your floor plan has been saved to your projects",
        })
      }
    } catch (error) {
      console.error("Failed to save project:", error)
      toast({
        title: "Error",
        description: "Failed to save project. Please try again.",
      })
    }
  }

  const handleRearrange = async () => {
    // Regenerate with same parameters
    setLoading(true)
    // Simulate regeneration
    setTimeout(() => {
      setLoading(false)
    }, 2000)
  }

  const handleEdit = () => {
    setIsEditMode(!isEditMode)
    toast({
      title: isEditMode ? "Edit Mode Disabled" : "Edit Mode Enabled",
      description: isEditMode
        ? "Switched back to normal view"
        : "You can now manually add rooms, walls, doors, and windows",
    })
  }

  const handleAddRoom = (room: {
    name: string
    x: number
    y: number
    width: number
    height: number
    material?: string
    color?: string
  }) => {
    setProposals((prevProposals) => {
      const newProposals = [...prevProposals]
      if (!newProposals[currentProposal]) {
        newProposals[currentProposal] = [{
          walls: [],
          rooms: [],
          doors: [],
          windows: [],
        }]
      }
      const currentPlan = newProposals[currentProposal][currentVariation]
      if (currentPlan) {
        currentPlan.rooms = [...currentPlan.rooms, { ...room, furniture: [] }]
      }
      return newProposals
    })
    toast({
      title: "Room Added",
      description: `${room.name} has been added to the floor plan`,
    })
  }

  const handleAddFurniture = ({ roomIndex, type }: { roomIndex: number; type: string }) => {
    setProposals((prevProposals) => {
      const newProposals = [...prevProposals]
      const currentPlan = newProposals[currentProposal]?.[currentVariation]
      if (currentPlan && currentPlan.rooms[roomIndex]) {
        currentPlan.rooms[roomIndex].furniture = [
          ...currentPlan.rooms[roomIndex].furniture,
          type,
        ]
      }
      return newProposals
    })
    toast({
      title: "Furniture Added",
      description: `${type} has been added to the room`,
    })
  }

  const handleAddWall = (wall: { x1: number; y1: number; x2: number; y2: number }) => {
    setProposals((prevProposals) => {
      const newProposals = [...prevProposals]
      if (!newProposals[currentProposal]) {
        newProposals[currentProposal] = [{
          walls: [],
          rooms: [],
          doors: [],
          windows: [],
        }]
      }
      const currentPlan = newProposals[currentProposal][currentVariation]
      if (currentPlan) {
        currentPlan.walls = [...currentPlan.walls, wall]
      }
      return newProposals
    })
    toast({
      title: "Wall Added",
      description: "New wall has been added to the floor plan",
    })
  }

  const handleAddDoor = (door: { x: number; y: number; rotation: number }) => {
    setProposals((prevProposals) => {
      const newProposals = [...prevProposals]
      if (!newProposals[currentProposal]) {
        newProposals[currentProposal] = [{
          walls: [],
          rooms: [],
          doors: [],
          windows: [],
        }]
      }
      const currentPlan = newProposals[currentProposal][currentVariation]
      if (currentPlan) {
        currentPlan.doors = [...currentPlan.doors, door]
      }
      return newProposals
    })
    toast({
      title: "Door Added",
      description: "New door has been added to the floor plan",
    })
  }

  const handleAddWindow = (window: { x: number; y: number; width: number }) => {
    setProposals((prevProposals) => {
      const newProposals = [...prevProposals]
      if (!newProposals[currentProposal]) {
        newProposals[currentProposal] = [{
          walls: [],
          rooms: [],
          doors: [],
          windows: [],
        }]
      }
      const currentPlan = newProposals[currentProposal][currentVariation]
      if (currentPlan) {
        currentPlan.windows = [...currentPlan.windows, window]
      }
      return newProposals
    })
    toast({
      title: "Window Added",
      description: "New window has been added to the floor plan",
    })
  }

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all elements? This cannot be undone.")) {
      setProposals((prevProposals) => {
        const newProposals = [...prevProposals]
        if (newProposals[currentProposal] && newProposals[currentProposal][currentVariation]) {
          newProposals[currentProposal][currentVariation] = {
            walls: [],
            rooms: [],
            doors: [],
            windows: [],
          }
        }
        return newProposals
      })
      toast({
        title: "Cleared",
        description: "All elements have been removed from the floor plan",
      })
    }
  }

  const handleExport = async () => {
    const currentPlan = proposals[currentProposal]?.[currentVariation]
    if (!currentPlan) return

    try {
      const response = await fetch("/api/export/dxf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planData: currentPlan }),
      })

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `floor-plan-${Date.now()}.dxf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Export failed:", error)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const currentPlan = proposals[currentProposal]?.[currentVariation]

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      {/* Header */}
      <nav className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <PlotSyncLogo size={32} />
            <span className="text-xl font-bold text-white">PlotSync</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 rounded-lg bg-zinc-800 p-1">
            <Button
              variant={viewMode === "2d" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("2d")}
            >
              <Code2 className="mr-1 h-4 w-4" />
              2D
            </Button>
            <Button
              variant={viewMode === "3d" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("3d")}
            >
              <Eye className="mr-1 h-4 w-4" />
              3D
            </Button>
            <Button
              variant={viewMode === "svg" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("svg")}
            >
              <svg className="mr-1 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
              SVG
            </Button>
          </div>

          {viewMode === "svg" && currentPlan && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadFloorPlanSVG(currentPlan, `floor-plan-${Date.now()}.svg`)}
            >
              <Download className="mr-1 h-4 w-4" />
              Download SVG
            </Button>
          )}

          <ActionButtons
            onSave={handleSave}
            onRearrange={handleRearrange}
            onEdit={handleEdit}
            onExport={handleExport}
            saved={saved}
            isEditMode={isEditMode}
          />
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas Area */}
        <div className="flex flex-1 flex-col">
          {proposals.length > 0 && (
            <div className="border-b border-zinc-800 bg-zinc-900 p-4">
              <Tabs value={`proposal-${currentProposal}`} onValueChange={(value) => {
                const index = parseInt(value.split("-")[1])
                setCurrentProposal(index)
                setCurrentVariation(0)
              }}>
                <TabsList>
                  {proposals.map((_, index) => {
                    const proposalNum = index + 1
                    const ordinal = getOrdinalSuffix(proposalNum)
                    return (
                      <TabsTrigger key={index} value={`proposal-${index}`}>
                        {proposalNum}{ordinal} Proposal
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </Tabs>
            </div>
          )}

          <div className="flex-1 bg-white">
            {viewMode === "2d" ? (
              <FloorPlanCanvas
                planData={currentPlan || null}
                width={window.innerWidth - 400}
                height={window.innerHeight - (proposals.length > 0 ? 200 : 140)}
              />
            ) : viewMode === "3d" ? (
              currentPlan && (
                <FloorPlan3DViewer
                  rooms={currentPlan.rooms || []}
                  walls={currentPlan.walls || []}
                  doors={currentPlan.doors || []}
                  windows={currentPlan.windows || []}
                />
              )
            ) : (
              currentPlan && (
                <div className="h-full w-full bg-zinc-50">
                  <FloorPlanSVGExporter
                    planData={currentPlan}
                    width={1200}
                    height={900}
                    interactive={true}
                  />
                </div>
              )
            )}
          </div>

          {/* Variation Gallery */}
          {proposals.length > 0 && proposals[currentProposal] && (
            <VariationGallery
              variations={proposals[currentProposal]}
              currentIndex={currentVariation}
              onSelect={setCurrentVariation}
              onLoadMore={() => {
                toast({
                  title: "Coming Soon",
                  description: "Load more variations feature will be available soon!",
                })
              }}
            />
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-96 border-l border-zinc-800">
          {isEditMode ? (
            <AdvancedEditPanel
              onAddRoom={handleAddRoom}
              onAddWall={handleAddWall}
              onAddDoor={handleAddDoor}
              onAddWindow={handleAddWindow}
              onAddFurniture={handleAddFurniture}
              onClear={handleClearAll}
            />
          ) : (
            <ParameterSidebar onGenerate={handleGenerate} loading={loading} />
          )}
        </div>
      </div>
    </div>
  )
}
