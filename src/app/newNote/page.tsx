"use client";

import { Textarea } from "@/components/ui/textarea";

export default function NewNote() {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <Textarea
        placeholder="Type your message here."
        className="min-h-[100px]"
      />
    </div>
  );
}
