import { NextResponse } from "next/server";
import { completeTask, createTask } from "@/server/data/store";

export async function PATCH(request: Request) {
  const { id } = (await request.json()) as { id: string };
  if (!id) {
    return NextResponse.json({ error: "Task ID required" }, { status: 400 });
  }
  const task = completeTask(id);
  return NextResponse.json({ task });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    description: string;
    contactId?: string;
    messageId?: string;
    dealId?: string;
    dueAt?: string;
    priority?: "low" | "normal" | "high";
  };

  if (!payload.description) {
    return NextResponse.json(
      { error: "Description is required" },
      { status: 400 }
    );
  }

  const task = createTask({
    ...payload,
    status: "open",
    priority: payload.priority ?? "normal"
  });

  return NextResponse.json({ task });
}
