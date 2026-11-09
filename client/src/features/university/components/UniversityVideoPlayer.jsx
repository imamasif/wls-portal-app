// client/src/features/university/components/UniversityVideoPlayer.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Box, Text, Group, Badge, Button, Center, Loader, Alert } from "@mantine/core";
import { IconAlertCircle, IconExternalLink, IconPlayerPlay, IconCircleCheck } from "@tabler/icons-react";

/**
 * Extracts standard 11-character YouTube video ID from various URL formats
 */
export function getYouTubeVideoId(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/i
  );
  return match ? match[1] : null;
}

export function UniversityVideoPlayer({
  videoUrl,
  isMandatory = true,
  isCompleted = false,
  initialPosition = 0,
  onProgress,
  onEnded,
  onDuration,
  onCheatDetected,
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const timerRef = useRef(null);

  const [isApiReady, setIsApiReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPosition || 0);
  const [duration, setDuration] = useState(0);
  const [maxWatched, setMaxWatched] = useState(initialPosition || 0);
  const [playerError, setPlayerError] = useState(null);

  const youtubeId = getYouTubeVideoId(videoUrl);

  // Update maxWatched when initialPosition or isCompleted changes
  useEffect(() => {
    if (initialPosition > maxWatched) {
      setMaxWatched(initialPosition);
    }
    setCurrentTime(initialPosition || 0);
  }, [initialPosition]);

  // Reset maxWatched when videoUrl changes
  useEffect(() => {
    setMaxWatched(initialPosition || 0);
    setCurrentTime(initialPosition || 0);
    setPlayerError(null);
  }, [videoUrl]);

  // 1. Ensure YouTube IFrame API script is loaded into the page
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
      return;
    }

    // Check if script tag is already injected
    const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
    }

    const previousOnReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousOnReady === "function") previousOnReady();
      setIsApiReady(true);
    };

    // Fallback timer check in case API ready fired before handler attached
    const interval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        setIsApiReady(true);
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // 2. Initialize or Update YouTube Player when youtubeId or API is ready
  useEffect(() => {
    if (!youtubeId || !isApiReady || !containerRef.current) return;

    let destroyed = false;

    // Unique DOM ID for the player container
    const playerId = `yt-player-${Math.random().toString(36).substring(2, 9)}`;
    const targetElement = document.createElement("div");
    targetElement.id = playerId;
    targetElement.style.width = "100%";
    targetElement.style.height = "100%";
    
    // Clear previous children
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(targetElement);

    try {
      playerRef.current = new window.YT.Player(playerId, {
        videoId: youtubeId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (destroyed) return;
            const dur = event.target.getDuration();
            if (dur && Number.isFinite(dur)) {
              setDuration(dur);
              onDuration?.(dur);
            }
            if (initialPosition > 0) {
              event.target.seekTo(initialPosition, true);
            }
          },
          onStateChange: (event) => {
            if (destroyed) return;
            // 1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              onEnded?.();
            }
          },
          onError: (event) => {
            console.warn("YouTube Player error:", event.data);
            setPlayerError(`YouTube player error code ${event.data}`);
          },
        },
      });
    } catch (err) {
      console.error("Failed to initialize YouTube Player:", err);
      setPlayerError(err.message);
    }

    return () => {
      destroyed = true;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        try {
          playerRef.current.destroy();
        } catch (_) {}
      }
    };
  }, [youtubeId, isApiReady]);

  // 3. Heartbeat & Anti-Cheat Scrubbing Monitor
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== "function") {
        return;
      }

      try {
        const curSec = playerRef.current.getCurrentTime() || 0;
        const totalSec = playerRef.current.getDuration() || duration;

        if (totalSec > 0 && totalSec !== duration) {
          setDuration(totalSec);
          onDuration?.(totalSec);
        }

        // Anti-Cheat scrub locking:
        // If lecture is mandatory and NOT yet completed:
        // Prevent skipping ahead of maxWatchedSeconds + 3s buffer
        if (isMandatory && !isCompleted) {
          if (curSec > maxWatched + 3) {
            playerRef.current.seekTo(maxWatched, true);
            onCheatDetected?.(
              "⚠️ Fast-forwarding is restricted on mandatory lectures. Please watch the video end-to-end to complete this module."
            );
            return;
          }
        }

        // Advance maxWatched forward as video naturally plays
        if (curSec > maxWatched) {
          setMaxWatched(curSec);
        }

        setCurrentTime(curSec);
        onProgress?.({ playedSeconds: curSec, totalSeconds: totalSec });
      } catch (e) {
        console.warn("Error reading playback state", e);
      }
    }, 500);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, maxWatched, isMandatory, isCompleted, duration, onProgress, onDuration, onCheatDetected]);

  // Direct HTML5 Video Player for non-YouTube video files (e.g. mp4, webm)
  const handleHtmlVideoTimeUpdate = (e) => {
    const curSec = e.target.currentTime;
    const totalSec = e.target.duration;

    if (isMandatory && !isCompleted && curSec > maxWatched + 3) {
      e.target.currentTime = maxWatched;
      onCheatDetected?.(
        "⚠️ Fast-forwarding is restricted on mandatory lectures. Please watch end-to-end."
      );
      return;
    }

    if (curSec > maxWatched) {
      setMaxWatched(curSec);
    }
    setCurrentTime(curSec);
    onProgress?.({ playedSeconds: curSec, totalSeconds: totalSec });
  };

  const formatSecs = (s) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <Box>
      {/* Video Viewport Container */}
      <Box
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "56.25%", // 16:9 Aspect Ratio
          backgroundColor: "#000000",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
        }}
      >
        {youtubeId ? (
          <Box
            ref={containerRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
          />
        ) : videoUrl ? (
          <video
            src={videoUrl}
            controls
            playsInline
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
            onTimeUpdate={handleHtmlVideoTimeUpdate}
            onEnded={onEnded}
            onLoadedMetadata={(e) => {
              const dur = e.target.duration;
              setDuration(dur);
              onDuration?.(dur);
              if (initialPosition > 0) e.target.currentTime = initialPosition;
            }}
          />
        ) : (
          <Center
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              color: "#94a3b8",
            }}
          >
            <Text size="sm">No video stream URL assigned to this lecture.</Text>
          </Center>
        )}
      </Box>

      {/* Video Status & Direct Links Bar */}
      <Group justify="space-between" mt="xs" px="xs" wrap="wrap">
        <Group gap="xs">
          <Badge
            color={isCompleted ? "teal" : isMandatory ? "orange" : "gray"}
            variant="light"
            size="sm"
          >
            {isCompleted
              ? "Completed (Free Replay)"
              : isMandatory
              ? "Mandatory Tracking Active"
              : "Optional Lecture"}
          </Badge>
          {duration > 0 && (
            <Text size="xs" c="dimmed">
              {formatSecs(currentTime)} / {formatSecs(duration)}
            </Text>
          )}
        </Group>

        {videoUrl && (
          <Button
            component="a"
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="subtle"
            color="gray"
            size="xs"
            leftSection={<IconExternalLink size={14} />}
          >
            Open in YouTube
          </Button>
        )}
      </Group>

      {playerError && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="orange"
          mt="xs"
          title="Video Playback Note"
        >
          {playerError}. You can also watch directly using the "Open in YouTube" button above.
        </Alert>
      )}
    </Box>
  );
}

export default UniversityVideoPlayer;
