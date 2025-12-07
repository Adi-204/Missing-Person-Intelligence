"use client"

import type React from "react"
import { NavBar } from "@/components/nav-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Upload, Lock, AlertCircle, X, Trash2, Search, CheckCircle, Users, Video } from "lucide-react"
import { useState, useEffect } from "react"

const API_URL = "http://localhost:8000"

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [loginError, setLoginError] = useState("")
  const [activeTab, setActiveTab] = useState<"search" | "videos" | "upload">("search")
  
  // Video upload state
  const [uploadData, setUploadData] = useState({
    department: "",
    location: "",
    timeWindow: "2hours",
    files: [] as File[],
  })
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [isUploading, setIsUploading] = useState(false)
  
  // Data state
  const [missingPersons, setMissingPersons] = useState<any[]>([])
  const [videos, setVideos] = useState<any[]>([])
  const [searchHistory, setSearchHistory] = useState<any[]>([])
  
  // Search state
  const [selectedPerson, setSelectedPerson] = useState<string>("")
  const [selectedVideo, setSelectedVideo] = useState<string>("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<any>(null)

  useEffect(() => {
    if (isLoggedIn) {
      fetchData()
    }
  }, [isLoggedIn])

  const fetchData = async () => {
    try {
      const [personsRes, videosRes, historyRes] = await Promise.all([
        fetch(`${API_URL}/admin/missing-persons`),
        fetch(`${API_URL}/admin/videos`),
        fetch(`${API_URL}/admin/search-history`)
      ])
      
      const personsData = await personsRes.json()
      const videosData = await videosRes.json()
      const historyData = await historyRes.json()
      
      if (personsData.success) setMissingPersons(personsData.missing_persons)
      if (videosData.success) setVideos(videosData.videos)
      if (historyData.success) setSearchHistory(historyData.results)
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const validEmail = "officer@police.gov"
    const validPassword = "1234"

    if (loginData.email === validEmail && loginData.password === validPassword) {
      setIsLoggedIn(true)
    } else {
      setLoginError("Invalid credentials. Access restricted to authorized officers.")
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadData({ ...uploadData, files: [...uploadData.files, ...files] })
  }

  const removeFile = (index: number) => {
    const newFiles = uploadData.files.filter((_, i) => i !== index)
    setUploadData({ ...uploadData, files: newFiles })
  }

  const handleVideoUpload = async () => {
    if (!uploadData.department || !uploadData.location || uploadData.files.length === 0) return

    setIsUploading(true)

    for (const file of uploadData.files) {
      const fileName = file.name
      
      try {
        const formData = new FormData()
        formData.append("video", file)
        formData.append("department", uploadData.department)
        formData.append("location", uploadData.location)
        formData.append("time_window", uploadData.timeWindow)

        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const current = prev[fileName] || 0
            const next = Math.min(current + Math.random() * 15, 95)
            return { ...prev, [fileName]: next }
          })
        }, 300)

        const response = await fetch(`${API_URL}/admin/upload-video`, {
          method: "POST",
          body: formData,
        })

        clearInterval(progressInterval)

        if (response.ok) {
          setUploadProgress((prev) => ({ ...prev, [fileName]: 100 }))
          await fetchData()
        } else {
          alert(`Failed to upload ${fileName}`)
        }
      } catch (error) {
        console.error("Upload error:", error)
      }
    }

    setTimeout(() => {
      setUploadData({ department: "", location: "", timeWindow: "2hours", files: [] })
      setUploadProgress({})
      setIsUploading(false)
    }, 1000)
  }

  const handleSearch = async () => {
    if (!selectedPerson || !selectedVideo) {
      alert("Please select both a missing person and a video")
      return
    }

    setIsSearching(true)
    setSearchResult(null)

    try {
      const formData = new FormData()
      formData.append("person_id", selectedPerson)
      formData.append("video_id", selectedVideo)

      const response = await fetch(`${API_URL}/admin/search`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const blob = await response.blob()
        const imageUrl = URL.createObjectURL(blob)

        // Extract metadata from response headers
        const personName = response.headers.get("X-Person-Name") || "Unknown"
        const videoFilename = response.headers.get("X-Video-Filename") || "Unknown"
        const location = response.headers.get("X-Location") || "Unknown"
        const department = response.headers.get("X-Department") || "Unknown"
        const searchTimestamp = response.headers.get("X-Search-Timestamp") || new Date().toISOString()
        const videoTimestamp = response.headers.get("X-Video-Timestamp") || "00:00"
        const lastSeenLocation = response.headers.get("X-Last-Seen-Location") || "Unknown"
        const shirtColor = response.headers.get("X-Shirt-Color") || "Unknown"
        const pantColor = response.headers.get("X-Pant-Color") || "Unknown"

        setSearchResult({
          found: true,
          imageUrl,
          personName,
          videoFilename,
          location,
          department,
          searchTimestamp,
          videoTimestamp,
          lastSeenLocation,
          shirtColor,
          pantColor,
        })

        await fetchData()
      } else {
        const error = await response.json()
        setSearchResult({
          found: false,
          message: error.detail,
        })
      }
    } catch (error) {
      console.error("Search error:", error)
      setSearchResult({
        found: false,
        message: "Error connecting to server",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm("Delete this video?")) return

    try {
      const response = await fetch(`${API_URL}/admin/videos/${videoId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error("Delete error:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100/20 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">Pending</Badge>
      case "found":
        return <Badge className="bg-green-100/20 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">Found</Badge>
      case "ready":
        return <Badge className="bg-blue-100/20 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">Ready</Badge>
      default:
        return null
    }
  }

  if (!isLoggedIn) {
    return (
      <>
        <NavBar />
        <main className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="border border-border w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Lock className="w-6 h-6 text-primary" />
                Admin Login
              </CardTitle>
              <CardDescription>Authorized Personnel Only</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="officer@police.gov"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="mt-2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="mt-2"
                    required
                  />
                </div>

                {loginError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-700 dark:text-red-400">{loginError}</p>
                  </div>
                )}

                <Button type="submit" className="w-full">Sign In</Button>
              </form>
              <div className="mt-6 p-4 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded text-xs text-blue-900 dark:text-blue-400">
                Demo: officer@police.gov / 1234
              </div>
            </CardContent>
          </Card>
        </main>
      </>
    )
  }

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Admin Dashboard</h2>
              <p className="text-muted-foreground">Manage missing persons and search CCTV footage</p>
            </div>
            <Button variant="outline" onClick={() => setIsLoggedIn(false)}>Sign Out</Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="border border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Users className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{missingPersons.length}</p>
                    <p className="text-xs text-muted-foreground">Missing Persons</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Video className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{videos.length}</p>
                    <p className="text-xs text-muted-foreground">CCTV Videos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Search className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{searchHistory.length}</p>
                    <p className="text-xs text-muted-foreground">Searches</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{searchHistory.filter(r => r.status === "match_found").length}</p>
                    <p className="text-xs text-muted-foreground">Matches Found</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-border">
            <button
              onClick={() => setActiveTab("search")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "search"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Search
            </button>
            <button
              onClick={() => setActiveTab("videos")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "videos"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Videos
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "upload"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Upload Video
            </button>
          </div>

          {/* SEARCH TAB */}
          {activeTab === "search" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle>Select Missing Person</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <select
                      value={selectedPerson}
                      onChange={(e) => setSelectedPerson(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
                    >
                      <option value="">Choose a person...</option>
                      {missingPersons.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.name} - {person.last_seen_location} ({person.shirt_color} shirt)
                        </option>
                      ))}
                    </select>
                  </CardContent>
                </Card>

                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle>Select Video to Search</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <select
                      value={selectedVideo}
                      onChange={(e) => setSelectedVideo(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
                    >
                      <option value="">Choose a video...</option>
                      {videos.map((video) => (
                        <option key={video.id} value={video.id}>
                          {video.filename} - {video.location} ({video.department})
                        </option>
                      ))}
                    </select>
                  </CardContent>
                </Card>

                <Button
                  onClick={handleSearch}
                  className="w-full h-12 text-base"
                  disabled={!selectedPerson || !selectedVideo || isSearching}
                >
                  {isSearching ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Run Search
                    </>
                  )}
                </Button>

                {searchResult && (
                  <Card className="border border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {searchResult.found ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            Match Found!
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            No Match
                          </>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {searchResult.found ? (
                        <div className="space-y-4">
                          <img src={searchResult.imageUrl} alt="Match" className="w-full rounded border border-border" />
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-4 space-y-3">
                            <h4 className="font-semibold text-green-900 dark:text-green-400 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Match Details
                            </h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs">Person Name</p>
                                <p className="font-medium text-foreground">{searchResult.personName}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Last Seen</p>
                                <p className="font-medium text-foreground">{searchResult.lastSeenLocation}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Video File</p>
                                <p className="font-medium text-foreground truncate" title={searchResult.videoFilename}>
                                  {searchResult.videoFilename}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Camera Location</p>
                                <p className="font-medium text-foreground">{searchResult.location}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Department</p>
                                <p className="font-medium text-foreground">{searchResult.department}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Search Timestamp</p>
                                <p className="font-medium text-foreground">
                                  {new Date(searchResult.searchTimestamp).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Shirt Color</p>
                                <p className="font-medium text-foreground capitalize">{searchResult.shirtColor}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Pant Color</p>
                                <p className="font-medium text-foreground capitalize">
                                  {searchResult.pantColor === "none" ? "Unknown" : searchResult.pantColor}
                                </p>
                              </div>
                            </div>
                          </div>
                          <Button 
                            className="w-full"
                            onClick={() => {
                              const link = document.createElement('a')
                              link.href = searchResult.imageUrl
                              link.download = `match_${searchResult.personName}_${new Date().getTime()}.jpg`
                              link.click()
                            }}
                          >
                            Download Match Image
                          </Button>
                        </div>
                      ) : (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4">
                          <p className="text-sm text-red-900 dark:text-red-400">{searchResult.message}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              <div>
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="text-base">Missing Persons List</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {missingPersons.map((person) => (
                        <div key={person.id} className="p-3 bg-secondary/5 rounded border border-border">
                          <p className="font-semibold text-sm">{person.name}</p>
                          <p className="text-xs text-muted-foreground">{person.last_seen_location}</p>
                          <div className="flex items-center justify-between mt-2">
                            {getStatusBadge(person.status)}
                            <span className="text-xs text-muted-foreground">{person.search_count} searches</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* VIDEOS TAB */}
          {activeTab === "videos" && (
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>CCTV Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4">Filename</th>
                        <th className="text-left py-3 px-4">Department</th>
                        <th className="text-left py-3 px-4">Location</th>
                        <th className="text-left py-3 px-4">Size</th>
                        <th className="text-left py-3 px-4">Searches</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {videos.map((video) => (
                        <tr key={video.id} className="border-b border-border hover:bg-secondary/5">
                          <td className="py-4 px-4">{video.filename}</td>
                          <td className="py-4 px-4">{video.department}</td>
                          <td className="py-4 px-4">{video.location}</td>
                          <td className="py-4 px-4">{(video.size / 1024 / 1024).toFixed(2)} MB</td>
                          <td className="py-4 px-4">{video.search_count}</td>
                          <td className="py-4 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteVideo(video.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* UPLOAD TAB */}
          {activeTab === "upload" && (
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>Upload CCTV Footage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Department *</Label>
                    <Input
                      value={uploadData.department}
                      onChange={(e) => setUploadData({ ...uploadData, department: e.target.value })}
                      placeholder="Police Station"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Location *</Label>
                    <Input
                      value={uploadData.location}
                      onChange={(e) => setUploadData({ ...uploadData, location: e.target.value })}
                      placeholder="Main Street"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Time Window</Label>
                    <select
                      value={uploadData.timeWindow}
                      onChange={(e) => setUploadData({ ...uploadData, timeWindow: e.target.value })}
                      className="w-full mt-2 px-3 py-2 rounded-md border border-input bg-background"
                    >
                      <option value="1hour">Last 1 Hour</option>
                      <option value="2hours">Last 2 Hours</option>
                      <option value="3hours">Last 3 Hours</option>
                    </select>
                  </div>
                </div>

                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors bg-secondary/5">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium mb-1">Select video files</p>
                  <p className="text-xs text-muted-foreground mb-4">MP4, MOV, AVI</p>
                  <input
                    type="file"
                    multiple
                    accept=".mp4,.avi,.mkv,.mov"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="video-upload"
                  />
                  <Label htmlFor="video-upload">
                    <Button variant="outline" asChild>
                      <span>Browse</span>
                    </Button>
                  </Label>
                </div>

                {uploadData.files.length > 0 && (
                  <div className="space-y-2">
                    {uploadData.files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-secondary/5 rounded border border-border">
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button onClick={() => removeFile(idx)}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {Object.keys(uploadProgress).length > 0 && (
                  <div className="space-y-2">
                    {Object.entries(uploadProgress).map(([name, progress]) => (
                      <div key={name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{name}</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full h-2 bg-secondary rounded-full">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  onClick={handleVideoUpload}
                  className="w-full"
                  disabled={!uploadData.department || !uploadData.location || uploadData.files.length === 0 || isUploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? "Uploading..." : "Upload Videos"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  )
}