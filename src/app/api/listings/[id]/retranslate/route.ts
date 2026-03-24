import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Listing from "@/models/Listing";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/auth-middleware";
import { translateListingContent } from "@/lib/translate";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, ["Admin"]);
    await dbConnect();
    const { id } = await params;

    const listing = await Listing.findById(id);

    if (!listing) {
      return errorResponse("Listing not found", 404);
    }

    const translations = await translateListingContent({
      title: listing.title,
      description: listing.description,
      amenities: listing.amenities || [],
      policies: listing.policies || [],
    });

    // Build the translations map for MongoDB
    const translationsMap: Record<
      string,
      {
        title: string;
        description: string;
        amenities: string[];
        policies: string[];
      }
    > = {};
    for (const [locale, fields] of Object.entries(translations)) {
      translationsMap[locale] = {
        title: fields.title,
        description: fields.description,
        amenities: fields.amenities || [],
        policies: fields.policies || [],
      };
    }

    await Listing.findByIdAndUpdate(id, {
      translations: translationsMap,
    });

    return successResponse(
      null,
      "Listing translations updated successfully"
    );
  } catch (error) {
    console.error("Retranslate error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to retranslate listing";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return errorResponse(message, status);
  }
}
