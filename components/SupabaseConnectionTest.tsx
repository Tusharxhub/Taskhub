"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2, Database, Upload, Table } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface ConnectionStatus {
  database: "loading" | "success" | "error"
  tables: "loading" | "success" | "error"
  storage: "loading" | "success" | "error"
}

export default function SupabaseConnectionTest() {
  const [status, setStatus] = useState<ConnectionStatus>({
    database: "loading",
    tables: "loading",
    storage: "loading",
  })
  const [errors, setErrors] = useState<string[]>([])
  const [tableInfo, setTableInfo] = useState<any[]>([])

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    setStatus({ database: "loading", tables: "loading", storage: "loading" })
    setErrors([])
    setTableInfo([])

    // Test 1: Basic database connection
    try {
      const { data, error } = await supabase.from("tasks").select("count", { count: "exact", head: true })

      if (error) {
        setStatus((prev) => ({ ...prev, database: "error" }))
        setErrors((prev) => [...prev, `Database connection failed: ${error.message}`])
      } else {
        setStatus((prev) => ({ ...prev, database: "success" }))
      }
    } catch (err) {
      setStatus((prev) => ({ ...prev, database: "error" }))
      setErrors((prev) => [...prev, `Database connection failed: ${err}`])
    }

    // Test 2: Check if required tables exist
    try {
      const tableChecks = [
        { name: "tasks", query: supabase.from("tasks").select("count", { count: "exact", head: true }) },
        { name: "comments", query: supabase.from("comments").select("count", { count: "exact", head: true }) },
        {
          name: "user_profiles",
          query: supabase.from("user_profiles").select("count", { count: "exact", head: true }),
        },
      ]

      const results = await Promise.allSettled(
        tableChecks.map(async ({ name, query }) => {
          const { data, error, count } = await query
          return { name, exists: !error, count: count || 0, error: error?.message }
        }),
      )

      const tableResults = results.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value
        } else {
          return {
            name: tableChecks[index].name,
            exists: false,
            count: 0,
            error: result.reason,
          }
        }
      })

      setTableInfo(tableResults)

      const allTablesExist = tableResults.every((table) => table.exists)
      if (allTablesExist) {
        setStatus((prev) => ({ ...prev, tables: "success" }))
      } else {
        setStatus((prev) => ({ ...prev, tables: "error" }))
        const missingTables = tableResults.filter((table) => !table.exists).map((table) => table.name)
        setErrors((prev) => [...prev, `Missing tables: ${missingTables.join(", ")}`])
      }
    } catch (err) {
      setStatus((prev) => ({ ...prev, tables: "error" }))
      setErrors((prev) => [...prev, `Table check failed: ${err}`])
    }

    // Test 3: Check storage bucket
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()

      if (bucketError) {
        setStatus((prev) => ({ ...prev, storage: "error" }))
        setErrors((prev) => [...prev, `Storage check failed: ${bucketError.message}`])
      } else {
        const profileImagesBucket = buckets?.find((bucket) => bucket.name === "profile-images")
        if (profileImagesBucket) {
          setStatus((prev) => ({ ...prev, storage: "success" }))
        } else {
          setStatus((prev) => ({ ...prev, storage: "error" }))
          setErrors((prev) => [...prev, 'Storage bucket "profile-images" not found'])
        }
      }
    } catch (err) {
      setStatus((prev) => ({ ...prev, storage: "error" }))
      setErrors((prev) => [...prev, `Storage check failed: ${err}`])
    }
  }

  const getStatusIcon = (state: "loading" | "success" | "error") => {
    switch (state) {
      case "loading":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusText = (state: "loading" | "success" | "error") => {
    switch (state) {
      case "loading":
        return "Testing..."
      case "success":
        return "Connected"
      case "error":
        return "Failed"
    }
  }

  const allSuccess = status.database === "success" && status.tables === "success" && status.storage === "success"

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Supabase Connection Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              {getStatusIcon(status.database)}
              <div>
                <div className="font-medium">Database Connection</div>
                <div className="text-sm text-gray-600">{getStatusText(status.database)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg">
              {getStatusIcon(status.tables)}
              <div>
                <div className="font-medium">Required Tables</div>
                <div className="text-sm text-gray-600">{getStatusText(status.tables)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg">
              {getStatusIcon(status.storage)}
              <div>
                <div className="font-medium">Storage Bucket</div>
                <div className="text-sm text-gray-600">{getStatusText(status.storage)}</div>
              </div>
            </div>
          </div>

          {/* Table Information */}
          {tableInfo.length > 0 && (
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Table className="h-4 w-4" />
                Table Status
              </h3>
              <div className="space-y-2">
                {tableInfo.map((table) => (
                  <div key={table.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {table.exists ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">{table.name}</span>
                    </div>
                    <div className="text-sm text-gray-600">{table.exists ? `${table.count} records` : "Missing"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-medium text-red-800 mb-2">Issues Found:</h3>
              <ul className="space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700">
                    • {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Success Message */}
          {allSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">All systems operational!</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your Supabase connection is working perfectly. You can now use all features of the marketplace.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={testConnection} variant="outline">
              <Loader2 className="h-4 w-4 mr-2" />
              Retest Connection
            </Button>

            {!allSuccess && (
              <Button
                onClick={() => window.open("https://supabase.com/dashboard/project/nyvfwshojyjjtcfgtigm", "_blank")}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Open Supabase Dashboard
              </Button>
            )}
          </div>

          {/* Setup Instructions */}
          {!allSuccess && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Setup Instructions:</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>1. Go to your Supabase dashboard SQL Editor</p>
                <p>2. Run the database setup scripts provided in the project</p>
                <p>3. Make sure the storage bucket is created and public</p>
                <p>4. Verify your environment variables are correct</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
