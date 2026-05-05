import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/apiClient";
import { useGetScratchpad } from "@/api/cachedQueries";

const AUTOSAVE_INTERVAL_MS = 10_000;
const MAX_CONSECUTIVE_FAILURES = 3;

export default function ScratchpadPage() {
  const { data, isLoading } = useGetScratchpad();
  const queryClient = useQueryClient();

  const [text, setText] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving" | "error">("saved");
  const pendingRef = useRef(false);
  const textRef = useRef(text);
  const failCountRef = useRef(0);
  const blockedRef = useRef(false);

  useEffect(() => {
    if (data?.content !== undefined) {
      setText(data.content);
    }
  }, [data?.content]);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  const save = async () => {
    if (!pendingRef.current || blockedRef.current) return;
    setSaveStatus("saving");
    try {
      await apiClient.post("/api/scratchpad", { content: textRef.current });
      pendingRef.current = false;
      failCountRef.current = 0;
      setSaveStatus("saved");
      queryClient.setQueryData(["/api/scratchpad"], (old: { content: string } | undefined) =>
        old ? { ...old, content: textRef.current } : old,
      );
    } catch {
      failCountRef.current++;
      if (failCountRef.current >= MAX_CONSECUTIVE_FAILURES) {
        blockedRef.current = true;
        setSaveStatus("error");
      } else {
        setSaveStatus("unsaved");
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(save, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    pendingRef.current = true;
    if (blockedRef.current) {
      blockedRef.current = false;
      failCountRef.current = 0;
    }
    setSaveStatus("unsaved");
  };

  if (isLoading) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Scratchpad</h1>
        <span className={`text-xs ${saveStatus === "error" ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500"}`}>
          {saveStatus === "saving" && "Saving…"}
          {saveStatus === "saved" && "Saved"}
          {saveStatus === "unsaved" && "Unsaved changes"}
          {saveStatus === "error" && "Save failed — changes not saved"}
        </span>
      </div>
      <textarea
        className="w-full h-[70vh] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-sm text-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700"
        placeholder="Write anything…"
        value={text}
        onChange={handleChange}
      />
    </div>
  );
}
