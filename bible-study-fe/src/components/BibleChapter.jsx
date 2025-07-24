import React, { useEffect, useState } from "react";
import { X, BookOpen } from "lucide-react";
import VersesSidebar from "./VersesSidebar";

const BibleChapter = () => {
  const [chapterData, setChapterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVerses, setSelectedVerses] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const translationId = "BSB";
  const bookId = "GEN";
  const chapterNumber = 1;

  // ✅ Combine verse content into clean sentence
  const getVerseText = (content) =>
    content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item.text) return item.text;
        return "";
      })
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

  useEffect(() => {
    fetch(
      `https://bible.helloao.org/api/${translationId}/${bookId}/${chapterNumber}.json`
    )
      .then((res) => res.json())
      .then((data) => {
        setChapterData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch Bible chapter:", error);
        setLoading(false);
      });
  }, []);

  const handleVerseClick = (e) => {
    const verseKey = e.currentTarget.dataset.versedatakey;
    const verseText = e.currentTarget.dataset.versetext;
    const verseNumber = e.currentTarget.dataset.versenumber;

    setSelectedVerses((prevSelected) => {
      const exists = prevSelected.some((v) => Object.keys(v)[0] === verseKey);
      if (exists) {
        const newSelected = prevSelected.filter(
          (v) => Object.keys(v)[0] !== verseKey
        );
        // Close sidebar if no verses selected
        if (newSelected.length === 0) {
          setSidebarOpen(false);
        }
        return newSelected;
      } else {
        // Open sidebar when first verse is selected
        if (prevSelected.length === 0) {
          setSidebarOpen(true);
        }
        return [
          ...prevSelected,
          { [verseKey]: { text: verseText, number: verseNumber } },
        ];
      }
    });
  };

  const clearAllSelected = () => {
    setSelectedVerses([]);
    setSidebarOpen(false);
  };

  const removeVerse = (verseKey) => {
    setSelectedVerses((prev) => {
      const newSelected = prev.filter((v) => Object.keys(v)[0] !== verseKey);
      if (newSelected.length === 0) {
        setSidebarOpen(false);
      }
      return newSelected;
    });
  };

  const renderVerseContent = (contentArray) =>
    contentArray.map((item, index) => {
      if (typeof item === "string") {
        return (
          <React.Fragment key={index}>
            {item}
            {index !== contentArray.length - 1 ? " " : ""}
          </React.Fragment>
        );
      }

      if (item.lineBreak) {
        return <br key={`lb-${index}`} />;
      }

      if (item.poem) {
        return (
          <span
            key={`poem-${index}`}
            className="italic"
            style={{ marginLeft: `${item.poem * 1.5}rem` }}
          >
            {item.text}
            {index !== contentArray.length - 1 && " "}
          </span>
        );
      }

      return null;
    });

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!chapterData)
    return <div className="p-10 text-center">No data available</div>;

  const { translation, book, chapter } = chapterData;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "mr-96" : ""
        }`}
      >
        <div className="flex justify-center px-6 sm:px-8 lg:px-12 py-16">
          <div className="max-w-lg w-full">
            <div className="flex items-center justify-between mb-12">
              <h1 className="text-4xl font-bold text-gray-900 leading-tight tracking-tight">
                {book.title} {chapter.number}
              </h1>
              {selectedVerses.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
                    {selectedVerses.length} selected
                  </span>
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-full transition-colors"
                  >
                    <BookOpen size={20} />
                  </button>
                </div>
              )}
            </div>

            <div className="text-sm text-gray-500 mb-8 font-medium">
              {translation.shortName}
            </div>

            <div
              className="text-gray-800 leading-relaxed text-lg font-serif"
              style={{ lineHeight: "1.75" }}
            >
              {chapter.content.map((block, index) => {
                if (block.type === "heading") {
                  return (
                    <h2
                      key={index}
                      className="text-2xl font-bold mt-12 mb-6 text-gray-900 font-sans"
                    >
                      {block.content.join(" ")}
                    </h2>
                  );
                }

                if (block.type === "verse") {
                  const verseText = getVerseText(block.content);
                  const verseKey = `${translation.id}-${book.id}-${chapter.number}-${block.number}`;

                  const isSelected = selectedVerses.some(
                    (v) => Object.keys(v)[0] === verseKey
                  );

                  return (
                    <span
                      key={verseKey}
                      data-versedatakey={verseKey}
                      data-versetext={verseText}
                      data-versenumber={block.number}
                      className={`cursor-pointer rounded-md transition-all duration-200 px-2 py-1 -mx-1 ${
                        isSelected
                          ? "bg-blue-100 border border-blue-200"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={handleVerseClick}
                    >
                      <sup className="text-xs text-gray-400 mr-1 font-sans font-semibold">
                        {block.number}
                      </sup>
                      {renderVerseContent(block.content)}
                    </span>
                  );
                }

                if (block.type === "line_break") {
                  return <br key={`br-${index}`} />;
                }

                return null;
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Verses Sidebar Component */}
      <VersesSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        selectedVerses={selectedVerses}
        onRemoveVerse={removeVerse}
        onClearAll={clearAllSelected}
        bookTitle={book.title}
        chapterNumber={chapter.number}
      />
    </div>
  );
};

export default BibleChapter;
