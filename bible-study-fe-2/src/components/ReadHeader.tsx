"use client";

import { useState, useEffect } from "react";

const books = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "1 Chronicles",
  "2 Chronicles",
  "Ezra",
  "Nehemiah",
];

const versions = ["NLT", "NIV", "KJV", "ESV", "BSB", "AMP", "ASV", "CEV"];

export default function ReadHeader({
  onSelectionChange,
}: {
  onSelectionChange?: (book: string, chapter: number, version: string) => void;
}) {
  const [selectedBook, setSelectedBook] = useState("Genesis");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedVersion, setSelectedVersion] = useState("NLT");

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedBook, selectedChapter, selectedVersion);
    }
  }, [selectedBook, selectedChapter, selectedVersion]);

  const renderChapters = () => {
    return Array.from({ length: 50 }, (_, i) => i + 1).map((num) => (
      <option key={num} value={num}>
        {num}
      </option>
    ));
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 py-6 px-4 border-b border-gray-300 bg-white  sticky top-0 z-50">
      {/* Book Selector */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Book</label>
        <select
          value={selectedBook}
          onChange={(e) => setSelectedBook(e.target.value)}
          className="border px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {books.map((book) => (
            <option key={book} value={book}>
              {book}
            </option>
          ))}
        </select>
      </div>

      {/* Chapter Selector */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Chapter</label>
        <select
          value={selectedChapter}
          onChange={(e) => setSelectedChapter(Number(e.target.value))}
          className="border px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {renderChapters()}
        </select>
      </div>

      {/* Version Selector */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Version</label>
        <select
          value={selectedVersion}
          onChange={(e) => setSelectedVersion(e.target.value)}
          className="border px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {versions.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
