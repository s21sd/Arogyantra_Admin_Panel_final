"use client"
import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { database } from '../Firebase'
import { toast } from 'sonner'
import { onValue, ref as dbRef } from "firebase/database"
import { useRouter } from 'next/navigation'
function LoginPage() {
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [adminCheck, setAdminCheck] = useState(false)
  const router = useRouter();

  // Check phone and password in database
  const checkAdminCredentials = async () => {
    const adminsRef = dbRef(database, 'admins/' + phone)
    return new Promise((resolve) => {
      onValue(adminsRef, (snapshot) => {
        const data = snapshot.val()
        console.log("Admin data:", data)
        if (data && data.password === password) {
          setAdminCheck(true)
          resolve(true)
        } else {
          setAdminCheck(false)
          toast.error("Invalid phone number or password")
          resolve(false)
        }
      }, { onlyOnce: true })
    })
  }

  const handleSendOtp = async (e: React.MouseEvent) => {
    e.preventDefault()
    setOtpLoading(true)
    const valid = await checkAdminCredentials()
    if (!valid) {
      setOtpLoading(false)
      return
    }
    setOtpSent(true)
    toast.success("OTP sent: 123456 (for testing)")
    setOtpLoading(false)
  }

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (otp === "123456") {
      setOtpVerified(true)
      toast.success("OTP verified. You can now login.")
    } else {
      toast.error("Invalid OTP")
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpVerified) return toast.error("Please verify OTP first")
    toast.success("Login Successful")
    router.push('/components/dashboard')
    // Redirect or further logic here
  }

  return (
    <div className='flex flex-col justify-center items-center h-screen w-full'>
      <form onSubmit={otpVerified ? handleLogin : handleVerifyOtp} className="space-y-4 border border-gray-400 p-5 rounded-xl w-[350px]">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            disabled={otpSent || otpVerified}
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
            disabled={otpSent || otpVerified}
          />
        </div>
        <div className="space-y-2 flex items-center">
          <div className="flex-1">
            <Label htmlFor="otp">OTP</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              disabled={!otpSent || otpVerified}
            />
          </div>
          <Button type="button" className="ml-2 mt-6" onClick={handleSendOtp} disabled={otpLoading || otpSent || !phone || !password}>
            {otpLoading ? "Sending..." : "Send OTP"}
          </Button>
        </div>
        <Button type="submit" className="w-full" disabled={!otpSent || !otp}>
          {otpVerified ? "Login" : "Verify OTP"}
        </Button>
      </form>
    </div>
  )
}

export default LoginPage
