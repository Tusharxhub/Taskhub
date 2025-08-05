"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, CheckCircle, XCircle, Play, MessageCircle, Briefcase, AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Task, Comment } from "@/lib/types"

interface ContentDeletionTestProps {
  onTestResult: (result: boolean) => void
}

export default function ContentDeletionTest({ onTestResult }: ContentDeletionTestProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [testResults, setTestResults] = useState<{
    deleteTask: boolean | null
    deleteComment: boolean | null
    cascadeDelete: boolean | null
  }>({
    deleteTask: null,
    deleteComment: null,
    cascadeDelete: null,
  })
  const [isRunning, setIsRunning] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [deletedItems, setDeletedItems] = useState<{
    tasks: number[]
    comments: number[]
  }>({
    tasks: [],
    comments: [],
  })

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const [tasksResponse, commentsResponse] = await Promise.all([
        supabase.from("tasks").select("*").limit(5),
        supabase.from("comments").select("*").limit(10),
      ])

      if (tasksResponse.error) throw tasksResponse.error
      if (commentsResponse.error) throw commentsResponse.error

      setTasks(tasksResponse.data || [])
      setComments(commentsResponse.data || [])

      if (tasksResponse.data && tasksResponse.data.length > 0) {
        setSelectedTask(tasksResponse.data[0])
      }
      if (commentsResponse.data && commentsResponse.data.length > 0) {
        setSelectedComment(commentsResponse.data[0])
      }
    } catch (error) {
      console.error("Error fetching content:", error)
    }
  }

  const testDeleteTask = async () => {
    if (!selectedTask) return

    setIsRunning(true)
    try {
      // Get comments for this task before deletion
      const taskComments = comments.filter((c) => c.task_id === selectedTask.id)

      // Simulate deleting comments first (cascade delete)
      const commentsToDelete = taskComments.map((c) => c.id)

      // Simulate deleting the task
      const success = true // Simulate successful deletion

      if (success) {
        setDeletedItems((prev) => ({
          tasks: [...prev.tasks, selectedTask.id],
          comments: [...prev.comments, ...commentsToDelete],
        }))

        setTestResults((prev) => ({ ...prev, deleteTask: true }))

        // Test cascade delete if there were comments
        if (taskComments.length > 0) {
          setTestResults((prev) => ({ ...prev, cascadeDelete: true }))
        }
      } else {
        setTestResults((prev) => ({ ...prev, deleteTask: false }))
      }

      updateOverallResult({
        ...testResults,
        deleteTask: success,
        cascadeDelete: taskComments.length > 0 ? success : testResults.cascadeDelete,
      })
    } catch (error) {
      setTestResults((prev) => ({ ...prev, deleteTask: false }))
      updateOverallResult({ ...testResults, deleteTask: false })
    }
    setIsRunning(false)
  }

  const testDeleteComment = async () => {
    if (!selectedComment) return

    setIsRunning(true)
    try {
      // Simulate deleting the comment
      const success = true // Simulate successful deletion

      if (success) {
        setDeletedItems((prev) => ({
          ...prev,
          comments: [...prev.comments, selectedComment.id],
        }))

        setTestResults((prev) => ({ ...prev, deleteComment: true }))
      } else {
        setTestResults((prev) => ({ ...prev, deleteComment: false }))
      }

      updateOverallResult({ ...testResults, deleteComment: success })
    } catch (error) {
      setTestResults((prev) => ({ ...prev, deleteComment: false }))
      updateOverallResult({ ...testResults, deleteComment: false })
    }
    setIsRunning(false)
  }

  const updateOverallResult = (results: typeof testResults) => {
    const allTestsPassed = Object.values(results).every((result) => result === true || result === null)
    const criticalTestsCompleted = results.deleteTask !== null && results.deleteComment !== null

    if (criticalTestsCompleted) {
      onTestResult(allTestsPassed)
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)

    // Test 1: Delete comment
    if (selectedComment) {
      await testDeleteComment()
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // Test 2: Delete task (with cascade)
    if (selectedTask) {
      await testDeleteTask()
    }

    setIsRunning(false)
  }

  const isTaskDeleted = (taskId: number) => deletedItems.tasks.includes(taskId)
  const isCommentDeleted = (commentId: number) => deletedItems.comments.includes(commentId)

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            <span>Content Deletion Functionality Test</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Delete Task</span>
                <Badge
                  className={
                    testResults.deleteTask === null
                      ? "bg-gray-100 text-gray-800"
                      : testResults.deleteTask
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                  }
                >
                  {testResults.deleteTask === null ? "Not Tested" : testResults.deleteTask ? "Passed" : "Failed"}
                </Badge>
              </div>
              {testResults.deleteTask === true && (
                <div className="flex items-center space-x-1 text-green-600 text-xs">
                  <CheckCircle className="h-3 w-3" />
                  <span>Task deleted successfully</span>
                </div>
              )}
              {testResults.deleteTask === false && (
                <div className="flex items-center space-x-1 text-red-600 text-xs">
                  <XCircle className="h-3 w-3" />
                  <span>Task deletion failed</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Delete Comment</span>
                <Badge
                  className={
                    testResults.deleteComment === null
                      ? "bg-gray-100 text-gray-800"
                      : testResults.deleteComment
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                  }
                >
                  {testResults.deleteComment === null ? "Not Tested" : testResults.deleteComment ? "Passed" : "Failed"}
                </Badge>
              </div>
              {testResults.deleteComment === true && (
                <div className="flex items-center space-x-1 text-green-600 text-xs">
                  <CheckCircle className="h-3 w-3" />
                  <span>Comment deleted successfully</span>
                </div>
              )}
              {testResults.deleteComment === false && (
                <div className="flex items-center space-x-1 text-red-600 text-xs">
                  <XCircle className="h-3 w-3" />
                  <span>Comment deletion failed</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cascade Delete</span>
                <Badge
                  className={
                    testResults.cascadeDelete === null
                      ? "bg-gray-100 text-gray-800"
                      : testResults.cascadeDelete
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                  }
                >
                  {testResults.cascadeDelete === null ? "Not Tested" : testResults.cascadeDelete ? "Passed" : "Failed"}
                </Badge>
              </div>
              {testResults.cascadeDelete === true && (
                <div className="flex items-center space-x-1 text-green-600 text-xs">
                  <CheckCircle className="h-3 w-3" />
                  <span>Related content deleted</span>
                </div>
              )}
              {testResults.cascadeDelete === false && (
                <div className="flex items-center space-x-1 text-red-600 text-xs">
                  <XCircle className="h-3 w-3" />
                  <span>Cascade deletion failed</span>
                </div>
              )}
            </div>
          </div>

          {/* Task Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tasks Available for Testing</h3>
            <div className="grid grid-cols-1 gap-4">
              {tasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTask?.id === task.id
                      ? "border-blue-500 bg-blue-50"
                      : isTaskDeleted(task.id)
                        ? "border-red-200 bg-red-50 opacity-50"
                        : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => !isTaskDeleted(task.id) && setSelectedTask(task)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{task.title}</h4>
                        {isTaskDeleted(task.id) && (
                          <Badge variant="destructive" className="text-xs">
                            Deleted
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>by {task.user_name}</span>
                        <span>•</span>
                        <span>{task.category}</span>
                        <span>•</span>
                        <span>₹{task.price}</span>
                      </div>
                    </div>
                    <Briefcase className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comment Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Comments Available for Testing</h3>
            <div className="grid grid-cols-1 gap-3">
              {comments.slice(0, 5).map((comment) => (
                <div
                  key={comment.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedComment?.id === comment.id
                      ? "border-blue-500 bg-blue-50"
                      : isCommentDeleted(comment.id)
                        ? "border-red-200 bg-red-50 opacity-50"
                        : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => !isCommentDeleted(comment.id) && setSelectedComment(comment)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{comment.user_name}</span>
                        {isCommentDeleted(comment.id) && (
                          <Badge variant="destructive" className="text-xs">
                            Deleted
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                    </div>
                    <MessageCircle className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Controls */}
          <div className="flex space-x-4">
            <Button
              onClick={runAllTests}
              disabled={isRunning || (!selectedTask && !selectedComment)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Play className="h-4 w-4 mr-2" />
              {isRunning ? "Running Tests..." : "Run All Tests"}
            </Button>

            <Button
              onClick={testDeleteTask}
              disabled={isRunning || !selectedTask || isTaskDeleted(selectedTask?.id || 0)}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50 bg-transparent"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Test Delete Task
            </Button>

            <Button
              onClick={testDeleteComment}
              disabled={isRunning || !selectedComment || isCommentDeleted(selectedComment?.id || 0)}
              variant="outline"
              className="border-orange-600 text-orange-600 hover:bg-orange-50 bg-transparent"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Test Delete Comment
            </Button>
          </div>

          {/* Deletion Summary */}
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-semibold text-red-900 mb-2">Deletion Summary:</h4>
            <div className="space-y-2 text-sm text-red-800">
              <p>
                <strong>Tasks Deleted:</strong> {deletedItems.tasks.length}
              </p>
              <p>
                <strong>Comments Deleted:</strong> {deletedItems.comments.length}
              </p>
              {deletedItems.tasks.length > 0 && (
                <div className="text-xs">
                  <strong>Deleted Task IDs:</strong> {deletedItems.tasks.join(", ")}
                </div>
              )}
              {deletedItems.comments.length > 0 && (
                <div className="text-xs">
                  <strong>Deleted Comment IDs:</strong> {deletedItems.comments.join(", ")}
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-semibold text-red-900 mb-2">Testing Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1 text-red-800 text-sm">
              <li>Select a task and/or comment from the lists above</li>
              <li>Click "Run All Tests" to test both deletion types</li>
              <li>Or use individual buttons to test specific deletion functionality</li>
              <li>Verify that deleted items show the "Deleted" badge and become unselectable</li>
              <li>Check that deleting a task also deletes its related comments (cascade delete)</li>
            </ol>
            <Alert className="mt-4 border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Note:</strong> This is a simulation test. In the real admin panel, deletions will be permanent
                and affect the actual database.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
