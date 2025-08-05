"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, Database, AlertTriangle } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export default function TaskPostingDebug() {
  const { user, isSignedIn } = useUser()
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<any>({})

  const runDatabaseTests = async () => {
    if (!isSignedIn || !user) {
      toast.error("Please sign in first")
      return
    }

    setTesting(true)
    const testResults: any = {}

    try {
      // Test 1: Check if tasks table exists and is accessible
      console.log("Testing tasks table access...")
      const { data: tasksTest, error: tasksError } = await supabase
        .from("tasks")
        .select("count", { count: "exact", head: true })

      testResults.tasksTable = {
        success: !tasksError,
        error: tasksError?.message,
        count: tasksTest?.length || 0,
      }

      // Test 2: Check user permissions
      console.log("Testing user permissions...")
      const testTask = {
        title: "DEBUG TEST - DELETE ME",
        description: "This is a debug test task that should be deleted immediately",
        price: 1,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        category: "Testing",
        user_id: user.id,
        user_name: user.fullName || user.emailAddresses[0]?.emailAddress || "Test User",
      }

      const { data: insertTest, error: insertError } = await supabase.from("tasks").insert(testTask).select().single()

      testResults.insertPermission = {
        success: !insertError,
        error: insertError?.message,
        data: insertTest,
      }

      // Test 3: If insert worked, try to delete the test task
      if (insertTest && !insertError) {
        console.log("Cleaning up test task...")
        const { error: deleteError } = await supabase.from("tasks").delete().eq("id", insertTest.id)

        testResults.cleanup = {
          success: !deleteError,
          error: deleteError?.message,
        }
      }

      // Test 4: Check RLS policies
      console.log("Testing RLS policies...")
      const { data: rlsTest, error: rlsError } = await supabase.from("tasks").select("*").limit(1)

      testResults.rlsPolicies = {
        success: !rlsError,
        error: rlsError?.message,
      }

      setResults(testResults)
    } catch (error: any) {
      console.error("Debug test failed:", error)
      toast.error("Debug test failed")
      setResults({ generalError: error.message })
    } finally {
      setTesting(false)
    }
  }

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge className="bg-green-500">
        <CheckCircle className="h-3 w-3 mr-1" />
        Pass
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Fail
      </Badge>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Task Posting Debug Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSignedIn && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-yellow-800">Please sign in to run database tests</span>
            </div>
          </div>
        )}

        <Button onClick={runDatabaseTests} disabled={testing || !isSignedIn} className="w-full">
          {testing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            "Run Database Tests"
          )}
        </Button>

        {Object.keys(results).length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Test Results:</h3>

            {results.tasksTable && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>Tasks Table Access</span>
                {getStatusBadge(results.tasksTable.success)}
              </div>
            )}

            {results.insertPermission && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>Insert Permission</span>
                {getStatusBadge(results.insertPermission.success)}
              </div>
            )}

            {results.rlsPolicies && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>RLS Policies</span>
                {getStatusBadge(results.rlsPolicies.success)}
              </div>
            )}

            {results.cleanup && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>Cleanup Test</span>
                {getStatusBadge(results.cleanup.success)}
              </div>
            )}

            {/* Error Details */}
            {Object.values(results).some((result: any) => result.error) && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Error Details:</h4>
                <div className="space-y-1 text-sm text-red-700">
                  {results.tasksTable?.error && <div>• Tasks Table: {results.tasksTable.error}</div>}
                  {results.insertPermission?.error && <div>• Insert Permission: {results.insertPermission.error}</div>}
                  {results.rlsPolicies?.error && <div>• RLS Policies: {results.rlsPolicies.error}</div>}
                  {results.cleanup?.error && <div>• Cleanup: {results.cleanup.error}</div>}
                  {results.generalError && <div>• General: {results.generalError}</div>}
                </div>
              </div>
            )}

            {/* Success Summary */}
            {Object.values(results).every((result: any) => result.success !== false) && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">All tests passed! Task posting should work correctly.</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <h4 className="font-medium text-blue-800 mb-2">Debug Information:</h4>
          <div className="space-y-1 text-blue-700">
            <div>User ID: {user?.id || "Not signed in"}</div>
            <div>User Name: {user?.fullName || user?.emailAddresses?.[0]?.emailAddress || "Not available"}</div>
            <div>Environment: {process.env.NODE_ENV}</div>
            <div>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Missing"}</div>
            <div>Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
