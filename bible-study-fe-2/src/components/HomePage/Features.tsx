import React from "react";

interface Feature {
  heading: string;
  description: string;
  videoSource: string;
}

const Features: React.FC = () => {
  const features: Feature[] = [
    {
      heading:
        "Descriptions that paint a picture in the mind, without bogging down the story.",
      description:
        'If you only focus on action and dialogue, writing can feel flat. Describe makes it easy to help your readers connect to your characters and feel like they\'re really "there".',
      videoSource: "/vidoes/context.mp4",
    },
    {
      heading: "Write a novel from start to finish. In a week.",
      description:
        "Story Bible takes you step-by-step from idea, to outline, to beating out chapters, and then writes 1,000s of words, in your style.",
      videoSource: "/vidoes/strongs.mp4",
    },
    {
      heading: "Generate compelling chapters with AI assistance",
      description:
        "Our Chapter Generator helps you create detailed story beats and scenes. From character development to plot progression, get the structure you need to keep your story moving forward.",
      videoSource: "/vidoes/context.mp4",
    },
  ];

  return (
    <section className="py-20 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-32">
          {features.map((feature, index) => (
            <div
              key={index}
              className="grid lg:grid-cols-2 gap-16 items-center"
            >
              {/* Alternate layout: odd indices have text on left, even on right */}
              {index % 2 === 0 ? (
                <>
                  {/* Text Content */}
                  <div className="text-left">
                    <h3 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6 leading-tight">
                      {feature.heading}
                    </h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Video Content */}
                  <div className="relative">
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                      <video
                        className="w-full h-auto"
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{ aspectRatio: "16/9" }}
                      >
                        <source src={feature.videoSource} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Video Content */}
                  <div className="relative lg:order-first">
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                      <video
                        className="w-full h-auto"
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{ aspectRatio: "16/9" }}
                      >
                        <source src={feature.videoSource} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>

                  {/* Text Content */}
                  <div className="text-left">
                    <h3 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6 leading-tight">
                      {feature.heading}
                    </h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
