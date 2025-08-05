"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Shield,
  Users,
  Briefcase,
  TrendingUp,
  Trash2,
  Search,
  Eye,
  UserX,
  CheckCircle,
  Clock,
  DollarSign,
  Lock,
  Ban,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { Task, Comment, UserProfile } from "@/lib/types"
import Link from "next/link"

interface AdminStats {
  totalUsers: number
  totalTasks: number
  totalComments: number
  activeUsers: number
  pendingTasks: number
  completedTasks: number
  totalRevenue: number
}

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [showPasswordDialog, setShowPasswordDialog] = useState(true)
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalTasks: 0,
    totalComments: 0,
    activeUsers: 0,
    pendingTasks: 0,
    completedTasks: 0,
    totalRevenue: 0,
  })
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState("overview")

  const handlePasswordSubmit = () => {
    if (password === "0000") {
      setIsAuthenticated(true)
      setShowPasswordDialog(false)
      fetchAdminData()
      toast.success("Welcome to Admin Panel!")
    } else {
      toast.error("Incorrect password. Please try again.")
      setPassword("")
    }
  }

  const fetchAdminData = async () => {
    try {
      setLoading(true)

      // Fetch all data in parallel
      const [tasksResponse, usersResponse, commentsResponse] = await Promise.all([
        supabase.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("user_profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("comments").select("*").order("created_at", { ascending: false }),
      ])

      if (tasksResponse.error) throw tasksResponse.error
      if (usersResponse.error) throw usersResponse.error
      if (commentsResponse.error) throw commentsResponse.error

      const tasksData = tasksResponse.data || []
      const usersData = usersResponse.data || []
      const commentsData = commentsResponse.data || []

      setTasks(tasksData)
      setUsers(usersData)
      setComments(commentsData)

      // Calculate stats
      const totalRevenue = tasksData.reduce((sum, task) => sum + task.price, 0)
      const activeUsers = usersData.filter(
        (user) => new Date(user.updated_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      ).length

      setStats({
        totalUsers: usersData.length,
        totalTasks: tasksData.length,
        totalComments: commentsData.length,
        activeUsers,
        pendingTasks: tasksData.length,
        completedTasks: 0,
        totalRevenue,
      })
    } catch (error) {
      console.error("Error fetching admin data:", error)
      toast.error("Failed to load admin data")
    } finally {
      setLoading(false)
    }
  }

  const handleBlockUser = async (userId: string) => {
    try {
      // In a real app, you'd update a 'blocked' field in the database
      // For now, we'll just track it locally
      setBlockedUsers((prev) => new Set([...prev, userId]))
      toast.success("User blocked successfully")
    } catch (error) {
      console.error("Error blocking user:", error)
      toast.error("Failed to block user")
    }
  }

  const handleUnblockUser = async (userId: string) => {
    try {
      setBlockedUsers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
      toast.success("User unblocked successfully")
    } catch (error) {
      console.error("Error unblocking user:", error)
      toast.error("Failed to unblock user")
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    try {
      // Delete comments first (foreign key constraint)
      await supabase.from("comments").delete().eq("task_id", taskId)

      // Then delete the task
      const { error } = await supabase.from("tasks").delete().eq("id", taskId)

      if (error) throw error

      setTasks(tasks.filter((task) => task.id !== taskId))
      toast.success("Task deleted successfully")

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalTasks: prev.totalTasks - 1,
      }))
    } catch (error) {
      console.error("Error deleting task:", error)
      toast.error("Failed to delete task")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      // Delete user's comments
      await supabase.from("comments").delete().eq("user_id", userId)

      // Delete user's tasks
      await supabase.from("tasks").delete().eq("user_id", userId)

      // Delete user profile
      const { error } = await supabase.from("user_profiles").delete().eq("user_id", userId)

      if (error) throw error

      setUsers(users.filter((user) => user.user_id !== userId))
      toast.success("User deleted successfully")

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalUsers: prev.totalUsers - 1,
      }))
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Failed to delete user")
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    try {
      const { error } = await supabase.from("comments").delete().eq("id", commentId)

      if (error) throw error

      setComments(comments.filter((comment) => comment.id !== commentId))
      toast.success("Comment deleted successfully")

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalComments: prev.totalComments - 1,
      }))
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast.error("Failed to delete comment")
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Password Dialog
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <Dialog open={showPasswordDialog} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <Shield className="h-6 w-6 text-blue-600" />
                Admin Access Required
              </DialogTitle>
              <DialogDescription>Enter the admin password to access the control panel.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handlePasswordSubmit()}
                  className="pl-10 text-center text-lg tracking-widest"
                />
              </div>
              {/* <div className="text-xs text-gray-500 text-center">
                Hint: The password is a 4-digit number starting with 0
              </div> */}
            </div>
            <DialogFooter>
              <Button onClick={handlePasswordSubmit} className="w-full bg-blue-600 hover:bg-blue-700">
                Access Admin Panel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 sm:pt-20">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                <Shield className="h-8 w-8 text-red-600 mr-3" />
                Admin Control Panel
              </h1>
              <p className="text-gray-600 mt-1">Manage users, tasks, and platform content with full control</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-red-100 text-red-800 px-4 py-2">
                <CheckCircle className="h-4 w-4 mr-1" />
                Admin Access Active
              </Badge>
              <Button
                onClick={() => {
                  setIsAuthenticated(false)
                  setShowPasswordDialog(true)
                  setPassword("")
                }}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Lock className="h-4 w-4 mr-2" />
                Lock Panel
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Users</p>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Tasks</p>
                  <p className="text-3xl font-bold">{stats.totalTasks}</p>
                </div>
                <Briefcase className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Active Users</p>
                  <p className="text-3xl font-bold">{stats.activeUsers}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold">{formatPrice(stats.totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tasks.slice(0, 5).map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{task.title}</p>
                            <p className="text-xs text-gray-500">by {task.user_name}</p>
                          </div>
                          <Badge variant="outline">{formatPrice(task.price)}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle>System Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Database Status</span>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Healthy
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">API Response Time</span>
                        <Badge className="bg-green-100 text-green-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Fast
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Storage Usage</span>
                        <Badge className="bg-blue-100 text-blue-800">Normal</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Blocked Users</span>
                        <Badge className="bg-red-100 text-red-800">{blockedUsers.size}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>User Management</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users
                      .filter(
                        (user) =>
                          user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
                      )
                      .map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {user.full_name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-medium">{user.full_name}</p>
                                {blockedUsers.has(user.user_id) && (
                                  <Badge variant="destructive" className="text-xs">
                                    Blocked
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              <p className="text-xs text-gray-400">Joined {formatDate(user.created_at)}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Link href={`/profile/${user.user_id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                            {blockedUsers.has(user.user_id) ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnblockUser(user.user_id)}
                                className="text-green-600 hover:text-green-700 bg-transparent"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Unblock
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBlockUser(user.user_id)}
                                className="text-orange-600 hover:text-orange-700 bg-transparent"
                              >
                                <Ban className="h-4 w-4 mr-1" />
                                Block
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 bg-transparent"
                                >
                                  <UserX className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to permanently delete {user.full_name}? This will also delete
                                    all their tasks and comments. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.user_id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Task Management</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search tasks..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tasks
                      .filter(
                        (task) =>
                          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.description.toLowerCase().includes(searchTerm.toLowerCase()),
                      )
                      .map((task) => (
                        <div key={task.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{task.title}</h3>
                              <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span>by {task.user_name}</span>
                                <span>•</span>
                                <span>{task.category}</span>
                                <span>•</span>
                                <span>{formatDate(task.created_at)}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <Badge className="bg-green-100 text-green-800">{formatPrice(task.price)}</Badge>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 bg-transparent"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{task.title}"? This will also delete all related
                                      comments. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete Task
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments" className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Comment Management</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search comments..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {comments
                      .filter(
                        (comment) =>
                          comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          comment.user_name.toLowerCase().includes(searchTerm.toLowerCase()),
                      )
                      .map((comment) => (
                        <div key={comment.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-medium">{comment.user_name}</span>
                                <span className="text-sm text-gray-500">{formatDate(comment.created_at)}</span>
                                {blockedUsers.has(comment.user_id) && (
                                  <Badge variant="destructive" className="text-xs">
                                    Blocked User
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-700">{comment.content}</p>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 ml-4 bg-transparent"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this comment? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete Comment
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
