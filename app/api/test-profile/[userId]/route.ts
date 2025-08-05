import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId

    if (!userId || userId.trim() === "") {
      return NextResponse.json({ userExists: false, profileExists: false, error: "Invalid user ID" }, { status: 404 })
    }

    // Check if user has a profile
    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single()

    const profileExists = !profileError && !!profileData

    // Check if user exists in tasks or comments
    const { data: tasksData, error: tasksError } = await supabase
      .from("tasks")
      .select("id")
      .eq("user_id", userId)
      .limit(1)

    const { data: commentsData, error: commentsError } = await supabase
      .from("comments")
      .select("id")
      .eq("user_id", userId)
      .limit(1)

    const userExists =
      profileExists ||
      (!tasksError && tasksData && tasksData.length > 0) ||
      (!commentsError && commentsData && commentsData.length > 0)

    return NextResponse.json({
      userExists,
      profileExists,
      userId,
    })
  } catch (error) {
    console.error("Error in test-profile API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
