import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Question from "@/models/Question";
import Listing from "@/models/Listing";
import { getCurrentUser } from "@/lib/auth/auth-middleware";

// GET: Fetch all questions for a listing (Host only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    // Verify host ownership
    const listing = await Listing.findById(id);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.host.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const questions = await Question.find({ listingId: id })
      .populate("guestId", "name avatar")
      .sort({ createdAt: -1 });

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error fetching host questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

// POST: Create FAQ (Host only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const { question, answer } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Question and Answer are required" },
        { status: 400 }
      );
    }

    // Verify host ownership
    const listing = await Listing.findById(id);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.host.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const newFAQ = await Question.create({
      listingId: id,
      hostId: user._id, // Host is creating it
      question,
      answer,
      isVisible: true,
      isFAQ: true,
    });

    return NextResponse.json(newFAQ, { status: 201 });
  } catch (error) {
    console.error("Error creating FAQ:", error);
    return NextResponse.json(
      { error: "Failed to create FAQ" },
      { status: 500 }
    );
  }
}
