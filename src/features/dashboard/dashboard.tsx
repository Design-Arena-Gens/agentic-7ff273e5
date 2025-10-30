"use client";

import { useMemo, useState, useTransition } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  BoltIcon,
  ChatBubbleOvalLeftIcon,
  PhoneIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import { clsx } from "clsx";
import { toast } from "@/components/ui/use-toast";
import type { CallLog, Deal, Message, Task } from "@/server/data/types";
import { buildThreads, useDashboardData } from "./hooks";

export function Dashboard() {
  const { snapshot, metrics, isLoading, error, mutate } = useDashboardData();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [useAgent, setUseAgent] = useState(true);
  const [isPending, startTransition] = useTransition();

  const threads = useMemo(() => {
    if (!snapshot) return [];
    return buildThreads(snapshot.messages, snapshot.contacts);
  }, [snapshot]);

  const selectedThread =
    threads.find((thread) => thread.threadId === selectedThreadId) ??
    threads[0];

  const handleSend = async () => {
    if (!selectedThread) return;
    if (!reply.trim() && !useAgent) {
      toast({
        title: "Message empty",
        description: "Compose a reply or enable AI drafting."
      });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            channel: selectedThread.channel,
            contactId: selectedThread.contact.id,
            threadId: selectedThread.threadId,
            body: useAgent ? undefined : reply,
            useAgent
          })
        });

        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.error ?? "Failed to send message");
        }

        const payload = (await response.json()) as {
          message: Message;
          suggestedTasks: string[];
          rationale?: string;
        };

        setReply("");
        toast({
          title: "Reply sent",
          description: useAgent
            ? "AI drafted and delivered the response."
            : "Your message reached the contact."
        });

        if (payload.suggestedTasks?.length) {
          toast({
            title: "AI follow-up tasks",
            description: payload.suggestedTasks.join(" • ")
          });
        }

        await mutate();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unexpected error occurred";
        toast({
          title: "Unable to send",
          description: message
        });
      }
    });
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-rose-600/40 bg-rose-900/20 p-6">
          <p className="text-sm font-medium text-white">
            Failed to load dashboard data.
          </p>
          <p className="mt-2 text-xs text-rose-200/80">
            {error.message ?? "Check your network connection and retry."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <Header metrics={metrics} isLoading={isLoading} />
      <div className="grid h-full flex-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="flex h-full min-h-0 flex-col gap-4 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
          <ConversationHeader
            threads={threads}
            selectedThreadId={selectedThread?.threadId ?? null}
            onSelect={setSelectedThreadId}
          />
          {selectedThread ? (
            <ConversationPane
              thread={selectedThread}
              reply={reply}
              onReplyChange={setReply}
              useAgent={useAgent}
              onUseAgentChange={setUseAgent}
              onSend={handleSend}
              pending={isPending}
            />
          ) : (
            <EmptyState />
          )}
        </section>
        <section className="flex h-full min-h-0 flex-col gap-4">
          <CallsCard calls={snapshot?.calls ?? []} />
          <PipelineCard deals={snapshot?.deals ?? []} />
          <TasksCard tasks={snapshot?.tasks ?? []} mutate={mutate} />
        </section>
      </div>
    </div>
  );
}

