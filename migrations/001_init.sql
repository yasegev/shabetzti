create table if not exists watchers (
  id text primary key,
  name text not null,
  color text not null default '#2f6f4e',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id text primary key,
  google_sub text not null unique,
  email text not null,
  name text not null default '',
  is_admin boolean not null default false,
  watcher_id text references watchers(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists shift_templates (
  id text primary key,
  name text not null,
  start_time text not null,
  end_time text not null,
  sort_order integer not null default 0
);

create table if not exists assignments (
  id text primary key,
  week_start date not null,
  day_of_week integer not null check (day_of_week between 0 and 6),
  template_id text not null references shift_templates(id) on delete cascade,
  watcher_id text not null references watchers(id) on delete cascade,
  unique (week_start, day_of_week, template_id)
);

create table if not exists invites (
  id text primary key,
  token text not null unique,
  created_by text not null references users(id) on delete cascade,
  watcher_id text references watchers(id) on delete set null,
  used_by text references users(id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists assignments_week_idx on assignments (week_start);
create index if not exists invites_token_idx on invites (token);

insert into shift_templates (id, name, start_time, end_time, sort_order)
select 'tpl-morning', 'בוקר', '07:00', '15:00', 0
where not exists (select 1 from shift_templates);

insert into shift_templates (id, name, start_time, end_time, sort_order)
select 'tpl-afternoon', 'צהריים', '15:00', '23:00', 1
where not exists (select 1 from shift_templates where id = 'tpl-afternoon');

insert into shift_templates (id, name, start_time, end_time, sort_order)
select 'tpl-night', 'לילה', '23:00', '07:00', 2
where not exists (select 1 from shift_templates where id = 'tpl-night');
