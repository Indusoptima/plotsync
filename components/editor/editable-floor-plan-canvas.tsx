"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Stage, Layer, Line, Rect, Text, Circle, Group } from "react-konva"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Maximize2, Grid3x3 } from "lucide-react"
import Konva from "konva"
import { STROKE_CONFIG, ADAPTIVE_SCALE } from "@/lib/floor-plan/config"
import { useEditorStore } from "@/lib/editor/editor-store"
import { pointInBoundingBox, snapPointToGrid } from "@/lib/editor/geometry-utils"
import type { FloorPlanGeometry } from "@/lib/floor-plan/types"

interface EditableFloorPlanCanvasProps {
  planData: any | null
  width: number
  height: number
}

export function EditableFloorPlanCanvas({ planData, width, height }: EditableFloorPlanCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const [stageScale, setStageScale] = useState(1)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [calculatedScale, setCalculatedScale] = useState(15) // pixels per meter

  // Editor store
  const {
    selection,
    transform,
    grid,
    hoveredElementId,
    showDimensions,
    selectElement,
    deselectAll,
    startTransform,
    updateTransform,
    commitTransform,
    cancelTransform,
    setHoveredElement,
    toggleGrid,
    undo,
    redo,
  } = useEditorStore()

  // Auto-fit to screen when plan data changes
  useEffect(() => {
    if (planData && stageRef.current) {
      handleFitToScreen()
      
      // Calculate and set the scale based on plan data
      const allX = [
        ...planData.walls.flatMap((w: any) => [w.x1, w.x2]),
        ...planData.rooms.map((r: any) => r.x),
        ...planData.rooms.map((r: any) => r.x + r.width),
      ]
      const allY = [
        ...planData.walls.flatMap((w: any) => [w.y1, w.y2]),
        ...planData.rooms.map((r: any) => r.y),
        ...planData.rooms.map((r: any) => r.y + r.height),
      ]

      const minX = Math.min(...allX)
      const maxX = Math.max(...allX)
      const minY = Math.min(...allY)
      const maxY = Math.max(...allY)

      const planWidth = maxX - minX
      const planHeight = maxY - minY

      const scaleX = ADAPTIVE_SCALE.minDisplayWidth / planWidth
      const scaleY = ADAPTIVE_SCALE.minDisplayHeight / planHeight
      const minRequiredScale = Math.max(scaleX, scaleY)
      
      const newScale = Math.max(
        ADAPTIVE_SCALE.minScale,
        Math.min(minRequiredScale, ADAPTIVE_SCALE.maxScale)
      )
      
      setCalculatedScale(newScale)
    }
  }, [planData])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      
      // Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      }
      
      // Toggle grid: G
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        toggleGrid()
      }
      
      // Deselect: Escape
      if (e.key === 'Escape') {
        e.preventDefault()
        deselectAll()
      }
      
      // Delete selected element: Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selection.elementIds.length > 0) {
        e.preventDefault()
        const { type, elementIds } = selection
        if (type && elementIds[0]) {
          const confirmDelete = confirm(`Delete selected ${type}?`)
          if (confirmDelete) {
            // Use store's delete function (will be implemented)
            deselectAll()
          }
        }
      }
      
      // Nudge selected element: Arrow keys (0.1m)
      if (selection.elementIds.length > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        const step = e.shiftKey ? 1.0 : 0.1 // Shift = 1m, normal = 0.1m
        // Nudge logic will be implemented
      }
      
      // Duplicate: Ctrl/Cmd + D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selection.elementIds.length > 0) {
        e.preventDefault()
        // Duplicate logic will be implemented
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, toggleGrid, deselectAll, selection])

  const handleZoomIn = () => {
    if (!stageRef.current) return
    const stage = stageRef.current
    const oldScale = stage.scaleX()
    const newScale = Math.min(oldScale * 1.2, 5)
    
    const center = { x: width / 2, y: height / 2 }
    const newPos = {
      x: center.x - (center.x - stage.x()) * (newScale / oldScale),
      y: center.y - (center.y - stage.y()) * (newScale / oldScale),
    }
    
    setStageScale(newScale)
    setStagePos(newPos)
  }

  const handleZoomOut = () => {
    if (!stageRef.current) return
    const stage = stageRef.current
    const oldScale = stage.scaleX()
    const newScale = Math.max(oldScale / 1.2, 0.1)
    
    const center = { x: width / 2, y: height / 2 }
    const newPos = {
      x: center.x - (center.x - stage.x()) * (newScale / oldScale),
      y: center.y - (center.y - stage.y()) * (newScale / oldScale),
    }
    
    setStageScale(newScale)
    setStagePos(newPos)
  }

  const handleFitToScreen = () => {
    if (!planData || !stageRef.current) return
    
    const allX = [
      ...planData.walls.flatMap((w: any) => [w.x1, w.x2]),
      ...planData.rooms.map((r: any) => r.x),
      ...planData.rooms.map((r: any) => r.x + r.width),
    ]
    const allY = [
      ...planData.walls.flatMap((w: any) => [w.y1, w.y2]),
      ...planData.rooms.map((r: any) => r.y),
      ...planData.rooms.map((r: any) => r.y + r.height),
    ]

    const minX = Math.min(...allX)
    const maxX = Math.max(...allX)
    const minY = Math.min(...allY)
    const maxY = Math.max(...allY)

    const planWidth = maxX - minX
    const planHeight = maxY - minY

    const currentScale = 15
    const scaledWidth = planWidth * currentScale
    const scaledHeight = planHeight * currentScale

    const padding = 100
    const scaleX = (width - padding * 2) / scaledWidth
    const scaleY = (height - padding * 2) / scaledHeight
    const optimalScale = Math.min(scaleX, scaleY, 1.5)

    setStageScale(optimalScale)
    setStagePos({ x: 0, y: 0 })
  }

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    
    const stage = stageRef.current
    if (!stage) return

    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    const delta = e.evt.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.1, Math.min(oldScale * delta, 5))

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }

    setStageScale(newScale)
    setStagePos(newPos)
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setStagePos({
      x: e.target.x(),
      y: e.target.y(),
    })
  }

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    if (!stageRef.current) return { x: 0, y: 0 }
    
    const stage = stageRef.current
    const worldX = (screenX - stage.x()) / (stage.scaleX() * calculatedScale)
    const worldY = (screenY - stage.y()) / (stage.scaleY() * calculatedScale)
    
    return { x: worldX, y: worldY }
  }, [calculatedScale])

  // Handle drag start for transform handles
  const handleHandleDragStart = useCallback((handleType: string, screenPos: { x: number; y: number }) => {
    const worldPos = screenToWorld(screenPos.x, screenPos.y)
    startTransform(handleType as any, worldPos)
  }, [screenToWorld, startTransform])

  // Handle drag move for transform handles
  const handleHandleDragMove = useCallback((screenPos: { x: number; y: number }) => {
    const worldPos = screenToWorld(screenPos.x, screenPos.y)
    updateTransform(worldPos)
  }, [screenToWorld, updateTransform])

  // Handle drag end for transform handles
  const handleHandleDragEnd = useCallback(() => {
    // Validate constraints before committing
    const previewGeom = transform.previewGeometry
    if (previewGeom && previewGeom.geometry?.bounds) {
      const { width, height } = previewGeom.geometry.bounds
      const area = width * height
      
      // Check minimum area (4m²)
      if (area < 4) {
        alert(`Room too small: ${area.toFixed(1)}m² (minimum 4m²)`)
        cancelTransform()
        return
      }
      
      // Check aspect ratio (1:3 to 3:1)
      const ratio = Math.max(width, height) / Math.min(width, height)
      if (ratio > 3) {
        const proceed = confirm(`Room proportions unusual (ratio ${ratio.toFixed(1)}:1). Continue anyway?`)
        if (!proceed) {
          cancelTransform()
          return
        }
      }
      
      // Check minimum dimensions
      if (width < 2 || height < 2) {
        alert(`Room dimensions too small (min 2m × 2m)`)
        cancelTransform()
        return
      }
    }
    
    commitTransform()
  }, [transform.previewGeometry, commitTransform, cancelTransform])

  // Handle canvas click for selection
  const handleCanvasClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage()
    if (!stage) return

    const pointerPos = stage.getPointerPosition()
    if (!pointerPos) return

    const worldPos = screenToWorld(pointerPos.x, pointerPos.y)
    
    // Check if clicking on a room
    if (planData?.rooms) {
      for (const room of planData.rooms) {
        const roomBounds = {
          x: room.x,
          y: room.y,
          width: room.width,
          height: room.height,
        }
        
        if (pointInBoundingBox(worldPos, roomBounds)) {
          const roomId = `room-${planData.rooms.indexOf(room)}`
          selectElement('room', roomId, e.evt.shiftKey)
          return
        }
      }
    }
    
    // If no element clicked, deselect
    deselectAll()
  }, [planData, screenToWorld, selectElement, deselectAll])

  if (!planData) {
    return (
      <div
        className="flex items-center justify-center bg-white"
        style={{ width, height }}
      >
        <div className="text-center">
          <div className="mb-4 text-6xl">📐</div>
          <p className="text-lg text-gray-600">Generate a floor plan to get started</p>
        </div>
      </div>
    )
  }

  // Calculate bounds and centering
  const allX = [
    ...planData.walls.flatMap((w: any) => [w.x1, w.x2]),
    ...planData.rooms.map((r: any) => r.x),
    ...planData.rooms.map((r: any) => r.x + r.width),
  ]
  const allY = [
    ...planData.walls.flatMap((w: any) => [w.y1, w.y2]),
    ...planData.rooms.map((r: any) => r.y),
    ...planData.rooms.map((r: any) => r.y + r.height),
  ]

  const minX = Math.min(...allX)
  const maxX = Math.max(...allX)
  const minY = Math.min(...allY)
  const maxY = Math.max(...allY)

  const planWidth = maxX - minX
  const planHeight = maxY - minY

  const scaleX = ADAPTIVE_SCALE.minDisplayWidth / planWidth
  const scaleY = ADAPTIVE_SCALE.minDisplayHeight / planHeight
  const minRequiredScale = Math.max(scaleX, scaleY)
  
  const calculatedScale = Math.max(
    ADAPTIVE_SCALE.minScale,
    Math.min(minRequiredScale, ADAPTIVE_SCALE.maxScale)
  )
  
  const scaledWidth = planWidth * calculatedScale
  const scaledHeight = planHeight * calculatedScale
  
  const offsetX = (width - scaledWidth) / 2 - minX * calculatedScale
  const offsetY = (height - scaledHeight) / 2 - minY * calculatedScale

  return (
    <div className="relative" style={{ width, height }}>
      {/* Control Buttons */}
      <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
        <Button
          size="icon"
          variant="secondary"
          onClick={handleZoomIn}
          className="h-10 w-10 bg-white shadow-lg hover:bg-gray-100"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={handleZoomOut}
          className="h-10 w-10 bg-white shadow-lg hover:bg-gray-100"
        >
          <ZoomOut className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={handleFitToScreen}
          className="h-10 w-10 bg-white shadow-lg hover:bg-gray-100"
        >
          <Maximize2 className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={toggleGrid}
          className={`h-10 w-10 shadow-lg ${grid.visible ? 'bg-blue-100 hover:bg-blue-200' : 'bg-white hover:bg-gray-100'}`}
        >
          <Grid3x3 className="h-5 w-5" />
        </Button>
        <div className="rounded-md bg-white px-2 py-1 text-center text-xs font-medium shadow-lg">
          {Math.round(stageScale * 100)}%
        </div>
      </div>

      {/* Konva Stage */}
      <Stage 
        width={width} 
        height={height} 
        ref={stageRef}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        draggable
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
        onClick={handleCanvasClick}
      >
        {/* Background Layer */}
        <Layer>
          <Rect
            x={-width}
            y={-height}
            width={width * 3}
            height={height * 3}
            fill="#ffffff"
          />
        </Layer>

        {/* Grid Layer */}
        {grid.visible && (
          <Layer>
            {renderGrid(minX, maxX, minY, maxY, calculatedScale, offsetX, offsetY, grid)}
          </Layer>
        )}

        {/* Floor Plan Layer */}
        <Layer>
          {/* Rooms */}
          {planData.rooms.map((room: any, index: number) => {
            const roomId = `room-${index}`
            const isSelected = selection.elementIds.includes(roomId)
            const isHovered = hoveredElementId === roomId
            
            return (
              <Group key={roomId}>
                {/* Room fill */}
                <Rect
                  x={room.x * calculatedScale + offsetX}
                  y={room.y * calculatedScale + offsetY}
                  width={room.width * calculatedScale}
                  height={room.height * calculatedScale}
                  fill="#ffffff"
                  stroke={isSelected ? "#3B82F6" : isHovered ? "#93C5FD" : "transparent"}
                  strokeWidth={isSelected ? 3 : 2}
                  onMouseEnter={() => setHoveredElement(roomId)}
                  onMouseLeave={() => setHoveredElement(null)}
                />
                
                {/* Room labels */}
                <Text
                  x={room.x * calculatedScale + offsetX + (room.width * calculatedScale) / 2}
                  y={room.y * calculatedScale + offsetY + (room.height * calculatedScale) / 2 - 10}
                  text={room.name}
                  fontSize={13}
                  fontFamily="Arial, sans-serif"
                  fontStyle="bold"
                  fill="#1a1a1a"
                  align="center"
                  offsetX={(room.width * calculatedScale) / 2}
                />
                
                {showDimensions && (
                  <>
                    <Text
                      x={room.x * calculatedScale + offsetX + (room.width * calculatedScale) / 2}
                      y={room.y * calculatedScale + offsetY + (room.height * calculatedScale) / 2 + 5}
                      text={`${room.width.toFixed(1)}m × ${room.height.toFixed(1)}m`}
                      fontSize={10}
                      fontFamily="Arial, sans-serif"
                      fill="#666666"
                      align="center"
                      offsetX={(room.width * calculatedScale) / 2}
                    />
                    <Text
                      x={room.x * calculatedScale + offsetX + (room.width * calculatedScale) / 2}
                      y={room.y * calculatedScale + offsetY + (room.height * calculatedScale) / 2 + 18}
                      text={`${(room.width * room.height).toFixed(1)} m²`}
                      fontSize={10}
                      fontFamily="Arial, sans-serif"
                      fill="#666666"
                      align="center"
                      offsetX={(room.width * calculatedScale) / 2}
                    />
                  </>
                )}
                
                {/* Furniture */}
                {room.furniture?.map((item: string, fIndex: number) => (
                  <Group key={`furniture-${index}-${fIndex}`}>
                    {renderFurnitureShape(item, room, fIndex, calculatedScale, offsetX, offsetY)}
                  </Group>
                ))}
              </Group>
            )
          })}

          {/* Walls */}
          {planData.walls.map((wall: any, index: number) => (
            <Line
              key={`wall-${index}`}
              points={[
                wall.x1 * calculatedScale + offsetX,
                wall.y1 * calculatedScale + offsetY,
                wall.x2 * calculatedScale + offsetX,
                wall.y2 * calculatedScale + offsetY,
              ]}
              stroke="#000000"
              strokeWidth={STROKE_CONFIG.canvas.wallStroke}
              lineCap="square"
            />
          ))}

          {/* Doors */}
          {planData.doors.map((door: any, index: number) => {
            const doorX = door.x * calculatedScale + offsetX
            const doorY = door.y * calculatedScale + offsetY
            const doorWidth = 18 * (calculatedScale / 2)
            const angle = door.rotation
            
            return (
              <Group key={`door-${index}`} x={doorX} y={doorY} rotation={angle}>
                <Line
                  points={[0, 0, doorWidth, 0]}
                  stroke="#ffffff"
                  strokeWidth={STROKE_CONFIG.canvas.doorGapStroke}
                  lineCap="butt"
                />
                <Line
                  points={[0, 0, doorWidth * 0.7, -doorWidth * 0.7]}
                  stroke="#000000"
                  strokeWidth={STROKE_CONFIG.canvas.doorArcStroke}
                  dash={[3, 3]}
                />
              </Group>
            )
          })}

          {/* Windows */}
          {planData.windows.map((window: any, index: number) => (
            <Line
              key={`window-${index}`}
              points={[
                window.x * calculatedScale + offsetX,
                window.y * calculatedScale + offsetY,
                window.x * calculatedScale + offsetX + window.width * calculatedScale,
                window.y * calculatedScale + offsetY,
              ]}
              stroke="#000000"
              strokeWidth={STROKE_CONFIG.canvas.windowStroke}
              lineCap="square"
            />
          ))}
        </Layer>

        {/* Interaction Layer - Handles and Feedback */}
        {selection.elementIds.length > 0 && (
          <Layer>
            {/* Preview geometry during drag */}
            {transform.isDragging && transform.previewGeometry && (
              <Group>
                <Rect
                  x={transform.previewGeometry.geometry.bounds.x * calculatedScale + offsetX}
                  y={transform.previewGeometry.geometry.bounds.y * calculatedScale + offsetY}
                  width={transform.previewGeometry.geometry.bounds.width * calculatedScale}
                  height={transform.previewGeometry.geometry.bounds.height * calculatedScale}
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dash={[5, 5]}
                  fill="transparent"
                />
                {/* Dimension label during resize */}
                <Text
                  x={transform.previewGeometry.geometry.bounds.x * calculatedScale + offsetX + 
                     (transform.previewGeometry.geometry.bounds.width * calculatedScale) / 2}
                  y={transform.previewGeometry.geometry.bounds.y * calculatedScale + offsetY - 20}
                  text={`${transform.previewGeometry.geometry.bounds.width.toFixed(1)}m × ${transform.previewGeometry.geometry.bounds.height.toFixed(1)}m`}
                  fontSize={12}
                  fontFamily="Arial, sans-serif"
                  fill="#1a1a1a"
                  align="center"
                  offsetX={(transform.previewGeometry.geometry.bounds.width * calculatedScale) / 2}
                  padding={4}
                />
                <Text
                  x={transform.previewGeometry.geometry.bounds.x * calculatedScale + offsetX + 
                     (transform.previewGeometry.geometry.bounds.width * calculatedScale) / 2}
                  y={transform.previewGeometry.geometry.bounds.y * calculatedScale + offsetY + 
                     (transform.previewGeometry.geometry.bounds.height * calculatedScale) / 2}
                  text={`${(transform.previewGeometry.geometry.bounds.width * transform.previewGeometry.geometry.bounds.height).toFixed(1)} m²`}
                  fontSize={11}
                  fontFamily="Arial, sans-serif"
                  fill="#666666"
                  align="center"
                  offsetX={(transform.previewGeometry.geometry.bounds.width * calculatedScale) / 2}
                />
              </Group>
            )}
            
            {/* Transform handles */}
            {renderTransformHandles(
              selection,
              planData,
              calculatedScale,
              offsetX,
              offsetY,
              stageScale,
              handleHandleDragStart,
              handleHandleDragMove,
              handleHandleDragEnd
            )}
          </Layer>
        )}
      </Stage>
    </div>
  )
}

