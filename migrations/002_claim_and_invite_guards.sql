create unique index if not exists users_one_watcher
  on users (watcher_id)
  where watcher_id is not null;

update invites
set expires_at = now() + interval '7 days'
where used_at is null and expires_at is null;
