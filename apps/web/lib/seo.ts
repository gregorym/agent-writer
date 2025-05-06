import { unstable_cache } from "next/cache";

export interface KeywordResult {
  keyword: string;
  volume: number;
  difficulty: number;
  competition: string;
  lastUpdated: string;
  intent: string;
}

async function queryKeywordsByWebsite(
  url: string,
  location: string,
  lang: string,
  limit: number = 100
): Promise<KeywordResult[]> {
  const apiUrl =
    "https://api.dataforseo.com/v3/dataforseo_labs/google/keywords_for_site/live";

  // Replace with actual credentials (should be environment variables)
  const username = process.env.DATAFORSEO_USERNAME;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!username || !password) {
    throw new Error("DataForSEO credentials not found");
  }

  const auth = Buffer.from(`${username}:${password}`).toString("base64");

  const requestBody = [
    {
      target: url,
      language_name: lang,
      location_name: location,
      include_serp_info: false,
      include_subdomains: false,
      filters: [
        ["keyword_properties.keyword_difficulty", ">", 0],
        "and",
        ["keyword_properties.competition", ">", 0],
        "and",
        ["keyword_info.search_volume", ">", 50],
      ],
      limit: limit,
    },
  ];

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`DataForSEO API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.tasks || !data.tasks[0] || !data.tasks[0].result) {
      return [];
    }

    return data.tasks[0].result[0].items.map((item: any) => ({
      keyword: item.keyword,
      volume: item.keyword_info?.search_volume || 0,
      difficulty: item.keyword_properties?.keyword_difficulty || 0,
      competition: item.keyword_info?.competition_level,
      lastUpdated: item.keyword_info?.last_updated_time,
      intent: item.search_intent_info?.main_intent,
    }));
  } catch (error) {
    throw new Error(
      `Failed to fetch keywords: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function queryKeywordSuggestion(
  keyword: string,
  location: string,
  lang: string,
  limit: number = 100
): Promise<KeywordResult[]> {
  const apiUrl =
    "https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live";

  // Replace with actual credentials (should be environment variables)
  const username = process.env.DATAFORSEO_USERNAME;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!username || !password) {
    throw new Error("DataForSEO credentials not found");
  }

  const auth = Buffer.from(`${username}:${password}`).toString("base64");

  const requestBody = [
    {
      keyword: keyword,
      language_name: lang,
      location_name: location,
      include_serp_info: false,
      include_subdomains: false,
      filters: [
        ["keyword_properties.keyword_difficulty", ">", 0],
        "and",
        ["keyword_properties.competition", ">", 0],
        "and",
        ["keyword_info.search_volume", ">", 50],
      ],
      limit: limit,
    },
  ];

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`DataForSEO API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.tasks || !data.tasks[0] || !data.tasks[0].result) {
      return [];
    }

    return data.tasks[0].result[0].items.map((item: any) => ({
      keyword: item.keyword,
      volume: item.keyword_info?.search_volume || 0,
      difficulty: item.keyword_properties?.keyword_difficulty || 0,
      competition: item.keyword_info?.competition_level,
      lastUpdated: item.keyword_info?.last_updated_time,
      intent: item.search_intent_info?.main_intent,
    }));
  } catch (error) {
    throw new Error(
      `Failed to fetch keywords: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function keywordsByWebsite(
  url: string,
  location: string,
  lang: string,
  limit: number = 100
): Promise<KeywordResult[]> {
  const FOUR_WEEK_IN_SECONDS = 7 * 24 * 60 * 60 * 4; // 4 week

  return unstable_cache(
    () => queryKeywordsByWebsite(url, location, lang, limit),
    [`keywords-for-site-${url}-${location}-${lang}-${limit}`],
    { revalidate: FOUR_WEEK_IN_SECONDS, tags: [`keywords-${url}`] }
  )();
}

export async function keywordSuggestions(
  keyword: string,
  location: string,
  lang: string,
  limit: number = 100
): Promise<KeywordResult[]> {
  const FOUR_WEEK_IN_SECONDS = 7 * 24 * 60 * 60 * 4; // 4 week

  return unstable_cache(
    () => queryKeywordSuggestion(keyword, location, lang, limit),
    [`keywords-suggestions-for-${keyword}-${location}-${lang}-${limit}`],
    { revalidate: FOUR_WEEK_IN_SECONDS, tags: [`keywords-${keyword}`] }
  )();
}
