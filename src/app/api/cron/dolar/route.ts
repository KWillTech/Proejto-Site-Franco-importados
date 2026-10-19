import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { refreshUsdRate } from '@/lib/dolar';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const rate = await refreshUsdRate(supabase);
  if (rate !== null) revalidatePath('/', 'layout');
  return Response.json({ ok: rate !== null, rate }, { status: rate === null ? 500 : 200 });
}
