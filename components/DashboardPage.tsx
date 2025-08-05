"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useUser } from "@clerk/nextjs"
import type { Task, Comment } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  DollarSign,
  MessageCircle,
  Edit,
  Trash2,
  Loader2,
  Plus,
  TrendingUp,
  Users,
  Briefcase,
  Star,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [comments, setComments] = useState<{ [taskId: string]: Comment[] }>({})
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalTasks: 0,
    totalApplications: 0,
    totalEarnings: 0,
    averageRating: 0,
  })
  const { user, isSignedIn } = useUser()

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

        // Calculate stats
        const totalApplications = commentsData?.length || 0
        const totalEarnings = tasksData?.reduce((sum, task) => sum + task.price, 0) || 0

        setStats({
          totalTasks: tasksData?.length || 0,
          totalApplications,
          totalEarnings,
          averageRating: 4.8, // Mock rating
        })
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
    if (isSignedIn && user) {
      fetchUserTasks()
    }
  }, [user, isSignedIn])

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return

    try {
      // First delete all comments for this task
      await supabase.from("comments").delete().eq("task_id", taskId)

      // Then delete the task
      const { error } = await supabase.from("tasks").delete().eq("id", taskId)

      if (error) throw error

      setTasks(tasks.filter((task) => task.id !== taskId))
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

  if (!isSignedIn) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-14 sm:pt-20">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                Welcome back, {user?.firstName || "Freelancer"}!
              </h1>
              <p className="text-base sm:text-xl text-gray-600">Manage your tasks and track your success</p>
            </div>
            <Link href="/request">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white mt-2 sm:mt-4 lg:mt-0 rounded-xl px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto">
                <Plus className="w-5 h-5 mr-2" />
                <span className="hidden xs:inline">Post New Task</span>
                <span className="inline xs:hidden">Post</span>
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8"
        >
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Tasks</p>
                  <p className="text-3xl font-bold">{stats.totalTasks}</p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Applications</p>
                  <p className="text-3xl font-bold">{stats.totalApplications}</p>
                </div>
                <Users className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Value</p>
                  <p className="text-3xl font-bold">{formatPrice(stats.totalEarnings)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Rating</p>
                  <p className="text-3xl font-bold">{stats.averageRating}</p>
                </div>
                <Star className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tasks Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                <TrendingUp className="h-6 w-6 mr-3 text-blue-600" />
                Your Posted Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Briefcase className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">No tasks posted yet</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Start your freelancing journey by posting your first task and connecting with talented
                    professionals.
                  </p>
                  <Link href="/request">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-6 py-3">
                      <Plus className="w-5 h-5 mr-2" />
                      Post Your First Task
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {tasks.map((task, index) => {
                    const taskComments = comments[task.id] || []
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg text-gray-900 line-clamp-2">{task.title}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200"
                              >
                                {task.category}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <p className="text-gray-700 text-sm line-clamp-3">{task.description}</p>

                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-green-600">
                                <DollarSign className="h-4 w-4" />
                                <span className="font-semibold">{formatPrice(task.price)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-blue-600">
                                <Calendar className="h-4 w-4" />
                                <span>Due: {formatDate(task.deadline)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-purple-600">
                                <MessageCircle className="h-4 w-4" />
                                <span>{taskComments.length} Applications</span>
                              </div>
                            </div>

                            {taskComments.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm text-gray-900">Recent Applications:</h4>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {taskComments.slice(0, 3).map((comment) => (
                                    <div key={comment.id} className="bg-blue-50 p-2 rounded-lg text-xs">
                                      <div className="font-medium text-gray-900">{comment.user_name}</div>
                                      <div className="text-gray-600 line-clamp-2">{comment.content}</div>
                                    </div>
                                  ))}
                                  {taskComments.length > 3 && (
                                    <div className="text-xs text-gray-500 text-center">
                                      +{taskComments.length - 3} more applications
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent rounded-lg"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                <span className="hidden xs:inline">Edit</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteTask(task.id)}
                                className="flex-1 text-red-600 border-red-600 hover:bg-red-50 bg-transparent rounded-lg"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                <span className="hidden xs:inline">Delete</span>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
