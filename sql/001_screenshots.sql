create table if not exists screenshots (
	id uuid primary key default gen_random_uuid(),
	device_id text not null,
	file_url text not null,
	ip text,
	hostname text,
	created_at timestamptz not null default now()
);

create index if not exists idx_screenshots_device_time on screenshots(device_id, created_at desc);

