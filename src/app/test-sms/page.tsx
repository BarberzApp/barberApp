'use client'

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Separator } from '@/shared/components/ui/separator'

const CARRIERS = [
  { value: 'verizon', label: 'Verizon' },
  { value: 'att', label: 'AT&T' },
  { value: 'tmobile', label: 'T-Mobile' },
  { value: 'sprint', label: 'Sprint' },
  { value: 'boost', label: 'Boost Mobile' },
  { value: 'uscellular', label: 'US Cellular' },
  { value: 'cricket', label: 'Cricket' },
  { value: 'metro', label: 'Metro PCS' },
  { value: 'googlefi', label: 'Google Fi' },
]

export default function TestSMSPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [carrier, setCarrier] = useState('')
  const [message, setMessage] = useState('')
  const [bookingId, setBookingId] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const handleTest = async () => {
    if (!phoneNumber || !carrier) {
      setResult('Please enter both phone number and carrier')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, carrier })
      })
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomMessage = async () => {
    if (!phoneNumber || !carrier || !message) {
      setResult('Please enter phone number, carrier, and message')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/bookings/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, carrier, message })
      })
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleReminderTest = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/bookings/check-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDebugBooking = async () => {
    if (!bookingId) {
      setResult('Please enter a booking ID')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/debug-booking-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      })
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleTestClientSMS = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-client-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: '9083407527', 
          carrier: 'verizon' 
        })
      })
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleTestBookingSMS = async () => {
    if (!bookingId) {
      setResult('Please enter a booking ID first')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/test-booking-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      })
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFixBarberSMS = async () => {
    if (!bookingId) {
      setResult('Please enter a booking ID first')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/fix-barber-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      })
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDirectSMSTest = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-sms-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBarberProfile = async () => {
    if (!bookingId) {
      setResult('Please enter a booking ID first')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/update-barber-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      })
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="bg-black/95 border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-2xl">SMS Testing Dashboard</CardTitle>
          <CardDescription className="text-white/70">
            Test the SMS notification system for your barber booking app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Basic SMS Test */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold">1. Basic SMS Test</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-white">Phone Number</Label>
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="1234567890"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <Label htmlFor="carrier" className="text-white">Carrier</Label>
                <Select value={carrier} onValueChange={setCarrier}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 border-white/20">
                    {CARRIERS.map((carrier) => (
                      <SelectItem key={carrier.value} value={carrier.value} className="text-white">
                        {carrier.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              onClick={handleTest} 
              disabled={loading}
              className="w-full bg-saffron text-black hover:bg-saffron/90"
            >
              {loading ? 'Sending...' : 'Send Test SMS'}
            </Button>
          </div>

          <Separator className="bg-white/20" />

          {/* Custom Message Test */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold">2. Custom Message Test</h3>
            <div>
              <Label htmlFor="message" className="text-white">Message</Label>
              <Input
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your custom message here..."
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <Button 
              onClick={handleCustomMessage} 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Sending...' : 'Send Custom Message'}
            </Button>
          </div>

          <Separator className="bg-white/20" />

          {/* Reminder Test */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold">3. Reminder System Test</h3>
            <p className="text-white/70 text-sm">
              This will check for any bookings in the next hour and send reminder SMS notifications.
            </p>
            <Button 
              onClick={handleReminderTest} 
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Checking...' : 'Check & Send Reminders'}
            </Button>
          </div>

          <Separator className="bg-white/20" />

          {/* Debug Booking */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold">4. Debug Booking SMS</h3>
            <p className="text-white/70 text-sm">
              Enter a booking ID to debug why SMS wasn't sent for that booking.
            </p>
            <div>
              <Label htmlFor="bookingId" className="text-white">Booking ID</Label>
              <Input
                id="bookingId"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="Enter booking ID..."
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <Button 
              onClick={handleDebugBooking} 
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? 'Debugging...' : 'Debug Booking SMS'}
            </Button>
          </div>

          <Separator className="bg-white/20" />

          {/* Test Client SMS */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold">5. Test Client SMS (From Your Booking)</h3>
            <p className="text-white/70 text-sm">
              Test sending an SMS to the client from your booking (9083407527 - Verizon).
            </p>
            <Button 
              onClick={handleTestClientSMS} 
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {loading ? 'Sending...' : 'Test Client SMS'}
            </Button>
          </div>

          <Separator className="bg-white/20" />

          {/* Test Booking SMS */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold">6. Test Booking SMS (Manual Trigger)</h3>
            <p className="text-white/70 text-sm">
              Manually trigger the SMS confirmation for your booking to see what happens.
            </p>
            <Button 
              onClick={handleTestBookingSMS} 
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Testing...' : 'Test Booking SMS'}
            </Button>
          </div>

          <Separator className="bg-white/20" />

          {/* Fix Barber SMS */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold">7. Fix Barber SMS & Test</h3>
            <p className="text-white/70 text-sm">
              Fix the missing barber SMS data and test the complete SMS system.
            </p>
            <Button 
              onClick={handleFixBarberSMS} 
              disabled={loading}
              className="w-full bg-yellow-600 hover:bg-yellow-700"
            >
              {loading ? 'Fixing...' : 'Fix Barber SMS & Test'}
            </Button>
          </div>

          <Separator className="bg-white/20" />

          {/* Direct SMS Test */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold">8. Direct SMS Test (Bypass Booking)</h3>
            <p className="text-white/70 text-sm">
              Test SMS directly without going through the booking system.
            </p>
            <Button 
              onClick={handleDirectSMSTest} 
              disabled={loading}
              className="w-full bg-pink-600 hover:bg-pink-700"
            >
              {loading ? 'Sending...' : 'Direct SMS Test'}
            </Button>
          </div>

          <Separator className="bg-white/20" />

          {/* Update Barber Profile */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold">9. Update Barber Profile Only</h3>
            <p className="text-white/70 text-sm">
              Just update the barber profile with SMS data (no SMS test).
            </p>
            <Button 
              onClick={handleUpdateBarberProfile} 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? 'Updating...' : 'Update Barber Profile'}
            </Button>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-2">
              <h3 className="text-white text-lg font-semibold">Results</h3>
              <pre className="bg-gray-900 p-4 rounded-lg text-green-400 text-sm overflow-x-auto">
                {result}
              </pre>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-blue-400 font-semibold mb-2">Instructions:</h4>
            <ul className="text-white/80 text-sm space-y-1">
              <li>• Make sure your Gmail credentials are set in environment variables</li>
              <li>• Test with your own phone number first</li>
              <li>• Check your spam folder if you don't receive SMS</li>
              <li>• Some carriers may have delays or block Gmail</li>
              <li>• The reminder system checks for bookings in the next hour</li>
            </ul>
          </div>

        </CardContent>
      </Card>
    </div>
  )
} 