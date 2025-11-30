"use client"

import type React from "react"

import { NavBar } from "@/components/nav-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Upload, Search, AlertCircle } from "lucide-react"
import { useState } from "react"

export default function SearchPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    clothing: "",
    gender: "",
    height: "",
    ageRange: [18, 65],
    notes: "",
  })

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSearch = () => {
    console.log("Search initiated with data:", { ...formData, image: imagePreview ? "uploaded" : "none" })
  }

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Missing Person Search</h2>
            <p className="text-muted-foreground">
              Upload details and search across CCTV feeds, reports, and social media
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Upload & Input Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Upload Card */}
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Upload Photo</CardTitle>
                  <CardDescription>Drag & drop or click to upload image</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDragDrop}
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-secondary/5"
                  >
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Preview"
                          className="w-full max-h-64 object-cover rounded"
                        />
                        <Button variant="outline" onClick={() => setImagePreview(null)} className="w-full">
                          Remove Image
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm font-medium text-foreground mb-1">Drag image here or click to browse</p>
                        <p className="text-xs text-muted-foreground mb-4">PNG, JPG up to 10MB</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <Label htmlFor="image-upload" className="cursor-pointer">
                          <Button variant="outline" className="cursor-pointer bg-transparent" asChild>
                            <span>Browse Files</span>
                          </Button>
                        </Label>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Person Details Card */}
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Person Details</CardTitle>
                  <CardDescription>Provide information to refine search</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-foreground">
                      Full Name <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <Label htmlFor="location" className="text-sm font-medium text-foreground">
                      Last Seen Location <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <Input
                      id="location"
                      placeholder="City, District, Landmark"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  {/* Clothing Description */}
                  <div>
                    <Label htmlFor="clothing" className="text-sm font-medium text-foreground">
                      Clothing Description <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <Input
                      id="clothing"
                      placeholder="Blue jacket, black pants, white shoes"
                      value={formData.clothing}
                      onChange={(e) => setFormData({ ...formData, clothing: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <Label htmlFor="gender" className="text-sm font-medium text-foreground">
                      Gender <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full mt-2 px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Height */}
                  <div>
                    <Label htmlFor="height" className="text-sm font-medium text-foreground">
                      Height <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <Input
                      id="height"
                      placeholder="e.g., 5'10 or 178 cm"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  {/* Age Range Slider */}
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-4 block">
                      Age Range: {formData.ageRange[0]} - {formData.ageRange[1]} years
                    </Label>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={formData.ageRange}
                      onValueChange={(value) => setFormData({ ...formData, ageRange: value as [number, number] })}
                      className="w-full"
                    />
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <Label htmlFor="notes" className="text-sm font-medium text-foreground">
                      Additional Notes <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <textarea
                      id="notes"
                      placeholder="Any additional information relevant to the search..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full mt-2 px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm resize-none h-24"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: System Info & Search */}
            <div className="space-y-6">
              {/* System Processing Info */}
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="text-base">How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">1</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">OpenCV Preprocessing</p>
                        <p className="text-xs text-muted-foreground mt-1">Image enhancement & noise reduction</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">2</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">MTCNN Face Detection</p>
                        <p className="text-xs text-muted-foreground mt-1">Detect & align facial features</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">3</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">FaceNet Embeddings</p>
                        <p className="text-xs text-muted-foreground mt-1">Generate 128D facial signature</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">4</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Kafka Streaming</p>
                        <p className="text-xs text-muted-foreground mt-1">Route through real-time pipelines</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">5</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">EAR Model Fusion</p>
                        <p className="text-xs text-muted-foreground mt-1">Unified schema matching across sources</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Alert */}
              <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900 dark:text-blue-400">
                  All searches are encrypted and logged for official investigations only.
                </p>
              </div>

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 text-base"
                disabled={!imagePreview}
              >
                <Search className="w-4 h-4 mr-2" />
                Run Search Across All Sources
              </Button>
            </div>
          </div>

          {/* Results Section Placeholder */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-foreground mb-6">Search Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Result Categories */}
              {[
                { category: "Matching Faces", count: 0, icon: "👤" },
                { category: "Clothing Matches", count: 0, icon: "👕" },
                { category: "Text/Social Media", count: 0, icon: "📱" },
                { category: "Timeline Matches", count: 0, icon: "⏰" },
              ].map((item) => (
                <Card key={item.category} className="border border-border">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-4xl mb-2">{item.icon}</div>
                      <p className="text-sm font-medium text-foreground">{item.category}</p>
                      <p className="text-2xl font-bold text-primary mt-2">{item.count}</p>
                      <p className="text-xs text-muted-foreground mt-1">Upload to begin search</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
