import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Question from "@/models/Question";
import Listing from "@/models/Listing";
import { getCurrentUser } from "@/lib/auth/auth-middleware";
import { triggerQuestionTranslation, applyQuestionLocale } from "@/lib/question-translation";
import { SUPPORTED_LOCALES } from "@/lib/translate";

// GET: Fetch visible questions for a listing (Public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const questions = await Question.find({ listingId: id, isVisible: true })
      .populate("guestId", "name avatar")
      .sort({ isFAQ: -1, createdAt: -1 }); // FAQs first, then new questions

    // Check if current user has already asked a question for this listing
    let hasAskedQuestion = false;
    const user = await getCurrentUser(request);
    if (user) {
      const existingQuestion = await Question.findOne({
        listingId: id,
        guestId: user._id,
      });
      hasAskedQuestion = !!existingQuestion;
    }

    // Resolve locale: check header first (explicitly sent by developer), then cookie (site language), then fallback
    const acceptLang = request.headers.get("accept-language")?.split(",")[0].split("-")[0].trim();
    const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
    
    const rawLocale = (acceptLang && (SUPPORTED_LOCALES as readonly string[]).includes(acceptLang)) 
      ? acceptLang 
      : (cookieLocale || "en");
    
    const effectiveLocale = (SUPPORTED_LOCALES as readonly string[]).includes(rawLocale) ? rawLocale : "en";
    
    const localizedQuestions = questions.map(q => applyQuestionLocale(q.toObject ? q.toObject() : q, effectiveLocale));

    return NextResponse.json({ questions: localizedQuestions, hasAskedQuestion });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

// POST: Ask a question (Guest only)
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
    const { question } = body;

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Check if user has already asked a question for this listing
    const existingQuestion = await Question.findOne({
      listingId: id,
      guestId: user._id,
    });

    if (existingQuestion) {
      return NextResponse.json(
        { error: "You have already asked a question for this listing" },
        { status: 400 }
      );
    }

    const newQuestion = await Question.create({
      listingId: id,
      guestId: user._id,
      hostId: listing.host,
      question,
      isVisible: false, // Default to invisible until answered
      isFAQ: false,
    });

    // Fire-and-forget translation
    triggerQuestionTranslation(newQuestion._id.toString(), {
      question: newQuestion.question,
    }).catch(err => console.error("[Translation] Guest question translation failed:", err));

    return NextResponse.json(newQuestion, { status: 201 });
  } catch (error) {
    console.error("Error asking question:", error);
    return NextResponse.json(
      { error: "Failed to submit question" },
      { status: 500 }
    );
  }
}
