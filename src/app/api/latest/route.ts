import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';

export async function GET() {
  const { rows } = await sql`
    select s.*
    from screenshots s
    join (
      select device_id, max(created_at) as last_time
      from screenshots
      group by device_id
    ) t on t.device_id = s.device_id and t.last_time = s.created_at
    order by s.device_id asc
  `;
  return NextResponse.json(rows);
}

