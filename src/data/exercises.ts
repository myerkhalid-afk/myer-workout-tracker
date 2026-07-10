import type { ExerciseDefinition } from '../types'

export const exercises: ExerciseDefinition[] = [
  { id: 'incline-db-press', name: 'Incline Dumbbell Press', muscles: ['chest', 'shoulders', 'triceps'], equipment: 'Dumbbells', favourite: true },
  { id: 'flat-db-press', name: 'Flat Dumbbell Press', muscles: ['chest', 'triceps'], equipment: 'Dumbbells', favourite: true },
  { id: 'seated-db-shoulder', name: 'Seated Dumbbell Shoulder Press', muscles: ['shoulders', 'triceps'], equipment: 'Dumbbells', favourite: true },
  { id: 'lateral-raise', name: 'Lateral Raise', muscles: ['shoulders'], equipment: 'Dumbbells' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', muscles: ['back', 'biceps'], equipment: 'Cable', favourite: true },
  { id: 'assisted-pullup', name: 'Assisted Pull-Up', muscles: ['back', 'biceps'], equipment: 'Machine', favourite: true },
  { id: 'one-arm-db-row', name: 'One-Arm Dumbbell Row', muscles: ['back', 'biceps'], equipment: 'Dumbbell', favourite: true },
  { id: 'barbell-row', name: 'Barbell Row', muscles: ['back', 'biceps'], equipment: 'Barbell' },
  { id: 'reverse-cable-fly', name: 'Reverse Cable Fly', muscles: ['shoulders', 'back'], equipment: 'Cable' },
  { id: 'face-pull', name: 'Face Pull', muscles: ['shoulders', 'back'], equipment: 'Cable' },
  { id: 'ez-curl', name: 'EZ-Bar Curl', muscles: ['biceps'], equipment: 'EZ Bar', favourite: true },
  { id: 'db-curl', name: 'Dumbbell Curl', muscles: ['biceps'], equipment: 'Dumbbells' },
  { id: 'rope-pushdown', name: 'Rope Triceps Pushdown', muscles: ['triceps'], equipment: 'Cable', favourite: true },
  { id: 'leg-press', name: 'Leg Press', muscles: ['quads', 'glutes'], equipment: 'Machine', favourite: true },
  { id: 'rdl', name: 'Romanian Deadlift', muscles: ['hamstrings', 'glutes'], equipment: 'Barbell', favourite: true },
  { id: 'squat', name: 'Barbell Squat', muscles: ['quads', 'glutes', 'core'], equipment: 'Barbell' },
  { id: 'walking-lunge', name: 'Walking Lunge', muscles: ['quads', 'glutes'], equipment: 'Dumbbells' },
  { id: 'leg-curl', name: 'Seated Leg Curl', muscles: ['hamstrings'], equipment: 'Machine' },
  { id: 'leg-extension', name: 'Leg Extension', muscles: ['quads'], equipment: 'Machine' },
  { id: 'calf-raise', name: 'Calf Raise', muscles: ['calves'], equipment: 'Machine' },
  { id: 'cable-crunch', name: 'Cable Crunch', muscles: ['core'], equipment: 'Cable' },
  { id: 'plank', name: 'Plank', muscles: ['core'], equipment: 'Bodyweight' }
]

export const exerciseById = Object.fromEntries(exercises.map((exercise) => [exercise.id, exercise]))
