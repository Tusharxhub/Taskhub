"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, Search, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function ProfileRoutingDiagnostic() {
  const [testUserId, setTestUserId] = useState("")
  const [testResult, setTestResult] = useState<{
    userExists: boolean | null
    profileExists: boolean | null
    tasksExist: boolean | null
    error: string | null
  }>({
    userExists: null,
    profileExists: null,
    tasksExist: null,
    error: null,
  })
  const [testing, setTesting] = useState(false)

  const runDiagnostic = async () => {
    if (!testUserId.trim()) return

    setTesting(true)
    setTestResult({
      userExists: null,
      profileExists: null,
      tasksExist: null,
      error: null,
    })

    try {
      // Check if user has a profile
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", testUserId.trim())
        .single()

      const profileExists = !profileError && !!profileData

      // Check if user has any tasks (to verify user exists in system)
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("id, user_name")
        .eq("user_id", testUserId.trim())
        .limit(1)

      const tasksExist = !tasksError && tasksData && tasksData.length > 0

      // Check if user has any comments (another way to verify user exists)
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("id, user_name")
        .eq("user_id", testUserId.trim())
        .limit(1)

      const commentsExist = !commentsError && commentsData && commentsData.length > 0

      const userExists = tasksExist || commentsExist || profileExists

      setTestResult({
        userExists,
        profileExists,
        tasksExist: tasksExist || commentsExist,
        error: null,
      })
    } catch (error: any) {
      setTestResult({
        userExists: false,
        profileExists: false,
        tasksExist: false,
        error: error.message,
      })
    } finally {
      setTesting(false)
    }
  }

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return null
    return status ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const getExpectedBehavior = () => {
    const { userExists, profileExists } = testResult

    if (userExists === null) return null

    if (!userExists) {
      return {
        type: "error",
        message: "Should show 'User Not Found' page",
        color: "red",
      }
    }

    if (userExists && !profileExists) {
      return {
        type: "warning",
        message: "Should show 'Profile Not Complete' page",
        color: "yellow",
      }
    }

    if (userExists && profileExists) {
      return {
        type: "success",
        message: "Should show full profile page",
        color: "green",
      }
    }

    return null
  }

  const expectedBehavior = getExpectedBehavior()

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Profile Route Diagnostic
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Input
            placeholder="Enter User ID to test (e.g., user_2abc123def)"
            value={testUserId}
            onChange={(e) => setTestUserId(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && runDiagnostic()}
          />
          <Button onClick={runDiagnostic} disabled={testing || !testUserId.trim()}>
            {testing ? "Testing..." : "Test"}
          </Button>
        </div>

        {testResult.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{testResult.error}</AlertDescription>
          </Alert>
        )}

        {(testResult.userExists !== null || testResult.profileExists !== null) && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">User Exists in System</span>
                {getStatusIcon(testResult.userExists)}
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">Profile Completed</span>
                {getStatusIcon(testResult.profileExists)}
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">Has Tasks/Comments</span>
                {getStatusIcon(testResult.tasksExist)}
              </div>
            </div>

            {expectedBehavior && (
              <Alert className={`border-${expectedBehavior.color}-200 bg-${expectedBehavior.color}-50`}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Expected Behavior:</strong> {expectedBehavior.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Link href={`/profile/${testUserId.trim()}`} target="_blank" className="flex-1">
                <Button variant="outline" className="w-full bg-transparent">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Profile Page
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>
            <strong>Tip:</strong> You can find user IDs from the browser console when testing, or from the database.
          </p>
          <p>
            <strong>Common User IDs:</strong> Look for Clerk user IDs that start with "user_" followed by random
            characters.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
