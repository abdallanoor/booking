import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Question from "@/models/Question";
import Listing from "@/models/Listing";
import { getCurrentUser } from "@/lib/auth/auth-middleware";
import { triggerQuestionTranslation, applyQuestionLocale } from "@/lib/question-translation";
import { SUPPORTED_LOCALES } from "@/lib/translate";

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

    // Resolve locale: check header first (explicitly sent by developer), then cookie (site language), then fallback
    const acceptLang = request.headers.get("accept-language")?.split(",")[0].split("-")[0].trim();
    const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
    
    const rawLocale = (acceptLang && (SUPPORTED_LOCALES as readonly string[]).includes(acceptLang)) 
      ? acceptLang 
      : (cookieLocale || "en");
    
    const effectiveLocale = (SUPPORTED_LOCALES as readonly string[]).includes(rawLocale) ? rawLocale : "en";
    
    const localizedQuestions = questions.map(q => applyQuestionLocale(q.toObject ? q.toObject() : q, effectiveLocale));

    return NextResponse.json(localizedQuestions);
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

    // Fire-and-forget translation
    triggerQuestionTranslation(newFAQ._id.toString(), {
      question: newFAQ.question,
      answer: newFAQ.answer,
    }).catch(err => console.error("[Translation] Host FAQ translation failed:", err));

    return NextResponse.json(newFAQ, { status: 201 });
  } catch (error) {
    console.error("Error creating FAQ:", error);
    return NextResponse.json(
      { error: "Failed to create FAQ" },
      { status: 500 }
    );
  }
}
