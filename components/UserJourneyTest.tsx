"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, Loader2, User, UserPlus, AlertTriangle, Play, RefreshCw } from "lucide-react"
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface TestStep {
  id: string
  name: string
  description: string
  status: "pending" | "running" | "success" | "error" | "skipped"
  error?: string
  details?: string
}

export default function UserJourneyTest() {
  const { user, isSignedIn, isLoaded } = useUser()
  const [currentStep, setCurrentStep] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<any>({})

  const [steps, setSteps] = useState<TestStep[]>([
    {
      id: "auth-check",
      name: "Authentication Status",
      description: "Check if user is signed in with Clerk",
      status: "pending",
    },
    {
      id: "profile-check",
      name: "Profile Creation",
      description: "Verify user profile exists or can be created",
      status: "pending",
    },
    {
      id: "task-creation",
      name: "Task Creation",
      description: "Test creating a new task",
      status: "pending",
    },
    {
      id: "task-retrieval",
      name: "Task Retrieval",
      description: "Verify tasks can be fetched from database",
      status: "pending",
    },
    {
      id: "comment-system",
      name: "Comment System",
      description: "Test adding comments to tasks",
      status: "pending",
    },
    {
      id: "profile-update",
      name: "Profile Management",
      description: "Test profile updates and image upload capability",
      status: "pending",
    },
    {
      id: "dashboard-access",
      name: "Dashboard Access",
      description: "Verify user can access their dashboard",
      status: "pending",
    },
  ])

  const updateStepStatus = (stepId: string, status: TestStep["status"], error?: string, details?: string) => {
    setSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, status, error, details } : step)))
  }

  const runCompleteTest = async () => {
    if (!isLoaded) {
      toast.error("Please wait for authentication to load")
      return
    }

    setIsRunning(true)
    setCurrentStep(0)

    // Reset all steps
    setSteps((prev) => prev.map((step) => ({ ...step, status: "pending", error: undefined, details: undefined })))

    try {
      // Step 1: Authentication Check
      setCurrentStep(1)
      updateStepStatus("auth-check", "running")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (!isSignedIn || !user) {
        updateStepStatus("auth-check", "error", "User is not signed in")
        // Skip remaining steps
        setSteps((prev) => prev.map((step) => (step.id !== "auth-check" ? { ...step, status: "skipped" } : step)))
        setIsRunning(false)
        return
      }

      updateStepStatus(
        "auth-check",
        "success",
        undefined,
        `Signed in as: ${user.fullName || user.emailAddresses[0]?.emailAddress}`,
      )

      // Step 2: Profile Check
      setCurrentStep(2)
      updateStepStatus("profile-check", "running")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      try {
        const { data: existingProfile, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError
        }

        if (existingProfile) {
          updateStepStatus("profile-check", "success", undefined, "Profile already exists")
          setTestResults((prev: any) => ({ ...prev, profile: existingProfile }))
        } else {
          // Try to create a test profile
          const testProfile = {
            user_id: user.id,
            full_name: user.fullName || "Test User",
            email: user.emailAddresses[0]?.emailAddress || "test@example.com",
            bio: "Test profile created during journey test",
            skills: ["Testing", "Quality Assurance"],
          }

          const { data: newProfile, error: createError } = await supabase
            .from("user_profiles")
            .insert(testProfile)
            .select()
            .single()

          if (createError) throw createError

          updateStepStatus("profile-check", "success", undefined, "Profile created successfully")
          setTestResults((prev: any) => ({ ...prev, profile: newProfile }))
        }
      } catch (error: any) {
        updateStepStatus("profile-check", "error", error.message)
      }

      // Step 3: Task Creation
      setCurrentStep(3)
      updateStepStatus("task-creation", "running")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      try {
        const testTask = {
          title: `Test Task - ${new Date().toISOString()}`,
          description: "This is a test task created during the user journey test. It can be safely deleted.",
          price: 1000,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7 days from now
          category: "Testing",
          user_id: user.id,
          user_name: user.fullName || user.emailAddresses[0]?.emailAddress || "Test User",
        }

        const { data: createdTask, error: taskError } = await supabase.from("tasks").insert(testTask).select().single()

        if (taskError) throw taskError

        updateStepStatus("task-creation", "success", undefined, `Task created with ID: ${createdTask.id}`)
        setTestResults((prev: any) => ({ ...prev, task: createdTask }))
      } catch (error: any) {
        updateStepStatus("task-creation", "error", error.message)
      }

      // Step 4: Task Retrieval
      setCurrentStep(4)
      updateStepStatus("task-retrieval", "running")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      try {
        const { data: tasks, error: fetchError } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5)

        if (fetchError) throw fetchError

        updateStepStatus("task-retrieval", "success", undefined, `Retrieved ${tasks.length} tasks`)
        setTestResults((prev: any) => ({ ...prev, userTasks: tasks }))
      } catch (error: any) {
        updateStepStatus("task-retrieval", "error", error.message)
      }

      // Step 5: Comment System
      setCurrentStep(5)
      updateStepStatus("comment-system", "running")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      try {
        if (testResults.task) {
          const testComment = {
            task_id: testResults.task.id,
            user_id: user.id,
            user_name: user.fullName || user.emailAddresses[0]?.emailAddress || "Test User",
            content: "This is a test comment created during the user journey test.",
          }

          const { data: createdComment, error: commentError } = await supabase
            .from("comments")
            .insert(testComment)
            .select()
            .single()

          if (commentError) throw commentError

          updateStepStatus("comment-system", "success", undefined, `Comment created with ID: ${createdComment.id}`)
          setTestResults((prev: any) => ({ ...prev, comment: createdComment }))
        } else {
          updateStepStatus("comment-system", "skipped", "No task available for commenting")
        }
      } catch (error: any) {
        updateStepStatus("comment-system", "error", error.message)
      }

      // Step 6: Profile Update
      setCurrentStep(6)
      updateStepStatus("profile-update", "running")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      try {
        const updateData = {
          bio: `Updated bio - ${new Date().toISOString()}`,
          location: "Test City, Test Country",
          hourly_rate: 500,
        }

        const { error: updateError } = await supabase.from("user_profiles").update(updateData).eq("user_id", user.id)

        if (updateError) throw updateError

        updateStepStatus("profile-update", "success", undefined, "Profile updated successfully")
      } catch (error: any) {
        updateStepStatus("profile-update", "error", error.message)
      }

      // Step 7: Dashboard Access
      setCurrentStep(7)
      updateStepStatus("dashboard-access", "running")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      try {
        // Test dashboard data fetching
        const { data: dashboardTasks, error: dashboardError } = await supabase
          .from("tasks")
          .select(`
            *,
            comments:comments(count)
          `)
          .eq("user_id", user.id)

        if (dashboardError) throw dashboardError

        updateStepStatus(
          "dashboard-access",
          "success",
          undefined,
          `Dashboard loaded with ${dashboardTasks.length} tasks`,
        )
      } catch (error: any) {
        updateStepStatus("dashboard-access", "error", error.message)
      }
    } catch (error: any) {
      console.error("Test failed:", error)
      toast.error("Test suite failed")
    } finally {
      setIsRunning(false)
      setCurrentStep(0)
    }
  }

  const cleanupTestData = async () => {
    if (!user || !testResults.task) return

    try {
      // Delete test comment
      if (testResults.comment) {
        await supabase.from("comments").delete().eq("id", testResults.comment.id)
      }

      // Delete test task
      await supabase.from("tasks").delete().eq("id", testResults.task.id)

      toast.success("Test data cleaned up")
      setTestResults({})
    } catch (error: any) {
      toast.error("Failed to cleanup test data")
      console.error("Cleanup error:", error)
    }
  }

  const getStepIcon = (status: TestStep["status"]) => {
    switch (status) {
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "skipped":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  const getStepBadge = (status: TestStep["status"]) => {
    switch (status) {
      case "running":
        return <Badge variant="secondary">Running</Badge>
      case "success":
        return <Badge className="bg-green-500">Success</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "skipped":
        return <Badge variant="outline">Skipped</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  const completedSteps = steps.filter((step) => step.status === "success").length
  const totalSteps = steps.length
  const progressPercentage = (completedSteps / totalSteps) * 100

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            Complete User Journey Test
          </CardTitle>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Progress: {completedSteps}/{totalSteps} steps completed
              </span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Authentication Status */}
          {!isLoaded && (
            <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span>Loading authentication...</span>
            </div>
          )}

          {isLoaded && !isSignedIn && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <UserPlus className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">Authentication Required</span>
              </div>
              <p className="text-sm text-yellow-700 mb-4">
                Please sign in or create an account to test the complete user journey.
              </p>
              <div className="flex gap-2">
                <SignInButton mode="modal">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm">Sign Up</Button>
                </SignUpButton>
              </div>
            </div>
          )}

          {isLoaded && isSignedIn && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">
                  Signed in as: {user?.fullName || user?.emailAddresses[0]?.emailAddress}
                </span>
              </div>
            </div>
          )}

          {/* Test Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`p-4 border rounded-lg transition-colors ${
                  currentStep === index + 1 ? "border-blue-300 bg-blue-50" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getStepIcon(step.status)}
                    <div>
                      <div className="font-medium">{step.name}</div>
                      <div className="text-sm text-gray-600">{step.description}</div>
                    </div>
                  </div>
                  {getStepBadge(step.status)}
                </div>

                {step.details && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">{step.details}</div>
                )}

                {step.error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <strong>Error:</strong> {step.error}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={runCompleteTest} disabled={isRunning || !isSignedIn} className="flex items-center gap-2">
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Complete Test
                </>
              )}
            </Button>

            {testResults.task && (
              <Button onClick={cleanupTestData} variant="outline" className="flex items-center gap-2 bg-transparent">
                <RefreshCw className="h-4 w-4" />
                Cleanup Test Data
              </Button>
            )}
          </div>

          {/* Test Results Summary */}
          {Object.keys(testResults).length > 0 && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-medium mb-2">Test Results Summary:</h3>
              <div className="text-sm space-y-1">
                {testResults.profile && <div>✅ Profile: {testResults.profile.full_name}</div>}
                {testResults.task && <div>✅ Task Created: "{testResults.task.title}"</div>}
                {testResults.comment && <div>✅ Comment Added: ID {testResults.comment.id}</div>}
                {testResults.userTasks && <div>✅ Retrieved {testResults.userTasks.length} user tasks</div>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
