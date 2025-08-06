import React from "react";

const SecondaryFeature: React.FC = () => {
  return (
    <section className="py-20 px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Feature preview */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="space-y-4">
              <div className="bg-blue-50 rounded p-3">
                <p className="text-sm font-medium text-blue-900">
                  Join the Community!
                </p>
                <p className="text-xs text-blue-700">
                  Love free our friendly community of writers and get feedback
                  on your work.
                </p>
              </div>

              <div className="bg-green-50 rounded p-3">
                <p className="text-sm font-medium text-green-900">
                  Attend a live class
                </p>
                <p className="text-xs text-green-700">
                  Get inspired by live classes with bestselling authors, from
                  Beginner to Advanced.
                </p>
              </div>

              <div className="bg-purple-50 rounded p-3">
                <p className="text-sm font-medium text-purple-900">
                  Try out an AI writing prompt
                </p>
                <p className="text-xs text-purple-700">
                  Get hands-on with a library of prompts designed to help you
                  get AI to write exactly what you want.
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Description */}
          <div className="text-left">
            <h3 className="text-3xl font-normal text-gray-900 mb-6">
              Write a novel from start to finish. In a week.
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              <span className="font-medium text-gray-900">Story Bible</span>{" "}
              takes you step-by-step from idea, to outline, to beating out
              chapters, and then writes 1,000s of words, in your style.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecondaryFeature;
