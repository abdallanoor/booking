import { translateListingContent, SUPPORTED_LOCALES } from "@/lib/translate";
import type { SupportedLocale } from "@/lib/translate";
import Listing from "@/models/Listing";
import dbConnect from "@/lib/mongodb";

interface TranslatableFields {
  title: string;
  description: string;
  amenities?: string[];
  policies?: string[];
}

/**
 * Trigger background translation for a listing.
 * Calls translateListingContent, then updates the listing in MongoDB.
 * This function is designed to be called WITHOUT await (fire-and-forget).
 */
export async function triggerListingTranslation(
  listingId: string,
  fields: TranslatableFields
): Promise<void> {
  try {
    await dbConnect();
    const translations = await translateListingContent(fields);

    // Build the translations map for MongoDB
    const translationsMap: Record<string, TranslatableFields> = {};
    for (const locale of SUPPORTED_LOCALES) {
      translationsMap[locale] = translations[locale];
    }

    await Listing.findByIdAndUpdate(listingId, {
      translations: translationsMap,
    });

    console.log(`[Translation] Successfully translated listing ${listingId}`);
  } catch (error) {
    console.error(`[Translation] Failed to translate listing ${listingId}:`, error);
  }
}

/**
 * Apply locale-specific translations to a listing object.
 * Reads from listing.translations (handles both Mongoose Map .get() and plain object access).
 * Falls back to original fields if the requested locale's translation is missing.
 * Returns a merged object — never exposes the raw translations map to the client.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyListingLocale(listing: any, locale: string): any {
  if (!listing) return listing;

  // Normalize locale (e.g., "ar-EG" → "ar")
  const normalizedLocale = locale.split("-")[0] as SupportedLocale;

  // Try to get the translation for this locale
  let translation: TranslatableFields | undefined;

  if (listing.translations) {
    if (typeof listing.translations.get === "function") {
      // Mongoose Map — use .get()
      translation = listing.translations.get(normalizedLocale);
    } else if (typeof listing.translations === "object") {
      // Plain object (from .toObject() or .lean())
      translation = listing.translations[normalizedLocale];
    }
  }

  // Build the result — copy listing and remove translations map
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { translations, sourceLang, ...rest } = listing;

  if (translation) {
    return {
      ...rest,
      title: translation.title || rest.title,
      description: translation.description || rest.description,
      amenities:
        translation.amenities && translation.amenities.length > 0
          ? translation.amenities
          : rest.amenities,
      policies:
        translation.policies && translation.policies.length > 0
          ? translation.policies
          : rest.policies,
    };
  }

  // No translation found — return original fields without translations map
  return rest;
}
