"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { X, Plus } from "lucide-react"

interface CreateJobPostFormProps {
  onSuccess: () => void
}

export function CreateJobPostForm({ onSuccess }: CreateJobPostFormProps) {
  const { user } = useAuth()
  const { createJobPost } = useData()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: [""],
    location: user?.location || "",
    salary: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleRequirementChange = (index: number, value: string) => {
    const updatedRequirements = [...formData.requirements]
    updatedRequirements[index] = value
    setFormData((prev) => ({
      ...prev,
      requirements: updatedRequirements,
    }))
  }

  const addRequirement = () => {
    setFormData((prev) => ({
      ...prev,
      requirements: [...prev.requirements, ""],
    }))
  }

  const removeRequirement = (index: number) => {
    if (formData.requirements.length === 1) return

    const updatedRequirements = [...formData.requirements]
    updatedRequirements.splice(index, 1)
    setFormData((prev) => ({
      ...prev,
      requirements: updatedRequirements,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !user.businessId) return

    setIsSubmitting(true)

    // Filter out empty requirements
    const filteredRequirements = formData.requirements.filter((req) => req.trim() !== "")

    // Create job post
    createJobPost({
      businessId: user.businessId,
      businessName: user.businessName || "Your Business",
      businessImage: user.image || "/placeholder.svg",
      title: formData.title,
      description: formData.description,
      requirements: filteredRequirements,
      location: formData.location,
      salary: formData.salary,
      postedDate: "Just now",
      status: "open",
    })

    setIsSubmitting(false)
    onSuccess()
  }

  const isFormValid = () => {
    return (
      formData.title.trim() !== "" &&
      formData.description.trim() !== "" &&
      formData.requirements.some((req) => req.trim() !== "") &&
      formData.location.trim() !== "" &&
      formData.salary.trim() !== ""
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Job Title</Label>
          <Input
            id="title"
            name="title"
            placeholder="e.g. Senior Barber, Master Stylist"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Job Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Describe the role, responsibilities, and what you're looking for..."
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            required
          />
        </div>

        <div>
          <Label>Requirements</Label>
          <div className="space-y-2 mt-2">
            {formData.requirements.map((requirement, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Requirement ${index + 1}`}
                  value={requirement}
                  onChange={(e) => handleRequirementChange(index, e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeRequirement(index)}
                  disabled={formData.requirements.length === 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addRequirement} className="mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Add Requirement
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              placeholder="e.g. Downtown, New York, NY"
              value={formData.location}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="salary">Compensation</Label>
            <Input
              id="salary"
              name="salary"
              placeholder="e.g. $50,000-$70,000/year, 60% commission"
              value={formData.salary}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isFormValid() || isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Job Post"}
        </Button>
      </div>
    </form>
  )
}
