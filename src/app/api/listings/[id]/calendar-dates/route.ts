import { NextRequest } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/mongodb";
import CalendarDate from "@/models/CalendarDate";
import Listing from "@/models/Listing";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/auth-middleware";
import { z } from "zod";

// Validation schema for bulk update
const bulkUpdateSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD")),
  isBlocked: z.boolean().optional(),
  customPrice: z.number().min(0).nullable().optional(),
  note: z.string().nullable().optional(),
});

// GET /api/listings/[id]/calendar-dates?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    await dbConnect();

    const { id: listingId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Verify listing exists and user owns it
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return errorResponse("Listing not found", 404);
    }

    if (
      listing.host.toString() !== user._id.toString() &&
      user.role !== "Admin"
    ) {
      return errorResponse("Forbidden", 403);
    }

    // Build date query
    const query: Record<string, unknown> = { listing: listingId };
    
    if (from && to) {
      query.date = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
    } else if (from) {
      query.date = { $gte: new Date(from) };
    } else if (to) {
      query.date = { $lte: new Date(to) };
    }

    const calendarDates = await CalendarDate.find(query)
      .sort({ date: 1 })
      .lean();

    return successResponse({ calendarDates });
  } catch (error) {
    console.error("Get calendar dates error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get calendar dates";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return errorResponse(message, status);
  }
}

// PUT /api/listings/[id]/calendar-dates - Bulk upsert
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    await dbConnect();

    const { id: listingId } = await params;
    const body = await req.json();

    // Validate input
    const validatedData = bulkUpdateSchema.parse(body);

    if (validatedData.dates.length === 0) {
      return errorResponse("At least one date is required", 400);
    }

    // Verify listing exists and user owns it
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return errorResponse("Listing not found", 404);
    }

    if (
      listing.host.toString() !== user._id.toString() &&
      user.role !== "Admin"
    ) {
      return errorResponse("Forbidden", 403);
    }

    const listingObjectId = new Types.ObjectId(listingId);

    // Bulk upsert each date
    const bulkOps = validatedData.dates.map((dateStr) => {
      const date = new Date(dateStr);
      date.setUTCHours(0, 0, 0, 0);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const setData: Record<string, any> = {
        listing: listingObjectId,
        date,
        createdBy: user._id,
      };

      if (validatedData.isBlocked !== undefined) {
        setData.isBlocked = validatedData.isBlocked;
      }

      if (validatedData.customPrice !== undefined && validatedData.customPrice !== null) {
        setData.customPrice = validatedData.customPrice;
      }

      if (validatedData.note !== undefined && validatedData.note !== null) {
        setData.note = validatedData.note;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateOp: any = { $set: setData };
      
      const unsetFields: Record<string, 1> = {};
      if (validatedData.customPrice === null) {
        unsetFields.customPrice = 1;
      }
      if (validatedData.note === null) {
        unsetFields.note = 1;
      }
      
      if (Object.keys(unsetFields).length > 0) {
        updateOp.$unset = unsetFields;
      }

      return {
        updateOne: {
          filter: { listing: listingObjectId, date },
          update: updateOp,
          upsert: true,
        },
      };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await CalendarDate.bulkWrite(bulkOps as any);

    // Fetch updated dates
    const updatedDates = await CalendarDate.find({
      listing: listingId,
      date: {
        $in: validatedData.dates.map((d) => {
          const date = new Date(d);
          date.setUTCHours(0, 0, 0, 0);
          return date;
        }),
      },
    })
      .sort({ date: 1 })
      .lean();

    return successResponse(
      { calendarDates: updatedDates },
      "Calendar dates updated successfully"
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return errorResponse("Validation error", 400, error);
    }
    console.error("Update calendar dates error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update calendar dates";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return errorResponse(message, status);
  }
}
