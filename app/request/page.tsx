"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const categories = [
  "Web Development",
  "Mobile Development",
  "Design & Graphics",
  "Writing & Content",
  "Digital Marketing",
  "Data Entry",
  "Photography",
  "Video Editing",
  "Translation",
  "Other",
]

export default function Request() {
  const { user, isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    deadline: "",
    category: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/")
    }
  }, [isSignedIn, isLoaded, router])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-2 sm:px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-base sm:text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isSignedIn || !user) {
      toast.error("Please sign in to post a task")
      return
    }

    // Validate all required fields
    if (!formData.title.trim()) {
      toast.error("Please enter a task title")
      return
    }

    if (!formData.description.trim()) {
      toast.error("Please enter a task description")
      return
    }

    if (!formData.price || formData.price.trim() === "") {
      toast.error("Please enter a price")
      return
    }

    if (!formData.deadline) {
      toast.error("Please select a deadline")
      return
    }

    if (!formData.category) {
      toast.error("Please select a category")
      return
    }

    const price = Number.parseFloat(formData.price)
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price (numbers only)")
      return
    }

    const deadlineDate = new Date(formData.deadline)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day

    if (deadlineDate <= today) {
      toast.error("Deadline must be at least tomorrow")
      return
    }

    setIsSubmitting(true)

    try {
      console.log("Submitting task with data:", {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: price,
        deadline: formData.deadline,
        category: formData.category,
        user_id: user.id,
        user_name: user.fullName || user.emailAddresses[0]?.emailAddress || "Anonymous",
      })

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim(),
          price: price,
          deadline: formData.deadline,
          category: formData.category,
          user_id: user.id,
          user_name: user.fullName || user.emailAddresses[0]?.emailAddress || "Anonymous",
        })
        .select()
        .single()

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      console.log("Task created successfully:", data)
      toast.success("Task posted successfully!")

      // Reset form
      setFormData({
        title: "",
        description: "",
        price: "",
        deadline: "",
        category: "",
      })

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (error: any) {
      console.error("Error posting task:", error)

      // Provide more specific error messages
      if (error.code === "23505") {
        toast.error("A task with this information already exists")
      } else if (error.code === "42501") {
        toast.error("Permission denied. Please check your account permissions.")
      } else if (error.message?.includes("JWT")) {
        toast.error("Authentication error. Please sign out and sign in again.")
      } else if (error.message?.includes("network")) {
        toast.error("Network error. Please check your internet connection.")
      } else {
        toast.error(`Failed to post task: ${error.message || "Unknown error"}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isSignedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 sm:pt-20">
      <div className="max-w-2xl mx-auto px-2 sm:px-4 md:px-6 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Post a New Task</h1>
          <p className="text-gray-600 text-base sm:text-lg">Fill out the details below to post your task</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="e.g., Edit photo for social media"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="w-full"
                  required
                  minLength={5}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about your task..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="min-h-[120px] w-full"
                  required
                  minLength={20}
                  maxLength={1000}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="2000"
                    min="1"
                    max="1000000"
                    step="1"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange("deadline", e.target.value)}
                    min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]} // Tomorrow
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4 pt-6">
                <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 bg-teal-500 hover:bg-teal-600">
                  {isSubmitting ? "Posting..." : "Post Task"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
