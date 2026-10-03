"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Pause, Play } from "lucide-react";

type HeroVideoProps = {
  src?: string;
  poster?: string;
  posterAlt: string;
};

/** A decorative background video that never starts until the browser allows motion. */
export default function HeroVideo({
  src = "/hero-solar.mp4",
  poster = "/hero-solar-poster.jpg",
  posterAlt,
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mounted, setMounted] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setMounted(true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    if (!reduce.matches && !saveData) setShowVideo(true);

    const onMotionPreferenceChange = () => {
      if (reduce.matches) {
        videoRef.current?.pause();
        setPlaying(false);
        setStarted(false);
        setShowVideo(false);
      }
    };
    reduce.addEventListener?.("change", onMotionPreferenceChange);
    return () => reduce.removeEventListener?.("change", onMotionPreferenceChange);
  }, []);

  useEffect(() => {
    if (!mounted || !showVideo || failed) return;
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {
      setPlaying(false);
      setAutoplayBlocked(true);
    });
  }, [failed, mounted, showVideo]);

  const togglePlayback = () => {
    if (failed) return;
    const video = videoRef.current;
    if (!video) {
      setShowVideo(true);
      return;
    }
    if (video.paused) {
      video.play().then(() => setAutoplayBlocked(false)).catch(() => setAutoplayBlocked(true));
    } else {
      video.pause();
    }
  };

  const showPoster = !mounted || !showVideo || failed || autoplayBlocked || !started;

  return (
    <div className="hero-video absolute inset-0">
      {mounted && showVideo && !failed && (
        <video
          ref={videoRef}
          className="absolute inset-0 z-0 h-full w-full object-cover object-[center_52%]"
          src={src}
          muted
          loop
          playsInline
          autoPlay={showVideo}
          preload="none"
          aria-hidden="true"
          onPlay={() => {
            setStarted(true);
            setPlaying(true);
            setAutoplayBlocked(false);
          }}
          onPause={() => setPlaying(false)}
          onError={() => {
            setFailed(true);
            setPlaying(false);
          }}
        />
      )}
      {showPoster && (
        <Image
          src={poster}
          alt={posterAlt}
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 z-0 object-cover object-[center_52%]"
        />
      )}
      {mounted && !failed && (
        <button
          type="button"
          className="absolute bottom-4 left-4 z-40 inline-flex min-h-9 items-center gap-2 border border-white bg-black/55 px-3 text-xs font-semibold text-white hover:bg-black/75 sm:bottom-6 sm:left-6"
          onClick={togglePlayback}
          aria-label={playing ? "Pause background video" : "Play background video"}
          aria-pressed={playing}
        >
          {playing ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
          {playing ? "Pause" : "Play"}
        </button>
      )}
    </div>
  );
}
