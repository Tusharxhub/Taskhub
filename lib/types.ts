export interface Task {
  id: number // Changed from string to number for BIGSERIAL
  title: string
  description: string
  price: number
  deadline: string
  category: string
  user_id: string
  user_name: string
  created_at: string
  updated_at: string
}

export interface Comment {
  id: number // Changed from string to number for BIGSERIAL
  task_id: number // Changed from string to number to match tasks.id
  user_id: string
  user_name: string
  content: string
  created_at: string
}

export interface UserProfile {
  id: number // Changed from string to number for BIGSERIAL
  user_id: string
  full_name: string
  email: string
  phone_number?: string
  bio?: string
  profile_image_url?: string
  instagram_id?: string
  linkedin_id?: string
  twitter_id?: string
  website_url?: string
  skills: string[]
  hourly_rate?: number
  location?: string
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: Task
        Insert: Omit<Task, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Task, "id" | "created_at" | "updated_at">>
      }
      comments: {
        Row: Comment
        Insert: Omit<Comment, "id" | "created_at">
        Update: Partial<Omit<Comment, "id" | "created_at">>
      }
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<UserProfile, "id" | "created_at" | "updated_at">>
      }
    }
  }
}
