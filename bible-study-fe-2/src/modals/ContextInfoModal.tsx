import React, { useEffect, useState, useRef } from "react";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { SideModalLayout } from "./SideModalLayout";

type ContextInfo = {
  MainHeading: string;
  TimelineInfo: string;
  Paras: {
    title: string;
    content: string;
  }[];
};

type StreamingState = {
  isStreaming: boolean;
  streamedSections: {
    MainHeading: string;
    TimelineInfo: string;
    sections: {
      [key: string]: {
        title: string;
        content: string;
        isComplete: boolean;
      };
    };
  };
  parsedData: ContextInfo | null;
  error: string | null;
  isComplete: boolean;
};

type ContextInfoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  book: string;
  chapter: number;
};

export const ContextInfoModal: React.FC<ContextInfoModalProps> = ({
  isOpen,
  onClose,
  book,
  chapter,
}) => {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    streamedSections: {
      MainHeading: "",
      TimelineInfo: "",
      sections: {},
    },
    parsedData: null,
    error: null,
    isComplete: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setStreamingState({
        isStreaming: false,
        streamedSections: {
          MainHeading: "",
          TimelineInfo: "",
          sections: {},
        },
        parsedData: null,
        error: null,
        isComplete: false,
      });
      return;
    }

    const fetchStreamingContext = async () => {
      // Create a unique cache key
      const cacheKey = `chapter-context-${book}-${chapter}`;

      // Try to get cached data first
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const parsed: ContextInfo = JSON.parse(cachedData);
          setStreamingState({
            isStreaming: false,
            streamedSections: {
              MainHeading: "",
              TimelineInfo: "",
              sections: {},
            },
            parsedData: parsed,
            error: null,
            isComplete: true,
          });
          return;
        } catch (err) {
          localStorage.removeItem(cacheKey);
        }
      }

      // Start streaming
      setStreamingState((prev) => ({
        ...prev,
        isStreaming: true,
        error: null,
        streamedSections: {
          MainHeading: "",
          TimelineInfo: "",
          sections: {},
        },
        parsedData: null,
        isComplete: false,
      }));

      try {
        // Create abort controller for this request
        abortControllerRef.current = new AbortController();

        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/chapter-info/${book}/${chapter}`,
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

              if (parsed.type === "header_update") {
                // Update header sections (MainHeading, TimelineInfo)
                setStreamingState((prev) => ({
                  ...prev,
                  streamedSections: {
                    ...prev.streamedSections,
                    [parsed.section]: parsed.content,
                  },
                }));
              } else if (parsed.type === "section_update") {
                // Update paragraph sections incrementally
                const sectionKey = parsed.section;
                const sectionTitle = getSectionTitle(parsed.section);

                setStreamingState((prev) => ({
                  ...prev,
                  streamedSections: {
                    ...prev.streamedSections,
                    sections: {
                      ...prev.streamedSections.sections,
                      [sectionKey]: {
                        title: sectionTitle,
                        content:
                          (prev.streamedSections.sections[sectionKey]
                            ?.content || "") + parsed.content,
                        isComplete: parsed.is_complete,
                      },
                    },
                  },
                }));
              } else if (parsed.type === "complete") {
                // Final structured data received
                const contextData: ContextInfo = parsed.data;

                // Cache the data
                localStorage.setItem(cacheKey, JSON.stringify(contextData));

                setStreamingState((prev) => ({
                  ...prev,
                  isStreaming: false,
                  parsedData: contextData,
                  isComplete: true,
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
              // Continue processing other lines
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
          error: error.message || "Failed to fetch context information",
        }));
      }
    };

    fetchStreamingContext();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isOpen, book, chapter]);

  const getSectionTitle = (sectionKey: string): string => {
    const mapping: { [key: string]: string } = {
      CulturalContext: "Cultural Context",
      WhatMightSeemStrange: "What Might Seem Strange",
      KeyInsights: "Key Insights to Watch For",
      WhyThisMattersToday: "Why This Matters Today",
    };
    return mapping[sectionKey] || sectionKey;
  };

  // Get current data to display (streaming or final)
  const getCurrentData = () => {
    if (streamingState.parsedData) {
      return streamingState.parsedData;
    }

    // Build data from streaming sections
    const { streamedSections } = streamingState;
    return {
      MainHeading: streamedSections.MainHeading,
      TimelineInfo: streamedSections.TimelineInfo,
      Paras: Object.values(streamedSections.sections).map((section) => ({
        title: section.title,
        content: section.content,
      })),
    };
  };

  const currentData = getCurrentData();
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <SideModalLayout isOpen={isOpen} onClose={onClose}>
      <div className="h-full flex flex-col overflow-hidden font-merriweather">
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b border-gray-200 ${
            isMobile ? "" : "sticky top-0 bg-white z-10"
          }`}
        >
          <div className="flex items-center space-x-3">
            <h2 className="text-base font-semibold text-gray-800">
              Chapter Context
            </h2>
            {streamingState.isStreaming && (
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            )}
            {streamingState.isComplete && (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
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
          {/* Loading state - only show if no content yet */}
          {streamingState.isStreaming && !currentData.MainHeading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-gray-500 text-sm">
                Crafting your chapter preview...
              </p>
            </div>
          )}

          {/* Error state */}
          {streamingState.error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                <p className="text-red-500 text-sm">
                  Error loading context: {streamingState.error}
                </p>
                <button
                  onClick={() => {
                    // Reset and retry
                    setStreamingState({
                      isStreaming: false,
                      streamedSections: {
                        MainHeading: "",
                        TimelineInfo: "",
                        sections: {},
                      },
                      parsedData: null,
                      error: null,
                      isComplete: false,
                    });
                    // The useEffect will trigger a new fetch
                  }}
                  className="text-blue-500 text-sm hover:underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          {currentData.MainHeading && (
            <div className="prose prose-gray max-w-none">
              {/* Main Heading */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
                  {currentData.MainHeading}
                  {streamingState.isStreaming && !currentData.TimelineInfo && (
                    <span className="inline-block w-2 h-6 bg-blue-500 animate-pulse ml-1" />
                  )}
                </h1>
                {currentData.TimelineInfo && (
                  <div className="text-sm text-gray-600 font-medium bg-gray-100 px-3 py-1 rounded-full inline-block">
                    {currentData.TimelineInfo}
                    {streamingState.isStreaming &&
                      currentData.Paras.length === 0 && (
                        <span className="inline-block w-1 h-3 bg-blue-500 animate-pulse ml-1" />
                      )}
                  </div>
                )}
              </div>

              {/* Paragraphs */}
              {currentData.Paras && currentData.Paras.length > 0 && (
                <div className="space-y-6 text-gray-800 leading-relaxed">
                  {currentData.Paras.map((section, index) => {
                    const isLastSection =
                      index === currentData.Paras.length - 1;
                    const isCurrentlyStreaming =
                      streamingState.isStreaming &&
                      !streamingState.isComplete &&
                      isLastSection;

                    return (
                      <div key={index}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          {section.title}
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          {section.content}
                          {isCurrentlyStreaming && (
                            <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Call to action - only show when complete */}
              {streamingState.isComplete && streamingState.parsedData && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 font-medium text-center">
                      Ready to dive into{" "}
                      <span className="font-semibold text-indigo-700">
                        {book} {chapter}
                      </span>
                      ? The story awaits your discovery.
                    </p>
                  </div>
                </div>
              )}

              {/* Streaming indicator */}
              {streamingState.isStreaming && !streamingState.isComplete && (
                <div className="mt-4 flex items-center justify-center space-x-2 text-blue-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating insights...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </SideModalLayout>
  );
};

export default ContextInfoModal;
