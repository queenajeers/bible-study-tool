// components/VerseModalContent.tsx

import React from "react";
import { X, Shield, ExternalLink } from "lucide-react";

type VerseModalContentProps = {
  verseReference?: string;
  verseKey: string;
  verseNumber: number;
  highlightText: string;
  onClose: () => void;
  children?: React.ReactNode;
};

export const VerseModalContent: React.FC<VerseModalContentProps> = ({
  verseReference = "Highlight responses",
  verseNumber,
  highlightText,
  verseKey,
  onClose,
  children,
}) => {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div
        className={`flex items-center justify-between p-4 border-b border-gray-100 ${
          isMobile ? "pb-3" : "sticky top-0 bg-white z-10"
        }`}
      >
        <div className="flex items-center space-x-3">
          <Shield className="w-5 h-5 text-gray-400" />
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        {!isMobile && (
          <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Content */}
      <div
        className={`flex-1 overflow-y-auto ${
          isMobile ? "max-h-[calc(90vh-80px)]" : "h-full"
        }`}
      >
        <div className="p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {verseReference} : {verseNumber}
          </h2>

          {/* Highlighted Text */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-800 leading-relaxed font-serif">
              {highlightText || "No text selected"}
            </p>
          </div>

          {/* Input */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">GN</span>
              </div>
              <span className="text-sm font-medium text-gray-900">G Nicky</span>
            </div>
            <div className="relative">
              <textarea
                placeholder="What are your thoughts?"
                className="w-full p-3 bg-gray-50 rounded-lg border-0 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 placeholder-gray-400"
                rows={3}
              />
            </div>
          </div>

          {/* Sample Response */}
          <div className="mb-6">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-orange-600">⭐</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    Paul James Crook
                  </span>
                  <span className="text-xs text-gray-500">Jul 7</span>
                  <button className="ml-auto p-1 hover:bg-gray-100 rounded">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-800 text-sm leading-relaxed mb-3">
                  Worth opening the article without getting further - thanks,
                  following your lead and giving it a try out
                </p>
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors">
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
                        d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                      />
                    </svg>
                    <span className="text-sm">20</span>
                  </button>
                  <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors underline">
                    Reply
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Content */}
          {children && <div className="mb-6">{children}</div>}

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-100">
            <button className="text-sm text-gray-600 hover:text-gray-800 transition-colors underline">
              See all 89 story responses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
