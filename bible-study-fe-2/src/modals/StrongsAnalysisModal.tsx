import React, { useEffect, useState, useRef } from "react";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Globe,
  Quote,
  List,
  Target,
} from "lucide-react";
import { SideModalLayout } from "./SideModalLayout";

type StrongsInfo = {
  WordHeader: string;
  LanguageInfo: string;
  OriginalText: string;
  Pronunciation: string;
  RootMeanings: string;
  ContextualMeaning: string;
  OtherUses: string;
  CulturalSignificance: string;
};

type StreamingState = {
  isStreaming: boolean;
  streamedSections: Record<string, string>;
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

  // Cache management
  const createCacheKey = (
    book: string,
    chapter: number,
    verse: number,
    word: string
  ) => {
    return `strongs-${book}-${chapter}-${verse}-${word.toLowerCase().trim()}`;
  };

  const saveToCacheWithExpiry = (
    cacheKey: string,
    data: StrongsInfo,
    expiryDays: number = 7
  ) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + expiryDays * 24 * 60 * 60 * 1000,
      };

      // Save to memory (optional, can remove if not needed)
      (window as any).strongsCache = (window as any).strongsCache || {};
      (window as any).strongsCache[cacheKey] = cacheData;

      // Save to localStorage
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn("Failed to save Strong's data to cache:", error);
    }
  };

  const getCachedDataWithExpiry = (cacheKey: string): StrongsInfo | null => {
    try {
      // 1. Check in-memory cache
      const memoryCache = (window as any).strongsCache || {};
      const inMemory = memoryCache[cacheKey];

      if (inMemory && Date.now() < inMemory.expiry) {
        return inMemory.data as StrongsInfo;
      }

      // 2. Check localStorage if not found or expired in memory
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.expiry && Date.now() < parsed.expiry) {
          // Restore to memory for faster access next time
          memoryCache[cacheKey] = parsed;
          return parsed.data as StrongsInfo;
        } else {
          localStorage.removeItem(cacheKey); // Clean expired
        }
      }
    } catch (error) {
      console.warn("Failed to parse cached Strong's data:", error);
    }
    return null;
  };

  // Data fetching effect
  useEffect(() => {
    if (!isOpen) {
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
      const cacheKey = createCacheKey(book, chapter, verse, word);
      const cachedData = getCachedDataWithExpiry(cacheKey);

      if (cachedData) {
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
        abortControllerRef.current = new AbortController();

        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/strongs-analysis/${book}/${chapter}/${verse}/${encodeURIComponent(
            word
          )}`,
          { signal: abortControllerRef.current.signal }
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
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim() === "") continue;

            const cleanLine = line.startsWith("data: ") ? line.slice(6) : line;

            try {
              const parsed = JSON.parse(cleanLine);

              if (parsed.type === "section_update") {
                setStreamingState((prev) => ({
                  ...prev,
                  streamedSections: {
                    ...prev.streamedSections,
                    [parsed.section]:
                      (prev.streamedSections[parsed.section] || "") +
                      parsed.content,
                  },
                }));
              } else if (parsed.type === "complete") {
                const strongsData: StrongsInfo = parsed.data;
                saveToCacheWithExpiry(cacheKey, strongsData, 7);

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
              if (cleanLine.trim()) {
                console.warn("Failed to parse line:", cleanLine, parseError);
              }
            }
          }
        }

        reader.releaseLock();
      } catch (error: any) {
        if (error.name === "AbortError") return;

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

  // Data parsing functions
  const getCurrentData = (): StrongsInfo => {
    if (streamingState.parsedData) {
      return streamingState.parsedData;
    }

    return {
      WordHeader: streamingState.streamedSections.WordHeader || "",
      LanguageInfo: streamingState.streamedSections.LanguageInfo || "",
      OriginalText: streamingState.streamedSections.OriginalText || "",
      Pronunciation: streamingState.streamedSections.Pronunciation || "",
      RootMeanings: streamingState.streamedSections.RootMeanings || "",
      ContextualMeaning:
        streamingState.streamedSections.ContextualMeaning || "",
      OtherUses: streamingState.streamedSections.OtherUses || "",
      CulturalSignificance:
        streamingState.streamedSections.CulturalSignificance || "",
    };
  };

  const parseWordHeader = (wordHeader: string) => {
    if (!wordHeader) return { parsedWord: "", strongsNum: "" };
    const parts = wordHeader.split("|");
    return {
      parsedWord: parts[0]?.trim() || "",
      strongsNum: parts[1]?.trim() || "",
    };
  };

  const parseRootMeanings = (rootMeanings: string): string[] => {
    if (!rootMeanings) return [];
    return rootMeanings
      .split("|")
      .map((meaning) => meaning.trim())
      .filter((meaning) => meaning.length > 0);
  };

  const parseContextualMeaning = (contextualMeaning: string) => {
    if (!contextualMeaning) {
      return {
        bestFit: "",
        fullVerseText: "",
        rewrittenVerse: "",
        contextCommentary: "",
      };
    }

    // More robust parsing with fallbacks
    const bestFitMatch = contextualMeaning.match(
      /\*\*Best-fit meaning:\*\*\s*(.+?)(?:\n\*\*|\n\n|\*\*|$)/s
    );
    const fullVerseMatch = contextualMeaning.match(
      /\*\*Full verse text:\*\*\s*(.+?)(?:\n\*\*|\n\n|\*\*|$)/s
    );
    const rewrittenMatch = contextualMeaning.match(
      /\*\*Rewritten verse:\*\*\s*(.+?)(?:\n\*\*|\n\n|\*\*|$)/s
    );
    const commentaryMatch = contextualMeaning.match(
      /\*\*Context commentary:\*\*\s*(.+?)(?:\n\*\*|\n\n|$)/s
    );

    return {
      bestFit: bestFitMatch?.[1]?.trim() || "",
      fullVerseText: fullVerseMatch?.[1]?.trim() || "",
      rewrittenVerse: rewrittenMatch?.[1]?.trim() || "",
      contextCommentary: commentaryMatch?.[1]?.trim() || "",
    };
  };

  const parseOtherUses = (otherUses: string) => {
    if (!otherUses) return [];

    // Split by **Reference:** but keep the content
    const sections = otherUses.split(/(?=\*\*Reference:\*\*)/);

    return sections
      .filter((section) => section.trim().length > 0)
      .map((section) => {
        const referenceMatch = section.match(
          /\*\*Reference:\*\*\s*(.+?)(?:\n|\*\*|$)/
        );
        const verseMatch = section.match(
          /\*\*Full Verse:\*\*\s*(.+?)(?:\n\*\*|\*\*|$)/s
        );
        const senseMatch = section.match(
          /\*\*Sense Used:\*\*\s*(.+?)(?:\n\*\*|\*\*|$)/s
        );
        const synonymMatch = section.match(
          /\*\*Best Synonym:\*\*\s*(.+?)(?:\n\*\*|\*\*|$)/s
        );

        return {
          reference: referenceMatch?.[1]?.trim() || "",
          fullVerse: verseMatch?.[1]?.trim() || "",
          senseUsed: senseMatch?.[1]?.trim() || "",
          bestSynonym: synonymMatch?.[1]?.trim() || "",
        };
      })
      .filter((item) => item.reference.length > 0)
      .slice(0, 8);
  };

  // Component to highlight capitalized words in verses
  const HighlightedVerse: React.FC<{ text: string; className?: string }> = ({
    text,
    className = "",
  }) => {
    if (!text) return null;

    const parts = text.split(/(\b[A-Z]{2,}\b)/g);

    return (
      <div className={`leading-relaxed ${className}`}>
        {parts.map((part, index) => {
          const isHighlighted = /^[A-Z]{2,}$/.test(part.trim());
          return (
            <span
              key={index}
              className={
                isHighlighted
                  ? "bg-yellow-200 text-yellow-900 px-1 py-0.5 rounded font-bold"
                  : ""
              }
            >
              {part}
            </span>
          );
        })}
      </div>
    );
  };

  const currentData = getCurrentData();
  const { parsedWord, strongsNum } = parseWordHeader(currentData.WordHeader);
  const rootMeaningsList = parseRootMeanings(currentData.RootMeanings);
  const contextualData = parseContextualMeaning(currentData.ContextualMeaning);
  const otherUsesData = parseOtherUses(currentData.OtherUses);

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .streaming-cursor {
          display: inline-block;
          width: 2px;
          height: 1.2em;
          background-color: #3b82f6;
          animation: blink 1s infinite;
          margin-left: 2px;
          vertical-align: text-bottom;
        }
        .content-section {
          opacity: 0;
          transform: translateY(15px);
        }
        .content-section.visible {
          animation: fadeInUp 0.5s ease-out forwards;
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
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                    Error: {streamingState.error}
                  </p>
                </div>
              </div>
            )}

            {/* Content */}
            {currentData.WordHeader && (
              <div className="space-y-6">
                {/* Word Header Section */}
                <div className="content-section visible bg-gray-50 rounded-lg p-6">
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
                  <div className="content-section visible grid md:grid-cols-2 gap-4">
                    {currentData.OriginalText && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                          Original Text
                        </h3>
                        <div className="text-2xl font-bold text-gray-900 text-center py-2">
                          {currentData.OriginalText}
                          {streamingState.isStreaming &&
                            !currentData.Pronunciation && (
                              <span className="streaming-cursor" />
                            )}
                        </div>
                      </div>
                    )}
                    {currentData.Pronunciation && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                          Pronunciation
                        </h3>
                        <div className="text-xl text-gray-800 text-center py-2 font-mono">
                          {currentData.Pronunciation}
                          {streamingState.isStreaming &&
                            !currentData.RootMeanings && (
                              <span className="streaming-cursor" />
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Root Meanings Section */}
                {rootMeaningsList.length > 0 && (
                  <div className="content-section visible">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <List className="w-5 h-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Root Meanings
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {rootMeaningsList.map((meaning, index) => (
                          <div
                            key={index}
                            className="bg-green-50 border border-green-200 rounded px-3 py-2 text-sm text-green-800 font-medium"
                          >
                            {meaning}
                          </div>
                        ))}
                      </div>
                      {streamingState.isStreaming &&
                        !currentData.ContextualMeaning && (
                          <span className="streaming-cursor" />
                        )}
                    </div>
                  </div>
                )}

                {/* Contextual Meaning Section */}
                {(contextualData.bestFit || contextualData.fullVerseText) && (
                  <div className="content-section visible">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                      <div className="flex items-center space-x-2 mb-4">
                        <Target className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Meaning in This Context
                        </h3>
                      </div>

                      <div className="space-y-4">
                        {/* Best-fit meaning */}
                        {contextualData.bestFit && (
                          <div>
                            <span className="text-sm font-semibold text-blue-700 block mb-1">
                              Best-fit meaning:
                            </span>
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-medium">
                              {contextualData.bestFit}
                            </span>
                          </div>
                        )}

                        {/* Full verse with highlighted word */}
                        {contextualData.fullVerseText && (
                          <div>
                            <span className="text-sm font-semibold text-blue-700 block mb-2">
                              {book} {chapter}:{verse} (with highlighted word):
                            </span>
                            <div className="bg-white border border-blue-200 rounded p-4">
                              <HighlightedVerse
                                text={contextualData.fullVerseText}
                                className="text-gray-800"
                              />
                            </div>
                          </div>
                        )}

                        {/* Rewritten verse */}
                        {contextualData.rewrittenVerse && (
                          <div>
                            <span className="text-sm font-semibold text-blue-700 block mb-2">
                              Verse with contextual meaning:
                            </span>
                            <div className="bg-blue-25 border border-blue-300 rounded p-4 italic">
                              <div className="text-gray-800 leading-relaxed">
                                {contextualData.rewrittenVerse}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Context commentary */}
                        {contextualData.contextCommentary && (
                          <div>
                            <span className="text-sm font-semibold text-blue-700 block mb-2">
                              Why this meaning fits:
                            </span>
                            <div className="bg-white border border-blue-200 rounded p-3">
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {contextualData.contextCommentary}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {streamingState.isStreaming && !currentData.OtherUses && (
                        <span className="streaming-cursor" />
                      )}
                    </div>
                  </div>
                )}

                {/* Other Biblical Uses Section */}
                {otherUsesData.length > 0 && (
                  <div className="content-section visible">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <BookOpen className="w-5 h-5 text-orange-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Other Biblical Uses
                        </h3>
                      </div>

                      <div className="space-y-4">
                        {otherUsesData.map((use, index) => (
                          <div
                            key={index}
                            className="bg-orange-50 border border-orange-200 rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <span className="font-semibold text-orange-800 text-sm">
                                {use.reference}
                              </span>
                              {use.bestSynonym && (
                                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">
                                  {use.bestSynonym}
                                </span>
                              )}
                            </div>

                            {use.fullVerse && (
                              <div className="mb-3">
                                <div className="bg-white border border-orange-200 rounded p-3">
                                  <HighlightedVerse
                                    text={use.fullVerse}
                                    className="text-gray-800 text-sm"
                                  />
                                </div>
                              </div>
                            )}

                            {use.senseUsed && (
                              <p className="text-xs text-gray-600 leading-relaxed">
                                <span className="font-medium">
                                  Usage context:
                                </span>{" "}
                                {use.senseUsed}
                              </p>
                            )}
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

                {/* Cultural Significance Section */}
                {currentData.CulturalSignificance && (
                  <div className="content-section visible">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Globe className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Cultural Significance
                        </h3>
                      </div>
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
                  <div className="mt-6 fade-in-up">
                    <div
                      className={`rounded-lg p-4 ${
                        streamingState.isFromCache
                          ? "bg-green-50 border border-green-200"
                          : "bg-blue-50 border border-blue-200"
                      }`}
                    >
                      <p className="text-sm text-gray-700 font-medium text-center">
                        {streamingState.isFromCache
                          ? "Loaded from cache: "
                          : "Analysis complete for "}
                        <span
                          className={`font-semibold ${
                            streamingState.isFromCache
                              ? "text-green-700"
                              : "text-blue-700"
                          }`}
                        >
                          "{parsedWord || word}" ({strongsNum})
                        </span>{" "}
                        in {book} {chapter}:{verse}
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
