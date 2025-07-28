"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Search, X } from "lucide-react";
import Select from "react-select";

interface TranslationBook {
  id: string;
  name: string;
  commonName: string;
  title: string | null;
  order: number;
  numberOfChapters: number;
  firstChapterApiLink: string;
  lastChapterApiLink: string;
  totalNumberOfVerses: number;
  isApocryphal?: boolean;
}

interface VersionOption {
  label: string;
  value: string;
}

interface ReadHeaderProps {
  onSelectionChange?: (book: string, chapter: number, version: string) => void;
}

// Hardcoded book categories based on screenshots
const BOOK_CATEGORIES = {
  TORAH: ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy"],
  HISTORICAL: [
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
    "Esther",
  ],
  WISDOM: ["Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Songs"],
  PROPHETS: [
    "Isaiah",
    "Jeremiah",
    "Lamentations",
    "Ezekiel",
    "Daniel",
    "Hosea",
    "Joel",
    "Amos",
    "Obadiah",
    "Jonah",
    "Micah",
    "Nahum",
    "Habakkuk",
    "Zephaniah",
    "Haggai",
    "Zechariah",
    "Malachi",
  ],
  GOSPELS: ["Matthew", "Mark", "Luke", "John"],
  ACTS: ["Acts"],
  EPISTLES: [
    "Romans",
    "1 Corinthians",
    "2 Corinthians",
    "Galatians",
    "Ephesians",
    "Philippians",
    "Colossians",
    "1 Thessalonians",
    "2 Thessalonians",
    "1 Timothy",
    "2 Timothy",
    "Titus",
    "Philemon",
    "Hebrews",
    "James",
    "1 Peter",
    "2 Peter",
    "1 John",
    "2 John",
    "3 John",
    "Jude",
  ],
  REVELATION: ["Revelation"],
};

export default function ReadHeader({ onSelectionChange }: ReadHeaderProps) {
  const [availableVersions, setAvailableVersions] = useState<VersionOption[]>(
    []
  );
  const [selectedVersion, setSelectedVersion] = useState<VersionOption | null>(
    null
  );
  const [booksData, setBooksData] = useState<TranslationBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<number>(1);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalStep, setModalStep] = useState<"book" | "chapter">("book");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Fetch available versions
  useEffect(() => {
    const options: VersionOption[] = [{ label: "BSB", value: "BSB" }];
    setAvailableVersions(options);
    setSelectedVersion(options[0]);
  }, []);

  // Fetch books when version changes
  useEffect(() => {
    const fetchBooks = async () => {
      if (!selectedVersion) return;
      try {
        const res = await fetch(
          `https://bible.helloao.org/api/${selectedVersion.value}/books.json`
        );
        const data = await res.json();
        const books: TranslationBook[] = data.books;

        setBooksData(books);

        const defaultBook = books[0];
        setSelectedBook(defaultBook.name);
        setSelectedChapter(1);
      } catch (error) {
        console.error("Error fetching books:", error);
      }
    };

    fetchBooks();
  }, [selectedVersion]);

  const getBooksByCategory = () => {
    const categorizedBooks: { [key: string]: TranslationBook[] } = {};

    Object.entries(BOOK_CATEGORIES).forEach(([category, bookNames]) => {
      categorizedBooks[category] = bookNames
        .map((name) => booksData.find((book) => book.commonName === name))
        .filter(Boolean) as TranslationBook[];
    });

    return categorizedBooks;
  };

  const filteredCategorizedBooks = () => {
    if (!searchTerm) return getBooksByCategory();

    const filtered: { [key: string]: TranslationBook[] } = {};
    Object.entries(getBooksByCategory()).forEach(([category, books]) => {
      const matchingBooks = books.filter((book) =>
        book.commonName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (matchingBooks.length > 0) {
        filtered[category] = matchingBooks;
      }
    });
    return filtered;
  };

  const currentBookData = booksData.find((book) => book.name === selectedBook);

  const handleBookSelect = (bookName: string) => {
    setSelectedBook(bookName);
    setSelectedChapter(1);
    setModalStep("chapter");
    setSearchTerm("");
  };

  const handleChapterSelect = (chapterNum: number) => {
    setSelectedChapter(chapterNum);
    setIsModalOpen(false);
    setModalStep("book");

    const selectedBookObj = booksData.find((b) => b.name === selectedBook);
    if (!selectedBookObj || !onSelectionChange || !selectedVersion) return;

    onSelectionChange(selectedBookObj.id, chapterNum, selectedVersion.value);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalStep("book");
    setSearchTerm("");
  };

  const goBackToBooks = () => {
    setModalStep("book");
    setSearchTerm("");
  };

  const generateChapterGrid = () => {
    if (!currentBookData) return [];
    return Array.from(
      { length: currentBookData.numberOfChapters },
      (_, i) => i + 1
    );
  };

  const customSelectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      minWidth: 100,
      minHeight: 40,
      borderRadius: "0.375rem",
      boxShadow: "none",
      borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
      "&:hover": { borderColor: "#60a5fa" },
      cursor: "pointer",
    }),
    menu: (base: any) => ({ ...base, zIndex: 100 }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#3b82f6"
        : state.isFocused
        ? "#eff6ff"
        : "white",
      color: state.isSelected ? "white" : "#111827",
      cursor: "pointer",
    }),
    singleValue: (base: any) => ({ ...base, color: "#111827" }),
    placeholder: (base: any) => ({ ...base, color: "#6b7280" }),
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-6 py-6 px-4 border-b border-gray-300 bg-white sticky top-0 z-40">
        {/* Book & Chapter Selector */}
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Book & Chapter
          </label>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-between min-w-[200px] px-4 py-2 border border-gray-300 rounded-md bg-white hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <span className="text-gray-900">
              {selectedBook} {selectedChapter}
            </span>
            <svg
              className="w-4 h-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={4}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* Version Selector */}
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Version
          </label>
          <Select
            options={availableVersions}
            value={selectedVersion}
            onChange={(val) => val && setSelectedVersion(val)}
            styles={customSelectStyles}
            placeholder="Loading versions..."
            isSearchable={false}
            isDisabled={!availableVersions.length}
          />
        </div>
      </div>

      {/* Simplified Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[70vh] overflow-hidden shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                {modalStep === "chapter" && (
                  <button
                    onClick={goBackToBooks}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ArrowLeft className="w-4 h-4 text-gray-600" />
                  </button>
                )}
                <h2 className="text-lg font-medium text-gray-800">
                  {modalStep === "book" ? "Select Book" : "Select Chapter"}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[55vh]">
              {modalStep === "book" ? (
                <div className="p-4">
                  {/* Search Bar */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search books..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Categorized Books */}
                  <div className="space-y-4">
                    {Object.entries(filteredCategorizedBooks()).map(
                      ([category, books]) => (
                        <div key={category}>
                          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                            {category}
                          </h3>
                          <div className="space-y-1">
                            {books.map((book) => (
                              <button
                                key={book.name}
                                onClick={() => handleBookSelect(book.name)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-gray-900"
                              >
                                {book.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  {/* Chapter Grid */}
                  <div className="grid grid-cols-6 gap-2">
                    {generateChapterGrid().map((chapterNum) => (
                      <button
                        key={chapterNum}
                        onClick={() => handleChapterSelect(chapterNum)}
                        className={`aspect-square flex items-center justify-center border rounded text-sm font-medium ${
                          chapterNum === selectedChapter
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "border-gray-300 hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        {chapterNum}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
