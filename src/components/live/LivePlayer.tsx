import { useState, useCallback } from "react";
import { RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import appLogo from "@/assets/branding/logo_icon_web.png";
import birdLogo from "@/assets/branding/nb-bird-circle.png";
import { useOrientation } from "@/hooks/useOrientation";

interface LivePlayerProps {
  youtubeId: string;
  title: string;
}

const LivePlayer = ({ youtubeId, title }: LivePlayerProps) => {
  const [iframeKey, setIframeKey] = useState(0);
  const [showFallback, setShowFallback] = useState(false);
  const isPortrait = useOrientation();

  const handleReload = useCallback(() => {
    setShowFallback(false);
    setIframeKey(k => k + 1);
  }, []);

  // Show fallback after 15s if user suspects stream isn't loading
  const handleIframeError = useCallback(() => {
    setShowFallback(true);
  }, []);

  return (
    <div className="relative w-full bg-black rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
      <iframe
        key={iframeKey}
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&iv_load_policy=3`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
        style={{ border: "none" }}
        onError={handleIframeError}
      />

      {/* Retry / fallback overlay */}
      {showFallback && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 gap-3">
          <p className="text-white/80 text-sm">Stream not loading?</p>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" className="gap-1.5" onClick={handleReload}>
              <RefreshCw className="h-4 w-4" /> Reload
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-white border-white/30" asChild>
              <a href={`https://www.youtube.com/watch?v=${youtubeId}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> Watch on YouTube
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Bird logo — covers YouTube infinity symbol (bottom-left) */}
      <img
        src={birdLogo}
        alt=""
        className={`absolute z-[50] rounded-full pointer-events-none select-none ${
          isPortrait ? 'bottom-[6px] left-[6px] h-11 w-11' : 'bottom-[8px] left-[8px] h-12 w-12'
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
        <img src={appLogo} alt="" className={isPortrait ? 'h-5 w-5 rounded' : 'h-6 w-6 rounded'} draggable={false} />
        <span className={`text-black font-bold tracking-wide whitespace-nowrap ${
          isPortrait ? 'text-[11px]' : 'text-sm'
        }`}>Naveen Bharat</span>
      </div>

      {/* Reload button — always accessible in corner */}
      <button
        onClick={handleReload}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white/70 hover:text-white transition-colors"
        title="Reload stream"
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default LivePlayer;
