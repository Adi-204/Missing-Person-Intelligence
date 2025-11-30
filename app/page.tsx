"use client"

import { NavBar } from "@/components/nav-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Server, Network, Database, Video } from "lucide-react"

export default function DashboardPage() {
  // Mock data for system status
  const systemStatus = [
    {
      id: 1,
      title: "Face Recognition Specialist",
      status: "active",
      description: "AI engine processing facial detection & embeddings",
      icon: "face",
      percentage: 98,
    },
    {
      id: 2,
      title: "Multimodal Feature Analyst",
      status: "active",
      description: "Processing clothing, body features & text analysis",
      icon: "multimodal",
      percentage: 95,
    },
    {
      id: 3,
      title: "Fusion Layer",
      status: "active",
      description: "Weighted feature & score-level fusion engine",
      icon: "fusion",
      percentage: 100,
    },
    {
      id: 4,
      title: "Live CCTV Streams",
      status: "active",
      description: "847 active streams connected",
      icon: "cctv",
      percentage: 89,
    },
  ]

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">System Overview</h2>
            <p className="text-muted-foreground">Real-time status of all AI branches and data sources</p>
          </div>

          {/* Status Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {systemStatus.map((item) => (
              <Card key={item.id} className="border border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-semibold">{item.title}</CardTitle>
                    <Badge className="bg-green-100/20 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium">System Health</span>
                      <span className="text-muted-foreground">{item.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* AI Branches Description */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Branch 1: Face Recognition */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Server className="w-5 h-5 text-primary" />
                  Face Recognition Specialist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-2">Technology Stack</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        <strong>MTCNN:</strong> Face detection & alignment
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        <strong>FaceNet:</strong> 128D facial embeddings
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        <strong>Cosine Similarity:</strong> Face matching
                      </span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Branch 2: Multimodal Feature Analyst */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Network className="w-5 h-5 text-primary" />
                  Multimodal Feature Analyst
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-2">Technology Stack</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        <strong>YOLO v8:</strong> Clothing & body feature detection
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        <strong>NLP (HART):</strong> Text insight extraction
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        <strong>LDA:</strong> Topic modeling from reports
                      </span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Fusion Layer */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Fusion Layer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-2">Architecture</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        <strong>Feature-Level Fusion:</strong> Concatenation of embeddings
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        <strong>Score-Level Fusion:</strong> Weighted average matching
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        <strong>Kafka Pipelines:</strong> Real-time data streaming
                      </span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Flow & CTA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real-time Data Flow Placeholder */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  Real-Time Data Flow
                </CardTitle>
                <CardDescription>System architecture overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded border-2 border-primary/30 flex items-center justify-center bg-primary/5">
                      <span className="text-xs font-semibold text-primary text-center">
                        CCTV
                        <br />
                        Sources
                      </span>
                    </div>
                    <div className="text-2xl text-muted-foreground">→</div>
                    <div className="w-20 h-20 rounded border-2 border-primary/30 flex items-center justify-center bg-primary/5">
                      <span className="text-xs font-semibold text-primary text-center">
                        Kafka
                        <br />
                        Pipeline
                      </span>
                    </div>
                    <div className="text-2xl text-muted-foreground">→</div>
                    <div className="w-20 h-20 rounded border-2 border-primary/30 flex items-center justify-center bg-primary/5">
                      <span className="text-xs font-semibold text-primary text-center">
                        AI
                        <br />
                        Branches
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-2xl text-muted-foreground">↓</div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-24 h-20 rounded border-2 border-primary/30 flex items-center justify-center bg-primary/5">
                      <span className="text-xs font-semibold text-primary text-center">
                        Fusion
                        <br />
                        Engine
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card className="border border-border flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">Begin Investigation</CardTitle>
                <CardDescription>Start a missing person search across all sources</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end gap-4">
                <p className="text-sm text-muted-foreground">
                  Upload a photo and details to search across active CCTV feeds, social media reports, and connected
                  databases.
                </p>
                <Link href="/search" className="w-full">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    Go to Missing Person Search
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}
