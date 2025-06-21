'use client'

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'

export default function DebugStripePage() {
  const [testMessage, setTestMessage] = useState('Debug page is working!')

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Stripe Debug Page</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{testMessage}</p>
            <Button 
              onClick={() => setTestMessage('Button clicked! Debug page is working correctly.')}
            >
              Test Button
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 