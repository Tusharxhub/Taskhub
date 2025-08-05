"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, X, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Image from "next/image"

interface ImageUploadProps {
  currentImageUrl?: string
  onImageUploaded: (url: string) => void
  userId: string
}

export default function ImageUpload({ currentImageUrl, onImageUploaded, userId }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB")
      return
    }

    setUploading(true)

    try {
      // Create a unique filename
      const fileExt = file.name.split(".").pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `profile-images/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage.from("profile-images").upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-images").getPublicUrl(filePath)

      setPreviewUrl(publicUrl)
      onImageUploaded(publicUrl)
      toast.success("Profile image uploaded successfully!")
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    onImageUploaded("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        {previewUrl ? (
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100">
            <Image src={previewUrl || "/placeholder.svg"} alt="Profile preview" fill className="object-cover" />
            <button
              onClick={handleRemoveImage}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
            <Camera className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center space-y-2">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading..." : previewUrl ? "Change Photo" : "Upload Photo"}
        </Button>
        <p className="text-xs text-gray-500 text-center">JPG, PNG or GIF (max 5MB)</p>
      </div>
    </div>
  )
}
