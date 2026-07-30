"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Workout } from "@/data/workouts"

import { updateWorkoutAction } from "../../actions"

export function EditWorkoutForm({ workout }: { workout: Workout }) {
  const router = useRouter()
  const [name, setName] = React.useState(workout.name ?? "")
  const [date, setDate] = React.useState<Date>(
    () => new Date(workout.startedAt)
  )
  const [time, setTime] = React.useState(() =>
    format(new Date(workout.startedAt), "HH:mm")
  )
  const [error, setError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const [hours, minutes] = time.split(":").map(Number)
    const startedAt = new Date(date)
    startedAt.setHours(hours, minutes, 0, 0)

    const result = await updateWorkoutAction({
      id: workout.id,
      name: name.trim() === "" ? undefined : name.trim(),
      startedAt,
    })

    setIsSubmitting(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    router.push("/dashboard")
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Edit Workout</h1>
      <Card>
        <CardHeader>
          <CardTitle>Workout details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="workout-name">Name (optional)</Label>
              <Input
                id="workout-name"
                value={name}
                onChange={(changeEvent) => setName(changeEvent.target.value)}
                maxLength={100}
                placeholder="Leg day"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      className="w-fit justify-start gap-2"
                    >
                      <CalendarIcon className="size-4" />
                      {format(date, "PPP")}
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selected) => {
                      if (selected) setDate(selected)
                    }}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="workout-time">Time</Label>
              <Input
                id="workout-time"
                type="time"
                value={time}
                onChange={(changeEvent) => setTime(changeEvent.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
