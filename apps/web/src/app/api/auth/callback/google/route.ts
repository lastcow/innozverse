import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/login?error=missing_oauth_parameters', request.url)
    );
  }

  try {
    // Exchange code for tokens by calling our API
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://innozverse.fly.dev';
    const response = await fetch(`${apiUrl}/v1/auth/google/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, state }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to exchange code for tokens');
    }

    const data = await response.json();
    const { access_token, refresh_token, is_new_user } = data.data;

    // Redirect to /auth/callback with tokens in URL (client-side will store them)
    const redirectUrl = new URL('/auth/callback', request.url);
    redirectUrl.searchParams.set('access_token', access_token);
    redirectUrl.searchParams.set('refresh_token', refresh_token);
    redirectUrl.searchParams.set('is_new_user', is_new_user.toString());

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(error instanceof Error ? error.message : 'oauth_failed')}`,
        request.url
      )
    );
  }
}
