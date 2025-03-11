import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-bold text-primary">
              Arogyantra
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Button  asChild>
              <Link href="/components/login">Login</Link>
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

