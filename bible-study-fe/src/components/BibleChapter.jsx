import React, { useEffect, useState } from "react";

const BibleChapter = () => {
  const [chapterData, setChapterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const translationId = "BSB";
  const bookId = "GEN";
  const chapterNumber = 1;

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

  const renderVerseContent = (contentArray) =>
    contentArray.map((item, index) => {
      if (typeof item === "string") return item;
      if (item.lineBreak) return <br key={`lb-${index}`} />;
      if (item.poem)
        return (
          <span
            key={`poem-${index}`}
            className="italic"
            style={{ marginLeft: `${item.poem * 1.5}rem` }}
          >
            {item.text}
          </span>
        );
      return null;
    });

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!chapterData)
    return <div className="p-10 text-center">No data available</div>;

  const { translation, book, chapter } = chapterData;

  return (
    <div className="flex justify-center px-6 sm:px-8 lg:px-12 py-16 bg-gray-50 min-h-screen">
      <div className="max-w-lg w-full">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-bold text-gray-900 leading-tight tracking-tight">
            {book.title} {chapter.number}
          </h1>
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
              return (
                <span key={`${book.id}-${chapter.number}-${block.number}`}>
                  <sup className="text-xs text-gray-400 mr-1 font-sans font-semibold">
                    {block.number}
                  </sup>
                  {renderVerseContent(block.content)}{" "}
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
  );
};

export default BibleChapter;
