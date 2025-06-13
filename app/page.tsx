import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (

    <div className="flex w-full flex-col items-center justify-center min-h-screen py-12 bg-gray-50 sm:px-6 lg:px-8">

      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Welcome to Arogyantra Admin Panel</h1>
          <p className="mt-2 text-center text-sm text-gray-600">Manage your healthcare services with ease</p>
        </div>
        <div className="mt-8 space-y-4">
          <Button asChild className="w-full">
            <Link href="/components/login">Login</Link>
          </Button>
          {/* <Button asChild variant="outline" className="w-full">
            <Link href="/components/signup">Sign Up</Link>
          </Button> */}
        </div>
      </div>
    </div>
  );
}
