"use client"

import { AvailabilityManager } from "@/components/availability/availability-manager"

export default function AvailabilityPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Manage Availability</h1>
      <AvailabilityManager />
    </div>
  )
}
