import { NextResponse } from "next/server"

const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000"

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  const incomingUrl = new URL(request.url)
  const targetUrl = new URL(`/api/${path.join("/")}`, backendUrl)
  targetUrl.search = incomingUrl.search

  const headers = new Headers(request.headers)
  headers.delete("host")

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer()
  }

  try {
    const response = await fetch(targetUrl, init)
    const responseHeaders = new Headers(response.headers)
    responseHeaders.delete("content-encoding")
    responseHeaders.delete("content-length")
    responseHeaders.delete("transfer-encoding")

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Backend proxy request failed",
      },
      { status: 502 }
    )
  }
}

export const dynamic = "force-dynamic"

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context)
}

export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context)
}

export async function PUT(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context)
}

export async function PATCH(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context)
}

export async function DELETE(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context)
}
