"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2, Database, AlertTriangle, Copy, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function DatabaseSetupHelper() {
  const [checking, setChecking] = useState(false)
  const [status, setStatus] = useState<{
    connected: boolean | null
    tablesExist: boolean | null
    canInsert: boolean | null
    error: string | null
  }>({
    connected: null,
    tablesExist: null,
    canInsert: null,
    error: null,
  })

  const checkDatabaseStatus = async () => {
    setChecking(true)
    setStatus({ connected: null, tablesExist: null, canInsert: null, error: null })

    try {
      // Test 1: Basic connection
      console.log("Testing Supabase connection...")
      const { data: connectionTest, error: connectionError } = await supabase
        .from("tasks")
        .select("count", { count: "exact", head: true })

      if (connectionError) {
        console.error("Connection error:", connectionError)
        setStatus({
          connected: false,
          tablesExist: false,
          canInsert: false,
          error: `Connection failed: ${connectionError.message}`,
        })
        return
      }

      setStatus((prev) => ({ ...prev, connected: true, tablesExist: true }))

      // Test 2: Try to insert a test record
      console.log("Testing insert permissions...")
      const testTask = {
        title: "TEST - DELETE ME",
        description: "This is a test task that should be deleted immediately",
        price: 1,
        deadline: "2024-12-31",
        category: "Testing",
        user_id: "test-user",
        user_name: "Test User",
      }

      const { data: insertTest, error: insertError } = await supabase.from("tasks").insert(testTask).select().single()

      if (insertError) {
        console.error("Insert error:", insertError)
        setStatus((prev) => ({
          ...prev,
          canInsert: false,
          error: `Insert failed: ${insertError.message}`,
        }))
        return
      }

      // Clean up test record
      if (insertTest) {
        await supabase.from("tasks").delete().eq("id", insertTest.id)
      }

      setStatus((prev) => ({ ...prev, canInsert: true }))
    } catch (error: any) {
      console.error("Database check failed:", error)
      setStatus({
        connected: false,
        tablesExist: false,
        canInsert: false,
        error: error.message,
      })
    } finally {
      setChecking(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const sqlScript = `-- Copy this entire script and run it in your Supabase SQL Editor

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    deadline DATE NOT NULL,
    category TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert comments" ON public.comments FOR INSERT WITH CHECK (true);`

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Setup Helper
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Check */}
          <div className="space-y-4">
            <Button onClick={checkDatabaseStatus} disabled={checking} className="w-full">
              {checking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking Database...
                </>
              ) : (
                "Check Database Status"
              )}
            </Button>

            {/* Results */}
            {(status.connected !== null || status.error) && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    {status.connected ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">Connection</span>
                  </div>

                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    {status.tablesExist ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">Tables Exist</span>
                  </div>

                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    {status.canInsert ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">Can Insert</span>
                  </div>
                </div>

                {status.error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{status.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          {/* Setup Instructions */}
          {status.connected === false && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your database tables don't exist. Follow these steps to set them up:
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Step 1: Open Supabase Dashboard</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open("https://supabase.com/dashboard/project/nyvfwshojyjjtcfgtigm/sql", "_blank")
                    }
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open SQL Editor
                  </Button>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Step 2: Copy and Run This SQL</h3>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto max-h-60">
                      {sqlScript}
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 bg-transparent"
                      onClick={() => copyToClipboard(sqlScript)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Step 3: Test Again</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    After running the SQL script, click "Check Database Status" again to verify everything is working.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {status.connected && status.tablesExist && status.canInsert && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                ✅ Database is properly configured! You can now post tasks successfully.
              </AlertDescription>
            </Alert>
          )}

          {/* Environment Check */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Environment Variables Check:</h3>
            <div className="space-y-1 text-sm text-blue-700">
              <div>
                Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing"}
                {process.env.NEXT_PUBLIC_SUPABASE_URL && (
                  <span className="ml-2 text-xs">({process.env.NEXT_PUBLIC_SUPABASE_URL})</span>
                )}
              </div>
              <div>Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing"}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
