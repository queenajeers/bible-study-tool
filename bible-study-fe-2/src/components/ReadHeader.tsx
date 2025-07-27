"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
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
  // Set static versions: BSB, ESV, NASB
  useEffect(() => {
    const options: VersionOption[] = [{ label: "BSB", value: "BSB" }];
    setAvailableVersions(options);
    setSelectedVersion(options[0]); // Default to BSB
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

  // Notify parent of selection change
  useEffect(() => {
    if (!onSelectionChange || !selectedVersion || !selectedBook) return;

    const selectedBookObj = booksData.find((b) => b.name === selectedBook);
    if (!selectedBookObj) return;

    onSelectionChange(
      selectedBookObj.id,
      selectedChapter,
      selectedVersion.value
    );
  }, [
    selectedBook,
    selectedChapter,
    selectedVersion,
    onSelectionChange,
    booksData,
  ]);

  const filteredBooks = booksData.filter((book) =>
    book.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[70vh] overflow-hidden shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-4">
                {modalStep === "chapter" && (
                  <button
                    onClick={goBackToBooks}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                )}
                <h2 className="text-lg font-medium text-gray-500 uppercase tracking-wide">
                  {modalStep === "book" ? "BOOK" : "CHAPTER"}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
              >
                <span className="text-sm font-medium">CANCEL</span>
              </button>
            </div>

            <div className="p-3 overflow-y-auto max-h-[50vh]">
              {modalStep === "book" ? (
                <>
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Filter Books..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    {filteredBooks.map((book) => (
                      <button
                        key={book.name}
                        onClick={() => handleBookSelect(book.name)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-base font-medium text-gray-900"
                      >
                        {book.name}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-5 gap-1">
                  {generateChapterGrid().map((chapterNum) => (
                    <button
                      key={chapterNum}
                      onClick={() => handleChapterSelect(chapterNum)}
                      className="aspect-square flex items-center justify-center border border-gray-300 hover:bg-blue-50 hover:border-blue-400 rounded text-base font-medium text-gray-900 transition-colors min-h-[40px]"
                    >
                      {chapterNum}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
