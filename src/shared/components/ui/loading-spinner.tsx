import { cn } from '@/shared/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 40,
    md: 64,
    lg: 96
  }
  const logoSize = sizeMap[size] || 64

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-4', className)}>
      <div className="relative flex items-center justify-center" style={{ width: logoSize, height: logoSize }}>
        {/* Animated Glow Effect */}
        <div className="absolute inset-0 rounded-full animate-bocm-glow z-0" style={{ filter: 'blur(16px)', background: 'radial-gradient(circle at 60% 40%, #c98f42 0%, #fff9f0 40%, #262b2e 100%)', opacity: 0.7 }} />
        {/* Floating Animation */}
        <img
          src="/BocmLogo.png"
          alt="Loading..."
          width={logoSize}
          height={logoSize}
          className="relative z-10 animate-bocm-float drop-shadow-xl"
          style={{ borderRadius: '20%' }}
        />
      </div>
      {text && (
        <p className="text-base text-saffron font-semibold animate-pulse mt-2">{text}</p>
      )}
      <style jsx global>{`
        @keyframes bocm-glow {
          0% { opacity: 0.7; filter: blur(16px); }
          50% { opacity: 1; filter: blur(32px); }
          100% { opacity: 0.7; filter: blur(16px); }
        }
        .animate-bocm-glow {
          animation: bocm-glow 2.2s ease-in-out infinite;
        }
        @keyframes bocm-float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
        .animate-bocm-float {
          animation: bocm-float 2.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
} 