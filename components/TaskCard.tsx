"use client"

import type React from "react"
import Link from "next/link"

import { useState } from "react"
import { Calendar, DollarSign, Tag, MessageCircle, User, Mail, Phone, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useUser } from "@clerk/nextjs"
import type { Task, Comment, UserProfile } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface TaskCardProps {
  task: Task
  comments: Comment[]
  onCommentAdded: () => void
}

export default function TaskCard({ task, comments, onCommentAdded }: TaskCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedApplicant, setSelectedApplicant] = useState<{
    comment: Comment
    profile: UserProfile | null
  } | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const { user, isSignedIn } = useUser()

  const isTaskOwner = isSignedIn && user && task.user_id === user.id

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSignedIn || !user || !newComment.trim()) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("comments").insert({
        task_id: task.id,
        user_id: user.id,
        user_name: user.fullName || user.emailAddresses[0]?.emailAddress || "Anonymous",
        content: newComment.trim(),
      })

      if (error) throw error

      setNewComment("")
      onCommentAdded()
      toast.success("Application submitted successfully!")
    } catch (error) {
      console.error("Error adding comment:", error)
      toast.error("Failed to submit application")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleContactApplicant = async (comment: Comment) => {
    setLoadingProfile(true)
    try {
      // Fetch the applicant's profile
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", comment.user_id)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error)
      }

      setSelectedApplicant({
        comment,
        profile: profile || null,
      })
    } catch (error) {
      console.error("Error fetching applicant profile:", error)
      toast.error("Failed to load applicant details")
    } finally {
      setLoadingProfile(false)
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

  return (
    <>
      <Card className="w-full hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">{task.title}</CardTitle>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>Posted by </span>
            <Link
              href={`/profile/${task.user_id}`}
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              {task.user_name}
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">{task.description}</p>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1 text-green-600">
              <DollarSign className="h-4 w-4" />
              <span className="font-semibold">{formatPrice(task.price)}</span>
            </div>
            <div className="flex items-center gap-1 text-blue-600">
              <Calendar className="h-4 w-4" />
              <span>Due: {formatDate(task.deadline)}</span>
            </div>
            <div className="flex items-center gap-1 text-purple-600">
              <Tag className="h-4 w-4" />
              <span>{task.category}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              {comments.length} {comments.length === 1 ? "Application" : "Applications"}
            </Button>
            <span className="text-xs text-gray-500">Posted {formatDate(task.created_at)}</span>
          </div>

          {showComments && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              {/* Existing Comments */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Link
                        href={`/profile/${comment.user_id}`}
                        className="font-medium text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {comment.user_name}
                      </Link>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                        {isTaskOwner && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleContactApplicant(comment)}
                            disabled={loadingProfile}
                            className="text-xs px-2 py-1 h-auto"
                          >
                            Contact
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No applications yet. Be the first to apply!</p>
                )}
              </div>

              {/* Add Comment Form */}
              {isSignedIn && !isTaskOwner ? (
                <form onSubmit={handleCommentSubmit} className="space-y-3">
                  <Textarea
                    placeholder="Write your application message..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className="bg-teal-500 hover:bg-teal-600 text-white"
                  >
                    {isSubmitting ? "Submitting..." : "Apply for Task"}
                  </Button>
                </form>
              ) : isSignedIn && isTaskOwner ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600">
                    This is your task. You can contact applicants using the "Contact" button above.
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 mb-2">Sign in to apply for this task</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Applicant Dialog */}
      <Dialog open={!!selectedApplicant} onOpenChange={() => setSelectedApplicant(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Applicant</DialogTitle>
          </DialogHeader>
          {selectedApplicant && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Application Message:</h3>
                <p className="text-sm text-gray-700">{selectedApplicant.comment.content}</p>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Contact Information:</h3>

                {selectedApplicant.profile ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{selectedApplicant.profile.full_name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <a
                        href={`mailto:${selectedApplicant.profile.email}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {selectedApplicant.profile.email}
                      </a>
                    </div>

                    {selectedApplicant.profile.phone_number && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <a
                          href={`tel:${selectedApplicant.profile.phone_number}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {selectedApplicant.profile.phone_number}
                        </a>
                      </div>
                    )}

                    {selectedApplicant.profile.website_url && (
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-gray-500" />
                        <a
                          href={selectedApplicant.profile.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Portfolio/Website
                        </a>
                      </div>
                    )}

                    {selectedApplicant.profile.skills && selectedApplicant.profile.skills.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Skills: </span>
                        <span className="text-sm text-gray-600">{selectedApplicant.profile.skills.join(", ")}</span>
                      </div>
                    )}

                    {selectedApplicant.profile.hourly_rate && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Hourly Rate: </span>₹{selectedApplicant.profile.hourly_rate}/hour
                      </div>
                    )}

                    <div className="pt-3">
                      <Link href={`/profile/${selectedApplicant.comment.user_id}`}>
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          View Full Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600 mb-3">This user hasn't completed their profile yet.</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedApplicant.comment.user_name}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Contact information will be available once they complete their profile.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
