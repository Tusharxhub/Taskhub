"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, MessageCircle, CheckCircle, XCircle, ExternalLink, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Task, Comment, UserProfile } from "@/lib/types"
import Link from "next/link"

export default function ProfileRoutingTest() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    fetchTestData()
  }, [])

  const fetchTestData = async () => {
    try {
      // Fetch some tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5)

      if (tasksError) throw tasksError

      // Fetch some comments
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5)

      if (commentsError) throw commentsError

      // Fetch some profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5)

      if (profilesError) throw profilesError

      setTasks(tasksData || [])
      setComments(commentsData || [])
      setProfiles(profilesData || [])
    } catch (error) {
      console.error("Error fetching test data:", error)
    } finally {
      setLoading(false)
    }
  }

  const testProfileRoute = async (userId: string, userName: string) => {
    try {
      // Test if the profile page loads correctly
      const response = await fetch(`/profile/${userId}`)
      const success = response.ok

      setTestResults((prev) => ({
        ...prev,
        [userId]: success,
      }))

      return success
    } catch (error) {
      console.error(`Error testing profile route for ${userName}:`, error)
      setTestResults((prev) => ({
        ...prev,
        [userId]: false,
      }))
      return false
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Test Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Routing Test Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
              <div className="text-sm text-gray-600">Tasks Found</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{comments.length}</div>
              <div className="text-sm text-gray-600">Comments Found</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{profiles.length}</div>
              <div className="text-sm text-gray-600">Profiles Found</div>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Click on any username below to test profile routing. Green checkmarks indicate successful routing.
          </div>
        </CardContent>
      </Card>

      {/* Task Authors Test */}
      <Card>
        <CardHeader>
          <CardTitle>Test 1: Task Author Links</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No tasks found for testing</p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">{task.title}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span>Posted by</span>
                      <Link
                        href={`/profile/${task.user_id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        onClick={() => testProfileRoute(task.user_id, task.user_name)}
                      >
                        {task.user_name}
                      </Link>
                      {testResults[task.user_id] !== undefined &&
                        (testResults[task.user_id] ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{task.category}</Badge>
                    <Link href={`/profile/${task.user_id}`} target="_blank">
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comment Authors Test */}
      <Card>
        <CardHeader>
          <CardTitle>Test 2: Comment Author Links</CardTitle>
        </CardHeader>
        <CardContent>
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No comments found for testing</p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="h-4 w-4 text-gray-500" />
                      <Link
                        href={`/profile/${comment.user_id}`}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        onClick={() => testProfileRoute(comment.user_id, comment.user_name)}
                      >
                        {comment.user_name}
                      </Link>
                      {testResults[comment.user_id] !== undefined &&
                        (testResults[comment.user_id] ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ))}
                      <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{comment.content}</p>
                  </div>
                  <Link href={`/profile/${comment.user_id}`} target="_blank">
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Directory Test */}
      <Card>
        <CardHeader>
          <CardTitle>Test 3: Profile Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No profiles found for testing</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profiles.map((profile) => (
                <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      {profile.profile_image_url ? (
                        <img
                          src={profile.profile_image_url || "/placeholder.svg"}
                          alt={profile.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <Link
                        href={`/profile/${profile.user_id}`}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        onClick={() => testProfileRoute(profile.user_id, profile.full_name)}
                      >
                        {profile.full_name}
                      </Link>
                      <div className="text-xs text-gray-500">{profile.email}</div>
                      {profile.location && <div className="text-xs text-gray-500">{profile.location}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {testResults[profile.user_id] !== undefined &&
                      (testResults[profile.user_id] ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ))}
                    <Link href={`/profile/${profile.user_id}`} target="_blank">
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Test Section */}
      <Card>
        <CardHeader>
          <CardTitle>Test 4: Manual Profile URL Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Test profile URLs manually by entering user IDs or trying these common scenarios:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Valid Profile Tests:</h4>
                {profiles.slice(0, 3).map((profile) => (
                  <Link
                    key={profile.id}
                    href={`/profile/${profile.user_id}`}
                    className="block p-2 border rounded text-sm hover:bg-gray-50"
                    target="_blank"
                  >
                    /profile/{profile.user_id} → {profile.full_name}
                  </Link>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Error Case Tests:</h4>
                <Link
                  href="/profile/nonexistent-user-id"
                  className="block p-2 border rounded text-sm hover:bg-gray-50"
                  target="_blank"
                >
                  /profile/nonexistent-user-id → Should show "User Not Found"
                </Link>
                <Link
                  href="/profile/user-without-profile"
                  className="block p-2 border rounded text-sm hover:bg-gray-50"
                  target="_blank"
                >
                  /profile/user-without-profile → Should show "Profile Incomplete"
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="font-medium">1.</span>
              <span>Click on any username link above to test profile routing</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">2.</span>
              <span>Green checkmarks (✓) indicate successful profile page loads</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">3.</span>
              <span>Red X marks (✗) indicate failed or problematic routes</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">4.</span>
              <span>Use the external link buttons to open profiles in new tabs</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">5.</span>
              <span>Test both existing users and non-existent users to verify error handling</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