// Grid rendering
function renderGrid(
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  scale: number,
  offsetX: number,
  offsetY: number,
  gridConfig: any
) {
  const gridLines: JSX.Element[] = []
  const majorSpacing = gridConfig.majorSpacing // 1.0m
  const minorSpacing = gridConfig.minorSpacing // 0.1m
  
  // Calculate grid bounds
  const startX = Math.floor(minX / majorSpacing) * majorSpacing
  const endX = Math.ceil(maxX / majorSpacing) * majorSpacing
  const startY = Math.floor(minY / majorSpacing) * majorSpacing
  const endY = Math.ceil(maxY / majorSpacing) * majorSpacing
  
  // Major grid lines (1.0m)
  for (let x = startX; x <= endX; x += majorSpacing) {
    gridLines.push(
      <Line
        key={`major-v-${x}`}
        points={[
          x * scale + offsetX,
          startY * scale + offsetY,
          x * scale + offsetX,
          endY * scale + offsetY,
        ]}
        stroke="#E0E0E0"
        strokeWidth={1}
      />
    )
  }
  
  for (let y = startY; y <= endY; y += majorSpacing) {
    gridLines.push(
      <Line
        key={`major-h-${y}`}
        points={[
          startX * scale + offsetX,
          y * scale + offsetY,
          endX * scale + offsetX,
          y * scale + offsetY,
        ]}
        stroke="#E0E0E0"
        strokeWidth={1}
      />
    )
  }
  
  return <>{gridLines}</>
}

