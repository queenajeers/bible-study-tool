import React, { useEffect, useState } from "react";

import { X, Loader2 } from "lucide-react";
import { SideModalLayout } from "./SideModalLayout";

type ContextInfo = {
  MainHeading: string;
  TimelineInfo: string;
  Paras: {
    title: string;
    content: string;
  }[];
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
  const [data, setData] = useState<ContextInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContext = async () => {
      // Create a unique key for this chapter
      const cacheKey = `chapter-context-${book}-${chapter}`;

      // Try to get cached data first
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const parsed: ContextInfo = JSON.parse(cachedData);
          setData(parsed);
          return; // Exit early if we have cached data
        } catch (err) {
          // If parsing fails, remove corrupted cache and continue to fetch
          localStorage.removeItem(cacheKey);
        }
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/explanations/chapter-info/${book}/${chapter}`
        );
        if (!res.ok) throw new Error("Failed to fetch explanation.");

        const json = await res.json();
        const parsed: ContextInfo = JSON.parse(json.result);

        // Cache the data for future use
        localStorage.setItem(cacheKey, JSON.stringify(parsed));

        setData(parsed);
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchContext();
    }
  }, [isOpen, book, chapter]);

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
          <h2 className="text-base font-semibold text-gray-800">
            Chapter Context
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-gray-500 text-sm">
                Crafting your chapter preview...
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <p className="text-red-500 text-sm">
                Error loading context: {error}
              </p>
            </div>
          )}

          {!loading && !error && data && (
            <div className="prose prose-gray max-w-none">
              {/* Main Heading */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
                  {data.MainHeading}
                </h1>
                <div className="text-sm text-gray-600 font-medium bg-gray-100 px-3 py-1 rounded-full inline-block">
                  {data.TimelineInfo}
                </div>
              </div>

              {/* Natural flowing paragraphs */}
              <div className="space-y-6 text-gray-800 leading-relaxed">
                {data.Paras.map((section, index) => (
                  <div key={index}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {section.title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Call to action */}
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
            </div>
          )}
        </div>
      </div>
    </SideModalLayout>
  );
};
