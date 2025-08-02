import React, { useEffect, useState } from "react";
import { X, Loader2, BookOpen, Hash, Languages, Lightbulb } from "lucide-react";
import { SideModalLayout } from "./SideModalLayout";

type OriginalFormat = {
  original_script: string;
  transliteration: string;
  pronunciation: string;
};

type WordBreakdown = {
  meaning_type: string;
  explanation: string;
  why_it_matters: string;
};

type BetterVerseReading = {
  original_verse: string;
  with_deeper_meaning: string;
  explanation: string;
};

type CrossReference = {
  verse_reference: string;
  verse_text: string;
  translated_as: string;
  how_its_used: string;
  deeper_insight: string;
};

type PracticalInsights = {
  what_this_teaches: string;
  cultural_background: string;
  how_to_apply: string;
};

type StrongsInfo = {
  word: string;
  strongs_number: string;
  original_language: string;
  original_format: OriginalFormat;
  simple_meaning: string;
  word_breakdown: WordBreakdown[];
  better_verse_reading: BetterVerseReading;
  cross_references: CrossReference[];
  practical_insights: PracticalInsights;
  summary: string;
};

type StrongsInfoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  book: string;
  chapter: number;
  word: string;
  verseNumber: number;
};

export const StrongsInfoModal: React.FC<StrongsInfoModalProps> = ({
  isOpen,
  onClose,
  book,
  chapter,
  word,
}) => {
  const [data, setData] = useState<StrongsInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStrongsInfo = async () => {
      // Create a unique key for this word lookup
      const cacheKey = `strongs-${book}-${chapter}-${word.toLowerCase()}`;

      // Try to get cached data first
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const parsed: StrongsInfo = JSON.parse(cachedData);
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
          `http://127.0.0.1:8000/explanations/strong-info/${book}/${chapter}/${encodeURIComponent(
            word
          )}`
        );
        if (!res.ok) throw new Error("Failed to fetch Strong's information.");

        const json = await res.json();
        console.log("Raw API response:", json);

        const parsed: StrongsInfo = JSON.parse(json.result);
        console.log("Parsed StrongsInfo:", parsed);
        console.log("original_format exists?", !!parsed.original_format);
        console.log("original_format value:", parsed.original_format);

        // Cache the data for future use
        localStorage.setItem(cacheKey, JSON.stringify(parsed));

        setData(parsed);
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && word) {
      fetchStrongsInfo();
    }
  }, [isOpen, book, chapter, word]);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const highlightWord = (text: string, wordToHighlight: string) => {
    if (!wordToHighlight) return text;

    const regex = new RegExp(`\\b(${wordToHighlight})\\b`, "gi");
    return text.replace(
      regex,
      '<mark class="bg-gray-200 font-medium">$1</mark>'
    );
  };

  return (
    <SideModalLayout isOpen={isOpen} onClose={onClose}>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b border-gray-200 bg-white ${
            isMobile ? "" : "sticky top-0 z-10"
          }`}
        >
          <div className="flex items-center space-x-3">
            <BookOpen className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Word Study</h2>
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
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
              <p className="text-gray-600 text-base">
                Looking up "{word}" in the original language...
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <p className="text-red-600 text-base">
                Error loading word study: {error}
              </p>
            </div>
          )}

          {!loading && !error && data && (
            <div className="space-y-8">
              {/* Word Header */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">
                    "{data.word}"
                  </h1>
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-mono bg-gray-100 text-gray-700 px-3 py-1 rounded">
                      {data.strongs_number}
                    </span>
                  </div>
                </div>

                {/* Original Language Info */}
                <div className="bg-gray-50 rounded-lg p-5 mb-6 border">
                  <div className="flex items-center space-x-2 mb-4">
                    <Languages className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-900 text-lg">
                      Original {data.original_language || "Language"}
                    </span>
                  </div>
                  {data.original_format ? (
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-gray-700 text-base">
                          Written as:{" "}
                        </span>
                        <span className="text-xl font-hebrew text-gray-900">
                          {data.original_format.original_script || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 text-base">
                          Sounds like:{" "}
                        </span>
                        <span className="italic text-gray-800 text-base">
                          {data.original_format.transliteration || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 text-base">
                          Pronunciation:{" "}
                        </span>
                        <span className="text-gray-800 text-base">
                          {data.original_format.pronunciation || "N/A"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-base">
                      Original format information not available
                    </p>
                  )}
                </div>

                {/* Simple Meaning */}
                <div className="border-l-4 border-gray-400 bg-gray-50 p-5 rounded-r">
                  <h3 className="font-semibold text-gray-900 text-lg mb-3">
                    What it means:
                  </h3>
                  <p className="text-gray-800 leading-relaxed text-base">
                    {data.simple_meaning}
                  </p>
                </div>
              </div>

              {/* Better Verse Reading */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-gray-600" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Understanding {book} {chapter} Better
                  </h3>
                </div>
                {data.better_verse_reading ? (
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-5">
                    <div className="mb-4">
                      <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        Original reading:
                      </span>
                      <p className="text-gray-700 italic mt-2 text-base leading-relaxed">
                        "{data.better_verse_reading.original_verse || "N/A"}"
                      </p>
                    </div>
                    <div className="mb-4">
                      <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        With deeper understanding:
                      </span>
                      <p className="text-gray-900 font-medium mt-2 text-base leading-relaxed">
                        "
                        {data.better_verse_reading.with_deeper_meaning || "N/A"}
                        "
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        Why this matters:
                      </span>
                      <p className="text-gray-800 mt-2 leading-relaxed text-base">
                        {data.better_verse_reading.explanation || "N/A"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-5">
                    <p className="text-gray-600 text-base">
                      Verse comparison not available
                    </p>
                  </div>
                )}
              </div>

              {/* Word Breakdown */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-5">
                  Understanding This Word Better
                </h3>
                {data.word_breakdown && data.word_breakdown.length > 0 ? (
                  <div className="space-y-5">
                    {data.word_breakdown.map((breakdown, index) => (
                      <div
                        key={index}
                        className="border-l-2 border-gray-300 pl-5 py-2"
                      >
                        <h4 className="font-semibold text-gray-900 mb-3 text-lg">
                          {breakdown.meaning_type || "Meaning"}
                        </h4>
                        <p className="text-gray-800 mb-3 leading-relaxed text-base">
                          {breakdown.explanation || "No explanation available"}
                        </p>
                        <div className="bg-gray-50 p-3 rounded border">
                          <p className="text-gray-700 text-base">
                            <strong className="text-gray-900">
                              Why it matters:
                            </strong>{" "}
                            {breakdown.why_it_matters || "Not specified"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-base">
                    Word breakdown not available
                  </p>
                )}
              </div>

              {/* Cross References */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Same Original Word, Different Translations
                </h3>
                <p className="text-gray-600 mb-5 text-base">
                  These verses use the same original{" "}
                  {data.original_language || "language"} word (
                  {data.strongs_number || "N/A"}) but may be translated
                  differently in English:
                </p>
                {data.cross_references && data.cross_references.length > 0 ? (
                  <div className="space-y-4">
                    {data.cross_references.map((ref, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg p-4 border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 text-base">
                            {ref.verse_reference || "Reference N/A"}
                          </h4>
                          <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded font-medium">
                            "{ref.translated_as || "N/A"}"
                          </span>
                        </div>
                        <div
                          className="text-gray-800 mb-3 italic leading-relaxed text-base"
                          dangerouslySetInnerHTML={{
                            __html: highlightWord(
                              ref.verse_text || "Verse text not available",
                              ref.translated_as || ""
                            ),
                          }}
                        />
                        <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                          <p className="text-gray-700">
                            <span className="font-medium text-gray-900">
                              How it's used:{" "}
                            </span>
                            {ref.how_its_used || "Not specified"}
                          </p>
                          <p className="text-gray-700">
                            <span className="font-medium text-gray-900">
                              Deeper insight:{" "}
                            </span>
                            {ref.deeper_insight || "Not available"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-base">
                    Cross references not available
                  </p>
                )}
              </div>

              {/* Practical Insights */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-5">
                  What This Means for You
                </h3>
                {data.practical_insights ? (
                  <div className="space-y-5">
                    <div className="bg-white border border-gray-200 rounded-lg p-5">
                      <h4 className="font-semibold text-gray-900 mb-3 text-lg">
                        What This Teaches Us
                      </h4>
                      <p className="text-gray-800 leading-relaxed text-base">
                        {data.practical_insights.what_this_teaches ||
                          "Not available"}
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-5">
                      <h4 className="font-semibold text-gray-900 mb-3 text-lg">
                        Historical Context
                      </h4>
                      <p className="text-gray-800 leading-relaxed text-base">
                        {data.practical_insights.cultural_background ||
                          "Not available"}
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-5">
                      <h4 className="font-semibold text-gray-900 mb-3 text-lg">
                        How to Apply This Today
                      </h4>
                      <p className="text-gray-800 leading-relaxed text-base">
                        {data.practical_insights.how_to_apply ||
                          "Not available"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 text-base">
                    Practical insights not available
                  </p>
                )}
              </div>

              {/* Summary */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Summary
                </h3>
                <div className="bg-gray-50 rounded-lg p-5 border-l-4 border-gray-400">
                  <p className="text-gray-800 leading-relaxed text-base">
                    {data.summary}
                  </p>
                </div>
              </div>

              {/* Call to action */}
              <div className="pt-6 border-t border-gray-200">
                <div className="bg-gray-50 rounded-lg p-5 text-center">
                  <p className="text-gray-800 font-medium text-base">
                    Now you understand "{word}" better in{" "}
                    <span className="font-semibold text-gray-900">
                      {book} {chapter}
                    </span>
                    ! Keep exploring God's Word with fresh understanding.
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
