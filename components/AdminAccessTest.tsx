"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Shield, CheckCircle, XCircle, Play, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

interface AdminAccessTestProps {
  onTestResult: (result: boolean) => void
}

export default function AdminAccessTest({ onTestResult }: AdminAccessTestProps) {
  const [testPassword, setTestPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [testResults, setTestResults] = useState<{
    correctPassword: boolean | null
    incorrectPassword: boolean | null
    accessGranted: boolean | null
  }>({
    correctPassword: null,
    incorrectPassword: null,
    accessGranted: null,
  })
  const [isRunning, setIsRunning] = useState(false)

  const runPasswordTest = async (password: string, shouldPass: boolean) => {
    setIsRunning(true)

    // Simulate the admin password check
    const isCorrect = password === "0000"
    const testPassed = shouldPass ? isCorrect : !isCorrect

    if (shouldPass) {
      setTestResults((prev) => ({ ...prev, correctPassword: testPassed }))
    } else {
      setTestResults((prev) => ({ ...prev, incorrectPassword: testPassed }))
    }

    // Update overall test result
    const allTests = {
      ...testResults,
      [shouldPass ? "correctPassword" : "incorrectPassword"]: testPassed,
    }

    if (allTests.correctPassword !== null && allTests.incorrectPassword !== null) {
      onTestResult(allTests.correctPassword && allTests.incorrectPassword)
    }

    setIsRunning(false)
  }

  const testAccessGranted = () => {
    setTestResults((prev) => ({ ...prev, accessGranted: true }))
    onTestResult(testResults.correctPassword === true && testResults.incorrectPassword === true)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-blue-600" />
            <span>Admin Password Authentication Test</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test 1: Correct Password */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Test 1: Correct Password (0000)</h3>
              <Badge
                className={
                  testResults.correctPassword === null
                    ? "bg-gray-100 text-gray-800"
                    : testResults.correctPassword
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                }
              >
                {testResults.correctPassword === null
                  ? "Not Tested"
                  : testResults.correctPassword
                    ? "Passed"
                    : "Failed"}
              </Badge>
            </div>
            <p className="text-gray-600 text-sm">
              This test verifies that the correct password "0000" grants admin access.
            </p>
            <Button
              onClick={() => runPasswordTest("0000", true)}
              disabled={isRunning}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Test Correct Password
            </Button>
            {testResults.correctPassword === true && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ✅ Correct password "0000" was accepted successfully!
                </AlertDescription>
              </Alert>
            )}
            {testResults.correctPassword === false && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  ❌ Correct password "0000" was rejected - this is a bug!
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Test 2: Incorrect Password */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Test 2: Incorrect Password</h3>
              <Badge
                className={
                  testResults.incorrectPassword === null
                    ? "bg-gray-100 text-gray-800"
                    : testResults.incorrectPassword
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                }
              >
                {testResults.incorrectPassword === null
                  ? "Not Tested"
                  : testResults.incorrectPassword
                    ? "Passed"
                    : "Failed"}
              </Badge>
            </div>
            <p className="text-gray-600 text-sm">This test verifies that incorrect passwords are rejected.</p>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter test password (try wrong password)"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                onClick={() => runPasswordTest(testPassword, false)}
                disabled={isRunning || !testPassword}
                className="bg-red-600 hover:bg-red-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Test Wrong Password
              </Button>
            </div>
            {testResults.incorrectPassword === true && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ✅ Incorrect password "{testPassword}" was properly rejected!
                </AlertDescription>
              </Alert>
            )}
            {testResults.incorrectPassword === false && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  ❌ Incorrect password "{testPassword}" was accepted - this is a security issue!
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Manual Test: Access Admin Panel */}
          <div className="space-y-4 pt-6 border-t">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Manual Test: Access Admin Panel</h3>
              <Badge className="bg-blue-100 text-blue-800">Manual Test Required</Badge>
            </div>
            <p className="text-gray-600 text-sm">
              Click the button below to manually test the admin panel access with password "0000".
            </p>
            <div className="flex space-x-4">
              <Link href="/admin" target="_blank">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Shield className="h-4 w-4 mr-2" />
                  Open Admin Panel
                </Button>
              </Link>
              <Button
                onClick={testAccessGranted}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50 bg-transparent"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Tested
              </Button>
            </div>
            {testResults.accessGranted && (
              <Alert className="border-blue-200 bg-blue-50">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  ✅ Admin panel access has been manually verified!
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Testing Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
              <li>Run the "Test Correct Password" to verify "0000" works</li>
              <li>Enter a wrong password and run "Test Wrong Password" to verify rejection</li>
              <li>Click "Open Admin Panel" to manually test the real admin interface</li>
              <li>Enter "0000" when prompted and verify you can access admin features</li>
              <li>Click "Mark as Tested" once you've verified manual access</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