function Header({
  metrics,
  isLoading
}: {
  metrics?:
    | {
        openConversations: number;
        avgFirstResponseMinutes: number;
        sentimentBreakdown: Record<
          "positive" | "neutral" | "negative",
          number
        >;
        tasksDueSoon: Task[];
      }
    | undefined;
  isLoading: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatTile
        label="Open conversations"
        value={metrics?.openConversations ?? (isLoading ? "…" : "0")}
      />
      <StatTile
        label="Avg first response"
        value={
          metrics
            ? `${metrics.avgFirstResponseMinutes} min`
            : isLoading
              ? "…"
              : "0 min"
        }
      />
      <StatTile
        label="Positive sentiment"
        value={
          metrics
            ? `${metrics.sentimentBreakdown.positive} threads`
            : isLoading
              ? "…"
              : "0 threads"
        }
      />
      <StatTile
        label="Tasks due soon"
        value={metrics?.tasksDueSoon.length ?? 0}
      />
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function ConversationHeader({
  threads,
  selectedThreadId,
  onSelect
}: {
  threads: ReturnType<typeof buildThreads>;
  selectedThreadId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-white">
          Omni-channel inbox
        </h1>
        <p className="text-xs text-slate-400">
          Unified view across website chat, Instagram DMs, Facebook, and
          Messenger.
        </p>
      </div>
      <div className="hidden gap-2 lg:flex">
        <input
          className="rounded-lg border border-slate-800/70 bg-slate-950/40 px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          placeholder="Search contacts or threads"
          disabled
        />
        <button className="rounded-lg border border-slate-800/70 px-3 py-2 text-xs text-slate-400 transition hover:border-brand-500/60 hover:text-white">
          Filter
        </button>
      </div>
      <select
        className="rounded-lg border border-slate-800/70 bg-slate-950/40 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 lg:hidden"
        value={selectedThreadId ?? threads[0]?.threadId ?? ""}
        onChange={(event) => onSelect(event.target.value)}
      >
        {threads.map((thread) => (
          <option key={thread.threadId} value={thread.threadId}>
            {thread.contact.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function ConversationPane({
  thread,
  reply,
  onReplyChange,
  useAgent,
  onUseAgentChange,
  onSend,
  pending
}: {
  thread: ReturnType<typeof buildThreads>[number];
  reply: string;
  onReplyChange: (value: string) => void;
  useAgent: boolean;
  onUseAgentChange: (value: boolean) => void;
  onSend: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-800/50 bg-slate-950/50">
      <div className="flex items-center justify-between border-b border-slate-800/60 p-4">
        <div>
          <p className="text-sm font-semibold text-white">
            {thread.contact.name}
          </p>
          <p className="text-xs text-slate-500">
            @{thread.contact.handle} • {thread.channel}
          </p>
        </div>
        <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-200">
          {thread.status}
        </span>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {thread.messages.map((message) => (
          <article
            key={message.id}
            className={clsx("flex max-w-[80%] flex-col gap-1", {
              "ml-auto items-end": message.direction === "outbound"
            })}
          >
            <div
              className={clsx(
                "rounded-2xl px-4 py-3 text-sm leading-relaxed backdrop-blur",
                message.direction === "outbound"
                  ? "bg-brand-500/90 text-white"
                  : "bg-slate-900/80 text-slate-100"
              )}
            >
              {message.body}
            </div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              {formatDistanceToNow(parseISO(message.createdAt), {
                addSuffix: true
              })}
            </p>
          </article>
        ))}
      </div>
      <div className="border-t border-slate-800/60 bg-slate-950/80 p-4">
        <div className="flex items-center justify-between pb-2">
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={useAgent}
              onChange={(event) => onUseAgentChange(event.target.checked)}
              className="h-4 w-4 rounded border border-slate-700 bg-slate-900 text-brand-500 focus:ring-brand-400"
            />
            Let Nova draft the reply
          </label>
          <span className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-brand-200">
            <SparklesIcon className="h-4 w-4" />
            AI Assist
          </span>
        </div>
        {!useAgent ? (
          <textarea
            className="h-24 w-full rounded-xl border border-slate-800/60 bg-slate-900/60 px-3 py-2 text-sm text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            placeholder="Write a personalized reply…"
            value={reply}
            onChange={(event) => onReplyChange(event.target.value)}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-brand-500/40 bg-brand-500/10 p-4 text-xs text-brand-100">
            Nova will summarize the conversation, draft a tailored reply, and
            suggest follow-up tasks for humans if needed.
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-600">
            <BoltIcon className="h-4 w-4" />
            Smart routing enabled
          </div>
          <button
            onClick={onSend}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            <SparklesIcon className="h-4 w-4" />
            {pending ? "Sending…" : useAgent ? "Auto-send" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-700/80 bg-slate-900/40">
      <ChatBubbleOvalLeftIcon className="h-10 w-10 text-slate-700" />
      <p className="text-sm text-slate-400">Select a thread to get started.</p>
    </div>
  );
}

function CallsCard({ calls }: { calls: CallLog[] }) {
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Call intelligence</h2>
        <span className="text-[11px] uppercase tracking-wide text-emerald-300">
          Synced
        </span>
      </div>
      <div className="flex flex-col gap-3 overflow-y-auto">
        {calls.map((call) => (
          <div
            key={call.id}
            className="rounded-xl border border-slate-800/50 bg-slate-950/40 p-3"
          >
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <PhoneIcon className="h-4 w-4" />
              {formatDistanceToNow(parseISO(call.recordedAt), {
                addSuffix: true
              })}
              <span>•</span>
              {Math.round(call.durationSeconds / 60)} min
            </div>
            <p className="mt-2 text-sm text-white">{call.summary}</p>
            <ul className="mt-2 space-y-1 text-xs text-slate-400">
              {call.followUps.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
        ))}
        {calls.length === 0 ? (
          <p className="text-xs text-slate-500">
            No call summaries yet. Connect your telephony provider to ingest
            recordings.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function PipelineCard({ deals }: { deals: Deal[] }) {
  const stages: Deal["stage"][] = [
    "lead",
    "qualified",
    "demo",
    "proposal",
    "negotiation",
    "won"
  ];

  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Pipeline momentum</h2>
        <span className="text-[11px] uppercase tracking-wide text-slate-500">
          Weighted: $
          {deals
            .reduce((acc, deal) => acc + deal.value * deal.probability, 0)
            .toLocaleString()}
        </span>
      </div>
      <div className="mt-4 grid gap-4">
        {stages.map((stage) => {
          const stageDeals = deals.filter((deal) => deal.stage === stage);
          return (
            <div key={stage} className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="uppercase tracking-wide">
                  {stage.toUpperCase()}
                </span>
                <span>{stageDeals.length} active</span>
              </div>
              <div className="space-y-2">
                {stageDeals.slice(0, 2).map((deal) => (
                  <div
                    key={deal.id}
                    className="rounded-xl border border-slate-800/40 bg-slate-950/50 p-3 text-xs text-slate-300"
                  >
                    <p className="text-sm font-medium text-white">
                      {deal.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      ${deal.value.toLocaleString()} • {Math.round(deal.probability * 100)}% win
                    </p>
                    {deal.nextStep ? (
                      <p className="mt-2 rounded-md bg-slate-900/70 px-2 py-1 text-xs text-brand-200">
                        Next: {deal.nextStep}
                      </p>
                    ) : null}
                  </div>
                ))}
                {stageDeals.length > 2 ? (
                  <p className="text-[11px] text-slate-500">
                    +{stageDeals.length - 2} more in stage
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TasksCard({
  tasks,
  mutate
}: {
  tasks: Task[];
  mutate: () => Promise<unknown>;
}) {
  const [completing, setCompleting] = useState<string | null>(null);

  const openTasks = tasks.filter((task) => task.status !== "completed");

  const complete = async (taskId: string) => {
    setCompleting(taskId);
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: taskId })
      });
      if (!response.ok) {
        throw new Error("Failed to complete task");
      }
      toast({
        title: "Task completed",
        description: "Marked as done and synced to workspace."
      });
      await mutate();
    } catch (error) {
      toast({
        title: "Unable to update task",
        description:
          error instanceof Error ? error.message : "Unexpected error occurred"
      });
    } finally {
      setCompleting(null);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Follow-up tasks</h2>
        <button className="rounded-lg border border-slate-800/70 px-2 py-1 text-[11px] uppercase tracking-wide text-slate-400 hover:border-brand-500/60 hover:text-white">
          New task
        </button>
      </div>
      <div className="space-y-2 overflow-y-auto">
        {openTasks.map((task) => (
          <div
            key={task.id}
            className="rounded-xl border border-slate-800/40 bg-slate-950/50 p-3"
          >
            <p className="text-sm font-medium text-white">{task.description}</p>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>{task.priority.toUpperCase()}</span>
              {task.dueAt ? (
                <span>
                  Due{" "}
                  {formatDistanceToNow(parseISO(task.dueAt), {
                    addSuffix: true
                  })}
                </span>
              ) : null}
            </div>
            <button
              onClick={() => complete(task.id)}
              disabled={completing === task.id}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-brand-500/40 px-3 py-1 text-xs font-medium text-brand-100 hover:bg-brand-500/10 disabled:cursor-wait disabled:opacity-60"
            >
              {completing === task.id ? "Completing…" : "Mark complete"}
            </button>
          </div>
        ))}
        {openTasks.length === 0 ? (
          <p className="text-xs text-slate-500">
            No open tasks. Relax — the pipeline is under control.
          </p>
        ) : null}
      </div>
    </div>
  );
}
