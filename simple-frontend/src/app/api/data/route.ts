import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  
  try {
    const response = await fetch(`${apiUrl}/api/data`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`VPS API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ ...data, source: 'live-proxy' });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ 
      source: 'error', 
      message: (error as Error).message,
      apiUrl: apiUrl 
    }, { status: 500 });
  }
}
