"use client"

import type React from "react"

import { NavBar } from "@/components/nav-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Search, AlertCircle, CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"

const API_URL = "http://localhost:8000"

export default function SearchPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [shirtColor, setShirtColor] = useState("")
  const [pantColor, setPantColor] = useState("none")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<any>(null)
  const [availableVideos, setAvailableVideos] = useState<any[]>([])

  // Fetch available videos on mount
  useEffect(() => {
    fetchAvailableVideos()
  }, [])

  const fetchAvailableVideos = async () => {
    try {
      const response = await fetch(`${API_URL}/search/available-videos`)
      const data = await response.json()
      if (data.success) {
        setAvailableVideos(data.videos)
      }
    } catch (error) {
      console.error("Error fetching videos:", error)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
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
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSearch = async () => {
    if (!imageFile || !shirtColor) {
      alert("Please upload an image and select shirt color")
      return
    }

    if (availableVideos.length === 0) {
      alert("No videos available for search. Please ask admin to upload CCTV footage first.")
      return
    }

    setIsSearching(true)
    setSearchResult(null)

    try {
      const formData = new FormData()
      formData.append("target_photo", imageFile)
      formData.append("shirt_color", shirtColor)
      formData.append("pant_color", pantColor)

      const response = await fetch(`${API_URL}/search-missing-person`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        // Get the image blob
        const blob = await response.blob()
        const imageUrl = URL.createObjectURL(blob)

        // Get metadata from headers
        const videoId = response.headers.get("X-Video-ID")
        const filename = response.headers.get("X-Video-Filename")
        const location = response.headers.get("X-Location")
        const department = response.headers.get("X-Department")

        setSearchResult({
          imageUrl,
          found: true,
          videoId,
          filename,
          location,
          department,
        })
      } else {
        const error = await response.json()
        setSearchResult({
          found: false,
          message: error.detail || "No match found",
        })
      }
    } catch (error) {
      console.error("Search error:", error)
      setSearchResult({
        found: false,
        message: "Error connecting to server. Please try again.",
      })
    } finally {
      setIsSearching(false)
    }
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
              Upload a photo and search across {availableVideos.length} CCTV footage(s)
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Upload & Input Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Upload Card */}
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Upload Photo</CardTitle>
                  <CardDescription>Upload a clear photo of the missing person</CardDescription>
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
                          src={imagePreview}
                          alt="Preview"
                          className="w-full max-h-64 object-cover rounded"
                        />
                        <Button variant="outline" onClick={() => {
                          setImagePreview(null)
                          setImageFile(null)
                        }} className="w-full">
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

              {/* Clothing Details Card */}
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Clothing Description</CardTitle>
                  <CardDescription>Provide clothing details to refine the search</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Shirt Color */}
                  <div>
                    <Label htmlFor="shirtColor" className="text-sm font-medium text-foreground">
                      👕 Shirt Color <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="shirtColor"
                      value={shirtColor}
                      onChange={(e) => setShirtColor(e.target.value)}
                      className="w-full mt-2 px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
                    >
                      <option value="">Select shirt color...</option>
                      <option value="black">Black</option>
                      <option value="white">White</option>
                      <option value="grey">Grey</option>
                      <option value="red">Red</option>
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="yellow">Yellow</option>
                      <option value="beige">Beige</option>
                      <option value="orange">Orange</option>
                      <option value="navy">Navy</option>
                    </select>
                  </div>

                  {/* Pant Color */}
                  <div>
                    <Label htmlFor="pantColor" className="text-sm font-medium text-foreground">
                      👖 Pant Color <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <select
                      id="pantColor"
                      value={pantColor}
                      onChange={(e) => setPantColor(e.target.value)}
                      className="w-full mt-2 px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
                    >
                      <option value="none">None / Unknown</option>
                      <option value="black">Black</option>
                      <option value="white">White</option>
                      <option value="grey">Grey</option>
                      <option value="red">Red</option>
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="yellow">Yellow</option>
                      <option value="beige">Beige</option>
                      <option value="orange">Orange</option>
                      <option value="navy">Navy</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Search Result */}
              {searchResult && (
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {searchResult.found ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          Match Found!
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          No Match Found
                        </>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {searchResult.found ? (
                      <div className="space-y-4">
                        <img
                          src={searchResult.imageUrl}
                          alt="Match Result"
                          className="w-full rounded-lg border border-border"
                        />
                        <div className="bg-secondary/5 rounded-lg p-4 space-y-2">
                          <p className="text-sm">
                            <span className="font-semibold">Video:</span> {searchResult.filename}
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">Location:</span> {searchResult.location}
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">Department:</span> {searchResult.department}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4">
                        <p className="text-sm text-red-900 dark:text-red-400">
                          {searchResult.message}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: System Info & Search */}
            <div className="space-y-6">
              {/* Available Videos */}
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="text-base">Available Videos</CardTitle>
                  <CardDescription>{availableVideos.length} video(s) will be searched</CardDescription>
                </CardHeader>
                <CardContent>
                  {availableVideos.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {availableVideos.map((video) => (
                        <div key={video.id} className="p-3 bg-secondary/5 rounded-lg border border-border">
                          <p className="text-xs font-semibold text-foreground truncate">{video.filename}</p>
                          <p className="text-xs text-muted-foreground mt-1">{video.location}</p>
                          <p className="text-xs text-muted-foreground">{video.department}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No videos available</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ask admin to upload CCTV footage
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* System Processing Info */}
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="text-base">How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">1</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Face Detection</p>
                        <p className="text-xs text-muted-foreground mt-1">MTCNN detects faces in photo</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">2</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Embedding Generation</p>
                        <p className="text-xs text-muted-foreground mt-1">FaceNet creates face signature</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">3</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Video Search</p>
                        <p className="text-xs text-muted-foreground mt-1">Scan all uploaded videos</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">4</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Clothing Match</p>
                        <p className="text-xs text-muted-foreground mt-1">Color detection verification</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">5</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Result Fusion</p>
                        <p className="text-xs text-muted-foreground mt-1">70% face + 30% clothing score</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Alert */}
              <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900 dark:text-blue-400">
                  All searches are encrypted and logged for official investigations only.
                </p>
              </div>

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 text-base"
                disabled={!imageFile || !shirtColor || isSearching || availableVideos.length === 0}
              >
                {isSearching ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search Across {availableVideos.length} Video(s)
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}