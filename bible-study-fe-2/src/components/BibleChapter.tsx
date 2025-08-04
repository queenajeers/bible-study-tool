import { useEffect, useRef, useState } from "react";
import type {
  Book,
  Chapter,
  ChapterData,
  VerseContentItem,
} from "../Types/bible-chapter-types";
// import { VerseModal } from "../modals/VerseModal";
import { Info } from "lucide-react";
import { SideModalLayout } from "../modals/SideModalLayout";
import { VerseModalContent } from "../modals/VerseModalContent";
import { ContextInfoModal } from "../modals/ContextInfoModal";
import { StrongsInfoModal } from "../modals/StrongsInfoModal";
import StrongsAnalysisModal from "../modals/StrongsAnalysisModal";

type BibleChapterProps = {
  book: string;
  chapter: number;
  version: string;
};

type HighlightData = {
  [verseId: string]: {
    highlights: string[];
  };
};

// Configurable highlight styling variables
const HIGHLIGHT_STYLES = {
  backgroundColor: "bg-blue-200", // Main highlight background color
  hoverBackgroundColor: "hover:bg-blue-300", // Hover background color
  selector: ".bg-blue-200", // CSS selector for highlights (must match backgroundColor)
};

// Configurable tooltip styling variables
const TOOLTIP_STYLES = {
  backgroundColor: "bg-gray-900", // Black background
  borderColor: "border-gray-700", // Dark border
  textColor: "text-gray-200", // Light text
  textHoverColor: "text-white", // White on hover
  hoverBackgroundColor: "hover:bg-gray-800", // Darker hover background
  activeBackgroundColor: "active:bg-gray-700", // Active state background
  shadowColor: "rgba(0, 0, 0, 0.3)", // Darker shadow
  arrowColor: "border-t-gray-900", // Arrow color to match background
};

// Configurable tooltip actions
type TooltipAction = {
  label: string;
  className?: string;
  onClick: (
    selectedRange: SelectedRange,
    bookMeta: any,
    chapterMeta: any
  ) => void;
};

export type SelectedRange = {
  startVerse: number;
  endVerse: number;
  text: string;
};

// Configuration for tooltip actions - Dark theme style
const TOOLTIP_CONFIG = {
  // Actions for non-highlighted text selection
  selection: [
    {
      label: "Highlight",
      className: `${TOOLTIP_STYLES.textColor} ${TOOLTIP_STYLES.textHoverColor} font-medium transition-colors duration-150`,
      onClick: (
        selectedRange: SelectedRange | null,
        bookMeta: any,
        chapterMeta: any,
        context: any
      ) => {
        context.handleHighlight(selectedRange, bookMeta, chapterMeta);
      },
    },
    {
      label: "Notes",
      className: `${TOOLTIP_STYLES.textColor} ${TOOLTIP_STYLES.textHoverColor} font-medium transition-colors duration-150`,
      onClick: (
        selectedRange: SelectedRange | null,
        bookMeta: any,
        chapterMeta: any,
        context: any
      ) => {
        if (!selectedRange) return;

        const verseId = `${bookMeta.id}-${chapterMeta.number}-${selectedRange.startVerse}`;
        const textId = selectedRange.text.replace(/\s+/g, "");
        const noteId = `${verseId}-${textId}`;

        // Highlight first if not already highlighted
        context.handleHighlight(selectedRange, bookMeta, chapterMeta);

        // Find verse element
        const verseEl = context.containerRef.current?.querySelector(
          `[data-verse-id="${verseId}"]`
        ) as HTMLElement;

        if (verseEl && noteId) {
          console.log("SAVING THE TEXT " + selectedRange.text);
          context.openStickyNote(noteId, verseEl, true, selectedRange.text);
        }

        context.setTooltipPosition(null);
      },
    },
    {
      label: "Insights",
      className: `${TOOLTIP_STYLES.textColor} ${TOOLTIP_STYLES.textHoverColor} font-medium transition-colors duration-150`,
      onClick: (
        selectedRange: SelectedRange | null,
        bookMeta: any,
        chapterMeta: any,
        context: any
      ) => {
        console.log("Insights clicked for:", selectedRange);
        context.handleInsightsForNewText(selectedRange, bookMeta, chapterMeta);
      },
    },
    {
      label: "Strong’s",
      className: `${TOOLTIP_STYLES.textColor} ${TOOLTIP_STYLES.textHoverColor} font-medium transition-colors duration-150`,
      onClick: (
        selectedRange: SelectedRange | null,
        bookMeta: any,
        chapterMeta: any,
        context: any
      ) => {
        if (selectedRange?.text?.split(/\s+/).length === 1) {
          context.setCurrentVerse(selectedRange.startVerse);
          context.setStrongsModal(selectedRange.text);
        }
      },
    },
  ],
  // Actions for highlighted text
  highlight: [
    {
      label: "Unhighlight",
      className: `${TOOLTIP_STYLES.textColor} ${TOOLTIP_STYLES.textHoverColor} font-medium transition-colors duration-150`,
      onClick: (
        selectedRange: SelectedRange | null,
        bookMeta: any,
        chapterMeta: any,
        context: any
      ) => {
        context.handleUnhighlight();
      },
    },
    {
      label: "Notes",
      className: `${TOOLTIP_STYLES.textColor} ${TOOLTIP_STYLES.textHoverColor} font-medium transition-colors duration-150`,
      onClick: (
        selectedRange: SelectedRange | null,
        bookMeta: any,
        chapterMeta: any,
        context: any
      ) => {
        const highlightElement = context.highlightElement;
        const verseId = highlightElement?.getAttribute("data-verse-id");
        let textId: string = highlightElement?.getAttribute(
          "data-highlight-text"
        );
        textId = textId.replace(/\s+/g, "");

        const noteId = `${verseId}-${textId}`;

        const verseEl = context.containerRef.current?.querySelector(
          `[data-verse-id="${verseId}"]`
        ) as HTMLElement;

        if (verseId && verseEl) {
          context.openStickyNote(noteId, verseEl, false);
        }

        context.setUnhighlightTooltip(null);
      },
    },
    {
      label: "Insights",
      className: `${TOOLTIP_STYLES.textColor} ${TOOLTIP_STYLES.textHoverColor} font-medium transition-colors duration-150`,
      onClick: (
        _: SelectedRange,
        bookMeta: any,
        chapterMeta: any,
        context: any
      ) => {
        context.handleInsightsForAHighlight(null, bookMeta, chapterMeta);
      },
    },
  ],
};

