"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Phone,
  MapPin,
  Globe,
  Instagram,
  Linkedin,
  Twitter,
  DollarSign,
  Plus,
  X,
  Loader2,
  Save,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { UserProfile } from "@/lib/types"
import ImageUpload from "@/components/ImageUpload"

export default function ProfilePage() {
  const { user, isSignedIn } = useUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newSkill, setNewSkill] = useState("")

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    bio: "",
    profile_image_url: "",
    instagram_id: "",
    linkedin_id: "",
    twitter_id: "",
    website_url: "",
    skills: [] as string[],
    hourly_rate: "",
    location: "",
  })

  useEffect(() => {
    if (isSignedIn && user) {
      fetchProfile()
    }
  }, [user, isSignedIn])

  const fetchProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw error
      }

      if (data) {
        setProfile(data)
        setFormData({
          full_name: data.full_name || "",
          email: data.email || "",
          phone_number: data.phone_number || "",
          bio: data.bio || "",
          profile_image_url: data.profile_image_url || "",
          instagram_id: data.instagram_id || "",
          linkedin_id: data.linkedin_id || "",
          twitter_id: data.twitter_id || "",
          website_url: data.website_url || "",
          skills: data.skills || [],
          hourly_rate: data.hourly_rate?.toString() || "",
          location: data.location || "",
        })
      } else {
        // Initialize with Clerk user data
        setFormData((prev) => ({
          ...prev,
          full_name: user.fullName || "",
          email: user.emailAddresses[0]?.emailAddress || "",
        }))
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }))
      setNewSkill("")
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }))
  }

  const handleImageUploaded = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      profile_image_url: url,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)

    try {
      const profileData = {
        user_id: user.id,
        full_name: formData.full_name,
        email: formData.email,
        phone_number: formData.phone_number || null,
        bio: formData.bio || null,
        profile_image_url: formData.profile_image_url || null,
        instagram_id: formData.instagram_id || null,
        linkedin_id: formData.linkedin_id || null,
        twitter_id: formData.twitter_id || null,
        website_url: formData.website_url || null,
        skills: formData.skills,
        hourly_rate: formData.hourly_rate ? Number.parseFloat(formData.hourly_rate) : null,
        location: formData.location || null,
      }

      if (profile) {
        // Update existing profile
        const { error } = await supabase.from("user_profiles").update(profileData).eq("user_id", user.id)

        if (error) throw error
      } else {
        // Create new profile
        const { error } = await supabase.from("user_profiles").insert(profileData)

        if (error) throw error
      }

      toast.success("Profile updated successfully!")
      fetchProfile() // Refresh profile data
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error("Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  if (!isSignedIn) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to view your profile</h1>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 sm:pt-20">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 md:px-6 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your profile information and showcase your skills</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Image Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Photo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                currentImageUrl={formData.profile_image_url}
                onImageUploaded={handleImageUploaded}
                userId={user?.id || ""}
              />
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange("full_name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone_number">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange("phone_number", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    type="text"
                    placeholder="City, Country"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself, your experience, and what makes you unique..."
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourly_rate">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Hourly Rate (₹)
                </Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  placeholder="500"
                  min="0"
                  step="50"
                  value={formData.hourly_rate}
                  onChange={(e) => handleInputChange("hourly_rate", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Skills Section */}
          <Card>
            <CardHeader>
              <CardTitle>Skills & Expertise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Add a skill..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                />
                <Button type="button" onClick={handleAddSkill} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <button type="button" onClick={() => handleRemoveSkill(skill)} className="ml-1 hover:text-red-500">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Social Media & Links */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media & Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram_id">
                    <Instagram className="h-4 w-4 inline mr-1" />
                    Instagram Username
                  </Label>
                  <Input
                    id="instagram_id"
                    type="text"
                    placeholder="@username"
                    value={formData.instagram_id}
                    onChange={(e) => handleInputChange("instagram_id", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin_id">
                    <Linkedin className="h-4 w-4 inline mr-1" />
                    LinkedIn Profile
                  </Label>
                  <Input
                    id="linkedin_id"
                    type="text"
                    placeholder="linkedin.com/in/username"
                    value={formData.linkedin_id}
                    onChange={(e) => handleInputChange("linkedin_id", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="twitter_id">
                    <Twitter className="h-4 w-4 inline mr-1" />
                    Twitter Handle
                  </Label>
                  <Input
                    id="twitter_id"
                    type="text"
                    placeholder="@username"
                    value={formData.twitter_id}
                    onChange={(e) => handleInputChange("twitter_id", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website_url">
                    <Globe className="h-4 w-4 inline mr-1" />
                    Website/Portfolio
                  </Label>
                  <Input
                    id="website_url"
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={formData.website_url}
                    onChange={(e) => handleInputChange("website_url", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 px-8">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
