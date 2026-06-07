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
    const { prisma, readWithRetry } = await import("@/lib/prisma");
    const settings = await readWithRetry(
      () => prisma.siteSettings.findFirst({ orderBy: { updatedAt: "desc" } }),
      "contact settings lookup",
    );

    if (settings?.maintenanceMode) {
      return NextResponse.json(
        {
          success: false,
          message: "The site is currently under maintenance. Please try again later.",
        },
        { status: 503 },
      );
    }

    if (settings && !settings.contactFormEnabled) {
      return NextResponse.json(
        {
          success: false,
          message: "The contact form is currently disabled.",
        },
        { status: 403 },
      );
    }

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
