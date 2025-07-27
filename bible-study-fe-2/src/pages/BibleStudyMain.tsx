// pages/BibleStudyMain.jsx
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import ChatInterface from "../components/ChatInterface";
import BibleChapter from "../components/BibleChapter";
import type { NavbarProps } from "../components/Navbar";

const BibleStudyMain = () => {
  const { isMobile } = useOutletContext<NavbarProps>();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => setIsChatOpen(!isChatOpen);

  return (
    <div
      className={`flex-1 bg-gray-700 relative ${
        isMobile ? "pb-16" : ""
      } transition-all duration-300 ${!isMobile && isChatOpen ? "mr-96" : ""}`}
    >
      {/* Chat Toggle */}
      <button
        onClick={toggleChat}
        className="fixed top-4 right-4 z-20 bg-gray-600 hover:bg-gray-500 p-3 rounded-full transition-colors"
      >
        <MessageCircle className="w-5 h-5" />
      </button>

      {/* Bible Study Content */}
      <div className="h-full flex items-center justify-center">
        <BibleChapter chapter={1} book="GEN" version="BSB" />
      </div>

      {/* Chat only on this page */}
      {isChatOpen && (
        <ChatInterface isMobile={isMobile} toggleChat={toggleChat} />
      )}
    </div>
  );
};

export default BibleStudyMain;
