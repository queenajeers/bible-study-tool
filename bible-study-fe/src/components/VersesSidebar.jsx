import React, { useEffect, useState } from "react";
import { X, BookOpen } from "lucide-react";

// Separate Sidebar Component
const VersesSidebar = ({
  isOpen,
  onClose,
  selectedVerses,
  onRemoveVerse,
  onClearAll,
  bookTitle,
  chapterNumber,
}) => {
  return (
    <>
      {/* Sliding Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">
              Selected Verses ({selectedVerses.length})
            </h3>
            <div className="flex items-center gap-3">
              {selectedVerses.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-sm text-red-600 hover:text-red-800 px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedVerses.length === 0 ? (
              <div className="text-center text-gray-500 mt-12">
                <BookOpen size={56} className="mx-auto mb-6 text-gray-300" />
                <p className="text-lg mb-2">No verses selected</p>
                <p className="text-sm text-gray-400">
                  Click on verses to add them here
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {selectedVerses.map((verseObj, index) => {
                  const verseKey = Object.keys(verseObj)[0];
                  const verseData = verseObj[verseKey];

                  return (
                    <div
                      key={verseKey}
                      className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                            {bookTitle} {chapterNumber}:{verseData.number}
                          </span>
                        </div>
                        <button
                          onClick={() => onRemoveVerse(verseKey)}
                          className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <p className="text-gray-800 leading-relaxed font-serif text-base">
                        {verseData.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          {selectedVerses.length > 0 && (
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Export Selected Verses
                </button>
                <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                  Copy to Clipboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default VersesSidebar;
