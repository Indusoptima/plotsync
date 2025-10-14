"use client"

import { Button } from "@/components/ui/button"
import { Heart, Shuffle, Edit, Download } from "lucide-react"

interface ActionButtonsProps {
  onSave: () => void
  onRearrange: () => void
  onEdit: () => void
  onExport: () => void
  saved?: boolean
  isEditMode?: boolean
}

export function ActionButtons({ 
  onSave, 
  onRearrange, 
  onEdit, 
  onExport,
  saved = false,
  isEditMode = false
}: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant={saved ? "default" : "outline"}
        size="icon"
        onClick={onSave}
        title="Save to Project"
      >
        <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={onRearrange}
        title="Rearrange Rooms"
      >
        <Shuffle className="h-4 w-4" />
      </Button>

      <Button
        variant={isEditMode ? "default" : "outline"}
        onClick={onEdit}
        title="Advanced Edit"
      >
        <Edit className="mr-2 h-4 w-4" />
        {isEditMode ? "Exit Edit Mode" : "Advanced Edit"}
      </Button>

      <Button
        onClick={onExport}
        title="Export to DXF"
      >
        <Download className="mr-2 h-4 w-4" />
        Export DXF
      </Button>
    </div>
  )
}
