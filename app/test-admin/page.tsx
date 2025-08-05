"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import AdminAccessTest from "@/components/AdminAccessTest"
import UserBlockingTest from "@/components/UserBlockingTest"
import ContentDeletionTest from "@/components/ContentDeletionTest"

export default function TestAdminPage() {
  const [testResults, setTestResults] = useState<{
    adminAccess: boolean | null
    userBlocking: boolean | null
    contentDeletion: boolean | null
  }>({
    adminAccess: null,
    userBlocking: null,
    contentDeletion: null,
  })

  const updateTestResult = (test: string, result: boolean) => {
    setTestResults((prev) => ({
      ...prev,
      [test]: result,
    }))
  }

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    if (status === true) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusText = (status: boolean | null) => {
    if (status === null) return "Not Tested"
    if (status === true) return "Passed"
    return "Failed"
  }

  const getStatusColor = (status: boolean | null) => {
    if (status === null) return "bg-yellow-100 text-yellow-800"
    if (status === true) return "bg-green-100 text-green-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 sm:pt-20">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                <Shield className="h-8 w-8 text-red-600 mr-3" />
                Admin Panel Testing Suite
              </h1>
              <p className="text-gray-600 mt-1 text-base sm:text-lg">Comprehensive testing for admin functionality</p>
            </div>
          </div>
        </div>

        {/* Test Results Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Admin Access Test</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(testResults.adminAccess)}
                    <span className="font-semibold">{getStatusText(testResults.adminAccess)}</span>
                  </div>
                </div>
                <Badge className={getStatusColor(testResults.adminAccess)}>
                  {getStatusText(testResults.adminAccess)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">User Blocking Test</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(testResults.userBlocking)}
                    <span className="font-semibold">{getStatusText(testResults.userBlocking)}</span>
                  </div>
                </div>
                <Badge className={getStatusColor(testResults.userBlocking)}>
                  {getStatusText(testResults.userBlocking)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Content Deletion Test</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(testResults.contentDeletion)}
                    <span className="font-semibold">{getStatusText(testResults.contentDeletion)}</span>
                  </div>
                </div>
                <Badge className={getStatusColor(testResults.contentDeletion)}>
                  {getStatusText(testResults.contentDeletion)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Tabs */}
        <Tabs defaultValue="admin-access" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="admin-access">Admin Access</TabsTrigger>
            <TabsTrigger value="user-blocking">User Blocking</TabsTrigger>
            <TabsTrigger value="content-deletion">Content Deletion</TabsTrigger>
          </TabsList>

          <TabsContent value="admin-access">
            <AdminAccessTest onTestResult={(result) => updateTestResult("adminAccess", result)} />
          </TabsContent>

          <TabsContent value="user-blocking">
            <UserBlockingTest onTestResult={(result) => updateTestResult("userBlocking", result)} />
          </TabsContent>

          <TabsContent value="content-deletion">
            <ContentDeletionTest onTestResult={(result) => updateTestResult("contentDeletion", result)} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
