import { defineRelations } from 'drizzle-orm';
import {
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const exercises = pgTable('exercises', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const workouts = pgTable('workouts', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name'),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('workouts_user_id_idx').on(table.userId),
]);

export const workoutExercises = pgTable('workout_exercises', {
  id: serial('id').primaryKey(),
  workoutId: integer('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  exerciseId: integer('exercise_id')
    .notNull()
    .references(() => exercises.id, { onDelete: 'restrict' }),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('workout_exercises_workout_id_idx').on(table.workoutId),
]);

export const sets = pgTable('sets', {
  id: serial('id').primaryKey(),
  workoutExerciseId: integer('workout_exercise_id')
    .notNull()
    .references(() => workoutExercises.id, { onDelete: 'cascade' }),
  setNumber: integer('set_number').notNull(),
  reps: integer('reps').notNull(),
  weight: numeric('weight', { precision: 6, scale: 2 }).notNull(),
  weightUnit: text('weight_unit').notNull().default('kg'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('sets_workout_exercise_id_idx').on(table.workoutExerciseId),
]);

export const relations = defineRelations(
  { exercises, workouts, workoutExercises, sets },
  (r) => ({
    workouts: {
      exercises: r.many.workoutExercises(),
    },
    exercises: {
      workoutExercises: r.many.workoutExercises(),
    },
    workoutExercises: {
      workout: r.one.workouts({
        from: r.workoutExercises.workoutId,
        to: r.workouts.id,
      }),
      exercise: r.one.exercises({
        from: r.workoutExercises.exerciseId,
        to: r.exercises.id,
      }),
      sets: r.many.sets(),
    },
    sets: {
      workoutExercise: r.one.workoutExercises({
        from: r.sets.workoutExerciseId,
        to: r.workoutExercises.id,
      }),
    },
  }),
);
