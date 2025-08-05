"use client"

import { useState } from "react"
import type { Task, Comment } from "@/lib/types"
import TaskCard from "@/components/TaskCard"
import { Loader2, Search, Grid, List } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface HomePageProps {
  tasks: Task[]
  comments: { [taskId: string]: Comment[] }
  loading: boolean
  onCommentAdded: () => void
}

export default function HomePage({ tasks, comments, loading, onCommentAdded }: HomePageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("newest")

  // Get unique categories
  const categories = Array.from(new Set(tasks.map((task) => task.category)))

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "all" || task.category === selectedCategory
      return matchesSearch && matchesCategory
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
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 sm:pt-20">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Loading amazing tasks for you...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 sm:pt-20">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1 sm:mb-2">
            Discover Amazing Tasks
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">Find the perfect freelance opportunity that matches your skills</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4 lg:gap-6">
            {/* Search */}
            <div className="w-full md:flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search tasks by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 sm:py-3 text-base sm:text-lg border-gray-300 focus:border-blue-500 rounded-xl"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="w-full md:w-40 lg:w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="py-2 sm:py-3 rounded-xl border-gray-300">
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
            </div>

            {/* Sort */}
            <div className="w-full md:w-40 lg:w-48">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="py-2 sm:py-3 rounded-xl border-gray-300">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode */}
            <div className="flex space-x-2 justify-center md:justify-start">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="rounded-xl"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="rounded-xl"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {(searchQuery || selectedCategory !== "all") && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200">
              <span className="text-xs sm:text-sm text-gray-600">Active filters:</span>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("all")
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
          <p className="text-gray-600 text-sm sm:text-base">
            Showing <span className="font-semibold">{filteredTasks.length}</span> of{" "}
            <span className="font-semibold">{tasks.length}</span> tasks
          </p>
        </div>

        {/* Tasks Grid/List */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Search className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">No tasks found</h3>
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
                {searchQuery || selectedCategory !== "all"
                  ? "Try adjusting your search criteria or filters"
                  : "No tasks available at the moment. Check back later for new opportunities!"}
              </p>
              {(searchQuery || selectedCategory !== "all") && (
                <Button
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory("all")
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className={
            viewMode === "grid"
              ? "grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "space-y-4 sm:space-y-6"
          }>
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                comments={comments[task.id] || []}
                onCommentAdded={onCommentAdded}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
