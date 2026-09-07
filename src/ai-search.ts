import { ParsedSearchQuery } from "./types";

/**
 * Natural-Language AI Query Parser
 * Translates conversational queries into structured SQL / Supabase filters and semantic search keywords.
 */
export function parseNaturalLanguageQuery(query: string): ParsedSearchQuery {
  const q = query.toLowerCase();
  const filters: ParsedSearchQuery["extractedFilters"] = {};
  const keywords: string[] = [];

  // Opportunity Type Extraction
  if (q.includes("scholarship") || q.includes("master") || q.includes("phd") || q.includes("study")) {
    filters.type = "scholarship";
  } else if (q.includes("internship") || q.includes("trainee") || q.includes("job")) {
    filters.type = "internship";
  } else if (q.includes("hackathon") || q.includes("competition")) {
    filters.type = "hackathon";
  } else if (q.includes("research")) {
    filters.type = "research";
  } else if (q.includes("exchange")) {
    filters.type = "exchange";
  }

  // Funding Type
  if (q.includes("fully funded") || q.includes("fully-funded") || q.includes("full fund") || q.includes("free")) {
    filters.fundingType = "fully_funded";
  } else if (q.includes("paid")) {
    filters.fundingType = "paid";
  } else if (q.includes("partial")) {
    filters.fundingType = "partial";
  }

  // Location Mode & Countries
  if (q.includes("remote") || q.includes("online")) {
    filters.locationMode = "remote";
  } else if (q.includes("germany")) {
    filters.locationCountry = "Germany";
  } else if (q.includes("usa") || q.includes("united states") || q.includes("america")) {
    filters.locationCountry = "United States";
  } else if (q.includes("korea") || q.includes("south korea")) {
    filters.locationCountry = "South Korea";
  } else if (q.includes("europe") || q.includes("eu")) {
    filters.locationCountry = "European Union";
  } else if (q.includes("egypt")) {
    filters.locationCountry = "Egypt";
  }

  // Nationality Target
  if (q.includes("egyptian") || q.includes("egypt")) {
    filters.nationality = "Egyptian";
  }

  // Field / Subject
  if (q.includes("ai") || q.includes("artificial intelligence") || q.includes("machine learning")) {
    filters.field = "AI";
    keywords.push("AI", "Machine Learning");
  } else if (q.includes("computer science") || q.includes("software")) {
    filters.field = "Computer Science";
    keywords.push("Computer Science", "Software");
  } else if (q.includes("engineering")) {
    filters.field = "Engineering";
    keywords.push("Engineering");
  } else if (q.includes("media") || q.includes("journalism")) {
    filters.field = "Digital Media";
    keywords.push("Media");
  }

  // Degree Level
  if (q.includes("master") || q.includes("postgraduate") || q.includes("grad")) {
    filters.degreeLevel = "master";
  } else if (q.includes("undergraduate") || q.includes("bachelor") || q.includes("first-year") || q.includes("2nd-year")) {
    filters.degreeLevel = "bachelor";
  }

  return {
    extractedFilters: filters,
    semanticKeywords: keywords.length > 0 ? keywords : [query],
    explanation: `Interpreted as: ${filters.fundingType || "all"} ${filters.type || "opportunities"} in ${filters.locationCountry || "any location"} for field '${filters.field || "all fields"}'.`,
  };
}
