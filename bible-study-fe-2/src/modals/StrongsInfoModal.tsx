import React, { useEffect, useState, useRef } from "react";
import {
  X,
  Loader2,
  BookOpen,
  Volume2,
  Quote,
  Languages,
  Hash,
  Globe,
  Scroll,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Clock,
  Star,
} from "lucide-react";
import { SideModalLayout } from "./SideModalLayout";

type GeneralMeaning = {
  meaning: string;
  explanation: string;
  usage_context: string;
};

type BiblicalUsageExample = {
  verse_reference: string;
  verse_text: string;
  translated_as: string;
  meaning_used: string;
  significance: string;
};

type StrongsData = {
  original_language_info: {
    strongs_number: string;
    original_language: string;
    original_script: string;
    transliteration: string;
    pronunciation: string;
    pronunciation_guide: string;
  };
  general_meanings: GeneralMeaning[];
  contextual_meaning: {
    verse_reference: string;
    verse_text: string;
    word_in_context: string;
    contextual_explanation: string;
    why_this_translation: string;
    deeper_insight: string;
  };
  biblical_usage_examples: BiblicalUsageExample[];
};

type StreamingState = {
  isStreaming: boolean;
  streamedSections: {
    [key: string]: string;
  };
  parsedData: StrongsData | null;
  error: string | null;
  isComplete: boolean;
  currentSection: string | null;
  completedSections: Set<string>;
};

type StrongsInfoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  book: string;
  chapter: number;
  word: string;
  verse: number;
};

