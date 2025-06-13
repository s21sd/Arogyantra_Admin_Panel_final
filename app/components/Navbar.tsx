"use client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function Navbar() {
  const router = useRouter()
  return (
    <nav className="bg-[#6C63FF] shadow-sm rounded-b-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <div onClick={() => router.push("/")} className="text-2xl font-bold text-white">
              Arogyantra
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="secondary" asChild>
              <h1 onClick={() => router.push("/components/login")}>Login</h1>
            </Button>
            {/* <Button asChild>
              <Link href="/components/signup">Sign Up</Link>
            </Button> */}
          </div>
        </div>
      </div>
    </nav>
  )
}

