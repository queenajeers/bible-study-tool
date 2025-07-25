import React from "react";

const ChatMessageList = ({ messages }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${
            msg.sender === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              msg.sender === "user"
                ? "bg-orange-500 text-white"
                : "bg-gray-700 text-gray-100"
            }`}
          >
            <p className="text-sm">{msg.text}</p>
            <p className="text-xs mt-1 opacity-70">{msg.timestamp}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatMessageList;
