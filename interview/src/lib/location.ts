export type LocationCandidate = {
  name: string;
  latitude: number;
  longitude: number;
  country: string | null;
  admin1: string | null;
};

export async function searchLocations(query: string): Promise<LocationCandidate[]> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "ko");

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return [];

  const data = await response.json();
  const results: unknown[] = data?.results ?? [];

  return results.map((r) => {
    const row = r as {
      name: string;
      latitude: number;
      longitude: number;
      country?: string;
      admin1?: string;
    };
    return {
      name: row.name,
      latitude: row.latitude,
      longitude: row.longitude,
      country: row.country ?? null,
      admin1: row.admin1 ?? null,
    };
  });
}
