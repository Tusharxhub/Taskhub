"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Database, AlertTriangle, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function DatabaseChecker() {
  const [checking, setChecking] = useState(false)
  const [results, setResults] = useState<any>({})

  const checkDatabase = async () => {
    setChecking(true)
    const testResults: any = {}

    try {
      // Test 1: Check if tasks table exists and can be queried
      console.log("Checking tasks table...")
      const { data: tasksData, error: tasksError } = await supabase.from("tasks").select("*").limit(1)

      testResults.tasksTable = {
        success: !tasksError,
        error: tasksError?.message,
        count: tasksData?.length || 0,
      }

      // Test 2: Check if comments table exists
      console.log("Checking comments table...")
      const { data: commentsData, error: commentsError } = await supabase.from("comments").select("*").limit(1)

      testResults.commentsTable = {
        success: !commentsError,
        error: commentsError?.message,
        count: commentsData?.length || 0,
      }

      // Test 3: Check if user_profiles table exists
      console.log("Checking user_profiles table...")
      const { data: profilesData, error: profilesError } = await supabase.from("user_profiles").select("*").limit(1)

      testResults.profilesTable = {
        success: !profilesError,
        error: profilesError?.message,
        count: profilesData?.length || 0,
      }

      // Test 4: Test foreign key relationship
      if (!tasksError && !commentsError && tasksData && tasksData.length > 0) {
        console.log("Testing foreign key relationship...")
        const testComment = {
          task_id: tasksData[0].id,
          user_id: "test-user",
          user_name: "Test User",
          content: "Test comment",
        }

        const { data: commentData, error: commentError } = await supabase
          .from("comments")
          .insert(testComment)
          .select()
          .single()

        testResults.foreignKey = {
          success: !commentError,
          error: commentError?.message,
        }

        // Clean up test comment
        if (commentData && !commentError) {
          await supabase.from("comments").delete().eq("id", commentData.id)
        }
      }

      setResults(testResults)
    } catch (error: any) {
      console.error("Database check failed:", error)
      setResults({ generalError: error.message })
    } finally {
      setChecking(false)
    }
  }

  const getStatusIcon = (success: boolean) => {
    return success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Structure Checker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={checkDatabase} disabled={checking} className="w-full">
          {checking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking Database...
            </>
          ) : (
            "Check Database Structure"
          )}
        </Button>

        {Object.keys(results).length > 0 && (
          <div className="space-y-3">
            {results.tasksTable && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>Tasks Table</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.tasksTable.success)}
                  <span className="text-sm text-gray-600">
                    {results.tasksTable.success ? `${results.tasksTable.count} records` : "Failed"}
                  </span>
                </div>
              </div>
            )}

            {results.commentsTable && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>Comments Table</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.commentsTable.success)}
                  <span className="text-sm text-gray-600">
                    {results.commentsTable.success ? `${results.commentsTable.count} records` : "Failed"}
                  </span>
                </div>
              </div>
            )}

            {results.profilesTable && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>User Profiles Table</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.profilesTable.success)}
                  <span className="text-sm text-gray-600">
                    {results.profilesTable.success ? `${results.profilesTable.count} records` : "Failed"}
                  </span>
                </div>
              </div>
            )}

            {results.foreignKey && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>Foreign Key Relationship</span>
                {getStatusIcon(results.foreignKey.success)}
              </div>
            )}

            {/* Error Details */}
            {(results.tasksTable?.error ||
              results.commentsTable?.error ||
              results.profilesTable?.error ||
              results.foreignKey?.error ||
              results.generalError) && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800">Issues Found:</span>
                </div>
                <div className="space-y-1 text-sm text-red-700">
                  {results.tasksTable?.error && <div>• Tasks Table: {results.tasksTable.error}</div>}
                  {results.commentsTable?.error && <div>• Comments Table: {results.commentsTable.error}</div>}
                  {results.profilesTable?.error && <div>• Profiles Table: {results.profilesTable.error}</div>}
                  {results.foreignKey?.error && <div>• Foreign Key: {results.foreignKey.error}</div>}
                  {results.generalError && <div>• General: {results.generalError}</div>}
                </div>
              </div>
            )}

            {/* Success Message */}
            {results.tasksTable?.success &&
              results.commentsTable?.success &&
              results.profilesTable?.success &&
              (!results.foreignKey || results.foreignKey.success) && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Database is properly configured!</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    All tables exist and relationships are working correctly.
                  </p>
                </div>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
