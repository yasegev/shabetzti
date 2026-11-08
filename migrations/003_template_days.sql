alter table shift_templates
  add column if not exists days_mask integer not null default 127;

update shift_templates
set days_mask = 31
where id in ('tpl-morning', 'tpl-afternoon', 'tpl-night');

insert into shift_templates (id, name, start_time, end_time, sort_order, days_mask)
select 'tpl-weekend', 'יממה', '00:00', '24:00', 3, 96
where not exists (select 1 from shift_templates where id = 'tpl-weekend');
