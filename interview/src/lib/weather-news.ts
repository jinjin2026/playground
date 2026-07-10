import * as cheerio from "cheerio";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { weatherNewsCache } from "@/db/schema";

const PAGE_URL = "https://www.weather.go.kr/w/special-report/overall.do";
// The overall.do page loads its "날씨해설" content client-side via this
// fragment endpoint (confirmed via the browser's network panel — the main
// page's initial HTML ships an empty placeholder div). This endpoint itself
// returns plain server-rendered HTML given the right AJAX-identifying
// headers, so a normal `fetch` + cheerio parse works with no browser
// automation needed.
const WARNING_FRAGMENT_URL =
  "https://www.weather.go.kr/w/wnuri-fct2021/weather/warning.do";

export type ScrapedWeatherNews = { rawHeadline: string; body: string };

export async function scrapeWeatherNews(): Promise<ScrapedWeatherNews | null> {
  const res = await fetch(WARNING_FRAGMENT_URL, {
    cache: "no-store",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      Referer: PAGE_URL,
      "User-Agent": "Mozilla/5.0 (compatible; MorningDashboard/1.0)",
    },
  });
  if (!res.ok) return null;

  const html = await res.text();
  const $ = cheerio.load(html);

  // "날씨해설" section: first tab (.tab-cont01, the "6시간전망" short-range
  // commentary) holds a quoted one-line headline in strong.txt-subtitle,
  // and the full commentary body in .cmp-weather-cmt-txt-box-inner.
  const commentSection = $(".weather-cmt-content .tab-cont01").first();
  const rawHeadline = commentSection
    .find("strong.txt-subtitle")
    .first()
    .text()
    .trim();
  const body = commentSection
    .find(".cmp-weather-cmt-txt-box-inner .inner-content")
    .first()
    .text()
    .replace(/\s+/g, " ")
    .trim();

  if (!rawHeadline) return null;
  return { rawHeadline, body };
}

// Isolated so swapping in a real LLM call later is a one-function change.
export async function summarizeToPlainLanguage(rawText: string): Promise<string> {
  // TODO(real-LLM): replace this mock with an Anthropic API call once a key
  // is available, feeding `rawText` (the full KMA commentary body) in and
  // asking for a plain-language one-line summary with region/wind detail.
  void rawText;
  return "오늘은 남쪽에서 덥고 습한 공기가 올라와 곳곳에 비나 소나기가 내리고, 무더위가 이어질 전망이에요. (임시 요약 · 실제 LLM 연동 예정)";
}

export async function getWeatherNewsForDate(date: string) {
  const [cached] = await db
    .select()
    .from(weatherNewsCache)
    .where(eq(weatherNewsCache.date, date));
  if (cached) return cached;

  const scraped = await scrapeWeatherNews();
  const plainSummary = await summarizeToPlainLanguage(scraped?.body ?? "");

  if (!scraped) {
    // Don't persist a failed scrape — retry on the next request instead.
    return {
      id: -1,
      date,
      rawHeadline: "",
      plainSummary,
      sourceUrl: PAGE_URL,
      fetchedAt: new Date(),
    };
  }

  const [created] = await db
    .insert(weatherNewsCache)
    .values({
      date,
      rawHeadline: scraped.rawHeadline,
      plainSummary,
      sourceUrl: PAGE_URL,
    })
    .returning();

  return created;
}
