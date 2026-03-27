"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocationBadgeProps {
  toolName: string;
  state: string;
  args: Record<string, unknown>;
  result?: unknown;
}

type StrReplaceCommand = "view" | "create" | "str_replace" | "insert" | "undo_edit";

const STR_REPLACE_LABELS: Record<StrReplaceCommand, { pending: string; done: string }> = {
  create:      { pending: "Creating",  done: "Created"  },
  str_replace: { pending: "Editing",   done: "Edited"   },
  insert:      { pending: "Editing",   done: "Edited"   },
  view:        { pending: "Reading",   done: "Read"     },
  undo_edit:   { pending: "Reverting", done: "Reverted" },
};

function getFilename(path: unknown): string {
  if (typeof path !== "string" || !path) return "file";
  return path.split("/").pop() || path;
}

function getLabel(toolName: string, args: Record<string, unknown>, isDone: boolean): string {
  if (toolName === "str_replace_editor") {
    const filename = getFilename(args.path);
    const entry = STR_REPLACE_LABELS[args.command as StrReplaceCommand];
    const verb = entry ? (isDone ? entry.done : entry.pending) : (isDone ? "Processed" : "Processing");
    return `${verb} ${filename}`;
  }
  return toolName;
}

export function ToolInvocationBadge({ toolName, state, args, result }: ToolInvocationBadgeProps) {
  const isDone = state === "result" && result != null;
  const label = getLabel(toolName, args, isDone);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
