"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Search, Menu, X } from "lucide-react"
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { isSignedIn } = useUser()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search functionality
    console.log("Searching for:", searchQuery)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              TaskHub
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-slate-700 hover:text-blue-600 transition-colors">
              Home
            </Link>
            {isSignedIn && (
              <>
                <Link href="/dashboard" className="text-slate-700 hover:text-blue-600 transition-colors">
                  My Dashboard
                </Link>
                <Link href="/request" className="text-slate-700 hover:text-blue-600 transition-colors">
                  Request
                </Link>
                <Link href="/profile" className="text-slate-700 hover:text-blue-600 transition-colors">
                  Profile
                </Link>
              </>
            )}
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="flex w-full">
              <Input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-r-none border-r-0"
              />
              <Button type="submit" className="rounded-l-none bg-blue-600 hover:bg-blue-700">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button className="bg-blue-600 hover:bg-blue-700">Sign Up</Button>
                </SignUpButton>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="flex">
                <Input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-r-none border-r-0"
                />
                <Button type="submit" className="rounded-l-none bg-blue-600 hover:bg-blue-700">
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              {/* Mobile Navigation Links */}
              <Link href="/" className="text-slate-700 hover:text-blue-600 py-2">
                Home
              </Link>
              {isSignedIn && (
                <>
                  <Link href="/dashboard" className="text-slate-700 hover:text-blue-600 py-2">
                    My Dashboard
                  </Link>
                  <Link href="/request" className="text-slate-700 hover:text-blue-600 py-2">
                    Request
                  </Link>
                  <Link href="/profile" className="text-slate-700 hover:text-blue-600 py-2">
                    Profile
                  </Link>
                </>
              )}

              {/* Mobile Auth */}
              <div className="flex flex-col space-y-2 pt-4">
                {isSignedIn ? (
                  <div className="flex justify-center">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                ) : (
                  <>
                    <SignInButton mode="modal">
                      <Button
                        variant="outline"
                        className="w-full text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
                      >
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">Sign Up</Button>
                    </SignUpButton>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
