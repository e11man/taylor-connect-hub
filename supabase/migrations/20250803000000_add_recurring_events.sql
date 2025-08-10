-- Recurring events minimal schema
-- Create event_series table to store recurrence configuration
create table if not exists public.event_series (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  timezone text not null default 'America/New_York',
  pattern text not null check (pattern in ('one_time','weekly','biweekly','monthly_weekday','custom_weekdays','monthly_date')),
  interval integer not null default 1,
  weekdays smallint[] null, -- 0=Sun .. 6=Sat for weekly/custom
  monthday smallint null, -- for monthly by date (1..31)
  weeknumber smallint null, -- 1..5 or -1 for last (monthly_weekday)
  weekday smallint null, -- 0..6 for monthly_weekday
  start_date date not null,
  end_by_date date null,
  count_limit integer null check (count_limit > 0 and count_limit <= 52),
  start_time time not null,
  end_time time not null,
  duration_minutes integer generated always as (extract(epoch from (end_time - start_time))::int / 60) stored,
  location text not null,
  max_participants integer not null,
  rrule text null,
  rdates timestamptz[] null,
  exdates timestamptz[] null,
  created_at timestamptz not null default now()
);

comment on table public.event_series is 'Stores recurrence configuration for a series of events.';

-- Add series mapping columns to events for occurrences
do $$ begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema='public' and table_name='events' and column_name='series_id'
  ) then
    alter table public.events add column series_id uuid references public.event_series(id) on delete cascade;
  end if;
  if not exists (
    select 1 from information_schema.columns 
    where table_schema='public' and table_name='events' and column_name='occurrence_index'
  ) then
    alter table public.events add column occurrence_index integer;
  end if;
end $$;

-- Helpful index for series lookups
create index if not exists idx_events_series_id on public.events(series_id, occurrence_index);
create index if not exists idx_events_org_start on public.events(organization_id, date);

-- Enable RLS and policies for event_series
alter table public.event_series enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'event_series' and policyname = 'Organizations can manage their own series'
  ) then
    create policy "Organizations can manage their own series"
    on public.event_series
    for all
    using (
      organization_id in (
        select id from public.organizations where user_id = auth.uid()
      )
    )
    with check (
      organization_id in (
        select id from public.organizations where user_id = auth.uid()
      )
    );
  end if;
end $$;

-- Update RLS policies for events table to handle series_id
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'events' and policyname = 'Users can view events from their organizations including series'
  ) then
    create policy "Users can view events from their organizations including series"
    on public.events
    for select
    using (
      organization_id in (
        select id from public.organizations where user_id = auth.uid()
      )
    );
  end if;
  
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'events' and policyname = 'Organizations can manage their events including series'
  ) then
    create policy "Organizations can manage their events including series"
    on public.events
    for all
    using (
      organization_id in (
        select id from public.organizations where user_id = auth.uid()
      )
    )
    with check (
      organization_id in (
        select id from public.organizations where user_id = auth.uid()
      )
    );
  end if;
end $$;

-- Helper: returns the nth weekday date for a given month/year (week_number: 1..5 or -1 for last, weekday: 0=Sun..6=Sat)
create or replace function public.nth_weekday_of_month(year int, month int, week_number int, weekday int)
returns date
language plpgsql
stable
as $$
declare
  first_of_month date := make_date(year, month, 1);
  first_weekday_offset int;
  candidate date;
  last_of_month date := (date_trunc('month', (first_of_month + interval '1 month')) - interval '1 day')::date;
begin
  if week_number = -1 then
    -- last weekday of month
    candidate := last_of_month - ((extract(dow from last_of_month)::int - weekday + 7) % 7);
    return candidate;
  end if;

  first_weekday_offset := (weekday - extract(dow from first_of_month)::int + 7) % 7;
  candidate := first_of_month + (first_weekday_offset || ' days')::interval + ((week_number - 1) || ' weeks')::interval;
  if candidate > last_of_month then
    return null;
  end if;
  return candidate;
