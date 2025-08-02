import React, { useEffect, useState } from "react";
import {
  X,
  Loader2,
  BookOpen,
  Volume2,
  Quote,
  Lightbulb,
  Heart,
  Languages,
  Clock,
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
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "figurative":
        return "bg-gray-50 text-gray-700 border-gray-200";
      case "metaphorical":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const renderHighlightedVerse = (
    verse: string,
    instruction: string,
    strongsWord?: string
  ) => {
    // Enhanced highlighting logic with multiple word support
    let highlightTexts: string[] = [];

    // Extract highlight text from instruction
    if (instruction.includes("highlight:")) {
      const instructionText = instruction.split("highlight:")[1]?.trim() || "";
      // Split by commas or "and" to handle multiple words
      highlightTexts = instructionText
        .split(/,|\sand\s/)
        .map((text) => text.trim())
        .filter((text) => text.length > 0);
    }

    // If no specific instruction, try to highlight the Strong's word and common variations
    if (highlightTexts.length === 0 && strongsWord) {
      highlightTexts = [strongsWord];

      // Add common word variations
      const baseWord = strongsWord.toLowerCase();
      const variations = [
        baseWord,
        baseWord + "s",
        baseWord + "ed",
        baseWord + "ing",
        baseWord + "er",
        baseWord + "est",
        baseWord.endsWith("e") ? baseWord.slice(0, -1) + "ing" : "",
        baseWord.endsWith("y") ? baseWord.slice(0, -1) + "ies" : "",
        baseWord.endsWith("y") ? baseWord.slice(0, -1) + "ied" : "",
      ].filter((v) => v.length > 2); // Filter out very short variations

      highlightTexts = [...new Set([strongsWord, ...variations])];
    }

    if (highlightTexts.length > 0) {
      // Create case-insensitive regex for all highlight texts
      const escapedTexts = highlightTexts.map((text) =>
        text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      );

      // Sort by length (longest first) to avoid partial matches
      escapedTexts.sort((a, b) => b.length - a.length);

      const regex = new RegExp(`\\b(${escapedTexts.join("|")})\\b`, "gi");

      const parts = verse.split(regex);

      return (
        <>
          {parts.map((part, index) =>
            part && regex.test(part) ? (
              <span
                key={index}
                className="bg-yellow-100 text-yellow-900 px-1 rounded font-medium"
              >
                {part}
              </span>
            ) : (
              <span key={index}>{part}</span>
            )
          )}
        </>
      );
    }
    return verse;
  };

  return (
    <SideModalLayout isOpen={isOpen} onClose={onClose}>
      <div className="h-full flex flex-col overflow-hidden font-serif">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Strong's Analysis
              </h2>
              <p className="text-xs text-gray-600">
                {book} {chapter}:{verse} • "{word}"
              </p>
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
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <div className="text-center">
                <p className="text-gray-600 font-medium">
                  Analyzing the word "{word}"
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Diving deep into the original meaning...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-16 px-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                <p className="text-red-600 text-sm text-center">
                  Error loading Strong's data: {error}
                </p>
              </div>
            </div>
          )}

          {!loading && !error && data && (
            <div className="p-6 space-y-8">
              {/* Word Analysis Header */}
              <div className="text-center border-b border-gray-200 pb-6">
                <div className="inline-flex items-center space-x-2 bg-blue-50 rounded-full px-3 py-1 mb-3">
                  <Languages className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {data.word_analysis.original_language}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                  {data.word_analysis.english_word}
                </h1>
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full font-medium text-sm">
                  {data.word_analysis.strongs_number}
                </span>
              </div>

              {/* Original Word Section */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Volume2 className="w-5 h-5 mr-2 text-blue-500" />
                  Original Word
                </h3>
                <div className="space-y-4">
                  <div className="text-center bg-gray-50 rounded-lg p-4">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {data.original_word.original_script}
                    </div>
                    <div className="text-lg text-gray-700 font-medium">
                      {data.original_word.transliteration}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                        Pronunciation
                      </div>
                      <div className="text-gray-900">
                        {data.original_word.pronunciation}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                        Sounds Like
                      </div>
                      <div className="text-gray-900">
                        {data.original_word.pronunciation_audio_guide}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Word Meanings */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Meanings & Definitions
                </h3>
                <div className="space-y-4">
                  {data.word_meanings.map((meaning, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-gray-900 flex-1">
                          {meaning.meaning}
                        </h4>
                        <span
                          className={`text-xs px-2 py-1 rounded-full border font-medium ${getUsageTypeColor(
                            meaning.usage_type
                          )}`}
                        >
                          {meaning.usage_type}
                        </span>
                      </div>
                      <p className="text-gray-600 leading-relaxed">
                        {meaning.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verse Reading */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Quote className="w-5 h-5 mr-2 text-blue-500" />
                  Deeper Meaning in Context
                </h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Original Reading
                    </div>
                    <p className="text-gray-700 italic border-l-4 border-gray-300 pl-3">
                      {data.verse_with_deeper_meaning.original_verse}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2">
                      Enhanced Reading
                    </div>
                    <p className="text-gray-900 font-medium border-l-4 border-blue-400 pl-3 text-lg">
                      {renderHighlightedVerse(
                        data.verse_with_deeper_meaning.enhanced_reading,
                        data.verse_with_deeper_meaning.highlight_instruction
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 mb-3 leading-relaxed">
                      {data.verse_with_deeper_meaning.meaning_explanation}
                    </p>
                    {data.verse_with_deeper_meaning.figurative_note && (
                      <p className="text-gray-600 text-sm italic bg-gray-50 p-3 rounded-lg border-l-4 border-gray-300">
                        {data.verse_with_deeper_meaning.figurative_note}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Related Verses */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
                  This Word Throughout Scripture
                </h3>
                <div className="space-y-4">
                  {data.related_verses.slice(0, 6).map((verse, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {verse.verse_reference}
                        </span>
                        <span className="text-xs text-gray-600">
                          Strong's Word:{" "}
                          <span className="font-medium">
                            {verse.strongs_word_used}
                          </span>
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 mb-3 border-l-4 border-blue-400">
                        <p className="text-gray-800">
                          {renderHighlightedVerse(
                            verse.verse_text,
                            verse.highlight_instruction,
                            verse.strongs_word_used
                          )}
                        </p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-600">
                          <span className="font-medium">Context: </span>
                          {verse.context_usage}
                        </p>
                        <p className="text-gray-600 italic">
                          <span className="font-medium">Insight: </span>
                          {verse.connection_insight}
                        </p>
                      </div>
                    </div>
                  ))}
                  {data.related_verses.length > 6 && (
                    <div className="text-center">
                      <button className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors">
                        Show {data.related_verses.length - 6} more verses
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Practical Application */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-blue-500" />
                  Practical Application
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      title: "What This Means for You",
                      content:
                        data.practical_application.what_this_means_for_you,
                    },
                    {
                      title: "What This Teaches Us",
                      content: data.practical_application.what_this_teaches_us,
                    },
                    {
                      title: "Historical Context",
                      content: data.practical_application.historical_context,
                    },
                    {
                      title: "How to Apply Today",
                      content: data.practical_application.how_to_apply_today,
                    },
                  ].map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">
                        {item.title}
                      </h4>
                      <p className="text-gray-700 leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Thoughts */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-blue-500" />
                  Final Thoughts
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">
                      Word Summary
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      {data.final_thoughts.word_summary}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-800 font-medium mb-3 leading-relaxed">
                      {data.final_thoughts.encouragement}
                    </p>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-blue-900 font-bold text-center">
                        {data.final_thoughts.key_takeaway}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
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
