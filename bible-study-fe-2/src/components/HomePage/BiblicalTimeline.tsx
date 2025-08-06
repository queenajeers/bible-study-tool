import React from "react";

type StoryItem = {
  title: string;
  description: string;
  quote: string;
  url: string;
};

const BiblicalTimeline: React.FC = () => {
  const stories: StoryItem[] = [
    {
      title: "Garden of Eden",
      description: "Humanity's dawn.",
      quote: "Discover the meaning behind our beginning.",
      url: "/HomePageIcons/biblical_creation_light_sky_land_plants.png",
    },
    {
      title: "The Fall",
      description: "Sin enters.",
      quote: "Look deeper into how everything changed.",
      url: "/HomePageIcons/depict_biblical_tree_of_knowledge_of_evil.png",
    },
    {
      title: "Noah's Ark",
      description: "Renewal after flood.",
      quote: "Find new insight in a story of rescue and renewal.",
      url: "/HomePageIcons/bible_illustration_of_noah_s_ark_on.png",
    },
    {
      title: "The Empty Tomb",
      description: "Hope rises.",
      quote: "Reflect on what the empty tomb means for faith and new life.",
      url: "/HomePageIcons/empty_tomb_with_the_stone_rolled_away.png",
    },
  ];

  return (
    <section className="py-10 px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-normal text-gray-900 mb-4">
            Uncover the meaning behind every book with confidence
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stories.map((story, index) => (
            <div key={index} className="text-center">
              {/* Quote bubble */}
              <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm relative">
                <p className="text-sm text-gray-700 italic mb-2">
                  "{story.quote}"
                </p>
                {/* Arrow pointing down */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-gray-200"></div>
              </div>

              {/* Profile image */}
              <div className="w-40 h-40 rounded-full mx-auto mb-3 overflow-hidden bg-gray-100 border-4 border-white shadow-sm">
                <img
                  src={story.url}
                  alt={story.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    target.parentElement!.innerHTML = `
                      <div class="w-full h-full bg-gray-300 flex items-center justify-center">
                        <span class="text-xs text-gray-600">Image</span>
                      </div>
                    `;
                  }}
                />
              </div>

              <h3 className="font-medium text-gray-900 text-sm mb-1">
                {story.title}
              </h3>
              <p className="text-xs text-gray-600">{story.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BiblicalTimeline;
