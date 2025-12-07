"use client"

import type React from "react"
import { NavBar } from "@/components/nav-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, CheckCircle, AlertCircle } from "lucide-react"
import { useState } from "react"

const API_URL = "http://localhost:8000"

export default function ReportPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    lastSeenLocation: "",
    shirtColor: "",
    pantColor: "none",
    height: "",
    additionalNotes: "",
    contactInfo: "",
  })

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

  const handleSubmit = async () => {
    if (!imageFile || !formData.name || !formData.shirtColor) {
      alert("Please upload a photo, provide a name, and select shirt color")
      return
    }

    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const data = new FormData()
      data.append("photo", imageFile)
      data.append("name", formData.name)
      data.append("age", formData.age)
      data.append("gender", formData.gender)
      data.append("last_seen_location", formData.lastSeenLocation)
      data.append("shirt_color", formData.shirtColor)
      data.append("pant_color", formData.pantColor)
      data.append("height", formData.height)
      data.append("additional_notes", formData.additionalNotes)
      data.append("contact_info", formData.contactInfo)

      const response = await fetch(`${API_URL}/user/report-missing-person`, {
        method: "POST",
        body: data,
      })

      if (response.ok) {
        const result = await response.json()
        setSubmitResult({ success: true, data: result })
        
        // Reset form
        setImagePreview(null)
        setImageFile(null)
        setFormData({
          name: "",
          age: "",
          gender: "",
          lastSeenLocation: "",
          shirtColor: "",
          pantColor: "none",
          height: "",
          additionalNotes: "",
          contactInfo: "",
        })
      } else {
        const error = await response.json()
        setSubmitResult({ success: false, message: error.detail })
      }
    } catch (error) {
      setSubmitResult({ success: false, message: "Error connecting to server" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Report Missing Person</h2>
            <p className="text-muted-foreground">
              Submit information to help locate a missing person
            </p>
          </div>

          {submitResult && (
            <Card className="border border-border mb-6">
              <CardContent className="pt-6">
                {submitResult.success ? (
                  <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-4">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-900 dark:text-green-400">
                        Report Submitted Successfully
                      </p>
                      <p className="text-xs text-green-800 dark:text-green-500 mt-1">
                        Reference ID: {submitResult.data.person_id}
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-500 mt-2">
                        Authorities have been notified. You will be contacted if there are any updates.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-900 dark:text-red-400">
                        Submission Failed
                      </p>
                      <p className="text-xs text-red-800 dark:text-red-500 mt-1">
                        {submitResult.message}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Photo Upload */}
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Upload Photo *</CardTitle>
                  <CardDescription>Upload a clear, recent photo of the missing person</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDragDrop}
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-secondary/5"
                  >
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover rounded" />
                        <Button variant="outline" onClick={() => { setImagePreview(null); setImageFile(null) }} className="w-full">
                          Remove Image
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm font-medium text-foreground mb-1">Drag image here or click to browse</p>
                        <p className="text-xs text-muted-foreground mb-4">PNG, JPG up to 10MB</p>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
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

              {/* Personal Information */}
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Full Name <span className="text-red-500">*</span></Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Age</Label>
                      <Input
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        placeholder="25"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full mt-2 px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <Label>Height</Label>
                      <Input
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                        placeholder="5'10 or 178cm"
                        className="mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Last Seen & Clothing */}
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Last Seen & Clothing Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Last Seen Location</Label>
                    <Input
                      value={formData.lastSeenLocation}
                      onChange={(e) => setFormData({ ...formData, lastSeenLocation: e.target.value })}
                      placeholder="City, District, Landmark"
                      className="mt-2"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Shirt Color <span className="text-red-500">*</span></Label>
                      <select
                        value={formData.shirtColor}
                        onChange={(e) => setFormData({ ...formData, shirtColor: e.target.value })}
                        className="w-full mt-2 px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
                      >
                        <option value="">Select</option>
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
                    <div>
                      <Label>Pant Color</Label>
                      <select
                        value={formData.pantColor}
                        onChange={(e) => setFormData({ ...formData, pantColor: e.target.value })}
                        className="w-full mt-2 px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
                      >
                        <option value="none">Unknown</option>
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
                  </div>
                  <div>
                    <Label>Additional Notes</Label>
                    <textarea
                      value={formData.additionalNotes}
                      onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                      placeholder="Any other identifying information..."
                      className="w-full mt-2 px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm resize-none h-24"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                  <CardDescription>We'll contact you if there are any updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <Label>Phone or Email</Label>
                  <Input
                    value={formData.contactInfo}
                    onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                    placeholder="+1234567890 or email@example.com"
                    className="mt-2"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="text-base">Important Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">1</span>
                    </div>
                    <p className="text-muted-foreground">Provide accurate information to help in the search</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">2</span>
                    </div>
                    <p className="text-muted-foreground">Upload a clear, recent photo for better face recognition</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">3</span>
                    </div>
                    <p className="text-muted-foreground">Clothing details are crucial for identifying the person</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">4</span>
                    </div>
                    <p className="text-muted-foreground">Authorities will review and search CCTV footage</p>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-2" />
                <p className="text-sm text-blue-900 dark:text-blue-400">
                  All information is encrypted and will only be used for official search purposes.
                </p>
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11"
                disabled={!imageFile || !formData.name || !formData.shirtColor || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}