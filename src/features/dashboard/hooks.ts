"use client";

import useSWR from "swr";
import type {
  CallLog,
  Contact,
  DashboardSnapshot,
  Deal,
  Message,
  Task
} from "@/server/data/types";

type DashboardResponse = {
  snapshot: DashboardSnapshot;
  metrics: {
    openConversations: number;
    avgFirstResponseMinutes: number;
    sentimentBreakdown: Record<"positive" | "neutral" | "negative", number>;
    tasksDueSoon: Task[];
  };
};

const fetcher = (url: string) =>
  fetch(url).then<DashboardResponse>((res) => {
    if (!res.ok) {
      throw new Error(`Failed to fetch dashboard: ${res.statusText}`);
    }
    return res.json();
  });

export function useDashboardData() {
  const { data, error, isLoading, mutate } = useSWR<DashboardResponse>(
    "/api/dashboard",
    fetcher,
    {
      refreshInterval: 20_000,
      revalidateOnFocus: true
    }
  );

  return {
    snapshot: data?.snapshot,
    metrics: data?.metrics,
    error,
    isLoading,
    mutate
  };
}

export type ConversationThread = {
  threadId: string;
  channel: Message["channel"];
  contact: Contact;
  messages: Message[];
  lastMessageAt: string;
  status: Message["status"];
};

export function buildThreads(
  messages: Message[],
  contacts: Contact[]
): ConversationThread[] {
  const contactMap = new Map(contacts.map((contact) => [contact.id, contact]));
  const grouped = new Map<string, ConversationThread>();

  for (const message of messages) {
    const existing = grouped.get(message.threadId);
    const contact = contactMap.get(message.contactId);
    if (!contact) continue;

    if (!existing) {
      grouped.set(message.threadId, {
        threadId: message.threadId,
        channel: message.channel,
        contact,
        messages: [message],
        lastMessageAt: message.createdAt,
        status: message.status
      });
    } else {
      existing.messages.push(message);
      if (message.createdAt > existing.lastMessageAt) {
        existing.lastMessageAt = message.createdAt;
        existing.status = message.status;
      }
    }
  }

  return Array.from(grouped.values()).sort((a, b) =>
    a.lastMessageAt < b.lastMessageAt ? 1 : -1
  );
}
