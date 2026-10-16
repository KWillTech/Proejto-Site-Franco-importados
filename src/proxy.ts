import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

export function proxy(request: NextRequest) {
  return updateSession(request);
}

// Só o painel usa sessão; a vitrine e os estáticos não passam pelo proxy.
export const config = {
  matcher: ['/admin/:path*'],
};
