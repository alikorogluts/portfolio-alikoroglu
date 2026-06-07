import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  subject: z.string().trim().max(180).optional(),
  message: z.string().trim().min(10).max(4000),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Please fill in the required fields.",
      },
      { status: 400 },
    );
  }

  try {
    const { prisma } = await import("@/lib/prisma");

    await prisma.contactMessage.create({
      data: {
        ...parsed.data,
        subject: parsed.data.subject?.trim() || "Portfolio contact",
      },
    });

    return NextResponse.json({ success: true, message: "Message sent successfully." });
  } catch (error) {
    console.error("[contact] Failed to save contact message.", error);
    return NextResponse.json({ success: false, message: "Could not send your message." }, { status: 500 });
  }
}
