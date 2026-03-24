export const SUPPORTED_LOCALES = ["en", "ar"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const API_URL = "https://translation.googleapis.com/language/translate/v2";

/**
 * Helper to fetch Google Translate APIs with necessary headers
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchTranslateAPI(endpoint: string, body: any) {
  if (!API_KEY) {
    throw new Error("GOOGLE_TRANSLATE_API_KEY is not defined");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Referer: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  };

  const response = await fetch(`${API_URL}${endpoint}?key=${API_KEY}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || "Google Translate API Error");
  }
  
  return data;
}

/**
 * Translate an array of strings to a target language in a single batch request.
 * Returns the original text array on failure.
 */
export async function translateTextArray(
  texts: string[],
  targetLang: string
): Promise<string[]> {
  try {
    if (!texts || texts.length === 0) return [];

    // Filter out completely empty strings to avoid API errors, but keep their index
    const validTexts = texts.map(t => t && t.trim().length > 0 ? t : " ");

    const data = await fetchTranslateAPI("", {
      q: validTexts,
      target: targetLang,
      format: "text",
    });
    
    return data.data.translations.map((t: any) => 
      t.translatedText.trim() === "" ? "" : t.translatedText
    );
  } catch (error) {
    console.error(`[Translate] Failed to translate array to ${targetLang}:`, error);
    return texts;
  }
}

export interface TranslatableFields {
  title: string;
  description: string;
  amenities?: string[];
  policies?: string[];
}

/**
 * Translate all listing content fields into every supported locale.
 * - Auto-detects source language for each text individually
 * - Batches all fields into a single API request per locale
 * - Translates all locales in parallel
 * - Never throws — always returns a result
 */
export async function translateListingContent(
  fields: TranslatableFields
): Promise<Record<SupportedLocale, TranslatableFields>> {
  try {
    const result = {} as Record<SupportedLocale, TranslatableFields>;

    const translationPromises = SUPPORTED_LOCALES.map(async (locale) => {
      const amenitiesCount = fields.amenities?.length || 0;
      const policiesCount = fields.policies?.length || 0;

      // 1. Flatten all text into a single array
      const textsToTranslate = [
        fields.title,
        fields.description,
        ...(fields.amenities || []),
        ...(fields.policies || [])
      ];

      // 2. Fetch translations cleanly, 1 bulk request per locale
      const translatedArray = await translateTextArray(textsToTranslate, locale);

      // 3. Re-map the array back to the object structure
      let currentIndex = 0;
      const title = translatedArray[currentIndex++];
      const description = translatedArray[currentIndex++];
      
      const amenities = amenitiesCount > 0
        ? translatedArray.slice(currentIndex, currentIndex + amenitiesCount)
        : [];
      currentIndex += amenitiesCount;

      const policies = policiesCount > 0
        ? translatedArray.slice(currentIndex, currentIndex + policiesCount)
        : [];

      result[locale] = { title, description, amenities, policies };
    });

    await Promise.all(translationPromises);
    return result;
  } catch (error) {
    console.error("[Translate] Failed to translate listing content:", error);

    const fallback = {} as Record<SupportedLocale, TranslatableFields>;
    for (const locale of SUPPORTED_LOCALES) {
      fallback[locale] = {
        title: fields.title,
        description: fields.description,
        amenities: fields.amenities ? [...fields.amenities] : [],
        policies: fields.policies ? [...fields.policies] : [],
      };
    }
    return fallback;
  }
}
