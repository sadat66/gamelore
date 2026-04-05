import { NextResponse } from "next/server";
import {
  fetchGamespotApi,
  getGamespotConfig,
  isGamespotListEndpoint,
} from "@/lib/gamespot";

/** Cache upstream responses (GameSpot free tier — be conservative). */
export const revalidate = 86400;

/** Only forward params GameSpot documents; avoids turning this into an open proxy. */
const ALLOWED_QUERY_KEYS = new Set([
  "filter",
  "sort",
  "offset",
  "limit",
  "field_list",
  "id",
]);

export async function GET(request: Request) {
  if (!getGamespotConfig()) {
    return NextResponse.json(
      {
        error:
          "Missing GAMESPOT_API_KEY. Optional: GAMESPOT_USER_AGENT (see https://www.gamespot.com/api/).",
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get("endpoint");

  if (!endpoint || !isGamespotListEndpoint(endpoint)) {
    return NextResponse.json(
      {
        error: "Invalid or missing endpoint.",
        allowed: [
          "games",
          "reviews",
          "articles",
          "videos",
          "images",
        ],
      },
      { status: 400 },
    );
  }

  const params: Record<string, string> = {};
  for (const key of ALLOWED_QUERY_KEYS) {
    const value = searchParams.get(key);
    if (value !== null && value !== "") {
      params[key] = value;
    }
  }

  const query = searchParams.get("query");
  if (query && !params.filter && endpoint === "games") {
    params.filter = `name:${query}`;
  }

  try {
    const response = await fetchGamespotApi(endpoint, params);

    const body = await response.text();
    const contentType =
      response.headers.get("Content-Type") ?? "application/json";

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
      },
    });
  } catch (e) {
    console.error("[GameSpot] upstream fetch failed:", e);
    return NextResponse.json(
      { error: "Failed to reach GameSpot API." },
      { status: 502 },
    );
  }
}
