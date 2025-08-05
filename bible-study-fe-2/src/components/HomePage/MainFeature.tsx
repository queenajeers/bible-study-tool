import React from "react";

const MainFeature: React.FC = () => {
  return (
    <section className="bg-[#f5f4f0] py-20 px-6 lg:px-8">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl font-normal text-gray-900 mb-16">
          Blank page, begone!
        </h2>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left side - Description */}
          <div className="text-left">
            <h3 className="text-2xl font-normal text-gray-900 mb-6">
              Descriptions that paint a picture in the mind, without bogging
              down the story.
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              If you only focus on action and dialogue, your writing can feel
              flat.
              <span className="font-medium text-gray-900"> Describe</span> makes
              it easy to help your readers connect to your characters and feel
              like they're really "there".
            </p>
          </div>

          {/* Right side - Feature preview */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="bg-gray-100 rounded p-4 mb-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                The stones were arranged in neat piles, as if someone had been
                collecting them. They looked like small stones. They looked like
                they had been there for a while, and LaBlanche could have sworn
                they were there. She moved toward them and realized that some of
                the stones had symbols. The symbols were small and etched into
                the stones. They were dark blue to pale gray. They were various
                sizes, from pebbles the size of a dime to stones the size of a
                fist. Their engravings were faint symbols. She recognized a few
                as similar to the rest were foreign to her.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <button className="text-sm text-blue-600 hover:text-blue-700">
                Insert
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">AI SMELL</span>
                <div className="w-4 h-4 bg-pink-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MainFeature;
