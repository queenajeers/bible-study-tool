import React from "react";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import { X } from "lucide-react";

const ChatInterface = ({
  isMobile,
  messages,
  message,
  setMessage,
  handleKeyPress,
  sendMessage,
  toggleChat,
}) => {
  return isMobile ? (
    <div className="fixed inset-0 bg-gray-900 z-40 flex flex-col">
      <div className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
        <h2 className="text-lg font-semibold">CHAT INTERFACE</h2>
        <button
          onClick={toggleChat}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <ChatMessageList messages={messages} />
      <ChatInput
        message={message}
        setMessage={setMessage}
        sendMessage={sendMessage}
        handleKeyPress={handleKeyPress}
      />
    </div>
  ) : (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-gray-800 border-l border-gray-700 z-30 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold">CHAT INTERFACE</h2>
        <button
          onClick={toggleChat}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <ChatMessageList messages={messages} />
      <ChatInput
        message={message}
        setMessage={setMessage}
        sendMessage={sendMessage}
        handleKeyPress={handleKeyPress}
      />
    </div>
  );
};

export default ChatInterface;
