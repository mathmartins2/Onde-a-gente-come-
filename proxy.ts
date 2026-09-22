import { NextResponse, type NextRequest } from 'next/server'

const loginPath = '/login'
const publicRestaurantPathPrefix = '/r/'

export const proxy = (request: NextRequest) => {
  const { pathname } = request.nextUrl
  if (pathname === loginPath) return NextResponse.next()
  if (pathname.startsWith(publicRestaurantPathPrefix)) return NextResponse.next()

  const hasSessionCookie = Boolean(request.cookies.get('restaurant_draw_session')?.value)
  if (hasSessionCookie) return NextResponse.next()

  return NextResponse.redirect(new URL(loginPath, request.url))
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|icon\\.svg).*)'],
}
