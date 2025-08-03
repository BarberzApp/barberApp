'use client'

import { useEffect, useState } from 'react'
import { fetchNearbyJobs } from '@/features/jobs/fetch-nearby-jobs'
import { Button } from '@/shared/components/ui/button'

export default function NearbyJobsPage() {
  const [jobs, setJobs] = useState<any[]>([])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const data = await fetchNearbyJobs(coords.latitude, coords.longitude)
        setJobs(data)
      } catch (err) {
        console.error('Failed to fetch jobs:', err)
      }
    })
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Nearby Jobs</h1>
      {jobs.length === 0 ? (
        <p>No nearby jobs right now.</p>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li key={job.id} className="border rounded p-4">
              <p><strong>Service:</strong> {job.service}</p>
              <p><strong>Requested:</strong> {new Date(job.requested_at).toLocaleString()}</p>
              <Button onClick={() => console.log('TODO: Accept job', job.id)}>Accept</Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
