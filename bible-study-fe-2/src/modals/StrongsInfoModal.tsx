import React, { useEffect, useState } from "react";
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

  const renderHighlightedVerse = (verseText: string, translatedAs: string) => {
    if (!translatedAs) return verseText;

    // Create variations of the word to highlight
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
          <button onClick={onClose} className="p-2 rounded-full text-gray-600">
            <X className="w-5 h-5" />
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
              <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md">
                <p className="text-gray-600 text-sm text-center">
                  Error loading Strong's data: {error}
                </p>
              </div>
            </div>
          )}

          {!loading && !error && data && (
            <div className="p-6 space-y-8">
              {/* Original Language Info Header */}
              <div className="text-center border-b border-gray-200 pb-6">
                <div className="inline-flex items-center space-x-2 bg-blue-50 rounded-full px-3 py-1 mb-3">
                  <Languages className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {data.original_language_info.original_language}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                  {data.original_language_info.original_script}
                </h1>
                <div className="text-lg text-gray-700 font-medium mb-3">
                  {data.original_language_info.transliteration}
                </div>
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full font-medium text-sm">
                  {data.original_language_info.strongs_number}
                </span>
              </div>

              {/* Pronunciation Section */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Volume2 className="w-5 h-5 mr-2 text-blue-500" />
                  Pronunciation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                      Pronunciation
                    </div>
                    <div className="text-gray-900">
                      {data.original_language_info.pronunciation}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                      Sounds Like
                    </div>
                    <div className="text-gray-900">
                      {data.original_language_info.pronunciation_guide}
                    </div>
                  </div>
                </div>
              </div>

              {/* General Meanings */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Scroll className="w-5 h-5 mr-2 text-blue-500" />
                  Various Meanings in Original Language
                </h3>
                <div className="space-y-4">
                  {data.general_meanings.map((meaning, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-gray-900 flex-1">
                          {meaning.meaning}
                        </h4>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                          #{index + 1}
                        </span>
                      </div>
                      <p className="text-gray-600 leading-relaxed mb-3">
                        {meaning.explanation}
                      </p>
                      <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-gray-300">
                        <p className="text-gray-600 text-sm">
                          <span className="font-medium">Usage: </span>
                          {meaning.usage_context}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contextual Meaning */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Quote className="w-5 h-5 mr-2 text-blue-500" />
                  Meaning in Context
                </h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
                      {data.contextual_meaning.verse_reference}
                    </div>
                    <p className="text-gray-700 border-l-4 border-gray-300 pl-3">
                      {renderHighlightedVerse(
                        data.contextual_meaning.verse_text,
                        data.contextual_meaning.word_in_context
                      )}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">
                        Word in Context: "
                        {data.contextual_meaning.word_in_context}"
                      </h4>
                      <p className="text-gray-700 leading-relaxed">
                        {data.contextual_meaning.contextual_explanation}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">
                        Why This Translation?
                      </h4>
                      <p className="text-gray-700 leading-relaxed">
                        {data.contextual_meaning.why_this_translation}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                      <h4 className="font-bold text-gray-900 mb-2">
                        Deeper Insight
                      </h4>
                      <p className="text-gray-700 font-medium">
                        {data.contextual_meaning.deeper_insight}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Biblical Usage Examples */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
                  This Word Throughout Scripture
                </h3>
                <div className="space-y-4">
                  {data.biblical_usage_examples.map((example, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {example.verse_reference}
                        </span>
                        <span className="text-xs text-gray-600">
                          Translated as: "{example.translated_as}"
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 mb-3 border-l-4 border-blue-400">
                        <p className="text-gray-800">
                          {renderHighlightedVerse(
                            example.verse_text,
                            example.translated_as
                          )}
                        </p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-600">
                            <span className="font-medium">Meaning Used: </span>
                            {example.meaning_used}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-600">
                            <span className="font-medium">Significance: </span>
                            {example.significance}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
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
