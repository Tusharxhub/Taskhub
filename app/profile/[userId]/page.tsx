"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Instagram,
  Linkedin,
  Twitter,
  DollarSign,
  Calendar,
  Loader2,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { UserProfile, Task } from "@/lib/types"
import Image from "next/image"
import Link from "next/link"

export default function PublicProfilePage() {
  const params = useParams()
  const userId = params.userId as string
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userTasks, setUserTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      fetchPublicProfile()
    }
  }, [userId])

  const fetchPublicProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Fetching profile for user ID:", userId)

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single()

      console.log("Profile query result:", { profileData, profileError })

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError
      }

      // If no profile found, check if user has any tasks (to verify user exists)
      if (!profileData) {
        console.log("No profile found, checking for user tasks...")
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", userId)
          .limit(1)

        if (tasksError) {
          throw tasksError
        }

        if (tasksData && tasksData.length > 0) {
          // User exists but hasn't created profile yet
          setProfile(null)
          setUserTasks([])
          setError("profile_incomplete")
        } else {
          // User doesn't exist at all
          setError("user_not_found")
        }
        return
      }

      // Fetch user's recent tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5)

      if (tasksError) {
        console.error("Error fetching tasks:", tasksError)
        // Don't throw error for tasks, just log it
      }

      setProfile(profileData)
      setUserTasks(tasksData || [])
    } catch (error: any) {
      console.error("Error fetching public profile:", error)
      setError(error.message || "Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error === "user_not_found") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
          <p className="text-gray-600 mb-6">The user profile you're looking for doesn't exist. This could mean:</p>
          <div className="text-left max-w-md mx-auto mb-6">
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• The user ID is incorrect or malformed</li>
              <li>• The user account has been deleted</li>
              <li>• The link you followed is broken or outdated</li>
            </ul>
          </div>
          <div className="flex gap-4 justify-center">
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (error === "profile_incomplete") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <User className="h-16 w-16 text-blue-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Complete</h1>
          <p className="text-gray-600 mb-6">
            This user exists but hasn't completed their profile yet. They may still be setting up their account.
          </p>
          <div className="text-sm text-gray-500 mb-6">
            <p>You can still see their activity in tasks and comments throughout the platform.</p>
          </div>
          <div className="flex gap-4 justify-center">
            <Link href="/">
              <Button>Browse Tasks</Button>
            </Link>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Profile</h1>
          <p className="text-gray-600 mb-4">We encountered an error while trying to load this profile.</p>
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3 mb-6 max-w-md mx-auto">
            <strong>Error Details:</strong> {error}
          </div>
          <div className="flex gap-4 justify-center">
            <Button onClick={fetchPublicProfile} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">This user hasn't created their profile yet.</p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {profile.profile_image_url ? (
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100">
                  <Image
                    src={profile.profile_image_url || "/placeholder.svg"}
                    alt={profile.full_name}
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.full_name}</h1>

              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-600 mb-4">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.hourly_rate && (
                  <div className="flex items-center gap-1 text-green-600">
                    <DollarSign className="h-4 w-4" />
                    <span>₹{profile.hourly_rate}/hour</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDate(profile.created_at)}</span>
                </div>
              </div>

              {profile.bio && <p className="text-gray-700 mb-4 max-w-2xl">{profile.bio}</p>}

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  {profile.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact & Social Links */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <a href={`mailto:${profile.email}`} className="text-sm hover:text-blue-600 transition-colors">
                  {profile.email}
                </a>
              </div>

              {profile.phone_number && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <a href={`tel:${profile.phone_number}`} className="text-sm hover:text-blue-600 transition-colors">
                    {profile.phone_number}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Social Media Links */}
          {(profile.instagram_id || profile.linkedin_id || profile.twitter_id || profile.website_url) && (
            <Card>
              <CardHeader>
                <CardTitle>Social Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.instagram_id && (
                  <a
                    href={`https://instagram.com/${profile.instagram_id.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm hover:text-blue-600 transition-colors"
                  >
                    <Instagram className="h-4 w-4" />
                    <span>{profile.instagram_id}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}

                {profile.linkedin_id && (
                  <a
                    href={
                      profile.linkedin_id.startsWith("http") ? profile.linkedin_id : `https://${profile.linkedin_id}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm hover:text-blue-600 transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                    <span>LinkedIn Profile</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}

                {profile.twitter_id && (
                  <a
                    href={`https://twitter.com/${profile.twitter_id.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm hover:text-blue-600 transition-colors"
                  >
                    <Twitter className="h-4 w-4" />
                    <span>{profile.twitter_id}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}

                {profile.website_url && (
                  <a
                    href={profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm hover:text-blue-600 transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    <span>Website</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks Posted</CardTitle>
            </CardHeader>
            <CardContent>
              {userTasks.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No tasks posted yet.</p>
              ) : (
                <div className="space-y-4">
                  {userTasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{task.title}</h3>
                        <span className="text-green-600 font-semibold">{formatPrice(task.price)}</span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{task.description}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="text-xs">
                            {task.category}
                          </Badge>
                          <span>Due: {formatDate(task.deadline)}</span>
                        </div>
                        <span>Posted {formatDate(task.created_at)}</span>
                      </div>
                    </div>
                  ))}

                  {userTasks.length >= 5 && (
                    <div className="text-center pt-4">
                      <Link href="/">
                        <Button variant="outline" size="sm">
                          View All Tasks
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
