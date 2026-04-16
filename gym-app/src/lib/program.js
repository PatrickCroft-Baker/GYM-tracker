export const PROGRAM = {
  A: [
    {
      day: 1, title: 'Day 1 — Upper A', subtitle: 'Chest + Back',
      exercises: [
        { id: 'bench_press',  name: 'Barbell Bench Press',  sets: 4, reps: '6–10',  restSecs: 120 },
        { id: 'barbell_row',  name: 'Barbell Row',           sets: 4, reps: '6–10',  restSecs: 120 },
        { id: 'incline_db',   name: 'Incline DB Press',      sets: 3, reps: '10–12', restSecs: 90  },
        { id: 'cable_row',    name: 'Cable Row',             sets: 3, reps: '10–12', restSecs: 90  },
        { id: 'lateral_d1',  name: 'Lateral Raise',         sets: 3, reps: '12–15', restSecs: 60  },
      ],
    },
    {
      day: 2, title: 'Day 2 — Lower A', subtitle: 'Quad Focus',
      exercises: [
        { id: 'squat',        name: 'Barbell Squat',         sets: 4, reps: '6–10',  restSecs: 120 },
        { id: 'rdl',          name: 'Romanian Deadlift',     sets: 3, reps: '8–10',  restSecs: 90  },
        { id: 'leg_press_d2', name: 'Leg Press',             sets: 3, reps: '10–12', restSecs: 90  },
        { id: 'leg_curl_d2',  name: 'Leg Curl',              sets: 3, reps: '12–15', restSecs: 60  },
        { id: 'calf_d2',      name: 'Calf Raise',            sets: 3, reps: '15–20', restSecs: 45  },
      ],
    },
    {
      day: 3, title: 'Day 3 — Upper B', subtitle: 'Shoulders + Arms',
      exercises: [
        { id: 'ohp',          name: 'Overhead Press',        sets: 4, reps: '6–10',  restSecs: 120 },
        { id: 'lat_pulldown', name: 'Lat Pulldown',          sets: 4, reps: '8–10',  restSecs: 90  },
        { id: 'db_lateral',   name: 'DB Lateral Raise',      sets: 3, reps: '12–15', restSecs: 60  },
        { id: 'ez_curl',      name: 'EZ Bar Curl',           sets: 3, reps: '10–12', restSecs: 75  },
        { id: 'tricep_push',  name: 'Tricep Pushdown',       sets: 3, reps: '10–12', restSecs: 75  },
      ],
    },
    {
      day: 4, title: 'Day 4 — Lower B', subtitle: 'Posterior Chain',
      exercises: [
        { id: 'deadlift',     name: 'Deadlift',              sets: 4, reps: '5–8',   restSecs: 120 },
        { id: 'bss',          name: 'Bulgarian Split Squat', sets: 3, reps: '8–10',  restSecs: 90  },
        { id: 'leg_press_d4', name: 'Leg Press',             sets: 3, reps: '10–12', restSecs: 75  },
        { id: 'leg_curl_d4',  name: 'Leg Curl',              sets: 3, reps: '12–15', restSecs: 60  },
        { id: 'calf_d4',      name: 'Calf Raise',            sets: 3, reps: '15–20', restSecs: 45  },
      ],
    },
  ],
  B: [
    {
      day: 5, title: 'Day 5 — Upper C', subtitle: 'Chest + Back',
      exercises: [
        { id: 'incline_bar',   name: 'Incline Barbell Press',     sets: 4, reps: '6–10',  restSecs: 120 },
        { id: 'cs_db_row',     name: 'Chest-Supported DB Row',    sets: 4, reps: '8–12',  restSecs: 90  },
        { id: 'cable_cross',   name: 'Cable Crossover',           sets: 3, reps: '12–15', restSecs: 60  },
        { id: 'wide_cable_row',name: 'Wide Grip Cable Row',       sets: 3, reps: '10–12', restSecs: 90  },
        { id: 'rear_delt_fly', name: 'Rear Delt Fly',             sets: 3, reps: '15–20', restSecs: 45  },
      ],
    },
    {
      day: 6, title: 'Day 6 — Lower C', subtitle: 'Quad Focus',
      exercises: [
        { id: 'hack_squat',    name: 'Hack Squat',                sets: 4, reps: '8–12',  restSecs: 120 },
        { id: 'walking_lunge', name: 'Walking Lunge',             sets: 3, reps: '10–12', restSecs: 90  },
        { id: 'leg_ext',       name: 'Leg Extension',             sets: 3, reps: '12–15', restSecs: 60  },
        { id: 'seated_curl',   name: 'Seated Leg Curl',           sets: 3, reps: '12–15', restSecs: 60  },
        { id: 'seated_calf_d6',name: 'Seated Calf Raise',         sets: 3, reps: '15–20', restSecs: 45  },
      ],
    },
    {
      day: 7, title: 'Day 7 — Upper D', subtitle: 'Shoulders + Arms',
      exercises: [
        { id: 'db_shoulder',   name: 'DB Shoulder Press',         sets: 4, reps: '8–12',  restSecs: 120 },
        { id: 'straight_pull', name: 'Straight-Arm Pulldown',     sets: 3, reps: '12–15', restSecs: 75  },
        { id: 'cable_lateral', name: 'Cable Lateral Raise',       sets: 3, reps: '15–20', restSecs: 45  },
        { id: 'incline_curl',  name: 'Incline DB Curl',           sets: 3, reps: '10–12', restSecs: 75  },
        { id: 'oh_tri_ext',    name: 'Overhead Tricep Extension', sets: 3, reps: '10–12', restSecs: 75  },
      ],
    },
    {
      day: 8, title: 'Day 8 — Lower D', subtitle: 'Posterior Chain',
      exercises: [
        { id: 'sumo_dl',       name: 'Sumo Deadlift',             sets: 4, reps: '5–8',   restSecs: 120 },
        { id: 'good_morning',  name: 'Good Morning',              sets: 3, reps: '8–10',  restSecs: 90  },
        { id: 'leg_press_d8',  name: 'Leg Press (close)',         sets: 3, reps: '10–12', restSecs: 75  },
        { id: 'nordic_curl',   name: 'Nordic Curl',               sets: 3, reps: '8–10',  restSecs: 60  },
        { id: 'seated_calf_d8',name: 'Seated Calf Raise',         sets: 3, reps: '15–20', restSecs: 45  },
      ],
    },
  ],
};
