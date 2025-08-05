import ProfileErrorTest from "@/components/ProfileErrorTest"

export default function TestErrorMessagesPage() {
  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Profile Error Message Testing</h1>
        <p className="text-gray-600 text-base sm:text-lg">
          Comprehensive testing of error handling for missing profiles and non-existent users
        </p>
      </div>

      <ProfileErrorTest />
    </div>
  )
}
