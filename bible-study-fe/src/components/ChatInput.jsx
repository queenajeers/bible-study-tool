import React from "react";
import { Send } from "lucide-react";

const ChatInput = ({ message, setMessage, sendMessage, handleKeyPress }) => {
  return (
    <div className="bg-gray-800 p-4 border-t border-gray-700">
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          onClick={sendMessage}
          className="bg-orange-500 hover:bg-orange-600 p-2 rounded-lg transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
