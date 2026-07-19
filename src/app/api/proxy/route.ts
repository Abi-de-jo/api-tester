import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { url, method, headers, body } = await request.json();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const start = Date.now();

  try {
    const finalHeaders: Record<string, string> = { ...headers };
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(method);
    if (hasBody && body && !finalHeaders['Content-Type'] && !finalHeaders['content-type']) {
      finalHeaders['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: hasBody ? body : undefined,
      signal: controller.signal,
    });

    const timeMs = Date.now() - start;
    const responseText = await res.text();
    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => { responseHeaders[k] = v; });

    clearTimeout(timeout);
    return NextResponse.json({
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
      body: responseText,
      timeMs,
    });
  } catch (err: any) {
    clearTimeout(timeout);
    const timeMs = Date.now() - start;
    return NextResponse.json(
      { error: err.name === 'AbortError' ? 'Request timed out (10s)' : err.message, timeMs },
      { status: 500 }
    );
  }
}
