"use client"

import type React from "react"

import { NavBar } from "@/components/nav-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Upload, Lock, AlertCircle, X, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"

const API_URL = "http://localhost:8000"

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [loginError, setLoginError] = useState("")
  const [uploadData, setUploadData] = useState({
    department: "",
    location: "",
    timeWindow: "2hours",
    files: [] as File[],
  })
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)

  // Fetch uploaded videos when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchUploadedVideos()
    }
  }, [isLoggedIn])

  const fetchUploadedVideos = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/videos`)
      const data = await response.json()
      if (data.success) {
        setUploadedFiles(data.videos)
      }
    } catch (error) {
      console.error("Error fetching videos:", error)
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")

    const validEmail = "officer@police.gov"
    const validPassword = "1234"

    if (loginData.email === validEmail && loginData.password === validPassword) {
      setIsLoggedIn(true)
      setLoginError("")
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

  const handleUpload = async () => {
    if (!uploadData.department || !uploadData.location || uploadData.files.length === 0) {
      return
    }

    setIsUploading(true)

    for (const file of uploadData.files) {
      const fileName = file.name
      
      try {
        // Create form data
        const formData = new FormData()
        formData.append("video", file)
        formData.append("department", uploadData.department)
        formData.append("location", uploadData.location)
        formData.append("time_window", uploadData.timeWindow)

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const current = prev[fileName] || 0
            const next = Math.min(current + Math.random() * 15, 95)
            return { ...prev, [fileName]: next }
          })
        }, 300)

        // Upload to backend
        const response = await fetch(`${API_URL}/admin/upload-video`, {
          method: "POST",
          body: formData,
        })

        clearInterval(progressInterval)

        if (response.ok) {
          const data = await response.json()
          
          // Set progress to 100%
          setUploadProgress((prev) => ({ ...prev, [fileName]: 100 }))
          
          // Add to uploaded files list
          setUploadedFiles((prev) => [data.metadata, ...prev])
          
          console.log("Upload successful:", data)
        } else {
          const error = await response.json()
          console.error("Upload failed:", error)
          alert(`Failed to upload ${fileName}: ${error.detail}`)
        }
      } catch (error) {
        console.error("Upload error:", error)
        alert(`Error uploading ${fileName}`)
      }
    }

    // Reset form
    setTimeout(() => {
      setUploadData({ department: "", location: "", timeWindow: "2hours", files: [] })
      setUploadProgress({})
      setIsUploading(false)
    }, 1000)
  }

  const handleDelete = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this video?")) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/admin/videos/${videoId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setUploadedFiles((prev) => prev.filter((v) => v.id !== videoId))
        alert("Video deleted successfully")
      } else {
        const error = await response.json()
        alert(`Failed to delete: ${error.detail}`)
      }
    } catch (error) {
      console.error("Delete error:", error)
      alert("Error deleting video")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100/20 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
            Completed
          </Badge>
        )
      case "processing":
        return (
          <Badge className="bg-blue-100/20 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
            Processing
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-100/20 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">Failed</Badge>
        )
      default:
        return null
    }
  }

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + " MB"
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
                Department Login
              </CardTitle>
              <CardDescription>CCTV Upload Portal - Restricted Access</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    Police Department Email
                  </Label>
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
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
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

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  Sign In
                </Button>
              </form>
              <div className="mt-6 p-4 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded text-xs text-blue-900 dark:text-blue-400">
                Demo credentials: officer@police.gov / 1234
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
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground">CCTV Upload & Processing</h2>
              <p className="text-muted-foreground">Manage department video uploads and processing status</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsLoggedIn(false)
                setLoginData({ email: "", password: "" })
                setLoginError("")
              }}
            >
              Sign Out
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="border border-border">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Videos</p>
                  <p className="text-3xl font-bold text-primary mt-2">{uploadedFiles.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Size</p>
                  <p className="text-3xl font-bold text-primary mt-2">
                    {formatFileSize(uploadedFiles.reduce((acc, v) => acc + (v.size || 0), 0))}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">API Status</p>
                  <p className="text-lg font-bold text-green-600 mt-2">● Connected</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upload Section */}
          <Card className="border border-border mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Upload CCTV Footage</CardTitle>
              <CardDescription>Submit video files from your department for processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Department */}
                <div>
                  <Label htmlFor="department" className="text-sm font-medium">
                    Police Department / Station Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="department"
                    placeholder="Downtown Police Station"
                    value={uploadData.department}
                    onChange={(e) => setUploadData({ ...uploadData, department: e.target.value })}
                    className="mt-2"
                  />
                </div>

                {/* Location */}
                <div>
                  <Label htmlFor="location" className="text-sm font-medium">
                    Location / Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="location"
                    placeholder="Main Street, Downtown"
                    value={uploadData.location}
                    onChange={(e) => setUploadData({ ...uploadData, location: e.target.value })}
                    className="mt-2"
                  />
                </div>

                {/* Time Window */}
                <div>
                  <Label htmlFor="timeWindow" className="text-sm font-medium">
                    Time Window <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="timeWindow"
                    value={uploadData.timeWindow}
                    onChange={(e) => setUploadData({ ...uploadData, timeWindow: e.target.value })}
                    className="w-full mt-2 px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
                  >
                    <option value="1hour">Last 1 Hour</option>
                    <option value="2hours">Last 2 Hours</option>
                    <option value="3hours">Last 3 Hours</option>
                  </select>
                </div>

                {/* File Count */}
                <div>
                  <Label className="text-sm font-medium">Files Selected: {uploadData.files.length}</Label>
                  <div className="mt-2 p-3 rounded-md border border-input bg-secondary/5">
                    <p className="text-sm text-muted-foreground">
                      {uploadData.files.length === 0 ? "No files selected" : `${uploadData.files.length} file(s) ready`}
                    </p>
                  </div>
                </div>
              </div>

              {/* File Upload Area */}
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors bg-secondary/5">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">Drag video files here or click to browse</p>
                <p className="text-xs text-muted-foreground mb-4">MP4, MOV, AVI (up to 5GB per file)</p>
                <input
                  type="file"
                  multiple
                  accept=".mp4,.avi,.mkv,.mov"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="video-upload"
                />
                <Label htmlFor="video-upload" className="cursor-pointer">
                  <Button variant="outline" className="cursor-pointer bg-transparent" asChild>
                    <span>Select Files</span>
                  </Button>
                </Label>
              </div>

              {uploadData.files.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Selected Files</Label>
                  <div className="space-y-2">
                    {uploadData.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-secondary/5 rounded-md border border-input"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="ml-4 p-1 hover:bg-secondary rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(uploadProgress).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Upload Progress</Label>
                  <div className="space-y-3">
                    {Object.entries(uploadProgress).map(([fileName, progress]) => (
                      <div key={fileName} className="space-y-1">
                        <div className="flex justify-between">
                          <p className="text-sm text-foreground truncate">{fileName}</p>
                          <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
                        </div>
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11"
                disabled={
                  !uploadData.department ||
                  !uploadData.location ||
                  uploadData.files.length === 0 ||
                  isUploading
                }
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload & Process Videos"}
              </Button>
            </CardContent>
          </Card>

          {/* Upload History */}
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-lg">Upload History</CardTitle>
              <CardDescription>Previously submitted CCTV files and their processing status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left font-semibold text-foreground py-3 px-4">File Name</th>
                      <th className="text-left font-semibold text-foreground py-3 px-4">Department</th>
                      <th className="text-left font-semibold text-foreground py-3 px-4">Location</th>
                      <th className="text-left font-semibold text-foreground py-3 px-4">Size</th>
                      <th className="text-left font-semibold text-foreground py-3 px-4">Upload Date</th>
                      <th className="text-left font-semibold text-foreground py-3 px-4">Status</th>
                      <th className="text-left font-semibold text-foreground py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedFiles.map((upload) => (
                      <tr key={upload.id} className="border-b border-border hover:bg-secondary/5 transition-colors">
                        <td className="py-4 px-4 text-muted-foreground font-mono text-xs">{upload.filename}</td>
                        <td className="py-4 px-4 text-foreground text-sm">{upload.department}</td>
                        <td className="py-4 px-4 text-muted-foreground text-xs">{upload.location}</td>
                        <td className="py-4 px-4 text-muted-foreground text-xs">
                          {upload.size ? formatFileSize(upload.size) : "N/A"}
                        </td>
                        <td className="py-4 px-4 text-muted-foreground text-xs">
                          {new Date(upload.upload_date).toLocaleString()}
                        </td>
                        <td className="py-4 px-4">{getStatusBadge(upload.status)}</td>
                        <td className="py-4 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(upload.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {uploadedFiles.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No videos uploaded yet. Upload your first video above.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}