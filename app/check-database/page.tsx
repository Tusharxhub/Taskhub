import DatabaseChecker from "@/components/DatabaseChecker"

export default function CheckDatabasePage() {
  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 md:px-6 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Database Structure Check</h1>
        <p className="text-gray-600 text-base sm:text-lg">Verify your database tables are properly configured</p>
      </div>
      <DatabaseChecker />
    </div>
  )
}
