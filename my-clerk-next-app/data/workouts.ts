import "server-only"

import { auth } from "@clerk/nextjs/server"

import { db } from "@/db"
import { workouts } from "@/db/schema"

export type WorkoutWithExercises = Awaited<
  ReturnType<typeof getWorkoutsForCurrentUser>
>[number]

export async function getWorkoutsForCurrentUser() {
  const { userId } = await auth()

  if (!userId) {
    return []
  }

  return db.query.workouts.findMany({
    where: {
      userId,
    },
    with: {
      exercises: {
        with: {
          exercise: true,
          sets: {
            orderBy: {
              setNumber: "asc",
            },
          },
        },
        orderBy: {
          order: "asc",
        },
      },
    },
    orderBy: {
      startedAt: "desc",
    },
  })
}

export async function createWorkout(input: { name?: string; startedAt: Date }) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Not authenticated")
  }

  const [workout] = await db
    .insert(workouts)
    .values({
      userId,
      name: input.name ?? null,
      startedAt: input.startedAt,
    })
    .returning()

  return workout
}
