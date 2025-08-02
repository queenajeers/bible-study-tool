import React, { useEffect, useState } from "react";
import {
  X,
  Loader2,
  BookOpen,
  Volume2,
  Quote,
  Lightbulb,
  Heart,
} from "lucide-react";
import { SideModalLayout } from "./SideModalLayout";

type WordMeaning = {
  meaning: string;
  explanation: string;
  usage_type: string;
};

type RelatedVerse = {
  verse_reference: string;
  verse_text: string;
  strongs_word_used: string;
  highlight_instruction: string;
  context_usage: string;
  connection_insight: string;
};

type StrongsData = {
  word_analysis: {
    english_word: string;
    strongs_number: string;
    original_language: string;
  };
  original_word: {
    original_script: string;
    transliteration: string;
    pronunciation: string;
    pronunciation_audio_guide: string;
  };
  word_meanings: WordMeaning[];
  verse_with_deeper_meaning: {
    original_verse: string;
    enhanced_reading: string;
    highlight_instruction: string;
    meaning_explanation: string;
    figurative_note: string;
  };
  related_verses: RelatedVerse[];
  practical_application: {
    what_this_means_for_you: string;
    what_this_teaches_us: string;
    historical_context: string;
    how_to_apply_today: string;
  };
  final_thoughts: {
    word_summary: string;
    encouragement: string;
    key_takeaway: string;
  };
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
  const [data, setData] = useState<StrongsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStrongsData = async () => {
      if (!word.trim()) return;

      // Create a unique cache key
      const cacheKey = `strongs-${book}-${chapter}-${verse}-${word.toLowerCase()}`;
      console.log(cacheKey);
      // Try cached data first
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const parsed: StrongsData = JSON.parse(cachedData);
          setData(parsed);
          return;
        } catch (err) {
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
        if (!res.ok) throw new Error("Failed to fetch Strong's data.");

        const json = await res.json();
        const parsed: StrongsData = JSON.parse(json.result);

        // Cache the data
        localStorage.setItem(cacheKey, JSON.stringify(parsed));
        setData(parsed);
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && word) {
      fetchStrongsData();
    }
  }, [isOpen, book, chapter, word]);

  const getUsageTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "literal":
        return "bg-green-50 text-green-700 border-green-200";
      case "figurative":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "metaphorical":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const renderHighlightedVerse = (verse: string, instruction: string) => {
    // Simple highlighting based on instruction
    if (instruction.includes("highlight:")) {
      const highlightText = instruction.split("highlight:")[1]?.trim();
      if (highlightText) {
        const parts = verse.split(highlightText);
        return (
          <>
            {parts[0]}
            <span className="bg-yellow-100 text-yellow-800 px-1 rounded font-medium">
              {highlightText}
            </span>
            {parts[1]}
          </>
        );
      }
    }
    return verse;
  };

  return (
    <SideModalLayout isOpen={isOpen} onClose={onClose}>
      <div className="h-full flex flex-col overflow-hidden font-merriweather">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-gray-800">
              Strong's Analysis
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-gray-500 text-sm">
                Analyzing the word "{word}"...
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12 px-6">
              <p className="text-red-500 text-sm text-center">
                Error loading Strong's data: {error}
              </p>
            </div>
          )}

          {!loading && !error && data && (
            <div className="p-6 space-y-8">
              {/* Word Analysis Header */}
              <div className="text-center border-b border-gray-100 pb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {data.word_analysis.english_word}
                </h1>
                <div className="flex items-center justify-center space-x-4 text-sm">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                    {data.word_analysis.strongs_number}
                  </span>
                  <span className="text-gray-600">
                    {data.word_analysis.original_language}
                  </span>
                </div>
              </div>

              {/* Original Word */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Volume2 className="w-5 h-5 mr-2 text-indigo-600" />
                  Original Word
                </h3>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-900 mb-2">
                      {data.original_word.original_script}
                    </div>
                    <div className="text-lg text-indigo-700 font-medium">
                      {data.original_word.transliteration}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Pronunciation
                      </div>
                      <div className="text-gray-800">
                        {data.original_word.pronunciation}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Sounds Like
                      </div>
                      <div className="text-gray-800">
                        {data.original_word.pronunciation_audio_guide}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Word Meanings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Meanings & Definitions
                </h3>
                <div className="grid gap-3">
                  {data.word_meanings.map((meaning, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 flex-1">
                          {meaning.meaning}
                        </h4>
                        <span
                          className={`text-xs px-2 py-1 rounded border ${getUsageTypeColor(
                            meaning.usage_type
                          )}`}
                        >
                          {meaning.usage_type}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        {meaning.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enhanced Verse Reading */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Quote className="w-5 h-5 mr-2 text-yellow-600" />
                  Deeper Meaning in Context
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Original Reading
                    </div>
                    <p className="text-gray-800 italic border-l-4 border-gray-300 pl-4">
                      {data.verse_with_deeper_meaning.original_verse}
                    </p>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-yellow-700 uppercase tracking-wide mb-2">
                      Enhanced Reading
                    </div>
                    <p className="text-gray-900 font-medium border-l-4 border-yellow-400 pl-4">
                      {renderHighlightedVerse(
                        data.verse_with_deeper_meaning.enhanced_reading,
                        data.verse_with_deeper_meaning.highlight_instruction
                      )}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-gray-700 text-sm mb-2">
                      {data.verse_with_deeper_meaning.meaning_explanation}
                    </p>
                    {data.verse_with_deeper_meaning.figurative_note && (
                      <p className="text-gray-600 text-xs italic">
                        {data.verse_with_deeper_meaning.figurative_note}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Related Verses */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  This Word Throughout Scripture
                </h3>
                <div className="space-y-4">
                  {data.related_verses.slice(0, 6).map((verse, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-600">
                          {verse.verse_reference}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {verse.strongs_word_used}
                        </span>
                      </div>
                      <p className="text-gray-800 mb-2 text-sm">
                        {renderHighlightedVerse(
                          verse.verse_text,
                          verse.highlight_instruction
                        )}
                      </p>
                      <p className="text-gray-600 text-xs mb-1">
                        {verse.context_usage}
                      </p>
                      <p className="text-gray-700 text-xs italic">
                        {verse.connection_insight}
                      </p>
                    </div>
                  ))}
                  {data.related_verses.length > 6 && (
                    <div className="text-center">
                      <button className="text-blue-600 text-sm hover:text-blue-800 transition-colors">
                        Show {data.related_verses.length - 6} more verses...
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Practical Application */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-green-600" />
                  Practical Application
                </h3>
                <div className="grid gap-4">
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">
                      What This Means for You
                    </h4>
                    <p className="text-gray-700 text-sm">
                      {data.practical_application.what_this_means_for_you}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">
                      What This Teaches Us
                    </h4>
                    <p className="text-gray-700 text-sm">
                      {data.practical_application.what_this_teaches_us}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">
                      Historical Context
                    </h4>
                    <p className="text-gray-700 text-sm">
                      {data.practical_application.historical_context}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">
                      How to Apply Today
                    </h4>
                    <p className="text-gray-700 text-sm">
                      {data.practical_application.how_to_apply_today}
                    </p>
                  </div>
                </div>
              </div>

              {/* Final Thoughts */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-purple-600" />
                  Final Thoughts
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-purple-800 mb-2">
                      Word Summary
                    </h4>
                    <p className="text-gray-700 text-sm">
                      {data.final_thoughts.word_summary}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-gray-800 text-sm font-medium mb-2">
                      {data.final_thoughts.encouragement}
                    </p>
                    <div className="bg-purple-100 rounded-lg p-3">
                      <p className="text-purple-900 text-sm font-medium text-center">
                        💡 {data.final_thoughts.key_takeaway}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Continue exploring God's Word with deeper understanding
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </SideModalLayout>
  );
};