// Transform handles rendering
function renderTransformHandles(
  selection: any,
  planData: any,
  scale: number,
  offsetX: number,
  offsetY: number,
  stageScale: number,
  onHandleDragStart: (handleType: string, pos: { x: number; y: number }) => void,
  onHandleDragMove: (pos: { x: number; y: number }) => void,
  onHandleDragEnd: () => void
) {
  const handles: JSX.Element[] = []
  const handleSize = 8 / stageScale // Constant screen size
  
  if (selection.type === 'room' && selection.elementIds.length > 0) {
    const roomIndex = parseInt(selection.elementIds[0].replace('room-', ''))
    const room = planData.rooms[roomIndex]
    
    if (room) {
      const x = room.x * scale + offsetX
      const y = room.y * scale + offsetY
      const w = room.width * scale
      const h = room.height * scale
      
      // 8 resize handles
      const handlePositions = [
        { x: x, y: y, type: 'top-left', cursor: 'nwse-resize' },
        { x: x + w, y: y, type: 'top-right', cursor: 'nesw-resize' },
        { x: x, y: y + h, type: 'bottom-left', cursor: 'nesw-resize' },
        { x: x + w, y: y + h, type: 'bottom-right', cursor: 'nwse-resize' },
        { x: x + w / 2, y: y, type: 'top-center', cursor: 'ns-resize' },
        { x: x + w / 2, y: y + h, type: 'bottom-center', cursor: 'ns-resize' },
        { x: x, y: y + h / 2, type: 'left-center', cursor: 'ew-resize' },
        { x: x + w, y: y + h / 2, type: 'right-center', cursor: 'ew-resize' },
      ]
      
      handlePositions.forEach((pos, idx) => {
        handles.push(
          <Rect
            key={`handle-${idx}`}
            x={pos.x - handleSize / 2}
            y={pos.y - handleSize / 2}
            width={handleSize}
            height={handleSize}
            fill="#3B82F6"
            stroke="#ffffff"
            strokeWidth={2 / stageScale}
            draggable
            onMouseEnter={(e) => {
              const stage = e.target.getStage()
              if (stage) {
                stage.container().style.cursor = pos.cursor
              }
            }}
            onMouseLeave={(e) => {
              const stage = e.target.getStage()
              if (stage) {
                stage.container().style.cursor = 'default'
              }
            }}
            onDragStart={(e) => {
              e.cancelBubble = true
              onHandleDragStart(pos.type, { x: e.target.x(), y: e.target.y() })
            }}
            onDragMove={(e) => {
              e.cancelBubble = true
              onHandleDragMove({ x: e.target.x(), y: e.target.y() })
            }}
            onDragEnd={(e) => {
              e.cancelBubble = true
              onHandleDragEnd()
            }}
          />
        )
      })
    }
  }
  
  return <>{handles}</>
}

