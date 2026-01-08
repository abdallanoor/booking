import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Question from "@/models/Question";
import { getCurrentUser } from "@/lib/auth/auth-middleware";
import Listing from "@/models/Listing";
import { sendQuestionReplyEmail } from "@/lib/email/nodemailer";

// PATCH: Answer question, toggle visibility, update FAQ
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params; // Question ID
    const body = await request.json();
    const { answer, isVisible } = body;

    const question = await Question.findById(id).populate("listingId guestId");
    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Verify host
    if (question.hostId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const wasAnswered = !!question.answer;

    if (answer !== undefined) {
      question.answer = answer;
      question.isVisible = true; // Auto-visible on answer
    }
    if (isVisible !== undefined) question.isVisible = isVisible;

    await question.save();

    // Send email if it's a new answer to a guest question
    if (answer && !wasAnswered && !question.isFAQ && question.guestId) {
      // We need to fetch the Listing title for the email
      const listing = await Listing.findById(question.listingId).select(
        "title"
      );
      // @ts-expect-error - Guest is populated
      const guestEmail = question.guestId.email;

      if (listing && guestEmail) {
        await sendQuestionReplyEmail(guestEmail, {
          listingTitle: listing.title,
          question: question.question,
          answer: answer,
          listingId: listing._id.toString(),
        });
      }
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a question/FAQ
export async function DELETE(
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

    const question = await Question.findById(id);
    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Verify host
    if (question.hostId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await Question.findByIdAndDelete(id);

    return NextResponse.json({ message: "Question deleted" });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    );
  }
}
