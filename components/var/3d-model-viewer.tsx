"use client"

import { useRef, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Environment, useGLTF, Html } from "@react-three/drei"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react"
import type * as THREE from "three"

interface ModelViewerProps {
  modelUrl: string
  title?: string
  description?: string
  annotations?: Array<{
    id: string
    position: [number, number, number]
    content: string
  }>
  controls?: {
    enableZoom?: boolean
    enableRotate?: boolean
    enablePan?: boolean
    autoRotate?: boolean
  }
}

function Model({
  url,
  annotations,
  autoRotate,
}: {
  url: string
  annotations?: ModelViewerProps["annotations"]
  autoRotate?: boolean
}) {
  const { scene } = useGLTF(url)
  const modelRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (autoRotate && modelRef.current) {
      modelRef.current.rotation.y += 0.005
    }
  })

  return (
    <group ref={modelRef}>
      <primitive object={scene} scale={1} />
      {annotations?.map((annotation) => (
        <Html key={annotation.id} position={annotation.position} distanceFactor={10} occlude>
          <Card className="p-2 w-40 text-xs bg-background/80 backdrop-blur-sm">{annotation.content}</Card>
        </Html>
      ))}
    </group>
  )
}

function Controls({
  enableZoom = true,
  enableRotate = true,
  enablePan = true,
  autoRotate = false,
  setAutoRotate,
}: {
  enableZoom?: boolean
  enableRotate?: boolean
  enablePan?: boolean
  autoRotate?: boolean
  setAutoRotate: (value: boolean) => void
}) {
  const { camera } = useThree()
  const [zoom, setZoom] = useState(1)

  const handleZoomIn = () => {
    camera.position.z *= 0.8
    setZoom(zoom * 1.25)
  }

  const handleZoomOut = () => {
    camera.position.z *= 1.2
    setZoom(zoom * 0.8)
  }

  const handleReset = () => {
    camera.position.set(0, 0, 5)
    camera.rotation.set(0, 0, 0)
    setZoom(1)
  }

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-background/80 backdrop-blur-sm p-2 rounded-lg">
      {enableZoom && (
        <>
          <Button variant="ghost" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Slider
            value={[zoom]}
            min={0.1}
            max={2}
            step={0.1}
            className="w-24"
            onValueChange={(value) => {
              const newZoom = value[0]
              camera.position.z = 5 / newZoom
              setZoom(newZoom)
            }}
          />
          <Button variant="ghost" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </>
      )}
      <Button variant="ghost" size="icon" onClick={handleReset}>
        <RotateCcw className="h-4 w-4" />
      </Button>
      <Button variant={autoRotate ? "default" : "ghost"} size="icon" onClick={() => setAutoRotate(!autoRotate)}>
        {autoRotate ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </Button>
    </div>
  )
}

export function ModelViewer({
  modelUrl,
  title,
  description,
  annotations,
  controls = {
    enableZoom: true,
    enableRotate: true,
    enablePan: true,
    autoRotate: false,
  },
}: ModelViewerProps) {
  const [autoRotate, setAutoRotate] = useState(controls.autoRotate || false)
  const [activeTab, setActiveTab] = useState<string>("model")

  return (
    <div className="w-full h-[500px] relative">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="absolute top-4 left-4 z-10">
        <TabsList className="bg-background/80 backdrop-blur-sm">
          <TabsTrigger value="model">Model</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>
        <TabsContent
          value="info"
          className="absolute top-12 left-0 w-64 bg-background/80 backdrop-blur-sm p-4 rounded-lg"
        >
          {title && <h3 className="text-lg font-bold">{title}</h3>}
          {description && <p className="text-sm mt-2">{description}</p>}
          {annotations && annotations.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium">Annotations:</h4>
              <ul className="mt-2 space-y-2">
                {annotations.map((annotation) => (
                  <li key={annotation.id} className="text-xs">
                    {annotation.content}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <Model url={modelUrl} annotations={activeTab === "model" ? annotations : undefined} autoRotate={autoRotate} />
        <Environment preset="studio" />
        <OrbitControls
          enableZoom={controls.enableZoom}
          enableRotate={controls.enableRotate}
          enablePan={controls.enablePan}
          autoRotate={false} // We handle autoRotate manually
        />
      </Canvas>

      <Controls
        enableZoom={controls.enableZoom}
        enableRotate={controls.enableRotate}
        enablePan={controls.enablePan}
        autoRotate={autoRotate}
        setAutoRotate={setAutoRotate}
      />
    </div>
  )
}
