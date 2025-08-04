import React, { useEffect, useState, useRef } from "react";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Globe,
} from "lucide-react";
import { SideModalLayout } from "./SideModalLayout";

type StrongsInfo = {
  WordHeader: string;
  LanguageInfo: string;
  OriginalText: string;
  Pronunciation: string;
  LiteralMeaning: string;
  ContextualMeaning: string;
  OtherUses: string;
  CulturalSignificance: string;
};

type StreamingState = {
  isStreaming: boolean;
  streamedSections: {
    [key: string]: string;
  };
  parsedData: StrongsInfo | null;
  error: string | null;
  isComplete: boolean;
  isFromCache: boolean;
};

type StrongsAnalysisModalProps = {
  isOpen: boolean;
  onClose: () => void;
  book: string;
  chapter: number;
  verse: number;
  word: string;
};

export const StrongsAnalysisModal: React.FC<StrongsAnalysisModalProps> = ({
  isOpen,
  onClose,
  book,
  chapter,
  verse,
  word,
}) => {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    streamedSections: {},
    parsedData: null,
    error: null,
    isComplete: false,
    isFromCache: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper function to create cache key
  const createCacheKey = (
    book: string,
    chapter: number,
    verse: number,
    word: string
  ) => {
    return `strongs-${book}-${chapter}-${verse}-${word.toLowerCase().trim()}`;
  };

  // Helper function to get cached data
  const getCachedData = (cacheKey: string): StrongsInfo | null => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsedData = JSON.parse(cached);
        // Validate that the cached data has the expected structure
        if (
          parsedData &&
          typeof parsedData === "object" &&
          parsedData.WordHeader
        ) {
          return parsedData as StrongsInfo;
        }
      }
    } catch (error) {
      console.warn("Failed to parse cached Strong's data:", error);
      // Remove invalid cache entry
      localStorage.removeItem(cacheKey);
    }
    return null;
  };

  // Helper function to save data to cache
  const saveToCacheWithExpiry = (
    cacheKey: string,
    data: StrongsInfo,
    expiryDays: number = 7
  ) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + expiryDays * 24 * 60 * 60 * 1000, // 7 days default
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn("Failed to save Strong's data to cache:", error);
    }
  };

  // Helper function to get cached data with expiry check
  const getCachedDataWithExpiry = (cacheKey: string): StrongsInfo | null => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const cacheData = JSON.parse(cached);

        // Check if it's old format (direct data) or new format (with expiry)
        if (cacheData.data && cacheData.expiry) {
          // New format with expiry
          if (Date.now() > cacheData.expiry) {
            // Cache expired, remove it
            localStorage.removeItem(cacheKey);
            return null;
          }
          return cacheData.data as StrongsInfo;
        } else if (cacheData.WordHeader) {
          // Old format (direct data), migrate to new format
          const strongsData = cacheData as StrongsInfo;
          saveToCacheWithExpiry(cacheKey, strongsData);
          return strongsData;
        }
      }
    } catch (error) {
      console.warn("Failed to parse cached Strong's data:", error);
      localStorage.removeItem(cacheKey);
    }
    return null;
  };

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setStreamingState({
        isStreaming: false,
        streamedSections: {},
        parsedData: null,
        error: null,
        isComplete: false,
        isFromCache: false,
      });
      return;
    }

    const fetchStrongsAnalysis = async () => {
      // Create a unique cache key
      const cacheKey = createCacheKey(book, chapter, verse, word);

      // Try to get cached data first
      const cachedData = getCachedDataWithExpiry(cacheKey);

      if (cachedData) {
        // Load from cache immediately
        console.log("Loading Strong's analysis from cache:", cacheKey);
        setStreamingState({
          isStreaming: false,
          streamedSections: {},
          parsedData: cachedData,
          error: null,
          isComplete: true,
          isFromCache: true,
        });
        return;
      }

      // No cache found, fetch from API
      console.log("Fetching Strong's analysis from API:", cacheKey);

      // Start streaming
      setStreamingState((prev) => ({
        ...prev,
        isStreaming: true,
        error: null,
        streamedSections: {},
        parsedData: null,
        isComplete: false,
        isFromCache: false,
      }));

      try {
        // Create abort controller for this request
        abortControllerRef.current = new AbortController();

        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/strongs-analysis/${book}/${chapter}/${verse}/${encodeURIComponent(
            word
          )}`,
          {
            signal: abortControllerRef.current.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No reader available");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim() === "") continue;

            // Remove "data: " prefix if present
            const cleanLine = line.startsWith("data: ") ? line.slice(6) : line;

            try {
              const parsed = JSON.parse(cleanLine);

              if (parsed.type === "section_update") {
                // Update sections incrementally
                const sectionKey = parsed.section;

                setStreamingState((prev) => ({
                  ...prev,
                  streamedSections: {
                    ...prev.streamedSections,
                    [sectionKey]:
                      (prev.streamedSections[sectionKey] || "") +
                      parsed.content,
                  },
                }));
              } else if (parsed.type === "complete") {
                // Final structured data received
                const strongsData: StrongsInfo = parsed.data;

                // Cache the data with expiry
                saveToCacheWithExpiry(cacheKey, strongsData, 7); // Cache for 7 days

                setStreamingState((prev) => ({
                  ...prev,
                  isStreaming: false,
                  parsedData: strongsData,
                  isComplete: true,
                  isFromCache: false,
                }));
                break;
              } else if (parsed.type === "error") {
                throw new Error(parsed.message || "Stream error");
              }
            } catch (parseError) {
              // Only log parse errors for debugging, don't stop the stream
              if (cleanLine.trim()) {
                console.warn("Failed to parse line:", cleanLine, parseError);
              }
            }
          }
        }

        reader.releaseLock();
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("Request was aborted");
          return;
        }

        console.error("Streaming error:", error);
        setStreamingState((prev) => ({
          ...prev,
          isStreaming: false,
          error: error.message || "Failed to fetch Strong's analysis",
        }));
      }
    };

    fetchStrongsAnalysis();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isOpen, book, chapter, verse, word]);

  // Get current data to display (streaming or final)
  const getCurrentData = () => {
    if (streamingState.parsedData) {
      return streamingState.parsedData;
    }

    // Build data from streaming sections
    return {
      WordHeader: streamingState.streamedSections.WordHeader || "",
      LanguageInfo: streamingState.streamedSections.LanguageInfo || "",
      OriginalText: streamingState.streamedSections.OriginalText || "",
      Pronunciation: streamingState.streamedSections.Pronunciation || "",
      LiteralMeaning: streamingState.streamedSections.LiteralMeaning || "",
      ContextualMeaning:
        streamingState.streamedSections.ContextualMeaning || "",
      OtherUses: streamingState.streamedSections.OtherUses || "",
      CulturalSignificance:
        streamingState.streamedSections.CulturalSignificance || "",
    };
  };

  const currentData = getCurrentData();

  const parseWordHeader = (wordHeader: string) => {
    if (!wordHeader) return { parsedWord: "", strongsNum: "" };
    const parts = wordHeader.split("|");
    return {
      parsedWord: parts[0] || "",
      strongsNum: parts[1] || "",
    };
  };

  const { parsedWord, strongsNum } = parseWordHeader(currentData.WordHeader);

  // Parse other uses
  const parseOtherUses = (otherUses: string) => {
    if (!otherUses) return [];

    return otherUses
      .split("\n")
      .filter((line) => line.trim() && line.includes("|"))
      .slice(0, 10) // Limit to 10 entries
      .map((line) => {
        const parts = line.trim().split("|");
        return {
          reference: parts[0] || "",
          translation: parts[1] || "",
          context: parts[2] || "",
        };
      });
  };

  const otherUsesData = parseOtherUses(currentData.OtherUses);

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }

        .streaming-cursor {
          display: inline-block;
          width: 2px;
          height: 1.2em;
          background-color: #3b82f6;
          animation: blink 1s infinite;
          margin-left: 2px;
          vertical-align: text-bottom;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .content-section {
          opacity: 0;
          transform: translateY(15px);
        }

        .content-section.visible {
          animation: fadeInUp 0.5s ease-out forwards;
        }

        .highlight-word {
          background-color: #fef3c7;
          color: #92400e;
          padding: 1px 3px;
          border-radius: 3px;
          font-weight: 500;
        }

        .cache-indicator {
          background-color: #dcfce7;
          color: #166534;
          font-size: 0.75rem;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 500;
        }
      `}</style>

      <SideModalLayout isOpen={isOpen} onClose={onClose}>
        <div className="h-full flex flex-col overflow-hidden font-serif">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="flex items-center space-x-3">
              <h2 className="text-base font-semibold text-gray-800">
                Strong's Analysis
              </h2>
              {streamingState.isFromCache && (
                <span className="cache-indicator">Cached</span>
              )}
              {streamingState.isStreaming && (
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              )}
              {streamingState.isComplete && !streamingState.isFromCache && (
                <CheckCircle2 className="w-4 h-4 text-green-500 fade-in" />
              )}
              {streamingState.error && (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Loading state */}
            {streamingState.isStreaming && !currentData.WordHeader && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4 fade-in">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-gray-500 text-sm">
                  Analyzing biblical word...
                </p>
              </div>
            )}

            {/* Error state */}
            {streamingState.error && (
              <div className="flex items-center justify-center py-12 fade-in-up">
                <div className="text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                  <p className="text-red-500 text-sm">
                    Error loading analysis: {streamingState.error}
                  </p>
                </div>
              </div>
            )}

            {/* Content */}
            {currentData.WordHeader && (
              <div className="space-y-8">
                {/* Word Header Section */}
                <div className="content-section visible bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                  <div className="text-center space-y-3">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {parsedWord || word}
                      {streamingState.isStreaming &&
                        !currentData.LanguageInfo && (
                          <span className="streaming-cursor" />
                        )}
                    </h1>
                    <div className="flex items-center justify-center space-x-4 text-sm">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                        {strongsNum}
                      </span>
                      {currentData.LanguageInfo && (
                        <div className="flex items-center space-x-1 text-gray-600">
                          <Globe className="w-4 h-4" />
                          <span className="font-medium">
                            {currentData.LanguageInfo}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">
                      {book} {chapter}:{verse}
                    </p>
                  </div>
                </div>

                {/* Original Text & Pronunciation */}
                {(currentData.OriginalText || currentData.Pronunciation) && (
                  <div className="content-section visible grid md:grid-cols-2 gap-6">
                    {currentData.OriginalText && (
                      <div className="bg-gray-50 rounded-lg p-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                          Original Text
                        </h3>
                        <div className="text-2xl font-bold text-gray-900 text-center py-4">
                          {currentData.OriginalText}
                          {streamingState.isStreaming &&
                            !currentData.Pronunciation && (
                              <span className="streaming-cursor" />
                            )}
                        </div>
                      </div>
                    )}

                    {currentData.Pronunciation && (
                      <div className="bg-gray-50 rounded-lg p-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                          Pronunciation
                        </h3>
                        <div className="text-xl text-gray-800 text-center py-4 font-mono">
                          {currentData.Pronunciation}
                          {streamingState.isStreaming &&
                            !currentData.LiteralMeaning && (
                              <span className="streaming-cursor" />
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Literal Meaning */}
                {currentData.LiteralMeaning && (
                  <div className="content-section visible">
                    <div className="border-l-4 border-green-500 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Literal Meaning
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {currentData.LiteralMeaning}
                        {streamingState.isStreaming &&
                          !currentData.ContextualMeaning && (
                            <span className="streaming-cursor" />
                          )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Contextual Meaning */}
                {currentData.ContextualMeaning && (
                  <div className="content-section visible">
                    <div className="border-l-4 border-purple-500 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Meaning in This Context
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {currentData.ContextualMeaning}
                        {streamingState.isStreaming &&
                          !currentData.OtherUses && (
                            <span className="streaming-cursor" />
                          )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Other Uses */}
                {otherUsesData.length > 0 && (
                  <div className="content-section visible">
                    <div className="border-l-4 border-orange-500 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Other Biblical Uses
                      </h3>
                      <div className="space-y-4">
                        {otherUsesData.map((use, index) => (
                          <div
                            key={index}
                            className="bg-orange-50 rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <span className="font-semibold text-orange-800">
                                {use.reference}
                              </span>
                              <span className="highlight-word text-sm">
                                "{use.translation}"
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {use.context}
                            </p>
                          </div>
                        ))}
                      </div>
                      {streamingState.isStreaming &&
                        !currentData.CulturalSignificance && (
                          <span className="streaming-cursor" />
                        )}
                    </div>
                  </div>
                )}

                {/* Cultural Significance */}
                {currentData.CulturalSignificance && (
                  <div className="content-section visible">
                    <div className="border-l-4 border-indigo-500 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                        <BookOpen className="w-5 h-5" />
                        <span>Cultural Significance</span>
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {currentData.CulturalSignificance}
                        {streamingState.isStreaming &&
                          !streamingState.isComplete && (
                            <span className="streaming-cursor" />
                          )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Completion Message */}
                {streamingState.isComplete && streamingState.parsedData && (
                  <div className="mt-8 pt-6 border-t border-gray-200 fade-in-up">
                    <div
                      className={`rounded-lg p-4 ${
                        streamingState.isFromCache
                          ? "bg-gradient-to-r from-green-50 to-emerald-50"
                          : "bg-gradient-to-r from-blue-50 to-indigo-50"
                      }`}
                    >
                      <p className="text-sm text-gray-700 font-medium text-center">
                        {streamingState.isFromCache
                          ? "Loaded from cache: "
                          : "Word study complete for "}
                        <span
                          className={`font-semibold ${
                            streamingState.isFromCache
                              ? "text-emerald-700"
                              : "text-indigo-700"
                          }`}
                        >
                          "{parsedWord || word}" ({strongsNum})
                        </span>{" "}
                        in {book} {chapter}:{verse}
                        {streamingState.isFromCache && (
                          <span className="block text-xs text-gray-500 mt-1">
                            Data cached for faster loading
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Streaming indicator */}
                {streamingState.isStreaming && !streamingState.isComplete && (
                  <div className="mt-4 flex items-center justify-center space-x-2 text-blue-500 text-sm fade-in">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing word usage...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </SideModalLayout>
    </>
  );
};

export default StrongsAnalysisModal;
