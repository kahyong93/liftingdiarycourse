"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { WorkoutWithExercises } from "@/data/workouts"

// `started_at` is a zone-less timestamp, so a workout belongs to the same calendar
// day for every viewer. Both sides of the comparison are reduced to a UTC yyyy-MM-dd
// key: stored instants via their UTC parts, and calendar selections (which arrive as
// local midnight) via their local parts, so neither drifts with the viewer's zone.
const utcDayKey = (value: Date | string) =>
  new Date(value).toISOString().slice(0, 10)

const localDayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`

// Formatting must be locale- and zone-stable: `toLocale*String` with an `undefined`
// locale resolves to the runtime's own locale, which differs between the server and
// the browser and causes a hydration mismatch. date-fns `format` is deterministic,
// so shift the instant onto UTC wall-clock first, then format it.
const asUtcWallClock = (value: Date | string) => {
  const instant = new Date(value)
  return new Date(instant.getTime() + instant.getTimezoneOffset() * 60_000)
}

const formatUtcTime = (value: Date | string) =>
  format(asUtcWallClock(value), "p")

const formatUtcDate = (value: Date) => format(value, "PPP")

export function WorkoutDayView({
  workouts,
}: {
  workouts: WorkoutWithExercises[]
}) {
  // Workouts are ordered startedAt desc, so the first is the most recent. Opening on
  // today would land on an empty day whenever the latest workout wasn't logged today.
  const [date, setDate] = React.useState<Date>(() =>
    workouts[0] ? new Date(workouts[0].startedAt) : new Date()
  )

  const selectedKey = localDayKey(date)

  const workoutsForDate = workouts.filter(
    (workout) => utcDayKey(workout.startedAt) === selectedKey
  )

  // Days with workouts get a marker so empty days read as "nothing logged" rather
  // than as a broken page.
  const workoutDays = React.useMemo(
    () =>
      workouts.map((workout) => {
        const [year, month, day] = utcDayKey(workout.startedAt)
          .split("-")
          .map(Number)
        return new Date(year, month - 1, day)
      }),
    [workouts]
  )

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" className="w-fit justify-start gap-2">
                <CalendarIcon className="size-4" />
                {formatUtcDate(date)}
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
              modifiers={{ hasWorkout: workoutDays }}
              modifiersClassNames={{
                hasWorkout:
                  "after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-primary data-[selected=true]:after:bg-primary-foreground",
              }}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col gap-4">
        {workoutsForDate.length === 0 ? (
          <Card>
            <CardContent className="text-center text-muted-foreground">
              No workouts logged on this date.
            </CardContent>
          </Card>
        ) : (
          workoutsForDate.map((workout) => (
            <Card key={workout.id}>
              <CardHeader>
                <CardTitle>{workout.name ?? "Workout"}</CardTitle>
                <CardDescription>
                  {formatUtcTime(workout.startedAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {workout.exercises.map((workoutExercise) => (
                  <div
                    key={workoutExercise.id}
                    className="flex flex-col gap-1"
                  >
                    <p className="font-medium">
                      {workoutExercise.exercise?.name}
                    </p>
                    <ul className="flex flex-col gap-0.5 text-sm text-muted-foreground">
                      {workoutExercise.sets.map((set) => (
                        <li key={set.id}>
                          Set {set.setNumber}: {set.reps} reps &times;{" "}
                          {set.weight} {set.weightUnit}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
