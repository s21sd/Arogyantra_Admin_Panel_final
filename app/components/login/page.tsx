"use client"
import React, { useState } from 'react'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../Firebase'
import { toast } from 'sonner'
const page = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await signInWithEmailAndPassword(auth, email, password);
    const user = res.user;
    console.log(user);
    toast.success("Login Successfully");


  }
  return (
    <div className='flex flex-col justify-center items-center h-screen w-full'>

      <form onSubmit={handleSubmit} className="space-y-4 border border-gray-400 p-5 rounded-xl w-[500]">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full">
          Login
        </Button>
      </form>
    </div>

  )
}

export default page
