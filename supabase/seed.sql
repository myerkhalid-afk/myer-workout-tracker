insert into public.exercises (owner_id, slug, name, equipment, muscles, is_system) values
(null, 'incline-db-press', 'Incline Dumbbell Press', 'Dumbbells', array['chest','shoulders','triceps'], true),
(null, 'flat-db-press', 'Flat Dumbbell Press', 'Dumbbells', array['chest','triceps'], true),
(null, 'seated-db-shoulder', 'Seated Dumbbell Shoulder Press', 'Dumbbells', array['shoulders','triceps'], true),
(null, 'lat-pulldown', 'Lat Pulldown', 'Cable', array['back','biceps'], true),
(null, 'assisted-pullup', 'Assisted Pull-Up', 'Machine', array['back','biceps'], true),
(null, 'one-arm-db-row', 'One-Arm Dumbbell Row', 'Dumbbell', array['back','biceps'], true),
(null, 'ez-curl', 'EZ-Bar Curl', 'EZ Bar', array['biceps'], true),
(null, 'rope-pushdown', 'Rope Triceps Pushdown', 'Cable', array['triceps'], true),
(null, 'leg-press', 'Leg Press', 'Machine', array['quads','glutes'], true),
(null, 'rdl', 'Romanian Deadlift', 'Barbell', array['hamstrings','glutes'], true),
(null, 'squat', 'Barbell Squat', 'Barbell', array['quads','glutes','core'], true),
(null, 'walking-lunge', 'Walking Lunge', 'Dumbbells', array['quads','glutes'], true),
(null, 'leg-curl', 'Seated Leg Curl', 'Machine', array['hamstrings'], true),
(null, 'leg-extension', 'Leg Extension', 'Machine', array['quads'], true),
(null, 'calf-raise', 'Calf Raise', 'Machine', array['calves'], true),
(null, 'cable-crunch', 'Cable Crunch', 'Cable', array['core'], true),
(null, 'plank', 'Plank', 'Bodyweight', array['core'], true)
on conflict do nothing;
