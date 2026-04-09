"use client";

import { Avatar, AvatarFallback } from "@/components/primitives/avatar";

export function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <Avatar className="h-7 w-7 shrink-0 mt-0.5">
        <AvatarFallback className="text-[10px] bg-violet-100 text-violet-600 font-medium">
          AI
        </AvatarFallback>
      </Avatar>
      <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-5">
          <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
          <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:150ms]" />
          <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
