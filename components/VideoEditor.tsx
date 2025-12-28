"use client";

import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Download,
  Upload,
  Type,
  Sparkles,
  Scissors,
  Volume2,
  VolumeX,
  RotateCcw,
  Image as ImageIcon,
  Crop,
} from "lucide-react";

interface VideoClip {
  id: string;
  file: File;
  url: string;
  startTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  startTime: number;
  endTime: number;
}

export default function VideoEditor() {
  const [videoClips, setVideoClips] = useState<VideoClip[]>([]);
  const [currentClip, setCurrentClip] = useState<VideoClip | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [showTextInput, setShowTextInput] = useState(false);
  const [newText, setNewText] = useState("");
  const [exportFormat, setExportFormat] = useState<"story" | "reel" | "post">("reel");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filters = [
    { name: "none", label: "Original" },
    { name: "grayscale", label: "Grayscale" },
    { name: "sepia", label: "Sepia" },
    { name: "vintage", label: "Vintage" },
    { name: "cold", label: "Cold" },
    { name: "warm", label: "Warm" },
  ];

  const aspectRatios = {
    story: { width: 1080, height: 1920, label: "Story (9:16)" },
    reel: { width: 1080, height: 1920, label: "Reel (9:16)" },
    post: { width: 1080, height: 1080, label: "Post (1:1)" },
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      if (video.currentTime >= video.duration) {
        setIsPlaying(false);
      }
    };

    const updateDuration = () => {
      setDuration(video.duration);
    };

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateDuration);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateDuration);
    };
  }, [currentClip]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("video/")) {
        const url = URL.createObjectURL(file);
        const video = document.createElement("video");
        video.src = url;
        video.onloadedmetadata = () => {
          const clip: VideoClip = {
            id: Date.now().toString() + Math.random(),
            file,
            url,
            startTime: 0,
            duration: video.duration,
            trimStart: 0,
            trimEnd: video.duration,
          };
          setVideoClips((prev) => [...prev, clip]);
          if (!currentClip) {
            setCurrentClip(clip);
          }
        };
      }
    });
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const addTextOverlay = () => {
    if (!newText.trim()) return;

    const overlay: TextOverlay = {
      id: Date.now().toString(),
      text: newText,
      x: 50,
      y: 50,
      fontSize: 48,
      color: "#ffffff",
      fontFamily: "Arial",
      startTime: currentTime,
      endTime: currentTime + 5,
    };

    setTextOverlays((prev) => [...prev, overlay]);
    setNewText("");
    setShowTextInput(false);
  };

  const removeTextOverlay = (id: string) => {
    setTextOverlays((prev) => prev.filter((overlay) => overlay.id !== id));
  };

  const applyFilter = (filterName: string) => {
    setSelectedFilter(filterName);
  };

  const getFilterStyle = () => {
    let filterStr = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

    switch (selectedFilter) {
      case "grayscale":
        filterStr += " grayscale(100%)";
        break;
      case "sepia":
        filterStr += " sepia(100%)";
        break;
      case "vintage":
        filterStr += " sepia(50%) contrast(110%)";
        break;
      case "cold":
        filterStr += " hue-rotate(180deg)";
        break;
      case "warm":
        filterStr += " hue-rotate(-20deg) saturate(120%)";
        break;
    }

    return filterStr;
  };

  const resetEffects = () => {
    setSelectedFilter("none");
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  const handleExport = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ratio = aspectRatios[exportFormat];
    canvas.width = ratio.width;
    canvas.height = ratio.height;

    alert(
      `Export functionality would process the video with:\n- Format: ${ratio.label}\n- Filter: ${selectedFilter}\n- ${textOverlays.length} text overlays\n- Brightness: ${brightness}%\n- Contrast: ${contrast}%\n- Saturation: ${saturation}%\n\nNote: Full video processing requires server-side rendering. This demo shows the editing interface.`
    );
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full h-screen flex flex-col text-white">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            Instagram Video Editor
          </h1>
          <div className="flex gap-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
            >
              <option value="story">Story (9:16)</option>
              <option value="reel">Reel (9:16)</option>
              <option value="post">Post (1:1)</option>
            </select>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all font-semibold"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-black/30 backdrop-blur-sm border-r border-white/10 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Upload */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Video
              </h3>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Choose Videos
              </button>
            </div>

            {/* Video Clips */}
            {videoClips.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Video Clips</h3>
                <div className="space-y-2">
                  {videoClips.map((clip) => (
                    <div
                      key={clip.id}
                      onClick={() => setCurrentClip(clip)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        currentClip?.id === clip.id
                          ? "bg-purple-600"
                          : "bg-white/10 hover:bg-white/20"
                      }`}
                    >
                      <p className="text-sm truncate">{clip.file.name}</p>
                      <p className="text-xs text-white/60 mt-1">
                        {formatTime(clip.duration)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Filters
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter.name}
                    onClick={() => applyFilter(filter.name)}
                    className={`px-3 py-2 rounded-lg transition-all text-sm ${
                      selectedFilter === filter.name
                        ? "bg-purple-600"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Effects */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Effects
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-white/80 block mb-1">
                    Brightness: {brightness}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/80 block mb-1">
                    Contrast: {contrast}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/80 block mb-1">
                    Saturation: {saturation}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={saturation}
                    onChange={(e) => setSaturation(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <button
                  onClick={resetEffects}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Effects
                </button>
              </div>
            </div>

            {/* Text Overlays */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Type className="w-5 h-5" />
                Text Overlays
              </h3>
              {showTextInput ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Enter text..."
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-500"
                    onKeyPress={(e) => e.key === "Enter" && addTextOverlay()}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={addTextOverlay}
                      className="flex-1 px-3 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowTextInput(false);
                        setNewText("");
                      }}
                      className="flex-1 px-3 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowTextInput(true)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Type className="w-5 h-5" />
                  Add Text
                </button>
              )}
              {textOverlays.length > 0 && (
                <div className="mt-3 space-y-2">
                  {textOverlays.map((overlay) => (
                    <div
                      key={overlay.id}
                      className="p-2 bg-white/10 rounded-lg flex items-center justify-between"
                    >
                      <span className="text-sm truncate flex-1">
                        {overlay.text}
                      </span>
                      <button
                        onClick={() => removeTextOverlay(overlay.id)}
                        className="ml-2 text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Video Preview */}
          <div className="flex-1 flex items-center justify-center bg-black/20 p-8">
            {currentClip ? (
              <div className="relative max-w-4xl w-full">
                <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl">
                  <video
                    ref={videoRef}
                    src={currentClip.url}
                    className="w-full h-auto"
                    style={{ filter: getFilterStyle() }}
                  />
                  {/* Text Overlays Preview */}
                  {textOverlays.map((overlay) => {
                    if (
                      currentTime >= overlay.startTime &&
                      currentTime <= overlay.endTime
                    ) {
                      return (
                        <div
                          key={overlay.id}
                          className="absolute pointer-events-none"
                          style={{
                            left: `${overlay.x}%`,
                            top: `${overlay.y}%`,
                            fontSize: `${overlay.fontSize}px`,
                            color: overlay.color,
                            fontFamily: overlay.fontFamily,
                            transform: "translate(-50%, -50%)",
                            textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                            fontWeight: "bold",
                          }}
                        >
                          {overlay.text}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center text-white/60">
                <Upload className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl">Upload a video to start editing</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="bg-black/30 backdrop-blur-sm border-t border-white/10 p-4">
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Timeline */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-mono w-16">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1"
                  disabled={!currentClip}
                />
                <span className="text-sm font-mono w-16 text-right">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={togglePlayPause}
                  disabled={!currentClip}
                  className="w-12 h-12 flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:bg-white/10 disabled:cursor-not-allowed rounded-full transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-1" />
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    disabled={!currentClip}
                    className="p-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-24"
                    disabled={!currentClip || isMuted}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
