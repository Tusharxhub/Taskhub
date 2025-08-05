import ProfileRoutingTest from "@/components/ProfileRoutingTest"
import ProfileRoutingDiagnostic from "@/components/ProfileRoutingDiagnostic"

export default function TestProfileRoutingPage() {
  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Profile Routing Test</h1>
        <p className="text-gray-600 text-base sm:text-lg">
          Test all username links to verify profile routing works correctly across the application
        </p>
      </div>

      <div className="space-y-8">
        <ProfileRoutingDiagnostic />
        <ProfileRoutingTest />
      </div>
    </div>
  )
}
