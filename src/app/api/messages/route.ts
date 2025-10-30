import { NextResponse } from "next/server";
import {
  addOutboundMessage,
  getDashboardSnapshot
} from "@/server/data/store";
import { generateAgentReply } from "@/lib/agent";
import { sendFacebookMessage } from "@/lib/channels/facebook";
import { sendInstagramMessage } from "@/lib/channels/instagram";
import { sendMessengerMessage } from "@/lib/channels/messenger";
import { sendWebsiteMessage } from "@/lib/channels/website";

const channelDispatchers = {
  website: sendWebsiteMessage,
  instagram: sendInstagramMessage,
  facebook: sendFacebookMessage,
  messenger: sendMessengerMessage
};

type Payload = {
  channel: keyof typeof channelDispatchers;
  contactId: string;
  threadId: string;
  body?: string;
  useAgent?: boolean;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as Payload;
  const { channel, contactId, threadId, useAgent } = payload;

  const snapshot = getDashboardSnapshot();
  const history = snapshot.messages.filter(
    (message) => message.threadId === threadId
  );

  let messageBody = payload.body;
  let rationale = "";
  let suggestedTasks: string[] = [];

  if (useAgent || !messageBody) {
    const agentResult = await generateAgentReply({
      conversation: history,
      channel
    });
    messageBody = agentResult.reply;
    rationale = agentResult.rationale;
    suggestedTasks = agentResult.suggestedTasks ?? [];
  }

  if (!messageBody) {
    return NextResponse.json(
      { error: "Message body is required" },
      { status: 400 }
    );
  }

  const dispatcher = channelDispatchers[channel];

  try {
    await dispatcher({
      recipientId: contactId,
      message: messageBody
    } as never);
  } catch (error) {
    console.error("Channel send error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send message"
      },
      { status: 502 }
    );
  }

  const saved = addOutboundMessage({
    channel,
    contactId,
    threadId,
    direction: "outbound",
    body: messageBody,
    status: "responded",
    sentiment: "positive"
  });

  return NextResponse.json({
    message: saved,
    rationale,
    suggestedTasks
  });
}
