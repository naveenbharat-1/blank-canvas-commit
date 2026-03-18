import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Loader2, ChevronDown, ChevronUp, Copy, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface VideoSummarizerProps {
  videoUrl?: string;
  lessonTitle?: string;
  lessonId?: string;
}

const VideoSummarizer = ({ videoUrl, lessonTitle, lessonId }: VideoSummarizerProps) => {
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  // Check localStorage cache
  const cacheKey = lessonId ? `nb_summary_${lessonId}` : null;

  const getCachedSummary = () => {
    if (!cacheKey) return null;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) return cached;
    } catch {}
    return null;
  };

  // Load cached on first render
  useState(() => {
    const cached = getCachedSummary();
    if (cached) setSummary(cached);
  });

  const generateSummary = async () => {
    if (!videoUrl && !lessonTitle) {
      toast.error("No video selected");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("summarize-video", {
        body: {
          videoUrl,
          lessonTitle,
          lessonId,
        },
      });

      if (error) throw error;

      const result = data?.summary || "Could not generate summary.";
      setSummary(result);
      if (cacheKey) {
        try { localStorage.setItem(cacheKey, result); } catch {}
      }
    } catch (err: any) {
      console.error("Summary error:", err);
      toast.error("Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  const copySummary = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success("Summary copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/15 hover:to-accent/15 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">AI Video Summarizer</p>
            <p className="text-[10px] text-muted-foreground">Powered by Naveen Sarthi</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="p-4 space-y-3">
          {!summary && !loading && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">
                Get AI-powered summary of this lecture's key topics and concepts
              </p>
              <Button onClick={generateSummary} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate Summary
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing lecture content...</p>
            </div>
          )}

          {summary && !loading && (
            <>
              <ScrollArea className="max-h-[300px]">
                <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                  <ReactMarkdown>{summary}</ReactMarkdown>
                </div>
              </ScrollArea>
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={copySummary}>
                  {copied ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={generateSummary}>
                  <Sparkles className="h-3 w-3" />
                  Regenerate
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoSummarizer;
