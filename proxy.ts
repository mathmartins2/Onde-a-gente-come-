import { NextResponse, type NextRequest } from 'next/server'

const publicPaths = ['/login']

export const proxy = (request: NextRequest) => {
  const { pathname } = request.nextUrl
  const hasSession = Boolean(request.cookies.get('restaurant_draw_session')?.value)

  if (publicPaths.includes(pathname)) {
    if (!hasSession) return NextResponse.next()
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (hasSession) return NextResponse.next()
  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
