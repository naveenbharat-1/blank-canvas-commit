import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MahimaGhostPlayer } from "@/components/video";
import nbLogo from "@/assets/branding/logo_icon_web.png";
import birdLogo from "@/assets/branding/nb-bird-circle.png";
import { useOrientation } from "@/hooks/useOrientation";

const DriveEmbedViewer = lazy(() => import("@/components/course/DriveEmbedViewer"));

interface UnifiedVideoPlayerProps {
  url: string;
  title?: string;
  lessonId?: string;
  onEnded?: () => void;
  onReady?: () => void;
  onProgress?: (state: { played: number; playedSeconds: number }) => void;
  onNextVideo?: () => void;
  nextVideoTitle?: string;
}

type Platform = "youtube" | "drive" | "docs" | "vimeo" | "archive" | "direct" | "unknown";

const detectPlatform = (url: string): Platform => {
  if (!url) return "unknown";
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/docs\.google\.com\/document/.test(url)) return "docs";
  if (/drive\.google\.com/.test(url)) return "drive";
  if (/vimeo\.com/.test(url)) return "vimeo";
  if (/archive\.org/.test(url)) return "archive";
  if (/\.(mp4|webm|ogg)($|\?)/i.test(url)) return "direct";
  if (/\.pdf($|\?)/i.test(url)) return "drive";
  return "unknown";
};

/** Extract YouTube video ID including /live/ URLs */
const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

/** Check if an Archive.org URL is likely a document (not video) */
const isArchiveDocument = (url: string): boolean => {
  // If URL explicitly references a video format, treat as video
  if (/\.(mp4|webm|ogv)($|\?)/i.test(url)) return false;
  // Book/text patterns
  if (/\/details\/[^/]*(?:book|text|pdf|doc)/i.test(url)) return true;
  // Default: treat archive as document (embed viewer handles both)
  return true;
};

const getVimeoId = (url: string) => url.match(/vimeo\.com\/(\d+)/)?.[1] || "";

const UnifiedVideoPlayer = ({ url, title, lessonId, onEnded, onReady, onProgress, onNextVideo, nextVideoTitle }: UnifiedVideoPlayerProps) => {
  const platform = detectPlatform(url);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTimeUpdate = useCallback((currentTime: number, duration: number) => {
    if (!onProgress || !duration) return;
    onProgress({ played: currentTime / duration, playedSeconds: currentTime });
  }, [onProgress]);

  // YouTube — delegate to MahimaGhostPlayer
  if (platform === "youtube") {
    return (
      <MahimaGhostPlayer
        videoUrl={url}
        title={title}
        lessonId={lessonId}
        onEnded={onEnded}
        onReady={onReady}
        onTimeUpdate={handleTimeUpdate}
        onNextVideo={onNextVideo}
        nextVideoTitle={nextVideoTitle}
      />
    );
  }

  // Drive / PDF / Docs — use DriveEmbedViewer
  if (platform === "drive" || platform === "docs") {
    return (
      <Suspense fallback={<Skeleton className="aspect-[4/3] w-full" />}>
        <DriveEmbedViewer url={url} title={title || "Document"} />
      </Suspense>
    );
  }

  // Archive.org — route documents to DriveEmbedViewer, videos to iframe
  if (platform === "archive") {
    if (isArchiveDocument(url)) {
      return (
        <Suspense fallback={<Skeleton className="aspect-[4/3] w-full" />}>
          <DriveEmbedViewer url={url} title={title || "Document"} />
        </Suspense>
      );
    }

    const embedUrl = url.replace("/details/", "/embed/");
    return (
      <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden" ref={containerRef}>
        <iframe
          src={embedUrl}
          className="w-full h-full border-0"
          allowFullScreen
          title={title || "Archive.org Video"}
        />
        <BrandingOverlay />
      </div>
    );
  }

  // Vimeo
  if (platform === "vimeo") {
    return (
      <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden" ref={containerRef}>
        <iframe
          src={`https://player.vimeo.com/video/${getVimeoId(url)}?title=0&byline=0&portrait=0&badge=0&dnt=1`}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title={title || "Vimeo Video"}
        />
        <BrandingOverlay />
      </div>
    );
  }

  // Direct video
  if (platform === "direct") {
    return (
      <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden">
        <video
          src={url}
          controls
          controlsList="nodownload"
          className="w-full h-full"
          onContextMenu={(e) => e.preventDefault()}
          onEnded={onEnded}
          onCanPlay={() => onReady?.()}
        >
          Your browser does not support video.
        </video>
        <BrandingOverlay />
      </div>
    );
  }

  // Fallback
  return (
    <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden flex items-center justify-center">
      <p className="text-white/50">Unsupported video format</p>
    </div>
  );
};

const BrandingOverlay = () => {
  const isPortrait = useOrientation();
  return (
    <>
      {/* Bird logo — covers YouTube infinity symbol (bottom-left) */}
      <img
        src={birdLogo}
        alt=""
        className={`absolute z-[50] rounded-full pointer-events-none select-none ${
          isPortrait ? 'bottom-[6px] left-[6px] h-11 w-11' : 'bottom-[8px] left-[8px] h-[50px] w-[50px]'
        }`}
        draggable={false}
      />
      {/* Naveen Bharat branding — covers YouTube white label (bottom-right) */}
      <div
        className={`absolute z-[50] pointer-events-none select-none flex items-center rounded-full ${
          isPortrait ? 'bottom-[6px] right-[6px] gap-1 px-2 py-0.5' : 'bottom-[8px] right-[8px] gap-1.5 px-3 py-1'
        }`}
        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(6px)' }}
      >
        <img src={nbLogo} alt="" className={isPortrait ? 'h-5 w-5 rounded' : 'h-6 w-6 rounded'} draggable={false} />
        <span className={`text-black font-bold tracking-wide whitespace-nowrap ${
          isPortrait ? 'text-[11px]' : 'text-sm'
        }`}>Naveen Bharat</span>
      </div>
    </>
  );
};

export default UnifiedVideoPlayer;
