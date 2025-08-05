// pages/BibleView.tsx
import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import ChatInterface from "../components/ChatInterface";
import ReadHeader from "../components/ReadHeader";
import BibleChapter from "../components/BibleChapter";
import type { NavbarProps } from "../components/Navbar";

export const BibleView = () => {
  const { isMobile } = useOutletContext<NavbarProps>();
  const [book, setBook] = useState("GEN");
  const [chapter, setChapter] = useState(1);
  const [version, setVersion] = useState("BSB");
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => setIsChatOpen((prev) => !prev);

  return (
    <div
      className={`flex-1 relative ${
        isMobile ? "pb-16" : ""
      } transition-all duration-300 ${!isMobile && isChatOpen ? "mr-96" : ""}`}
    >
      {/* Header */}
      <ReadHeader
        onSelectionChange={(b, c, v) => {
          setBook(b);
          setChapter(c);
          setVersion(v);
        }}
      />

      {/* Bible Content */}
      <div className="flex items-center justify-center">
        <BibleChapter
          book={book}
          chapter={chapter}
          version={version}
          // Remove toggleChat prop since button is now in parent
        />
      </div>

      {/* Chat Interface */}
      {isChatOpen && (
        <ChatInterface isMobile={isMobile} toggleChat={toggleChat} />
      )}
    </div>
  );
};
