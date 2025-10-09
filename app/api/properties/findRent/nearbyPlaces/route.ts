import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;
const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

async function getNearbyPlaces(lat: number, lng: number) {
  const radius = 1000;
  const types = ["school", "hospital", "mall"];
  const MAX_PLACES_PER_TYPE = 2;
  const MAX_TOTAL_PLACES = 6;

  let allPlaces: any[] = [];

  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    isNaN(lat) ||
    isNaN(lng)
  ) {
    console.error("getNearbyPlaces received invalid coordinates:", {
      lat,
      lng,
    });
    return [];
  }

  for (const type of types) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_PLACES_KEY}`;
    console.log("TESTING URL:", url);
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "REQUEST_DENIED") {
      console.error(
        "Google Places API Request Denied. Check your API key and billing settings."
      );
      return [];
    }

    if (data.results) {
      const topResults = data.results.slice(0, MAX_PLACES_PER_TYPE);

      const withPhotos = topResults.map((place: any) => ({
        name: place.name,
        vicinity: place.vicinity,
        photoUrl: place.photos?.[0]
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_KEY}`
          : null,
        type,
      }));
      allPlaces = allPlaces.concat(withPhotos);
    }
  }

  const uniquePlaces = allPlaces.filter(
    (place, index, self) =>
      index === self.findIndex((p) => p.name === place.name)
  );

  return uniquePlaces.slice(0, MAX_TOTAL_PLACES);
}

async function summarizePlacesOpenRouter(places: any[]) {
  if (!places.length) {
    return "No major schools or hospitals found nearby.";
  }

  if (!OPENROUTER_API_KEY) {
    console.warn("OPENROUTER_API_KEY is missing. Skipping AI summary.");
    return "Nearby places found, but AI summary is unavailable.";
  }

  const placeList = places.map((p) => p.name).join(", ");
  const prompt = `Summarize these nearby places for a property listing in 1-2 sentences: ${placeList}`;

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1:free",
          messages: [
            {
              role: "system",
              content: "You are a helpful real estate assistant.",
            },
            { role: "user", content: prompt },
          ],
        }),
      }
    );

    const json = await response.json();
    return json.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("OpenRouter API call failed:", error);
    return "Nearby places found, but AI summary failed.";
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const propertyId = searchParams.get("id");

  if (!propertyId) {
    return NextResponse.json(
      { message: "Property ID is required" },
      { status: 400 }
    );
  }

  try {
    const query = `
            SELECT latitude, longitude
            FROM Property
            WHERE property_id = ?
        `;
    const result = await db.execute(query, [propertyId]);
    const rows: any[] = Array.isArray(result[0]) ? result[0] : [];

    if (!rows.length) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 }
      );
    }

    const rawLatitude = rows[0].latitude;
    const rawLongitude = rows[0].longitude;

    const latitude = parseFloat(rawLatitude);
    const longitude = parseFloat(rawLongitude);

    if (isNaN(latitude) || isNaN(longitude)) {
      console.error(
        `Invalid coordinates for property ${propertyId}. Raw values: ${rawLatitude}, ${rawLongitude}`
      );
      return NextResponse.json({
        summary: "Invalid property location coordinates.",
        places: [],
      });
    }

    const nearbyPlaces = await getNearbyPlaces(latitude, longitude);
    const summary = await summarizePlacesOpenRouter(nearbyPlaces);

    return NextResponse.json({
      summary,
      places: nearbyPlaces,
    });
  } catch (error) {
    console.error("Error fetching nearby places:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
