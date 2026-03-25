import { SUPPORTED_LOCALES, translateTextArray } from "./translate";
import Review from "@/models/Review";
import dbConnect from "./mongodb";

const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const API_URL = "https://translation.googleapis.com/language/translate/v2";

/**
 * Detect the language of a given text. Returns 'en' as fallback.
 */
async function detectLanguage(text: string): Promise<string> {
  if (!API_KEY) return "en";

  try {
    const response = await fetch(`${API_URL}/detect?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      },
      body: JSON.stringify({ q: [text] }),
    });

    const data = await response.json();
    if (!response.ok) return "en";
    return data.data.detections[0][0].language;
  } catch (error) {
    console.error("[Translate] Failed to detect language:", error);
    return "en";
  }
}

/**
 * Perform translation of review fields (comment) to all supported locales.
 */
export async function translateReviewContent(comment: string | undefined): Promise<{
  translations: Record<string, { comment?: string }>;
  sourceLang: string;
}> {
  const result: Record<string, { comment?: string }> = {};

  if (!comment) {
    // If no comment, just map empty to all locales
    for (const locale of SUPPORTED_LOCALES) {
      result[locale] = { comment: "" };
    }
    return { translations: result, sourceLang: "en" };
  }

  // Detect source language
  const sourceLang = await detectLanguage(comment);

  const translationPromises = SUPPORTED_LOCALES.map(async (locale) => {
    // Optimization: Skip translation if language matches source
    if (locale === sourceLang) {
      result[locale] = { comment };
      return;
    }

    try {
      const translatedArray = await translateTextArray([comment], locale);
      result[locale] = {
        comment: translatedArray[0],
      };
    } catch (e) {
      // Fallback to original text on error
      result[locale] = { comment };
    }
  });

  await Promise.all(translationPromises);

  return { translations: result, sourceLang };
}

/**
 * Fire-and-forget background job to translate a new or updated review.
 * Does not block the API response.
 */
export async function triggerReviewTranslation(reviewId: string) {
  // Use setTimeout to ensure this runs outside the main request context
  setTimeout(async () => {
    try {
      await dbConnect();
      const review = await Review.findById(reviewId);

      if (!review) {
        console.error(`[Review Translate] Review not found: ${reviewId}`);
        return;
      }

      if (!review.comment) {
        // Nothing to translate
        return;
      }

      console.log(`[Review Translate] Starting translation for review ${reviewId}...`);

      const { translations, sourceLang } = await translateReviewContent(review.comment);

      review.translations = translations as any;
      review.sourceLang = sourceLang;

      await review.save();

      console.log(`[Review Translate] Completed translation for review ${reviewId}`);
    } catch (error) {
      console.error(
        `[Review Translate] Critical failure translating review ${reviewId}:`,
        error
      );
    }
  }, 0);
}

/**
 * Helper to safely apply translations to a populated or raw review object
 * based on the requested locale.
 * Replaces the 'comment' property with its translation if available.
 */
export function applyReviewLocale(reviewObj: any, locale: string) {
  if (!reviewObj) return reviewObj;

  const normalizedLocale = locale.split("-")[0];
  let translation: any;

  if (reviewObj.translations) {
    if (typeof reviewObj.translations.get === "function") {
      translation = reviewObj.translations.get(normalizedLocale);
    } else if (typeof reviewObj.translations === "object") {
      translation = reviewObj.translations[normalizedLocale];
    }
  }

  // Create a clean object to return without mutating original
  // reviewObj might be a Mongoose Document so .toJSON() is best if it exists
  const cloned = typeof reviewObj.toJSON === 'function' ? reviewObj.toJSON() : { ...reviewObj };

  if (translation && translation.comment) {
    cloned.comment = translation.comment;
  }

  // Clean up server-only fields before sending to client
  delete cloned.translations;
  // We can keep sourceLang if frontend wants to show "Translated from X"

  return cloned;
}
