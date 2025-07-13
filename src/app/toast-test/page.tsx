'use client'

import { useCustomToast } from '@/shared/hooks/use-custom-toast'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'

export default function ToastTestPage() {
  const toast = useCustomToast()

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bebas text-white mb-2">Toast Test Page</h1>
          <p className="text-white/70">Test all the new BOCM toast variants</p>
        </div>

        <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Toast Variants</CardTitle>
            <CardDescription className="text-white/70">
              Click the buttons below to test different toast types. Each toast includes a "swipe to exit" instruction.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => toast.success('Success!', 'This is a success message with green styling.')}
                className="bg-green-500/20 border-green-500/30 text-green-100 hover:bg-green-500/30"
              >
                Success Toast
              </Button>
              
              <Button 
                onClick={() => toast.error('Error!', 'This is an error message with red styling.')}
                className="bg-red-500/20 border-red-500/30 text-red-100 hover:bg-red-500/30"
              >
                Error Toast
              </Button>
              
              <Button 
                onClick={() => toast.warning('Warning!', 'This is a warning message with yellow styling.')}
                className="bg-yellow-500/20 border-yellow-500/30 text-yellow-100 hover:bg-yellow-500/30"
              >
                Warning Toast
              </Button>
              
              <Button 
                onClick={() => toast.info('Info!', 'This is an info message with saffron styling.')}
                className="bg-saffron/20 border-saffron/30 text-saffron hover:bg-saffron/30"
              >
                Info Toast
              </Button>
              
              <Button 
                onClick={() => toast.default('Default!', 'This is a default message with glassy styling.')}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Default Toast
              </Button>
              
              <Button 
                onClick={() => toast.success('Long Message', 'This is a longer message to test how the toast handles multiple lines of text and whether the swipe instruction remains visible.')}
                className="bg-green-500/20 border-green-500/30 text-green-100 hover:bg-green-500/30"
              >
                Long Message
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Features</CardTitle>
            <CardDescription className="text-white/70">
              What's new in the BOCM toast system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-white/80">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-saffron rounded-full"></div>
              <span>Glassy backdrop blur effect matching your UI</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-saffron rounded-full"></div>
              <span>Saffron accent colors and modern styling</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-saffron rounded-full"></div>
              <span>Multiple variants: success, error, warning, info, default</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-saffron rounded-full"></div>
              <span>"Swipe to exit" instruction on every toast</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-saffron rounded-full"></div>
              <span>Convenient hook methods: toast.success(), toast.error(), etc.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 