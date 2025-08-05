"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertTriangle,
  User,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Database,
  UserX,
  FileX,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

interface ErrorTestCase {
  id: string
  name: string
  description: string
  userId: string
  expectedError: "user_not_found" | "profile_incomplete" | "success"
  expectedMessage: string
  tested: boolean
  actualResult?: string
  success?: boolean
}

export default function ProfileErrorTest() {
  const [testCases, setTestCases] = useState<ErrorTestCase[]>([
    {
      id: "nonexistent",
      name: "Non-existent User",
      description: "User ID that doesn't exist in any table",
      userId: "user_nonexistent_12345",
      expectedError: "user_not_found",
      expectedMessage: "User Not Found - The user profile you're looking for doesn't exist.",
      tested: false,
    },
    {
      id: "invalid-format",
      name: "Invalid User ID Format",
      description: "Malformed user ID",
      userId: "invalid-user-id-format",
      expectedError: "user_not_found",
      expectedMessage: "User Not Found - The user profile you're looking for doesn't exist.",
      tested: false,
    },
    {
      id: "empty",
      name: "Empty User ID",
      description: "Empty or whitespace user ID",
      userId: " ",
      expectedError: "user_not_found",
      expectedMessage: "User Not Found - The user profile you're looking for doesn't exist.",
      tested: false,
    },
    {
      id: "special-chars",
      name: "Special Characters",
      description: "User ID with special characters",
      userId: "user_@#$%^&*()",
      expectedError: "user_not_found",
      expectedMessage: "User Not Found - The user profile you're looking for doesn't exist.",
      tested: false,
    },
  ])

  const [realUserTests, setRealUserTests] = useState<ErrorTestCase[]>([])
  const [loading, setLoading] = useState(false)

  const findRealTestCases = async () => {
    setLoading(true)
    try {
      // Find users who have tasks but no profiles
      const { data: tasksData, error: tasksError } = await supabase.from("tasks").select("user_id, user_name").limit(10)

      if (tasksError) throw tasksError

      const realTests: ErrorTestCase[] = []

      // Check each task author to see if they have a profile
      for (const task of tasksData || []) {
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("user_id", task.user_id)
          .single()

        const hasProfile = !profileError && !!profileData

        realTests.push({
          id: `real-${task.user_id}`,
          name: `Real User: ${task.user_name}`,
          description: `User who ${hasProfile ? "has" : "doesn't have"} a complete profile`,
          userId: task.user_id,
          expectedError: hasProfile ? "success" : "profile_incomplete",
          expectedMessage: hasProfile
            ? "Should show full profile page"
            : "Profile Not Complete - This user exists but hasn't completed their profile yet.",
          tested: false,
        })
      }

      setRealUserTests(realTests)
    } catch (error) {
      console.error("Error finding real test cases:", error)
    } finally {
      setLoading(false)
    }
  }

  const testProfilePage = async (testCase: ErrorTestCase) => {
    try {
      // Test the actual profile route behavior
      const response = await fetch(`/api/test-profile/${testCase.userId}`)

      let actualResult = "Unknown"
      let success = false

      if (response.status === 404) {
        actualResult = "User Not Found"
        success = testCase.expectedError === "user_not_found"
      } else if (response.ok) {
        const data = await response.json()
        if (data.profileExists) {
          actualResult = "Profile Found"
          success = testCase.expectedError === "success"
        } else if (data.userExists) {
          actualResult = "Profile Incomplete"
          success = testCase.expectedError === "profile_incomplete"
        } else {
          actualResult = "User Not Found"
          success = testCase.expectedError === "user_not_found"
        }
      }

      // Update test case
      const updateTestCases = (cases: ErrorTestCase[]) =>
        cases.map((tc) => (tc.id === testCase.id ? { ...tc, tested: true, actualResult, success } : tc))

      if (testCase.id.startsWith("real-")) {
        setRealUserTests(updateTestCases)
      } else {
        setTestCases(updateTestCases)
      }
    } catch (error) {
      console.error(`Error testing ${testCase.name}:`, error)

      const updateWithError = (cases: ErrorTestCase[]) =>
        cases.map((tc) =>
          tc.id === testCase.id ? { ...tc, tested: true, actualResult: "Test Failed", success: false } : tc,
        )

      if (testCase.id.startsWith("real-")) {
        setRealUserTests(updateWithError)
      } else {
        setTestCases(updateWithError)
      }
    }
  }

  const testAllCases = async () => {
    for (const testCase of [...testCases, ...realUserTests]) {
      await testProfilePage(testCase)
      // Small delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  const resetTests = () => {
    setTestCases((cases) => cases.map((tc) => ({ ...tc, tested: false, actualResult: undefined, success: undefined })))
    setRealUserTests((cases) =>
      cases.map((tc) => ({ ...tc, tested: false, actualResult: undefined, success: undefined })),
    )
  }

  const getStatusIcon = (testCase: ErrorTestCase) => {
    if (!testCase.tested) return null
    return testCase.success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getStatusBadge = (testCase: ErrorTestCase) => {
    if (!testCase.tested) return <Badge variant="outline">Not Tested</Badge>

    if (testCase.success) {
      return <Badge className="bg-green-500">Pass</Badge>
    } else {
      return <Badge variant="destructive">Fail</Badge>
    }
  }

  const allTests = [...testCases, ...realUserTests]
  const testedCount = allTests.filter((tc) => tc.tested).length
  const passedCount = allTests.filter((tc) => tc.tested && tc.success).length

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Test Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Profile Error Message Test Suite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{allTests.length}</div>
              <div className="text-sm text-gray-600">Total Tests</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{testedCount}</div>
              <div className="text-sm text-gray-600">Tests Run</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{passedCount}</div>
              <div className="text-sm text-gray-600">Tests Passed</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{testedCount - passedCount}</div>
              <div className="text-sm text-gray-600">Tests Failed</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={findRealTestCases} disabled={loading}>
              {loading ? (
                <>
                  <Database className="h-4 w-4 mr-2 animate-spin" />
                  Finding Real Users...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Find Real Test Cases
                </>
              )}
            </Button>
            <Button onClick={testAllCases} variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Test All Cases
            </Button>
            <Button onClick={resetTests} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Tests
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Synthetic Test Cases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Synthetic Error Cases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testCases.map((testCase) => (
              <div key={testCase.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(testCase)}
                    <div>
                      <div className="font-medium text-gray-900">{testCase.name}</div>
                      <div className="text-sm text-gray-600">{testCase.description}</div>
                    </div>
                  </div>
                  {getStatusBadge(testCase)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-700 mb-1">Test User ID:</div>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">{testCase.userId}</code>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700 mb-1">Expected Result:</div>
                    <div className="text-gray-600">{testCase.expectedMessage}</div>
                  </div>
                </div>

                {testCase.tested && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <div className="font-medium text-sm text-gray-700 mb-1">Actual Result:</div>
                    <div className={`text-sm ${testCase.success ? "text-green-700" : "text-red-700"}`}>
                      {testCase.actualResult}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => testProfilePage(testCase)}>
                    Test This Case
                  </Button>
                  <Link href={`/profile/${testCase.userId}`} target="_blank">
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open Profile
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Real User Test Cases */}
      {realUserTests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Real User Test Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {realUserTests.map((testCase) => (
                <div key={testCase.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(testCase)}
                      <div>
                        <div className="font-medium text-gray-900">{testCase.name}</div>
                        <div className="text-sm text-gray-600">{testCase.description}</div>
                      </div>
                    </div>
                    {getStatusBadge(testCase)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-700 mb-1">User ID:</div>
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">{testCase.userId}</code>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Expected:</div>
                      <div className="text-gray-600">{testCase.expectedMessage}</div>
                    </div>
                  </div>

                  {testCase.tested && (
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <div className="font-medium text-sm text-gray-700 mb-1">Actual Result:</div>
                      <div className={`text-sm ${testCase.success ? "text-green-700" : "text-red-700"}`}>
                        {testCase.actualResult}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => testProfilePage(testCase)}>
                      Test This Case
                    </Button>
                    <Link href={`/profile/${testCase.userId}`} target="_blank">
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Open Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileX className="h-5 w-5" />
            Expected Error Messages Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <UserX className="h-4 w-4" />
              <AlertDescription>
                <strong>User Not Found:</strong> Should show "User Not Found" page with message: "The user profile
                you're looking for doesn't exist."
              </AlertDescription>
            </Alert>

            <Alert>
              <User className="h-4 w-4" />
              <AlertDescription>
                <strong>Profile Incomplete:</strong> Should show "Profile Not Complete" page with message: "This user
                exists but hasn't completed their profile yet."
              </AlertDescription>
            </Alert>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Profile Found:</strong> Should show the complete user profile with all information.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Manual Testing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="font-medium">1.</span>
              <span>Click "Find Real Test Cases" to discover actual users in your database</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">2.</span>
              <span>Click "Test All Cases" to automatically test all scenarios</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">3.</span>
              <span>Use "Open Profile" buttons to manually verify the error pages</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">4.</span>
              <span>Check that error messages are user-friendly and informative</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">5.</span>
              <span>Verify that "Back to Home" buttons work correctly</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