const BibleChapter = ({ book, chapter, version }: BibleChapterProps) => {
  const [chapterData, setChapterData] = useState<ChapterData>(
    {} as ChapterData
  );
  const [loading, setLoading] = useState(true);

  const [selectedRange, setSelectedRange] = useState<SelectedRange | null>(
    null
  );
  const [highlightData, setHighlightData] = useState<HighlightData>({});

  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [unhighlightTooltip, setUnhighlightTooltip] = useState<{
    x: number;
    y: number;
    highlightElement: HTMLElement;
  } | null>(null);

  const [notePanelVerseId, setNotePanelVerseId] = useState<string | null>(null);
  const [notePanelPosition, setNotePanelPosition] = useState<{
    x: number;
    y: number;
    positionMode?: "sidebar" | "overlay";
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const appliedHighlightsRef = useRef<Set<string>>(new Set());

  // Modals Data
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVerseKey, setCurrentVerseKey] = useState("");
  const [currentHighlightText, setCurrentHighlightText] = useState("");
  const [currentVerse, setCurrentVerse] = useState(0);

  const [isContextOpen, setIsContextOpen] = useState(false);

  const [isStrongsOpen, setIsStrongsOpen] = useState(false);
  const [strongsWord, setStrongsWord] = useState<string | null>(null);

  // Generate storage key for current chapter
  const getStorageKey = () => `bible-highlights-${version}-${book}-${chapter}`;

  // Load highlights from localStorage
  const loadHighlights = (): HighlightData => {
    try {
      const stored = localStorage.getItem(getStorageKey());
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error("Error loading highlights:", error);
      return {};
    }
  };

  // Save highlights to localStorage
  const saveHighlights = (highlights: HighlightData) => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(highlights));
    } catch (error) {
      console.error("Error saving highlights:", error);
    }
  };

  // Generate a unique key for each highlight
  const getHighlightKey = (verseId: string, text: string) =>
    `${verseId}:${text}`;

  // Apply only new highlights without clearing existing ones
  const applyNewHighlights = () => {
    if (!containerRef.current) return;

    Object.entries(highlightData).forEach(([verseId, data]) => {
      data.highlights.forEach((highlightText) => {
        const highlightKey = getHighlightKey(verseId, highlightText);

        // Only apply if not already applied
        if (!appliedHighlightsRef.current.has(highlightKey)) {
          const verseElement = containerRef.current?.querySelector(
            `[data-verse-id="${verseId}"]`
          );
          if (verseElement) {
            const success = highlightTextInElement(
              verseElement as HTMLElement,
              highlightText,
              verseId
            );
            if (success) {
              appliedHighlightsRef.current.add(highlightKey);
            }
          }
        }
      });
    });
  };

  // Remove specific highlight from DOM
  const removeHighlightFromDOM = (verseId: string, highlightText: string) => {
    if (!containerRef.current) return;

    const highlightElements = containerRef.current.querySelectorAll(
      `${HIGHLIGHT_STYLES.selector}[data-verse-id="${verseId}"][data-highlight-text="${highlightText}"]`
    );

    highlightElements.forEach((element) => {
      const textContent = element.textContent || "";
      const textNode = document.createTextNode(textContent);
      if (element.parentNode) {
        element.parentNode.replaceChild(textNode, element);
      }
    });

    // Remove from applied highlights tracking
    const highlightKey = getHighlightKey(verseId, highlightText);
    appliedHighlightsRef.current.delete(highlightKey);
  };

  // Function to highlight specific text within an element
  const highlightTextInElement = (
    element: HTMLElement,
    textToHighlight: string,
    verseId: string
  ): boolean => {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    const textNodes: Text[] = [];
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
    }

    for (const textNode of textNodes) {
      const text = textNode.textContent || "";
      const index = text.indexOf(textToHighlight);

      if (index !== -1) {
        // Split the text node
        const beforeText = text.substring(0, index);
        const afterText = text.substring(index + textToHighlight.length);

        // Create new nodes
        const beforeNode = beforeText
          ? document.createTextNode(beforeText)
          : null;
        const highlightSpan = document.createElement("span");
        highlightSpan.className = `${HIGHLIGHT_STYLES.backgroundColor} ${HIGHLIGHT_STYLES.hoverBackgroundColor} cursor-pointer transition-colors duration-150`;
        highlightSpan.textContent = textToHighlight;
        // Store the exact text and verse ID for reliable unhighlighting
        highlightSpan.setAttribute("data-highlight-text", textToHighlight);
        highlightSpan.setAttribute("data-verse-id", verseId);
        const afterNode = afterText ? document.createTextNode(afterText) : null;

        // Replace the original text node
        const parent = textNode.parentNode;
        if (parent) {
          if (beforeNode) parent.insertBefore(beforeNode, textNode);
          parent.insertBefore(highlightSpan, textNode);
          if (afterNode) parent.insertBefore(afterNode, textNode);
          parent.removeChild(textNode);
        }

        return true; // Successfully highlighted
      }
    }
    return false; // Text not found
  };

  // Add highlight to data and save
  const addHighlight = (verseId: string, text: string) => {
    setHighlightData((prev) => {
      const updated = {
        ...prev,
        [verseId]: {
          highlights: prev[verseId]
            ? [...prev[verseId].highlights, text]
            : [text],
        },
      };
      saveHighlights(updated);
      return updated;
    });
  };

  // Remove highlight from data and save
  const removeHighlight = (verseId: string, text: string) => {
    // First remove from DOM immediately
    removeHighlightFromDOM(verseId, text);

    // Then update state
    setHighlightData((prev) => {
      const updated = { ...prev };
      if (updated[verseId]) {
        updated[verseId].highlights = updated[verseId].highlights.filter(
          (highlight) => highlight !== text
        );
        // Remove verse entry if no highlights left
        if (updated[verseId].highlights.length === 0) {
          delete updated[verseId];
        }
      }
      saveHighlights(updated);
      return updated;
    });
  };

  // Handler functions for tooltip actions
  const handleHighlight = (
    selectedRange: SelectedRange,
    bookMeta: Book,
    chapterMeta: Chapter
  ) => {
    if (!selectedRange) return;

    const verseId = `${bookMeta.id}-${chapterMeta.number}-${selectedRange.startVerse}`;

    // Add to highlight data
    addHighlight(verseId, selectedRange.text);

    // Apply visual highlight immediately
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const clonedContent = range.cloneContents();

    const wrapper = document.createElement("span");
    wrapper.className = `${HIGHLIGHT_STYLES.backgroundColor} ${HIGHLIGHT_STYLES.hoverBackgroundColor} cursor-pointer transition-colors duration-150`;
    wrapper.appendChild(clonedContent);
    wrapper.setAttribute("data-highlight-text", selectedRange.text);
    wrapper.setAttribute("data-verse-id", verseId);

    setCurrentHighlightText(selectedRange.text);

    range.deleteContents();
    range.insertNode(wrapper);

    // Track this highlight as applied
    const highlightKey = getHighlightKey(verseId, selectedRange.text);
    appliedHighlightsRef.current.add(highlightKey);

    selection.removeAllRanges();
    setTooltipPosition(null);
    setSelectedRange(null);
  };

  const handleUnhighlight = () => {
    if (!unhighlightTooltip) return;

    const highlightElement = unhighlightTooltip.highlightElement;
    const highlightText = highlightElement.getAttribute("data-highlight-text");
    const verseId = highlightElement.getAttribute("data-verse-id");

    if (highlightText && verseId) {
      removeHighlight(verseId, highlightText);
    }

    setUnhighlightTooltip(null);
  };

  const handleInsightsForNewText = (
    selectedRange: SelectedRange,
    bookMeta: Book,
    chapterMeta: Chapter
  ) => {
    handleHighlight(selectedRange, bookMeta, chapterMeta);

    // SET currentVerseKey
    const verseKey = `${bookMeta.id}-${chapterMeta.number}-${selectedRange.startVerse}`;

    setCurrentVerseKey(verseKey);

    setCurrentVerse(selectedRange.startVerse);
    setCurrentHighlightText(selectedRange.text);

    setIsModalOpen(true);
    setTooltipPosition(null);
    setUnhighlightTooltip(null);
  };

  const handleInsightsForAHighlight = (
    _: SelectedRange, // discard incoming
    bookMeta: Book,
    chapterMeta: Chapter
  ) => {
    const el = unhighlightTooltip?.highlightElement;
    const text = el?.getAttribute("data-highlight-text");
    const verseId = el?.getAttribute("data-verse-id");

    if (text && verseId) {
      const [bookId, chapterNum, verseNum] = verseId.split("-");
      const startVerse = parseInt(verseNum, 10);

      const newRange: SelectedRange = {
        startVerse,
        endVerse: startVerse,
        text,
      };

      setSelectedRange(newRange);
      setCurrentVerseKey(verseId);

      setCurrentVerse(newRange.startVerse);
      setCurrentHighlightText(newRange.text);

      setIsModalOpen(true);
      setTooltipPosition(null);
      setUnhighlightTooltip(null);
    }
  };

  const openStickyNote = (
    verseId: string,
    anchorElement: HTMLElement,
    isNew?: boolean,
    selectedText?: string
  ) => {
    const rect = anchorElement.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (isNew) {
      console.log("SAVING");
      localStorage.setItem(
        `note-${verseId}`,
        JSON.stringify({
          NotesByUser: "",
          verseLinked: selectedText,
        })
      );
    }

    if (containerRect) {
      const viewportWidth = window.innerWidth;
      const notePanelWidth = 350; // Panel width
      const padding = 20;
      const contentRightEdge = containerRect.left + containerRect.width;
      const availableRightSpace = viewportWidth - contentRightEdge - padding;

      let x, y;
      let positionMode = "sidebar"; // 'sidebar' or 'overlay'

      // Check if we have enough space for sidebar on larger screens
      if (viewportWidth >= 1024 && availableRightSpace >= notePanelWidth) {
        // Sidebar mode: Position in the right margin area
        x = contentRightEdge + padding;
        // Remove the offset - position directly at the verse top
        y = rect.top;
        positionMode = "sidebar";
      } else {
        // Overlay mode: Position over content with smart positioning
        positionMode = "overlay";

        // Try right side first
        x = rect.right - containerRect.left + 20;

        // If not enough space on right, try left
        if (x + notePanelWidth > viewportWidth - padding) {
          x = rect.left - containerRect.left - notePanelWidth - 20;
        }

        // If still not enough space, center it
        if (x < padding) {
          x = Math.max(padding, (viewportWidth - notePanelWidth) / 2);
        }

        // Remove the offset - position directly at the verse top
        y = rect.top;
      }

      // Ensure y position stays in viewport
      const viewportHeight = window.innerHeight;
      const notePanelHeight = 280;

      if (y + notePanelHeight > viewportHeight - padding) {
        y = Math.max(padding, viewportHeight - notePanelHeight - padding);
      }

      if (y < padding) {
        y = padding;
      }

      setNotePanelPosition({ x, y, positionMode });
      setNotePanelVerseId(verseId);
    }
  };

  // Context object for tooltip action handlers
  const getActionContext = () => ({
    handleHighlight,
    handleUnhighlight,
    highlightElement: unhighlightTooltip?.highlightElement,
    setTooltipPosition,
    setSelectedRange,
    setUnhighlightTooltip,
    handleInsightsForNewText,
    handleInsightsForAHighlight,
    containerRef,
    openStickyNote,
    setStrongsModal: (word: string) => {
      setStrongsWord(word);
      setIsStrongsOpen(true);
    },
    setCurrentVerse,
  });

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        setNotePanelVerseId(null);

        // Check if selection overlaps any existing highlight
        const selectionRects = Array.from(range.getClientRects());
        const highlightedEls = containerRef.current?.querySelectorAll(
          HIGHLIGHT_STYLES.selector
        );

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
            const viewportWidth = window.innerWidth;

            // Calculate tooltip width (approximate)
            const tooltipWidth = 280; // Adjust based on your tooltip content
            const padding = 16; // Padding from screen edges

            // Calculate initial position
            let x = firstRect.left - containerRect.left + firstRect.width / 2;

            // Ensure tooltip stays within bounds
            const minX = tooltipWidth / 2 + padding;
            const maxX = viewportWidth - tooltipWidth / 2 - padding;

            x = Math.min(Math.max(x, minX), maxX);

            setTooltipPosition({
              x,
              y: firstRect.top - containerRect.top - 70,
            });
          }
        }
      } else {
        setSelectedRange(null);
        setTooltipPosition(null);
      }
    };

    // Also update the click handler for highlight tooltips
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check if clicked element has data-highlight-text attribute (is a highlight)
      if (target.hasAttribute("data-highlight-text")) {
        e.preventDefault();
        e.stopPropagation();
        const text = target?.getAttribute("data-highlight-text");
        if (text) {
          setCurrentHighlightText(text);
        }
        setNotePanelVerseId(null);

        if (containerRef.current) {
          const rect = target.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();
          const viewportWidth = window.innerWidth;

          // Calculate tooltip width (approximate)
          const tooltipWidth = 280;
          const padding = 16;

          // Calculate initial position
          let x = rect.left - containerRect.left + rect.width / 2;

          // Ensure tooltip stays within bounds
          const minX = tooltipWidth / 2 + padding;
          const maxX = viewportWidth - tooltipWidth / 2 - padding;

          x = Math.min(Math.max(x, minX), maxX);

          setUnhighlightTooltip({
            x,
            y: rect.top - containerRect.top - 70,
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
  // Load highlights on mount and when chapter changes
  useEffect(() => {
    const highlights = loadHighlights();
    setHighlightData(highlights);
    // Clear applied highlights tracking when chapter changes
    appliedHighlightsRef.current.clear();
  }, [book, chapter, version]);

  // Apply highlights when data loads or highlights change
  useEffect(() => {
    if (!loading && chapterData.chapter) {
      // Only apply new highlights, don't clear existing ones
      applyNewHighlights();
    }
  }, [loading, chapterData, highlightData]);

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
      if (item.noteId) return <span key={`n-${index}`}> </span>;
      if (item.poem)
        return (
          <span key={`poem-${index}`} className="italic-[0.5]">
            {item.text} <br />
          </span>
        );
      return null;
    });

  const hasStrongsData = (
    book: string,
    chapter: number,
    word: string,
    verse: number
  ): boolean => {
    const key = `strongs-${book}-${chapter}-${verse}-${word.toLowerCase()}`;
    return localStorage.getItem(key) !== null;
  };
  const getStrongsWordsForVerse = (
    book: string,
    chapter: number,
    verse: number,
    contentArray: VerseContentItem[]
  ): string[] => {
    const words: string[] = [];

    for (const item of contentArray) {
      if (typeof item === "string") {
        const candidates = item.match(/\b[a-zA-Z]+\b/g);
        if (candidates) {
          candidates.forEach((word) => {
            if (hasStrongsData(book, chapter, word, verse)) {
              console.log("FOUND!");
              words.push(word);
            }
          });
        }
      }
    }

    return [...new Set(words.map((w) => w.toLowerCase()))]; // Deduplicate
  };

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
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-merriweather font-light text-4xl text-gray-900 leading-tight tracking-tight">
              {bookMeta.title} {chapterMeta.number}
            </h1>
            <button
              onClick={() => {
                setIsContextOpen(true);
              }}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1.5 text-sm font-medium shadow-sm transition"
            >
              <Info className="w-4 h-4" />
              Background & Context
            </button>
          </div>
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
              const verseId = `${bookMeta.id}-${chapterMeta.number}-${block.number}`;
              const strongsWords = getStrongsWordsForVerse(
                book,
                chapter,
                block.number, // Pass the verse number
                block.content
              );
              console.log(strongsWord);

              return (
                <span
                  data-verse={block.number}
                  data-verse-id={verseId}
                  className="text-[20px] font-merriweather verse-span"
                  key={verseId}
                >
                  <sup className="text-sm text-gray-600 mr-1 font-merriweather font-semibold select-none">
                    {block.number}
                  </sup>
                  {renderVerseContent(block.content)}{" "}
                  {/* Strong's words inline */}
                  {strongsWords.length > 0 &&
                    strongsWords.map((word, idx) => (
                      <button
                        key={`${verseId}-strongs-${idx}`}
                        className="text-xs font-semibold text-indigo-800 bg-indigo-100 hover:bg-indigo-200 px-2 py-1 rounded ml-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        onClick={() => {
                          setCurrentVerse(block.number);
                          setStrongsWord(word);
                          setIsStrongsOpen(true);
                        }}
                        title="View Strong's Info"
                        aria-label={`Strong's word: ${word}`}
                        type="button"
                      >
                        #{word}
                      </button>
                    ))}
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

      {/* Selection Tooltip - Dark theme style for non-highlighted text */}
      {tooltipPosition &&
        selectedRange &&
        selectedRange.startVerse === selectedRange.endVerse && (
          <div
            className={`absolute z-50 ${TOOLTIP_STYLES.backgroundColor} ${TOOLTIP_STYLES.borderColor} border shadow-lg rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-sm transition-all duration-200 ease-out animate-in fade-in slide-in-from-top-2`}
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: "translateX(-50%)",
              boxShadow: `0 10px 40px -10px ${TOOLTIP_STYLES.shadowColor}, 0 2px 9px -3px ${TOOLTIP_STYLES.shadowColor}`,
              backdropFilter: "blur(16px)",
              maxWidth: "90vw", // Ensure tooltip doesn't exceed viewport
              width: "max-content",
            }}
          >
            <div className="flex items-center space-x-3 sm:space-x-6 whitespace-nowrap">
              {TOOLTIP_CONFIG.selection
                .filter((action) => {
                  if (
                    action.label === "Strong’s" &&
                    selectedRange?.text?.split(/\s+/).length !== 1
                  ) {
                    return false;
                  }
                  return true;
                })
                .map((action, index) => (
                  <button
                    key={index}
                    className={`${action.className} px-1.5 py-1 sm:px-2 sm:py-1 rounded-md ${TOOLTIP_STYLES.hoverBackgroundColor} ${TOOLTIP_STYLES.activeBackgroundColor} text-xs sm:text-sm leading-5 whitespace-nowrap`}
                    onClick={() =>
                      action.onClick(
                        selectedRange,
                        bookMeta,
                        chapterMeta,
                        getActionContext()
                      )
                    }
                  >
                    {action.label}
                  </button>
                ))}
            </div>
            {/* Tooltip arrow */}
            <div
              className={`absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${TOOLTIP_STYLES.arrowColor}`}
              style={{
                filter: `drop-shadow(0 2px 4px ${TOOLTIP_STYLES.shadowColor})`,
              }}
            />
          </div>
        )}

      {/* Highlight Tooltip - Dark theme style for already highlighted text */}
      {unhighlightTooltip && (
        <div
          className={`absolute z-50 ${TOOLTIP_STYLES.backgroundColor} ${TOOLTIP_STYLES.borderColor} border shadow-lg rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-sm transition-all duration-200 ease-out animate-in fade-in slide-in-from-top-2`}
          style={{
            left: `${unhighlightTooltip.x}px`,
            top: `${unhighlightTooltip.y}px`,
            transform: "translateX(-50%)",
            boxShadow: `0 10px 40px -10px ${TOOLTIP_STYLES.shadowColor}, 0 2px 9px -3px ${TOOLTIP_STYLES.shadowColor}`,
            backdropFilter: "blur(16px)",
            maxWidth: "90vw", // Ensure tooltip doesn't exceed viewport
            width: "max-content",
          }}
        >
          <div className="flex items-center space-x-3 sm:space-x-6 whitespace-nowrap">
            {TOOLTIP_CONFIG.highlight.map((action, index) => (
              <button
                key={index}
                className={`${action.className} px-1.5 py-1 sm:px-2 sm:py-1 rounded-md ${TOOLTIP_STYLES.hoverBackgroundColor} ${TOOLTIP_STYLES.activeBackgroundColor} text-xs sm:text-sm leading-5 whitespace-nowrap`}
                onClick={() =>
                  action.onClick(
                    selectedRange,
                    bookMeta,
                    chapterMeta,
                    getActionContext()
                  )
                }
              >
                {action.label}
              </button>
            ))}
          </div>
          {/* Tooltip arrow */}
          <div
            className={`absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${TOOLTIP_STYLES.arrowColor}`}
            style={{
              filter: `drop-shadow(0 2px 4px ${TOOLTIP_STYLES.shadowColor})`,
            }}
          />
        </div>
      )}
      {notePanelVerseId && notePanelPosition && (
        <div
          className="fixed z-40 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl shadow-2xl border border-yellow-200/50 backdrop-blur-sm"
          style={{
            left: notePanelPosition.x,
            top: notePanelPosition.y,
            width: "min(300px, calc(100vw - 32px))", // Responsive width with padding
            maxHeight: "calc(100vh - 32px)", // Prevent vertical overflow
          }}
        >
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-yellow-100 to-amber-100 rounded-t-xl p-4 border-b border-yellow-200/30">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <div className="text-xs text-yellow-700 font-semibold tracking-wide uppercase">
                  {bookMeta.title} {chapterMeta.number}:
                  {notePanelVerseId?.split("-")[2]}
                </div>
                <div
                  className="text-sm text-yellow-900 font-medium mt-1 leading-relaxed break-words"
                  style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}
                >
                  "
                  {localStorage.getItem(`note-${notePanelVerseId}`)?.length
                    ? JSON.parse(
                        localStorage.getItem(`note-${notePanelVerseId}`)!
                      ).verseLinked
                    : ""}
                  "
                </div>
              </div>
              <button
                onClick={() => setNotePanelVerseId(null)}
                className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-200/50 p-1.5 -m-1 flex-shrink-0 rounded-full transition-all duration-200"
                title="Close"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Note content area */}
          <div className="p-4">
            <textarea
              placeholder="Add your thoughts, insights, or reflections here..."
              className="w-full bg-transparent text-sm text-yellow-900 placeholder-yellow-500/70 resize-none focus:outline-none leading-relaxed"
              style={{
                fontFamily: '"Comic Sans MS", cursive, sans-serif',
                minHeight: "120px",
                maxHeight: "calc(100vh - 200px)", // Responsive max height
              }}
              defaultValue={
                localStorage.getItem(`note-${notePanelVerseId}`)?.length
                  ? JSON.parse(
                      localStorage.getItem(`note-${notePanelVerseId}`)!
                    ).NotesByUser
                  : ""
              }
              onBlur={(e) => {
                const storedNote = localStorage.getItem(
                  `note-${notePanelVerseId}`
                );
                const existingNote = storedNote ? JSON.parse(storedNote) : {};

                localStorage.setItem(
                  `note-${notePanelVerseId}`,
                  JSON.stringify({
                    verseLinked: existingNote.verseLinked,
                    NotesByUser: e.target.value,
                  })
                );
              }}
            />

            {/* Save indicator */}
            <div
              className="mt-2 text-xs text-yellow-600/80 italic"
              style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}
            >
              Notes auto-save when you click away
            </div>
          </div>
        </div>
      )}
      <SideModalLayout
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <VerseModalContent
          verseKey={currentVerseKey}
          verseNumber={currentVerse}
          highlightText={currentHighlightText}
          onClose={() => setIsModalOpen(false)}
        />
      </SideModalLayout>
      <ContextInfoModal
        isOpen={isContextOpen}
        onClose={() => setIsContextOpen(false)}
        book={book}
        chapter={chapter}
      />
      <StrongsAnalysisModal
        isOpen={isStrongsOpen}
        onClose={() => setIsStrongsOpen(false)}
        book={book}
        chapter={chapter}
        word={strongsWord || ""}
        verse={currentVerse}
      />
    </div>
  );
};

export default BibleChapter;
