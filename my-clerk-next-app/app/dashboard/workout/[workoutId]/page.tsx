import { notFound } from "next/navigation"

import { getWorkoutById } from "@/data/workouts"

import { EditWorkoutForm } from "./edit-workout-form"

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ workoutId: string }>
}) {
  const { workoutId } = await params
  const id = Number(workoutId)

  if (!Number.isInteger(id)) {
    notFound()
  }

  const workout = await getWorkoutById(id)

  if (!workout) {
    notFound()
  }

  return <EditWorkoutForm workout={workout} />
}
