"use server"

import { z } from "zod"

import { createWorkout, updateWorkout } from "@/data/workouts"

const createWorkoutSchema = z.object({
  name: z.string().max(100).optional(),
  startedAt: z.coerce.date(),
})

export async function createWorkoutAction(
  input: z.infer<typeof createWorkoutSchema>
) {
  const parsed = createWorkoutSchema.safeParse(input)

  if (!parsed.success) {
    return { success: false as const, error: "Invalid workout details." }
  }

  try {
    const workout = await createWorkout(parsed.data)
    return { success: true as const, workout }
  } catch {
    return { success: false as const, error: "Could not create workout." }
  }
}

const updateWorkoutSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().max(100).optional(),
  startedAt: z.coerce.date(),
})

export async function updateWorkoutAction(
  input: z.infer<typeof updateWorkoutSchema>
) {
  const parsed = updateWorkoutSchema.safeParse(input)

  if (!parsed.success) {
    return { success: false as const, error: "Invalid workout details." }
  }

  try {
    const workout = await updateWorkout(parsed.data.id, parsed.data)

    if (!workout) {
      return { success: false as const, error: "Workout not found." }
    }

    return { success: true as const, workout }
  } catch {
    return { success: false as const, error: "Could not update workout." }
  }
}
