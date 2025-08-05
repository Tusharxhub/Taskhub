"use client"

import { useState, useEffect } from "react"
import type { Task, Comment } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import TaskCard from "@/components/TaskCard"
import { Loader2, Search, Filter, SlidersHorizontal, MapPin, Calendar, DollarSign } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export default function BrowseTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [comments, setComments] = useState<{ [taskId: string]: Comment[] }>({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [priceRange, setPriceRange] = useState([0, 100000])
  const [sortBy, setSortBy] = useState("newest")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [])

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

  const handleCommentAdded = () => {
    fetchTasks() // Refresh data when a new comment is added
  }

  // Get unique categories
  const categories = Array.from(new Set(tasks.map((task) => task.category)))

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.user_name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "all" || task.category === selectedCategory
      const matchesPrice = task.price >= priceRange[0] && task.price <= priceRange[1]
      return matchesSearch && matchesCategory && matchesPrice
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "price-high":
          return b.price - a.price
        case "price-low":
          return a.price - b.price
        case "most-applications":
          return (comments[b.id]?.length || 0) - (comments[a.id]?.length || 0)
        default:
          return 0
      }
    })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Loading tasks...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Browse All Tasks
          </h1>
          <p className="text-gray-600 text-lg">Explore freelance opportunities with advanced filtering</p>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search tasks, descriptions, or authors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 text-lg border-gray-300 focus:border-blue-500 rounded-xl"
                />
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48 py-3 rounded-xl border-gray-300">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 py-3 rounded-xl border-gray-300">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="most-applications">Most Applications</SelectItem>
                </SelectContent>
              </Select>

              {/* Advanced Filters */}
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="px-4 py-3 rounded-xl border-gray-300 bg-transparent">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Advanced Filters</SheetTitle>
                    <SheetDescription>Refine your search with detailed filters</SheetDescription>
                  </SheetHeader>
                  <div className="space-y-6 mt-6">
                    {/* Price Range */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Price Range</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{formatPrice(priceRange[0])}</span>
                          <span>{formatPrice(priceRange[1])}</span>
                        </div>
                        <Slider
                          value={priceRange}
                          onValueChange={setPriceRange}
                          max={100000}
                          min={0}
                          step={1000}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Category Filter */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Categories</h3>
                      <div className="space-y-2">
                        <Button
                          variant={selectedCategory === "all" ? "default" : "outline"}
                          onClick={() => setSelectedCategory("all")}
                          className="w-full justify-start"
                        >
                          All Categories
                        </Button>
                        {categories.map((category) => (
                          <Button
                            key={category}
                            variant={selectedCategory === category ? "default" : "outline"}
                            onClick={() => setSelectedCategory(category)}
                            className="w-full justify-start"
                          >
                            {category}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Reset Filters */}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("")
                        setSelectedCategory("all")
                        setPriceRange([0, 100000])
                        setSortBy("newest")
                      }}
                      className="w-full"
                    >
                      Reset All Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Active Filters */}
          {(searchQuery || selectedCategory !== "all" || priceRange[0] > 0 || priceRange[1] < 100000) && (
            <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Search: "{searchQuery}"
                </Badge>
              )}
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  Category: {selectedCategory}
                </Badge>
              )}
              {(priceRange[0] > 0 || priceRange[1] < 100000) && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Price: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Showing</p>
                  <p className="text-xl font-bold">{filteredTasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Avg. Price</p>
                  <p className="text-xl font-bold">
                    {filteredTasks.length > 0
                      ? formatPrice(filteredTasks.reduce((sum, task) => sum + task.price, 0) / filteredTasks.length)
                      : "₹0"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Categories</p>
                  <p className="text-xl font-bold">{categories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Tasks</p>
                  <p className="text-xl font-bold">{tasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Grid */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters to find more tasks.</p>
              <Button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("all")
                  setPriceRange([0, 100000])
                  setSortBy("newest")
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                comments={comments[task.id] || []}
                onCommentAdded={handleCommentAdded}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
