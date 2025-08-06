import React, { useEffect, useState, useRef } from "react";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Clock,
} from "lucide-react";
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

        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes typewriter {
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

        .slide-in-right {
          animation: slideInFromRight 0.5s ease-out forwards;
        }

        .typewriter-effect {
          animation: typewriter 0.3s ease-out forwards;
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

        .divider-line {
          position: relative;
          margin: 2rem 0;
        }

        .divider-line::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          width: 100%;
          height: 1px;
          background: linear-gradient(to right, transparent, #e5e7eb, transparent);
          transform: translateY(-50%);
        }

        .section-card {
          background: linear-gradient(135deg, #fafafa 0%, #f8f9fa 100%);
          border: 1px solid #e9ecef;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
        }

        .section-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.04);
        }

        .section-header {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e9ecef;
        }

        .section-number {
          width: 28px;
          height: 28px;
          background: #6b7280;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .main-header-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #cbd5e1;
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 32px;
          position: relative;
          overflow: hidden;
        }

        .main-header-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #64748b, #94a3b8);
        }

        .timeline-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #475569;
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          margin-top: 16px;
        }

        .loading-skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 8px;
          height: 20px;
          margin-bottom: 12px;
        }

        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>

      <SideModalLayout isOpen={isOpen} onClose={onClose}>
        <div className="h-full flex flex-col overflow-hidden font-serif bg-gray-50">
          {/* Header */}
          <div
            className={`flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm ${
              isMobile ? "" : "sticky top-0 z-10"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Chapter Context
                </h2>
                <p className="text-sm text-gray-500">
                  {book} • Chapter {chapter}
                </p>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                {streamingState.isStreaming && (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    <span className="text-xs text-blue-600 font-medium">
                      Generating
                    </span>
                  </div>
                )}
                {streamingState.isComplete && (
                  <div className="flex items-center space-x-1 fade-in">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">
                      Complete
                    </span>
                  </div>
                )}
                {streamingState.error && (
                  <div className="flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-red-600 font-medium">
                      Error
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Loading state - only show if no content yet */}
            {streamingState.isStreaming && !currentData.MainHeading && (
              <div className="space-y-6 fade-in">
                <div className="main-header-card">
                  <div
                    className="loading-skeleton"
                    style={{ width: "80%", height: "32px" }}
                  ></div>
                  <div
                    className="loading-skeleton"
                    style={{ width: "60%", height: "16px", marginTop: "16px" }}
                  ></div>
                </div>
                <div className="section-card">
                  <div
                    className="loading-skeleton"
                    style={{ width: "40%", height: "20px" }}
                  ></div>
                  <div
                    className="loading-skeleton"
                    style={{ width: "100%", marginTop: "12px" }}
                  ></div>
                  <div
                    className="loading-skeleton"
                    style={{ width: "90%" }}
                  ></div>
                </div>
                <div className="section-card">
                  <div
                    className="loading-skeleton"
                    style={{ width: "50%", height: "20px" }}
                  ></div>
                  <div
                    className="loading-skeleton"
                    style={{ width: "95%", marginTop: "12px" }}
                  ></div>
                </div>
              </div>
            )}

            {/* Error state */}
            {streamingState.error && (
              <div className="flex items-center justify-center py-16 fade-in-up">
                <div className="text-center space-y-4 max-w-md">
                  <div className="p-4 bg-red-50 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Something went wrong
                  </h3>
                  <p className="text-red-600 text-sm leading-relaxed">
                    {streamingState.error}
                  </p>
                  <button
                    onClick={() => {
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
                    }}
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Content */}
            {currentData.MainHeading && (
              <div className="max-w-none space-y-6">
                {/* Main Heading Card */}
                <div className="main-header-card fade-in-up">
                  <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                    {currentData.MainHeading}
                    {streamingState.isStreaming &&
                      !currentData.TimelineInfo && (
                        <span className="streaming-cursor" />
                      )}
                  </h1>
                  {currentData.TimelineInfo && (
                    <div className="timeline-badge slide-in-right">
                      <Clock className="w-4 h-4" />
                      {currentData.TimelineInfo}
                      {streamingState.isStreaming &&
                        currentData.Paras.length === 0 && (
                          <span
                            className="streaming-cursor"
                            style={{ height: "12px" }}
                          />
                        )}
                    </div>
                  )}
                </div>

                {/* Content Sections */}
                {currentData.Paras && currentData.Paras.length > 0 && (
                  <div className="space-y-5">
                    {currentData.Paras.map((section, index) => {
                      const isLastSection =
                        index === currentData.Paras.length - 1;
                      const isCurrentlyStreaming =
                        streamingState.isStreaming &&
                        !streamingState.isComplete &&
                        isLastSection;

                      return (
                        <div key={index}>
                          <div
                            className="section-card content-section visible"
                            style={{ animationDelay: `${index * 0.15}s` }}
                          >
                            <div className="section-header">
                              <div className="section-number">{index + 1}</div>
                              <h3 className="text-lg font-semibold text-gray-900 flex-1">
                                {section.title}
                              </h3>
                            </div>
                            <div className="text-gray-700 leading-relaxed text-[15px]">
                              {section.content}
                              {isCurrentlyStreaming && (
                                <span className="streaming-cursor" />
                              )}
                            </div>
                          </div>

                          {/* Divider between sections */}
                          {index < currentData.Paras.length - 1 && (
                            <div className="divider-line"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Call to action - only show when complete */}
                {streamingState.isComplete && streamingState.parsedData && (
                  <div
                    className="mt-8 fade-in-up"
                    style={{ animationDelay: "0.3s" }}
                  >
                    <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-center">
                      <div className="w-16 h-16 bg-gray-900 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Ready to Begin Your Journey
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed max-w-md mx-auto">
                        Armed with this context, you're now prepared to dive
                        deep into{" "}
                        <span className="font-semibold text-gray-900">
                          {book} Chapter {chapter}
                        </span>
                        . The narrative awaits your discovery.
                      </p>
                    </div>
                  </div>
                )}

                {/* Streaming indicator */}
                {streamingState.isStreaming && !streamingState.isComplete && (
                  <div className="mt-6 flex items-center justify-center space-x-3 py-4 fade-in">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-blue-600 text-sm font-medium">
                      Crafting insights...
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

export default ContextInfoModal;
