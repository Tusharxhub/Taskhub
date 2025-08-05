"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
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
import { Plus, DollarSign, Calendar, Tag, FileText, Loader2 } from "lucide-react"

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

export default function RequestPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    deadline: "",
    category: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user, isSignedIn } = useUser()
  const router = useRouter()

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
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Post a New Task
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Describe your project and connect with talented freelancers who can bring your vision to life
          </p>
        </motion.div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                <Plus className="h-6 w-6 mr-3 text-blue-600" />
                Task Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-semibold flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                    Task Title *
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="e.g., Create a modern website for my restaurant"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="w-full text-lg py-3 rounded-xl border-gray-200 focus:border-blue-500"
                    required
                    minLength={5}
                    maxLength={100}
                  />
                  <p className="text-sm text-gray-500">Be specific and descriptive to attract the right freelancers</p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-semibold">
                    Project Description *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed information about your project, requirements, deliverables, and any specific skills needed..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className="min-h-[150px] w-full text-base rounded-xl border-gray-200 focus:border-blue-500"
                    required
                    minLength={20}
                    maxLength={1000}
                  />
                  <p className="text-sm text-gray-500">
                    Include project scope, timeline expectations, and any files or references
                  </p>
                </div>

                {/* Price and Deadline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-base font-semibold flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                      Budget (₹) *
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="15000"
                      min="1"
                      max="1000000"
                      step="1"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      className="text-lg py-3 rounded-xl border-gray-200 focus:border-blue-500"
                      required
                    />
                    <p className="text-sm text-gray-500">Set a fair budget based on project complexity</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadline" className="text-base font-semibold flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-purple-600" />
                      Deadline *
                    </Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => handleInputChange("deadline", e.target.value)}
                      min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]} // Tomorrow
                      className="text-lg py-3 rounded-xl border-gray-200 focus:border-blue-500"
                      required
                    />
                    <p className="text-sm text-gray-500">When do you need this completed?</p>
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-base font-semibold flex items-center">
                    <Tag className="h-4 w-4 mr-2 text-orange-600" />
                    Category *
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger className="text-lg py-3 rounded-xl border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="Select the best category for your project" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category} className="text-base">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">Choose the category that best fits your project</p>
                </div>

                {/* Submit Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex-1 py-3 text-base rounded-xl bg-transparent"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Posting Task...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5 mr-2" />
                        Post Task
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <Card className="bg-blue-50/80 backdrop-blur-sm border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-blue-900">💡 Tips for a Successful Project</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div className="space-y-2">
                  <p className="font-medium">✅ Be Clear and Specific</p>
                  <p>Provide detailed requirements and expectations</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">✅ Set Realistic Deadlines</p>
                  <p>Allow enough time for quality work</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">✅ Fair Budget</p>
                  <p>Price your project competitively to attract talent</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">✅ Respond Quickly</p>
                  <p>Engage with freelancers who apply to your project</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
