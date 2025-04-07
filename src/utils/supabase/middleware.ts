import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from './server';

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createClient();

  // ✅ FIXED HERE
  const {
    data: { user },
  } = await (await supabase).auth.getUser();
  const url = request.nextUrl.clone()
  url.pathname = '/dashboard'


  if(request.nextUrl.pathname == ('/')|| request.nextUrl.pathname == ('')) {
    return NextResponse.redirect(url)

  }


  if (
    user==null &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/signup') 
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
