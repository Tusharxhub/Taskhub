"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  Search,
  Menu,
  X,
  Bell,
  MessageCircle,
  User,
  Settings,
  LogOut,
  Plus,
  Briefcase,
  Home,
  Shield,
  Grid,
} from "lucide-react"
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import LogoutButton from "@/components/LogoutButton"

export default function AnimatedNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isScrolled, setIsScrolled] = useState(false)
  const [notifications] = useState(3) // Mock notification count
  const { isSignedIn, user } = useUser()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Searching for:", searchQuery)
  }

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/browse", label: "Browse Tasks", icon: Grid },
    { href: "/dashboard", label: "Dashboard", icon: Briefcase },
    { href: "/admin", label: "Admin", icon: Shield, adminOnly: true },
  ]

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.05 }} className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TaskHub
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation - Only show if signed in */}
          {isSignedIn && (
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => {
                if (item.adminOnly) {
                  return null // Admin link will be shown separately
                }

                return (
                  <motion.div key={item.href} whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
                    <Link
                      href={item.href}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                        isScrolled
                          ? "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                          : "text-white hover:text-blue-200 hover:bg-white/10"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  </motion.div>
                )
              })}
              {/* Admin Link - Always visible for testing */}
              <motion.div whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
                <Link
                  href="/admin"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                    isScrolled
                      ? "text-red-700 hover:text-red-600 hover:bg-red-50"
                      : "text-red-200 hover:text-red-100 hover:bg-red-500/10"
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin</span>
                </Link>
              </motion.div>
            </div>
          )}

          {/* Search Bar - Only show if signed in */}
          {isSignedIn && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="flex w-full">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search tasks, freelancers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full bg-white/90 backdrop-blur-sm border-gray-200 focus:border-blue-500 rounded-xl"
                  />
                </div>
              </form>
            </div>
          )}

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isSignedIn ? (
              <>
                {/* Post Task Button */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/request">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl">
                      <Plus className="w-4 h-4 mr-2" />
                      Post Task
                    </Button>
                  </Link>
                </motion.div>

                {/* Notifications */}
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {notifications > 0 && (
                      <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                        {notifications}
                      </Badge>
                    )}
                  </Button>
                </motion.div>

                {/* Messages */}
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button variant="ghost" size="icon">
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                </motion.div>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }}>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <UserButton afterSignOutUrl="/" />
                      </Button>
                    </motion.div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.fullName || user?.emailAddresses[0]?.emailAddress}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.emailAddresses[0]?.emailAddress}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <Briefcase className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <LogoutButton>
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </LogoutButton>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <SignInButton mode="modal">
                  <Button
                    variant="ghost"
                    className={`${
                      isScrolled
                        ? "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                        : "text-white hover:text-blue-200 hover:bg-white/10"
                    } rounded-xl`}
                  >
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl">
                    Get Started
                  </Button>
                </SignUpButton>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-lg ${
                isScrolled ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/10"
              }`}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4 border-t border-gray-200/20"
            >
              <div className="flex flex-col space-y-4">
                {/* Mobile Search - Only show if signed in */}
                {isSignedIn && (
                  <form onSubmit={handleSearch} className="flex">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full bg-white/90 backdrop-blur-sm border-gray-200 rounded-xl"
                      />
                    </div>
                  </form>
                )}

                {/* Mobile Navigation Links - Only show if signed in */}
                {isSignedIn &&
                  navItems.map((item) => {
                    if (item.adminOnly) {
                      return null
                    }

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                          isScrolled
                            ? "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                            : "text-white hover:text-blue-200 hover:bg-white/10"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}

                {/* Mobile Admin Link - Always visible for testing */}
                {isSignedIn && (
                  <Link
                    href="/admin"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isScrolled
                        ? "text-red-700 hover:text-red-600 hover:bg-red-50"
                        : "text-red-200 hover:text-red-100 hover:bg-red-500/10"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                )}

                {/* Mobile Auth */}
                <div className="pt-4 border-t border-gray-200/20">
                  {isSignedIn ? (
                    <div className="space-y-2">
                      <Link href="/request" onClick={() => setIsMenuOpen(false)}>
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl">
                          <Plus className="w-4 h-4 mr-2" />
                          Post Task
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-2">
                      <SignInButton mode="modal">
                        <Button
                          variant="outline"
                          className="w-full rounded-xl bg-transparent"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Sign In
                        </Button>
                      </SignInButton>
                      <SignUpButton mode="modal">
                        <Button
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Get Started
                        </Button>
                      </SignUpButton>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}
