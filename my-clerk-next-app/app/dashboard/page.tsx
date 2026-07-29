import { getWorkoutsForCurrentUser } from "@/data/workouts"

import { WorkoutDayView } from "./workout-day-view"

export default async function DashboardPage() {
  const workouts = await getWorkoutsForCurrentUser()

  return <WorkoutDayView workouts={workouts} />
}