export const StrongsInfoModal: React.FC<StrongsInfoModalProps> = ({
  isOpen,
  onClose,
  book,
  chapter,
  word,
  verse,
}) => {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    streamedSections: {},
    parsedData: null,
    error: null,
    isComplete: false,
    currentSection: null,
    completedSections: new Set(),
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setStreamingState({
        isStreaming: false,
        streamedSections: {},
        parsedData: null,
        error: null,
        isComplete: false,
        currentSection: null,
        completedSections: new Set(),
      });
      return;
    }

    const fetchStreamingStrongsData = async () => {
      if (!word.trim()) return;

      // Create a unique cache key
      const cacheKey = `strongs-${book}-${chapter}-${verse}-${word.toLowerCase()}`;

      // Try cached data first - Store in memory instead of localStorage
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const parsed: StrongsData = JSON.parse(cachedData);
          setStreamingState({
            isStreaming: false,
            streamedSections: {},
            parsedData: parsed,
            error: null,
            isComplete: true,
            currentSection: null,
            completedSections: new Set([
              "LANGUAGE_INFO",
              "MEANINGS",
              "CONTEXT",
              "EXAMPLES",
            ]),
          });
          return;
        } catch (err) {
          sessionStorage.removeItem(cacheKey);
        }
      }

      // Start streaming
      setStreamingState({
        isStreaming: true,
        streamedSections: {},
        parsedData: null,
        error: null,
        isComplete: false,
        currentSection: null,
        completedSections: new Set(),
      });

      try {
        // Create abort controller for this request
        abortControllerRef.current = new AbortController();

        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/strongs-analysis/${book}/${chapter}/${encodeURIComponent(
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
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim() === "") continue;
            const cleanLine = line.startsWith("data: ") ? line.slice(6) : line;

            try {
              const parsed = JSON.parse(cleanLine);

              if (parsed.type === "section_update") {
                const sectionKey = parsed.section;

                setStreamingState((prev) => ({
                  ...prev,
                  currentSection: sectionKey,
                  streamedSections: {
                    ...prev.streamedSections,
                    [sectionKey]:
                      (prev.streamedSections[sectionKey] || "") +
                      parsed.content,
                  },
                }));
              } else if (parsed.type === "complete") {
                const strongsData: StrongsData = parsed.data;
                sessionStorage.setItem(cacheKey, JSON.stringify(strongsData));

                setStreamingState((prev) => ({
                  ...prev,
                  isStreaming: false,
                  parsedData: strongsData,
                  isComplete: true,
                  currentSection: null,
                  completedSections: new Set([
                    "LANGUAGE_INFO",
                    "MEANINGS",
                    "CONTEXT",
                    "EXAMPLES",
                  ]),
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
        if (error.name === "AbortError") {
          console.log("Request was aborted");
          return;
        }

        console.error("Streaming error:", error);
        setStreamingState((prev) => ({
          ...prev,
          isStreaming: false,
          error: error.message || "Failed to fetch Strong's data",
        }));
      }
    };

    fetchStreamingStrongsData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isOpen, book, chapter, word, verse]);

  const renderHighlightedVerse = (verseText: string, translatedAs: string) => {
    if (!translatedAs || !verseText) return verseText;

    const baseWord = translatedAs.toLowerCase();
    const variations = [
      translatedAs,
      baseWord,
      baseWord + "s",
      baseWord + "ed",
      baseWord + "ing",
      baseWord.endsWith("e") ? baseWord.slice(0, -1) + "ing" : "",
      baseWord.endsWith("y") ? baseWord.slice(0, -1) + "ies" : "",
    ].filter((v) => v.length > 2);

    const uniqueVariations = [...new Set(variations)];
    const escapedTexts = uniqueVariations.map((text) =>
      text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );

    if (escapedTexts.length === 0) return verseText;

    const regex = new RegExp(`\\b(${escapedTexts.join("|")})\\b`, "gi");
    const parts = verseText.split(regex);

    return (
      <>
        {parts.map((part, index) =>
          part && regex.test(part) ? (
            <span
              key={index}
              className="bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 px-1.5 py-0.5 rounded-md font-medium shadow-sm"
            >
              {part}
            </span>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    );
  };

  // Show streaming cursor for current section
  const showCursorFor = (sectionKey: string) => {
    return (
      streamingState.isStreaming &&
      streamingState.currentSection === sectionKey &&
      !streamingState.isComplete
    );
  };

  const getSectionIcon = (sectionKey: string) => {
    switch (sectionKey) {
      case "LANGUAGE_INFO":
        return <Languages className="w-5 h-5" />;
      case "MEANINGS":
        return <Scroll className="w-5 h-5" />;
      case "CONTEXT":
        return <Quote className="w-5 h-5" />;
      case "EXAMPLES":
        return <BookOpen className="w-5 h-5" />;
      default:
        return <Star className="w-5 h-5" />;
    }
  };

  const getSectionTitle = (sectionKey: string) => {
    switch (sectionKey) {
      case "LANGUAGE_INFO":
        return "Original Language Information";
      case "MEANINGS":
        return "General Meanings";
      case "CONTEXT":
        return "Meaning in This Context";
      case "EXAMPLES":
        return "Biblical Usage Examples";
      default:
        return sectionKey;
    }
  };

  const data = streamingState.parsedData;
  const loading =
    streamingState.isStreaming &&
    !data &&
    Object.keys(streamingState.streamedSections).length === 0;
  const error = streamingState.error;

  return (
    <>
      <style>{`
        .streaming-cursor {
          display: inline-block;
          width: 2px;
          height: 1.2em;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          animation: pulse-glow 1.2s infinite;
          margin-left: 3px;
          vertical-align: text-bottom;
          border-radius: 1px;
        }

        @keyframes pulse-glow {
          0%, 100% { 
            opacity: 1; 
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
          }
          50% { 
            opacity: 0.3; 
            box-shadow: 0 0 4px rgba(59, 130, 246, 0.3);
          }
        }

        .glass-effect {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .gradient-border {
          position: relative;
          background: linear-gradient(145deg, #f8fafc, #ffffff);
          border: 1px solid transparent;
        }

        .gradient-border::before {
          content: '';
          position: absolute;
          inset: 0;
          padding: 1px;
          background: linear-gradient(145deg, #e2e8f0, #cbd5e1);
          border-radius: inherit;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
        }
      `}</style>

      <SideModalLayout isOpen={isOpen} onClose={onClose}>
        <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          {/* Enhanced Header */}
          <div className="glass-effect border-b border-slate-200/60 sticky top-0 z-20">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                      <Hash className="w-6 h-6 text-white" />
                    </div>
                    {streamingState.isStreaming && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full animate-ping" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                      Strong's Analysis
                    </h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
                        {book} {chapter}:{verse}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="font-semibold text-slate-700">
                        "{word}"
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {streamingState.isStreaming && (
                    <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                      <span className="text-sm font-medium text-blue-700">
                        Analyzing...
                      </span>
                    </div>
                  )}
                  {streamingState.isComplete && (
                    <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-green-700">
                        Complete
                      </span>
                    </div>
                  )}
                  {error && (
                    <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 rounded-lg border border-red-200">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-red-700">
                        Error
                      </span>
                    </div>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                  <Sparkles className="w-8 h-8 text-blue-500 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-slate-700">
                    Analyzing "{word}"
                  </h3>
                  <p className="text-slate-500 text-sm max-w-md">
                    Diving deep into the original biblical languages to uncover
                    the rich meaning behind this word...
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center py-20 px-6">
                <div className="glass-effect rounded-xl p-8 max-w-md text-center shadow-lg">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    Analysis Failed
                  </h3>
                  <p className="text-slate-600 text-sm mb-4">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {!loading && !error && data && (
              <div className="p-6 space-y-8">
                {/* Hero Section - Original Language Info */}
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl blur-lg opacity-20" />
                    <div className="relative glass-effect rounded-2xl p-8 shadow-xl">
                      <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full px-4 py-2 mb-4 border border-blue-200">
                        <Languages className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-800">
                          {data.original_language_info.original_language}
                        </span>
                      </div>

                      <h1 className="text-4xl font-bold text-slate-800 mb-3">
                        {data.original_language_info.original_script}
                      </h1>

                      <div className="text-xl text-slate-600 font-medium mb-4">
                        {data.original_language_info.transliteration}
                      </div>

                      <div className="flex items-center justify-center space-x-4 mb-4">
                        <div className="flex items-center space-x-2 px-3 py-2 bg-slate-100 rounded-lg">
                          <Volume2 className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700">
                            {data.original_language_info.pronunciation}
                          </span>
                        </div>
                        <div className="text-sm text-slate-500">
                          sounds like:{" "}
                          <span className="font-medium">
                            {data.original_language_info.pronunciation_guide}
                          </span>
                        </div>
                      </div>

                      <div className="inline-block bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg">
                        {data.original_language_info.strongs_number}
                      </div>
                    </div>
                  </div>
                </div>

                {/* General Meanings */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-slate-800 flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                      <Scroll className="w-6 h-6 text-white" />
                    </div>
                    <span>Various Meanings</span>
                  </h3>

                  <div className="grid gap-4">
                    {data.general_meanings.map((meaning, index) => (
                      <div
                        key={index}
                        className="gradient-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">
                            {meaning.meaning}
                          </h4>
                          <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">
                            #{index + 1}
                          </span>
                        </div>

                        <p className="text-slate-600 leading-relaxed mb-4">
                          {meaning.explanation}
                        </p>

                        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                          <p className="text-slate-600 text-sm">
                            <span className="font-semibold text-slate-700">
                              Usage Context:{" "}
                            </span>
                            {meaning.usage_context}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contextual Meaning */}
                <div className="gradient-border rounded-xl p-6 shadow-lg">
                  <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
                      <Quote className="w-6 h-6 text-white" />
                    </div>
                    <span>Meaning in This Context</span>
                  </h3>

                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <div className="text-sm font-bold text-blue-700 mb-3 uppercase tracking-wide">
                        {data.contextual_meaning.verse_reference}
                      </div>
                      <p className="text-slate-700 text-lg leading-relaxed border-l-4 border-blue-400 pl-4">
                        {renderHighlightedVerse(
                          data.contextual_meaning.verse_text,
                          data.contextual_meaning.word_in_context
                        )}
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-white to-slate-50 rounded-lg p-5 border border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-3 flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                          <span>Word in Context</span>
                        </h4>
                        <p className="text-blue-600 font-semibold mb-2">
                          "{data.contextual_meaning.word_in_context}"
                        </p>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          {data.contextual_meaning.contextual_explanation}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-white to-slate-50 rounded-lg p-5 border border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-3 flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-green-500" />
                          <span>Why This Translation?</span>
                        </h4>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          {data.contextual_meaning.why_this_translation}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border-l-4 border-amber-400">
                      <h4 className="font-bold text-slate-800 mb-3 flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        <span>Deeper Insight</span>
                      </h4>
                      <p className="text-slate-700 font-medium leading-relaxed">
                        {data.contextual_meaning.deeper_insight}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Biblical Usage Examples */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-slate-800 flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <span>Throughout Scripture</span>
                  </h3>

                  <div className="grid gap-6">
                    {data.biblical_usage_examples.map((example, index) => (
                      <div
                        key={index}
                        className="gradient-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm">
                            {example.verse_reference}
                          </span>
                          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">
                            "{example.translated_as}"
                          </span>
                        </div>

                        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-4 mb-4 border-l-4 border-blue-400">
                          <p className="text-slate-800 leading-relaxed">
                            {renderHighlightedVerse(
                              example.verse_text,
                              example.translated_as
                            )}
                          </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-gradient-to-br from-white to-slate-50 rounded-lg p-4 border border-slate-200">
                            <h5 className="font-semibold text-slate-700 mb-2 text-sm">
                              Meaning Used
                            </h5>
                            <p className="text-slate-600 text-sm">
                              {example.meaning_used}
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-white to-slate-50 rounded-lg p-4 border border-slate-200">
                            <h5 className="font-semibold text-slate-700 mb-2 text-sm">
                              Significance
                            </h5>
                            <p className="text-slate-600 text-sm">
                              {example.significance}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center pt-8 border-t border-slate-200">
                  <div className="inline-flex items-center space-x-2 text-slate-500">
                    <Star className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Continue exploring God's Word with deeper understanding
                    </span>
                    <Star className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )}

            {/* Show streaming content while loading (improved fallback) */}
            {!data &&
              Object.keys(streamingState.streamedSections).length > 0 && (
                <div className="p-6 space-y-8">
                  {Object.entries(streamingState.streamedSections).map(
                    ([sectionKey, content], index) => (
                      <div
                        key={sectionKey}
                        className="gradient-border rounded-xl p-6 shadow-lg"
                      >
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                            {getSectionIcon(sectionKey)}
                          </div>
                          <span>{getSectionTitle(sectionKey)}</span>
                          {showCursorFor(sectionKey) && (
                            <div className="flex items-center space-x-2 text-blue-500">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-sm font-medium">
                                Streaming...
                              </span>
                            </div>
                          )}
                        </h3>
                        <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {content}
                          {showCursorFor(sectionKey) && (
                            <span className="streaming-cursor" />
                          )}
                        </div>
                      </div>
                    )
                  )}

                  {/* Global streaming indicator */}
                  {streamingState.isStreaming && (
                    <div className="flex items-center justify-center space-x-3 py-6">
                      <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                      <span className="text-blue-600 font-medium">
                        Analyzing biblical usage patterns...
                      </span>
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

export default StrongsInfoModal;
