import { NextResponse } from 'next/server';

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_API_KEY = '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';

export async function GET() {
  const startTime = Date.now();

  try {
    const response = await fetch(`${NVIDIA_BASE_URL}/models`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
      },
      signal: AbortSignal.timeout(8000),
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      return NextResponse.json(
        {
          status: 'error',
          model: 'unknown',
          latency: `${latency}ms`,
          error: `NVIDIA API returned ${response.status}`,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      model: 'deepseek-ai/deepseek-v3.1',
      provider: 'NVIDIA NIM',
      latency: `${latency}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const latency = Date.now() - startTime;
    return NextResponse.json(
      {
        status: 'error',
        model: 'unknown',
        latency: `${latency}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
