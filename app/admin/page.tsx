"use client"

import type React from "react"

import { NavBar } from "@/components/nav-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Upload, Lock, AlertCircle, X } from "lucide-react"
import { useState } from "react"

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
  const [uploadedFiles, setUploadedFiles] = useState([
    {
      id: 1,
      filename: "downtown_station_2024_01_15.mp4",
      department: "Downtown Police Station",
      timeRange: "2024-01-15 14:00 - 16:00",
      status: "completed",
      uploadDate: "2024-01-15 16:30",
    },
    {
      id: 2,
      filename: "airport_terminal_2024_01_15.mp4",
      department: "Airport Security Unit",
      timeRange: "2024-01-15 10:00 - 12:00",
      status: "processing",
      uploadDate: "2024-01-15 12:15",
    },
    {
      id: 3,
      filename: "highway_interchange_2024_01_14.mp4",
      department: "Highway Patrol",
      timeRange: "2024-01-14 18:00 - 20:00",
      status: "failed",
      uploadDate: "2024-01-14 20:45",
    },
    {
      id: 4,
      filename: "transit_hub_2024_01_14.mp4",
      department: "Transit Authority",
      timeRange: "2024-01-14 08:00 - 10:00",
      status: "completed",
      uploadDate: "2024-01-14 10:30",
    },
  ])

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

  const handleUpload = () => {
    if (!uploadData.department || !uploadData.location || uploadData.files.length === 0) {
      return
    }

    // Simulate progress for each file
    uploadData.files.forEach((file) => {
      const fileName = file.name
      let progress = 0

      const interval = setInterval(() => {
        progress += Math.random() * 30
        if (progress > 100) progress = 100

        setUploadProgress((prev) => ({ ...prev, [fileName]: progress }))

        if (progress >= 100) {
          clearInterval(interval)
          // Add file to uploaded list
          const newUpload = {
            id: uploadedFiles.length + 1,
            filename: fileName,
            department: uploadData.department,
            timeRange: `${uploadData.timeWindow}`,
            status: "processing",
            uploadDate: new Date().toLocaleString(),
          }
          setUploadedFiles([newUpload, ...uploadedFiles])
        }
      }, 300)
    })

    // Reset form after upload starts
    setTimeout(() => {
      setUploadData({ department: "", location: "", timeWindow: "2hours", files: [] })
      setUploadProgress({})
    }, 2000)
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
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
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
                  Object.keys(uploadProgress).length > 0
                }
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload & Process Videos
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
                      <th className="text-left font-semibold text-foreground py-3 px-4">Time Range</th>
                      <th className="text-left font-semibold text-foreground py-3 px-4">Upload Timestamp</th>
                      <th className="text-left font-semibold text-foreground py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedFiles.map((upload) => (
                      <tr key={upload.id} className="border-b border-border hover:bg-secondary/5 transition-colors">
                        <td className="py-4 px-4 text-muted-foreground font-mono text-xs">{upload.filename}</td>
                        <td className="py-4 px-4 text-foreground text-sm">{upload.department}</td>
                        <td className="py-4 px-4 text-muted-foreground text-xs">{upload.timeRange}</td>
                        <td className="py-4 px-4 text-muted-foreground text-xs">{upload.uploadDate}</td>
                        <td className="py-4 px-4">{getStatusBadge(upload.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
