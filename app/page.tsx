"use client"

import { useState, useEffect } from "react"
import type { Task, Comment } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { useUser } from "@clerk/nextjs"
import LandingPage from "@/components/LandingPage"
import HomePage from "@/components/HomePage"

export default function Page() {
  const { isSignedIn, isLoaded } = useUser()

  const [tasks, setTasks] = useState<Task[]>([])
  const [comments, setComments] = useState<{ [taskId: string]: Comment[] }>({})
  const [loading, setLoading] = useState(true)

  const fetchTasks = async () => {
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false })

      if (tasksError) throw tasksError

      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("*")
        .order("created_at", { ascending: true })

      if (commentsError) throw commentsError

      // Group comments by task_id
      const commentsByTask: { [taskId: string]: Comment[] } = {}
      commentsData?.forEach((comment) => {
        if (!commentsByTask[comment.task_id]) {
          commentsByTask[comment.task_id] = []
        }
        commentsByTask[comment.task_id].push(comment)
      })

      setTasks(tasksData || [])
      setComments(commentsByTask)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleCommentAdded = () => {
    fetchTasks() // Refresh data when a new comment is added
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading TaskHub...</p>
        </div>
      </div>
    )
  }

  return isSignedIn ? (
    <HomePage tasks={tasks} comments={comments} loading={loading} onCommentAdded={handleCommentAdded} />
  ) : (
    <LandingPage />
  )
}