end;
$$;

-- Core RPC: create a series and generate event occurrences
create or replace function public.create_event_series_and_occurrences(
  p_organization_id uuid,
  p_title text,
  p_description text,
  p_timezone text,
  p_pattern text,
  p_interval int,
  p_weekdays smallint[],
  p_monthday smallint,
  p_weeknumber smallint,
  p_weekday smallint,
  p_start_date date,
  p_end_by_date date,
  p_count_limit int,
  p_start_time time,
  p_end_time time,
  p_location text,
  p_max_participants int,
  p_rrule text,
  p_rdates timestamptz[],
  p_exdates timestamptz[]
)
returns table(series_id uuid, occurrences_created int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_series_id uuid;
  v_occurrence_dates timestamptz[] := array[]::timestamptz[];
  v_created_count int := 0;
  v_date date;
  v_limit_date date;
  v_max_count int := coalesce(p_count_limit, 52);
  v_safety_cap int := 104; -- absolute hard cap
  v_months_elapsed int;
  v_occurrence_start timestamptz;
  v_occurrence_end timestamptz;
  v_occurrence_index int := 0;
  v_included timestamptz;
  v_dow int;
begin
  -- Basic validation
  if p_start_time >= p_end_time then
    raise exception 'start_time must be before end_time';
  end if;
  if p_pattern not in ('one_time','weekly','biweekly','monthly_weekday','custom_weekdays','monthly_date') then
    raise exception 'Unsupported pattern %', p_pattern;
  end if;

  -- Authorization will be enforced by table RLS and function owner privileges; do not block here

  -- Insert series
  insert into public.event_series (
    organization_id, title, description, timezone, pattern, interval, weekdays, monthday, weeknumber, weekday,
    start_date, end_by_date, count_limit, start_time, end_time, location, max_participants, rrule, rdates, exdates
  ) values (
    p_organization_id, p_title, p_description, p_timezone, p_pattern, coalesce(p_interval,1), p_weekdays, p_monthday, p_weeknumber, p_weekday,
    p_start_date, p_end_by_date, p_count_limit, p_start_time, p_end_time, p_location, p_max_participants, p_rrule, p_rdates, p_exdates
  ) returning id into v_series_id;

  -- Determine limit date
  v_limit_date := coalesce(p_end_by_date, p_start_date + interval '2 years');

  -- Generate occurrence dates based on pattern
  if p_pattern = 'one_time' then
    v_occurrence_dates := array_append(v_occurrence_dates, ((p_start_date::timestamp + p_start_time) at time zone p_timezone));
  elsif p_pattern in ('weekly','biweekly','custom_weekdays') then
    if p_weekdays is null or array_length(p_weekdays,1) is null then
      raise exception 'weekdays must be provided for weekly/custom patterns';
    end if;
    v_date := p_start_date;
    while v_date <= v_limit_date and v_created_count < least(v_max_count, v_safety_cap) loop
      v_dow := extract(dow from v_date)::int; -- 0..6
      if v_dow = any(p_weekdays) then
        -- Check interval alignment based on weeks since start
        if mod(((v_date - p_start_date) / 7), coalesce(case when p_pattern='biweekly' then 2 else p_interval end,1)) = 0 then
          v_occurrence_dates := array_append(v_occurrence_dates, ((v_date::timestamp + p_start_time) at time zone p_timezone));
        end if;
      end if;
      v_date := v_date + interval '1 day';
    end loop;
  elsif p_pattern = 'monthly_date' then
    if p_monthday is null then
      raise exception 'monthday must be provided for monthly_date pattern';
    end if;
    v_date := p_start_date;
    v_months_elapsed := 0;
    while v_date <= v_limit_date and v_created_count < least(v_max_count, v_safety_cap) loop
      if mod(v_months_elapsed, coalesce(p_interval,1)) = 0 then
        if p_monthday between 1 and 31 then
          -- Compute the target date in this month
          v_date := make_date(extract(year from v_date)::int, extract(month from v_date)::int, 1);
          v_date := v_date + ((p_monthday - 1) || ' days')::interval;
          if extract(month from v_date + interval '1 day')::int = extract(month from (v_date + interval '0 day'))::int then
            v_occurrence_dates := array_append(v_occurrence_dates, ((v_date::timestamp + p_start_time) at time zone p_timezone));
          end if;
        end if;
      end if;
      v_months_elapsed := v_months_elapsed + 1;
      v_date := date_trunc('month', (date_trunc('month', v_date)::date + interval '1 month'))::date;
    end loop;
  elsif p_pattern = 'monthly_weekday' then
    if p_weeknumber is null or p_weekday is null then
      raise exception 'weeknumber and weekday must be provided for monthly_weekday pattern';
    end if;
    v_date := p_start_date;
    v_months_elapsed := 0;
    while v_date <= v_limit_date and v_created_count < least(v_max_count, v_safety_cap) loop
      if mod(v_months_elapsed, coalesce(p_interval,1)) = 0 then
        -- Compute the nth weekday date for this month
        declare
          v_year int := extract(year from v_date)::int;
          v_month int := extract(month from v_date)::int;
          v_target date;
        begin
          v_target := public.nth_weekday_of_month(v_year, v_month, p_weeknumber, p_weekday);
          if v_target is not null then
            v_occurrence_dates := array_append(v_occurrence_dates, ((v_target::timestamp + p_start_time) at time zone p_timezone));
          end if;
        end;
      end if;
      v_months_elapsed := v_months_elapsed + 1;
      v_date := date_trunc('month', (date_trunc('month', v_date)::date + interval '1 month'))::date;
    end loop;
  end if;

  -- Include explicit rdates
  if p_rdates is not null then
    foreach v_included in array p_rdates loop
      v_occurrence_dates := array_append(v_occurrence_dates, v_included);
    end loop;
  end if;

  -- Remove excluded exdates and duplicates, sort
  if p_exdates is not null and array_length(p_exdates,1) is not null then
    v_occurrence_dates := (
      select array_agg(dt order by dt)
      from (
        select distinct dt
        from unnest(v_occurrence_dates) as dt
        where not (dt = any(p_exdates))
      ) s
    );
  else
    v_occurrence_dates := (
      select array_agg(dt order by dt)
      from (
        select distinct dt from unnest(v_occurrence_dates) dt
      ) s
    );
  end if;

  -- Truncate to count limit / safety cap
  if array_length(v_occurrence_dates,1) is not null then
    v_occurrence_dates := (
      select array_agg(dt order by dt)
      from (
        select dt from unnest(v_occurrence_dates) with ordinality as t(dt, rn)
        where rn <= least(v_max_count, v_safety_cap)
      ) s
    );
  end if;

  -- Insert occurrences into events table
  if array_length(v_occurrence_dates,1) is not null then
    for v_occurrence_index in 1..array_length(v_occurrence_dates,1) loop
      v_occurrence_start := v_occurrence_dates[v_occurrence_index];
      v_occurrence_end := ( ( (v_occurrence_start at time zone p_timezone)::timestamp + (p_end_time - p_start_time) ) at time zone p_timezone );

      insert into public.events (
        title, description, date, location, max_participants, organization_id,
        arrival_time, estimated_end_time, series_id, occurrence_index
      ) values (
        p_title, p_description, v_occurrence_start, p_location, p_max_participants, p_organization_id,
        v_occurrence_start, v_occurrence_start + (p_end_time - p_start_time), v_series_id, v_occurrence_index - 1
      );
      v_created_count := v_created_count + 1;
    end loop;
  end if;

  return query select v_series_id, v_created_count;
end;
$$;

-- Function to update an existing event series and regenerate occurrences
create or replace function public.update_event_series(
  p_series_id uuid,
  p_title text default null,
  p_description text default null,
  p_timezone text default null,
  p_pattern text default null,
  p_interval int default null,
  p_weekdays smallint[] default null,
  p_monthday smallint default null,
  p_weeknumber smallint default null,
  p_weekday smallint default null,
  p_start_date date default null,
  p_end_by_date date default null,
  p_count_limit int default null,
  p_start_time time default null,
  p_end_time time default null,
  p_location text default null,
  p_max_participants int default null,
  p_rrule text default null,
  p_rdates timestamptz[] default null,
  p_exdates timestamptz[] default null
)
returns table(series_id uuid, occurrences_updated int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_series record;
  v_occurrences_updated int := 0;
begin
  -- Get current series data
  select * into v_old_series from public.event_series where id = p_series_id;
  if not found then
    raise exception 'Event series not found';
  end if;

  -- Update series with provided values (keep old values if not provided)
  update public.event_series set
    title = coalesce(p_title, title),
    description = coalesce(p_description, description),
    timezone = coalesce(p_timezone, timezone),
    pattern = coalesce(p_pattern, pattern),
    interval = coalesce(p_interval, interval),
    weekdays = coalesce(p_weekdays, weekdays),
    monthday = coalesce(p_monthday, monthday),
    weeknumber = coalesce(p_weeknumber, weeknumber),
    weekday = coalesce(p_weekday, weekday),
    start_date = coalesce(p_start_date, start_date),
    end_by_date = coalesce(p_end_by_date, end_by_date),
    count_limit = coalesce(p_count_limit, count_limit),
    start_time = coalesce(p_start_time, start_time),
    end_time = coalesce(p_end_time, end_time),
    location = coalesce(p_location, location),
    max_participants = coalesce(p_max_participants, max_participants),
    rrule = coalesce(p_rrule, rrule),
    rdates = coalesce(p_rdates, rdates),
    exdates = coalesce(p_exdates, exdates)
  where id = p_series_id;

  -- Delete existing occurrences
  delete from public.events where series_id = p_series_id;
  get diagnostics v_occurrences_updated = row_count;

  -- Regenerate occurrences using the create function
  perform public.create_event_series_and_occurrences(
    v_old_series.organization_id,
    coalesce(p_title, v_old_series.title),
    coalesce(p_description, v_old_series.description),
    coalesce(p_timezone, v_old_series.timezone),
    coalesce(p_pattern, v_old_series.pattern),
    coalesce(p_interval, v_old_series.interval),
    coalesce(p_weekdays, v_old_series.weekdays),
    coalesce(p_monthday, v_old_series.monthday),
    coalesce(p_weeknumber, v_old_series.weeknumber),
    coalesce(p_weekday, v_old_series.weekday),
    coalesce(p_start_date, v_old_series.start_date),
    coalesce(p_end_by_date, v_old_series.end_by_date),
    coalesce(p_count_limit, v_old_series.count_limit),
    coalesce(p_start_time, v_old_series.start_time),
    coalesce(p_end_time, v_old_series.end_time),
    coalesce(p_location, v_old_series.location),
    coalesce(p_max_participants, v_old_series.max_participants),
    coalesce(p_rrule, v_old_series.rrule),
    coalesce(p_rdates, v_old_series.rdates),
    coalesce(p_exdates, v_old_series.exdates)
  );

  return query select p_series_id, v_occurrences_updated;
end;
$$;

-- Function to delete an event series and all its occurrences
create or replace function public.delete_event_series(p_series_id uuid)
returns table(series_id uuid, occurrences_deleted int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_occurrences_deleted int := 0;
begin
  -- Delete all occurrences first (cascade should handle this, but explicit for clarity)
  delete from public.events where series_id = p_series_id;
  get diagnostics v_occurrences_deleted = row_count;
  
  -- Delete the series
  delete from public.event_series where id = p_series_id;
  
  return query select p_series_id, v_occurrences_deleted;
end;
$$;

-- Function to get next occurrences for a series
create or replace function public.get_next_series_occurrences(
  p_series_id uuid,
  p_limit int default 10
)
returns table(
  occurrence_id uuid,
  title text,
  description text,
  date timestamptz,
  location text,
  max_participants int,
  occurrence_index int
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
  select 
    e.id as occurrence_id,
    e.title,
    e.description,
    e.date,
    e.location,
    e.max_participants,
    e.occurrence_index
  from public.events e
  where e.series_id = p_series_id
    and e.date >= now()
  order by e.date
  limit p_limit;
end;
$$;

-- Function to get series information with occurrence count
create or replace function public.get_event_series_info(p_series_id uuid)
returns table(
  series_id uuid,
  title text,
  description text,
  pattern text,
  interval int,
  start_date date,
  end_by_date date,
  total_occurrences bigint,
  future_occurrences bigint,
  past_occurrences bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
  select 
    es.id as series_id,
    es.title,
    es.description,
    es.pattern,
    es.interval,
    es.start_date,
    es.end_by_date,
    count(e.id) as total_occurrences,
    count(e.id) filter (where e.date >= now()) as future_occurrences,
    count(e.id) filter (where e.date < now()) as past_occurrences
  from public.event_series es
  left join public.events e on e.series_id = es.id
  where es.id = p_series_id
  group by es.id, es.title, es.description, es.pattern, es.interval, es.start_date, es.end_by_date;
end;
$$;

-- Allow authenticated users to execute the RPCs
do $$ begin
  grant execute on function public.create_event_series_and_occurrences(
    uuid, text, text, text, text, int, smallint[], smallint, smallint, smallint, date, date, int, time, time, text, int, text, timestamptz[], timestamptz[]
  ) to authenticated;
  
  grant execute on function public.update_event_series(
    uuid, text, text, text, text, int, smallint[], smallint, smallint, smallint, date, date, int, time, time, text, int, text, timestamptz[], timestamptz[]
  ) to authenticated;
  
  grant execute on function public.delete_event_series(uuid) to authenticated;
  
  grant execute on function public.get_next_series_occurrences(uuid, int) to authenticated;
  
  grant execute on function public.get_event_series_info(uuid) to authenticated;
  
  grant execute on function public.nth_weekday_of_month(int, int, int, int) to authenticated;
exception when others then null; end $$;

-- Add helpful comments
comment on function public.create_event_series_and_occurrences is 'Creates a new event series and generates all occurrences based on the recurrence pattern.';
comment on function public.update_event_series is 'Updates an existing event series and regenerates all occurrences.';
comment on function public.delete_event_series is 'Deletes an event series and all its occurrences.';
comment on function public.get_next_series_occurrences is 'Returns the next N occurrences for a given series.';
comment on function public.get_event_series_info is 'Returns summary information about a series including occurrence counts.';
comment on function public.nth_weekday_of_month is 'Helper function to calculate the nth weekday of a month.';

-- Create a view for easy series management
create or replace view public.event_series_overview as
select 
  es.id,
  es.title,
  es.description,
  es.pattern,
  es.interval,
  es.start_date,
  es.end_by_date,
  es.count_limit,
  es.start_time,
  es.end_time,
  es.location,
  es.max_participants,
  es.created_at,
  o.name as organization_name,
  count(e.id) as total_occurrences,
  count(e.id) filter (where e.date >= now()) as future_occurrences,
  count(e.id) filter (where e.date < now()) as past_occurrences
from public.event_series es
join public.organizations o on o.id = es.organization_id
left join public.events e on e.series_id = es.id
group by es.id, es.title, es.description, es.pattern, es.interval, es.start_date, es.end_by_date, es.count_limit, es.start_time, es.end_time, es.location, es.max_participants, es.created_at, o.name;

-- Grant access to the view
grant select on public.event_series_overview to authenticated;

comment on view public.event_series_overview is 'Overview of all event series with occurrence counts and organization information.';
