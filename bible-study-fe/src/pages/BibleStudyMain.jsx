// pages/BibleStudyMain.jsx
import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import ChatInterface from "../components/ChatInterface";
import BibleChapter from "../components/BibleChapter";

const BibleStudyMain = () => {
  const { isMobile } = useOutletContext();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Welcome! How can I help you with your Bible study today?",
      sender: "ai",
      timestamp: "10:30 AM",
    },
    {
      id: 2,
      text: "I'd like to understand more about this passage.",
      sender: "user",
      timestamp: "10:32 AM",
    },
  ]);

  const toggleChat = () => setIsChatOpen(!isChatOpen);

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: message,
        sender: "user",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, newMessage]);
      setMessage("");

      setTimeout(() => {
        const aiResponse = {
          id: messages.length + 2,
          text: "That's a great question! Let me help you explore that passage.",
          sender: "ai",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, aiResponse]);
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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
        <BibleChapter />
      </div>

      {/* Chat only on this page */}
      {isChatOpen && (
        <ChatInterface
          isMobile={isMobile}
          messages={messages}
          message={message}
          setMessage={setMessage}
          handleKeyPress={handleKeyPress}
          sendMessage={sendMessage}
          toggleChat={toggleChat}
        />
      )}
    </div>
  );
};

export default BibleStudyMain;
