import "server-only"

import { auth } from "@clerk/nextjs/server"

import { db } from "@/db"

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
