import { useEffect, useRef, useState } from "react";
import type {
  ChapterData,
  VerseContentItem,
} from "../Types/bible-chapter-types";

type BibleChapterProps = {
  book: string;
  chapter: number;
  version: string;
};

const BibleChapter = ({ book, chapter, version }: BibleChapterProps) => {
  const [chapterData, setChapterData] = useState<ChapterData>(
    {} as ChapterData
  );
  const [loading, setLoading] = useState(true);

  const [selectedRange, setSelectedRange] = useState<{
    startVerse: number;
    endVerse: number;
    text: string;
  } | null>(null);

  const [highlightedRanges, setHighlightedRanges] = useState<
    { startVerse: number; endVerse: number }[]
  >([]);

  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [unhighlightTooltip, setUnhighlightTooltip] = useState<{
    x: number;
    y: number;
    highlightElement: HTMLElement;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        // Check if selection overlaps any existing highlight
        const selectionRects = Array.from(range.getClientRects());

        const highlightedEls =
          containerRef.current?.querySelectorAll(".bg-yellow-200");

        let overlapsExistingHighlight = false;

        if (highlightedEls) {
          for (const el of highlightedEls) {
            const rects = el.getClientRects();
            for (const rect of rects) {
              for (const selRect of selectionRects) {
                const overlaps =
                  rect.left < selRect.right &&
                  rect.right > selRect.left &&
                  rect.top < selRect.bottom &&
                  rect.bottom > selRect.top;
                if (overlaps) {
                  overlapsExistingHighlight = true;
                  break;
                }
              }
              if (overlapsExistingHighlight) break;
            }
            if (overlapsExistingHighlight) break;
          }
        }

        if (overlapsExistingHighlight) {
          setSelectedRange(null);
          setTooltipPosition(null);
          return;
        }

        const getVerseFromNode = (node: Node | null): string | null => {
          while (node) {
            if (node instanceof HTMLElement && node.dataset.verse) {
              return node.dataset.verse;
            }
            node = node.parentNode;
          }
          return null;
        };

        const startVerse = getVerseFromNode(range.startContainer);
        const endVerse = getVerseFromNode(range.endContainer);

        if (startVerse && endVerse) {
          const start = parseInt(startVerse);
          const end = parseInt(endVerse);

          setSelectedRange({
            startVerse: Math.min(start, end),
            endVerse: Math.max(start, end),
            text,
          });

          if (selectionRects.length > 0 && containerRef.current) {
            const firstRect = selectionRects[0];
            const containerRect = containerRef.current.getBoundingClientRect();

            setTooltipPosition({
              x: firstRect.left - containerRect.left + firstRect.width / 2,
              y: firstRect.top - containerRect.top - 40,
            });
          }
        }
      } else {
        setSelectedRange(null);
        setTooltipPosition(null);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check if clicked element has bg-yellow-200 class (is highlighted)
      if (target.classList.contains("bg-yellow-200")) {
        e.preventDefault();
        e.stopPropagation();

        if (containerRef.current) {
          const rect = target.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();

          setUnhighlightTooltip({
            x: rect.left - containerRect.left + rect.width / 2,
            y: rect.top - containerRect.top - 40,
            highlightElement: target,
          });
        }
      } else {
        // Hide unhighlight tooltip if clicking elsewhere
        setUnhighlightTooltip(null);
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("click", handleClick);
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`https://bible.helloao.org/api/${version}/${book}/${chapter}.json`)
      .then((res) => res.json())
      .then((data) => {
        setChapterData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch Bible chapter:", error);
        setLoading(false);
      });
  }, [book, chapter, version]);

  const renderVerseContent = (contentArray: VerseContentItem[]) =>
    contentArray.map((item, index) => {
      if (typeof item === "string") return item;
      if (item.lineBreak) return <br key={`lb-${index}`} />;
      if (item.poem)
        return (
          <span key={`poem-${index}`} className="italic-[0.5]">
            {item.text} <br />
          </span>
        );
      return null;
    });

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!chapterData)
    return <div className="p-10 text-center">No data available</div>;

  const { book: bookMeta, chapter: chapterMeta } = chapterData;

  return (
    <div
      ref={containerRef}
      className="relative flex justify-center px-6 sm:px-8 lg:px-12 py-16 bg-white min-h-screen"
    >
      <div className="max-w-lg w-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-merriweather font-light text-4xl text-gray-900 leading-tight tracking-tight">
            {bookMeta.title} {chapterMeta.number}
          </h1>
        </div>

        <div
          className="text-gray-800 leading-relaxed font-serif"
          style={{ lineHeight: "1.75" }}
        >
          {chapterMeta.content.map((block, index) => {
            if (block.type === "heading") {
              return (
                <h2
                  key={index}
                  className="font-bold mt-4 mb-4 text-2xl text-gray-900 font-sans"
                >
                  {block.content.join(" ")}
                </h2>
              );
            }
            if (block.type === "verse") {
              return (
                <span
                  data-verse={block.number}
                  data-verse-id={`${bookMeta.id}-${chapterMeta.number}-${block.number}`}
                  className={`text-[20px] font-merriweather verse-span ${
                    highlightedRanges.some(
                      (range) =>
                        block.number >= range.startVerse &&
                        block.number <= range.endVerse
                    )
                      ? "bg-yellow-200"
                      : ""
                  }`}
                  key={`${bookMeta.id}-${chapterMeta.number}-${block.number}`}
                >
                  <sup className="text-sm text-gray-600 mr-1 font-merriweather font-semibold select-none">
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
      {tooltipPosition &&
        selectedRange &&
        selectedRange.startVerse === selectedRange.endVerse && (
          <div
            className="absolute z-50 bg-white border border-gray-300 shadow-lg rounded-md px-3 py-1 text-sm transition-all duration-150"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: "translateX(-50%)", // Horizontally center
            }}
          >
            <button
              className="text-blue-600 hover:underline"
              onClick={() => {
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) return;

                const range = selection.getRangeAt(0);
                const clonedContent = range.cloneContents();

                // Create a span to hold the highlighted content
                const wrapper = document.createElement("span");
                wrapper.className = "bg-yellow-200 cursor-pointer";
                wrapper.appendChild(clonedContent);

                // Replace the selected content with the new highlighted span
                range.deleteContents();
                range.insertNode(wrapper);

                // Clean up selection
                selection.removeAllRanges();

                // Clear tooltip and state
                setTooltipPosition(null);
                setSelectedRange(null);
              }}
            >
              Highlight
            </button>
          </div>
        )}

      {unhighlightTooltip && (
        <div
          className="absolute z-50 bg-white border border-gray-300 shadow-lg rounded-md px-3 py-1 text-sm transition-all duration-150"
          style={{
            left: `${unhighlightTooltip.x}px`,
            top: `${unhighlightTooltip.y}px`,
            transform: "translateX(-50%)", // Horizontally center
          }}
        >
          <button
            className="text-red-600 hover:underline"
            onClick={() => {
              const highlightElement = unhighlightTooltip.highlightElement;

              // Get the text content and create a text node
              const textContent = highlightElement.textContent || "";
              const textNode = document.createTextNode(textContent);

              // Replace the highlighted span with plain text
              if (highlightElement.parentNode) {
                highlightElement.parentNode.replaceChild(
                  textNode,
                  highlightElement
                );
              }

              // Clear tooltip
              setUnhighlightTooltip(null);
            }}
          >
            Unhighlight
          </button>
        </div>
      )}
    </div>
  );
};

export default BibleChapter;
