"use client"

import * as React from "react"
import { format, isSameDay } from "date-fns"
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

export function WorkoutDayView({
  workouts,
}: {
  workouts: WorkoutWithExercises[]
}) {
  const [date, setDate] = React.useState<Date>(new Date())

  const workoutsForDate = workouts.filter((workout) =>
    isSameDay(workout.startedAt, date)
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
                  {format(workout.startedAt, "p")}
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
