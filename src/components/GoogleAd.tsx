"use client";
import { useEffect, useRef } from "react";

interface GoogleAdProps {
  slotId: string;
  format?: "auto" | "fluid" | "rectangle" | "vertical";
  className?: string;
  style?: React.CSSProperties;
}

export function GoogleAd({ slotId, format = "auto", className = "", style }: GoogleAdProps) {
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    // Check if window.adsbygoogle is available and the element is ready
    if (typeof window !== "undefined" && insRef.current) {
      try {
        // Only push if the element hasn't been processed by AdSense yet
        if (!insRef.current.hasAttribute("data-adsbygoogle-status")) {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (err) {
        console.error("AdSense injection failed:", err);
      }
    }
  }, [slotId]); // Re-run if slotId changes

  const client = process.env.NEXT_PUBLIC_GOOGLE_ADS_CLIENT || "ca-pub-6130818380087432";

  return (
    <div className={`flex justify-center w-full py-4 ${className}`} style={{ minHeight: style?.minHeight || '250px' }}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ 
          display: "block", 
          width: "100%",
          ...style 
        }}
        data-ad-client={client}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