// Furniture rendering (reuse from original component)
function renderFurnitureShape(
  item: string,
  room: any,
  index: number,
  scale: number,
  offsetX: number,
  offsetY: number
) {
  const roomX = room.x * scale + offsetX
  const roomY = room.y * scale + offsetY
  const roomWidth = room.width * scale
  const roomHeight = room.height * scale
  
  const padding = 15
  const positions = [
    { x: roomX + padding, y: roomY + padding },
    { x: roomX + roomWidth - 40, y: roomY + padding },
    { x: roomX + padding, y: roomY + roomHeight - 45 },
    { x: roomX + roomWidth - 40, y: roomY + roomHeight - 45 },
    { x: roomX + roomWidth / 2 - 15, y: roomY + padding },
    { x: roomX + roomWidth / 2 - 15, y: roomY + roomHeight - 45 },
  ]
  
  const pos = positions[index % positions.length]
  const type = item.toLowerCase()
  
  if (type === 'bed') {
    return (
      <>
        <Rect 
          x={pos.x} 
          y={pos.y} 
          width={30} 
          height={40} 
          fill="none" 
          stroke="#000000" 
          strokeWidth={STROKE_CONFIG.canvas.furnitureStroke} 
        />
        <Line
          points={[pos.x, pos.y, pos.x + 30, pos.y]}
          stroke="#666666"
          strokeWidth={STROKE_CONFIG.canvas.furnitureStroke}
        />
      </>
    )
  }
  
  if (type === 'sofa') {
    return (
      <>
        <Rect 
          x={pos.x} 
          y={pos.y} 
          width={35} 
          height={20} 
          fill="none" 
          stroke="#000000" 
          strokeWidth={STROKE_CONFIG.canvas.furnitureStroke} 
        />
        <Rect 
          x={pos.x} 
          y={pos.y} 
          width={35} 
          height={5} 
          fill="#000000" 
        />
      </>
    )
  }
  
  if (type.includes('table')) {
    return (
      <Circle 
        x={pos.x + 15} 
        y={pos.y + 15} 
        radius={12} 
        fill="none" 
        stroke="#000000" 
        strokeWidth={2} 
      />
    )
  }
  
  return (
    <Circle 
      x={pos.x + 10} 
      y={pos.y + 10} 
      radius={8} 
      fill="none" 
      stroke="#000000" 
      strokeWidth={STROKE_CONFIG.canvas.furnitureStroke} 
    />
  )
}
