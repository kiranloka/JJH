create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('medical-records', 'medical-records', false, 52428800, array['application/pdf'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.medical_records (
  id uuid primary key default gen_random_uuid(),
  ip_number text,
  patient_name text,
  doctor_name text,
  sections text[] not null default '{}',
  file_name text not null,
  content_type text not null default 'application/pdf',
  size_bytes bigint not null check (size_bytes >= 0),
  storage_provider text not null default 'supabase' check (storage_provider in ('supabase', 's3')),
  bucket text not null,
  object_key text not null unique,
  status text not null default 'Synced' check (status in ('Synced', 'Uploading', 'Failed')),
  source text not null default 'manual' check (source in ('manual', 'folder-sync')),
  record_date date not null default current_date,
  uploaded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_downloaded_at timestamptz,
  download_count integer not null default 0 check (download_count >= 0),
  error_message text
);

create index if not exists medical_records_record_date_idx on public.medical_records (record_date desc);
create index if not exists medical_records_uploaded_at_idx on public.medical_records (uploaded_at desc);
create index if not exists medical_records_ip_number_idx on public.medical_records (ip_number);
create index if not exists medical_records_patient_name_idx on public.medical_records (patient_name);
create index if not exists medical_records_doctor_name_idx on public.medical_records (doctor_name);
create index if not exists medical_records_sections_idx on public.medical_records using gin (sections);

create table if not exists public.daily_usage (
  usage_date date not null,
  action text not null check (action in ('upload', 'download')),
  count integer not null default 0 check (count >= 0),
  limit_count integer not null check (limit_count > 0),
  updated_at timestamptz not null default now(),
  primary key (usage_date, action)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists medical_records_set_updated_at on public.medical_records;
create trigger medical_records_set_updated_at
before update on public.medical_records
for each row execute function public.set_updated_at();

create or replace function public.consume_daily_quota(
  p_action text,
  p_limit integer,
  p_amount integer default 1,
  p_usage_date date default current_date
)
returns table (allowed boolean, used integer, limit_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used integer;
  v_limit integer;
begin
  if p_action not in ('upload', 'download') then
    raise exception 'Unsupported quota action: %', p_action;
  end if;

  if p_amount <= 0 or p_limit <= 0 then
    raise exception 'Quota amount and limit must be positive';
  end if;

  if p_amount > p_limit then
    select du.count, du.limit_count
    into v_used, v_limit
    from public.daily_usage du
    where du.usage_date = p_usage_date and du.action = p_action;

    return query select false, coalesce(v_used, 0), coalesce(v_limit, p_limit);
    return;
  end if;

  insert into public.daily_usage (usage_date, action, count, limit_count)
  values (p_usage_date, p_action, p_amount, p_limit)
  on conflict (usage_date, action) do update
  set
    count = public.daily_usage.count + excluded.count,
    limit_count = excluded.limit_count,
    updated_at = now()
  where public.daily_usage.count + excluded.count <= excluded.limit_count
  returning public.daily_usage.count, public.daily_usage.limit_count
  into v_used, v_limit;

  if found then
    return query select true, v_used, v_limit;
    return;
  end if;

  select du.count, du.limit_count
  into v_used, v_limit
  from public.daily_usage du
  where du.usage_date = p_usage_date and du.action = p_action;

  return query select false, coalesce(v_used, 0), coalesce(v_limit, p_limit);
end;
$$;

create or replace function public.release_daily_quota(
  p_action text,
  p_amount integer default 1,
  p_usage_date date default current_date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.daily_usage
  set
    count = greatest(0, count - greatest(1, p_amount)),
    updated_at = now()
  where usage_date = p_usage_date and action = p_action;
end;
$$;

create or replace function public.increment_record_download(p_record_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.medical_records
  set
    download_count = download_count + 1,
    last_downloaded_at = now()
  where id = p_record_id;
end;
$$;

alter table public.medical_records enable row level security;
alter table public.daily_usage enable row level security;
