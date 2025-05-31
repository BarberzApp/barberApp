'use client'

import { ServiceWorkerTest } from '@/components/service-worker-test'

export default function TestPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Service Worker Test Page</h1>
      <ServiceWorkerTest />
    </div>
  )
} 