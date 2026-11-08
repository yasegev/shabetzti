create table if not exists day_notes (
  id text primary key,
  week_start date not null,
  day_of_week integer not null check (day_of_week between 0 and 6),
  body text not null,
  updated_at timestamptz not null default now(),
  unique (week_start, day_of_week)
);

create index if not exists day_notes_week_idx on day_notes (week_start);
