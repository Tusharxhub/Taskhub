"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import type { Task, Comment } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import DashboardPageComponent from "@/components/DashboardPage"

export default function Dashboard() {
  const { user, isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [comments, setComments] = useState<{ [taskId: string]: Comment[] }>({})
  const [loading, setLoading] = useState(true)

  const fetchUserTasks = async () => {
    if (!user) return

    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (tasksError) throw tasksError

      const taskIds = tasksData?.map((task) => task.id) || []

      if (taskIds.length > 0) {
        const { data: commentsData, error: commentsError } = await supabase
          .from("comments")
          .select("*")
          .in("task_id", taskIds)
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

        setComments(commentsByTask)
      }

      setTasks(tasksData || [])
    } catch (error) {
      console.error("Error fetching user tasks:", error)
      toast.error("Failed to load your tasks")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/")
    }
    if (isSignedIn && user) {
      fetchUserTasks()
    }
  }, [user, isSignedIn, isLoaded, router])

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return

    try {
      // First delete all comments for this task
      await supabase.from("comments").delete().eq("task_id", taskId)

      // Then delete the task
      const { error } = await supabase.from("tasks").delete().eq("id", taskId)

      if (error) throw error

      setTasks(tasks.filter((task) => String(task.id) !== taskId))
      toast.success("Task deleted successfully")
    } catch (error) {
      console.error("Error deleting task:", error)
      toast.error("Failed to delete task")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price)
  }

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 sm:pt-20">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 sm:pt-20">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
        <DashboardPageComponent tasks={tasks} comments={comments} loading={loading} />
      </div>
    </div>
  )
}
