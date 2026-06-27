import { handlers } from "@/lib/auth"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
    console.log('[AUTH_ROUTE] GET', req.url);
    return handlers.GET(req);
}

export async function POST(req: NextRequest) {
    console.log('[AUTH_ROUTE] POST', req.url);
    return handlers.POST(req);
}

export const dynamic = 'force-dynamic'
