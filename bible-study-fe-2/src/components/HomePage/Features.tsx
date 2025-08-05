import React from "react";

const Features: React.FC = () => {
  const features = [
    {
      title: "Smart Commentary",
      description:
        "Get context-aware insights and commentary from trusted biblical scholars. Our AI-powered system provides relevant explanations tailored to your current study passage.",
      image: "commentary-feature",
    },
    {
      title: "Cross-Reference Navigator",
      description:
        "Discover connections between verses instantly. See how different parts of Scripture relate to each other with our comprehensive cross-reference system.",
      image: "cross-reference-feature",
    },
    {
      title: "Original Language Tools",
      description:
        "Dive deeper with Hebrew and Greek word studies. Understand the original meaning behind every word with pronunciation guides and etymology.",
      image: "language-tools-feature",
    },
    {
      title: "Study Plan Creator",
      description:
        "Create personalized reading plans and track your progress. Set goals, receive reminders, and build consistent study habits.",
      image: "study-plan-feature",
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {features.map((feature, index) => (
          <div key={index} className={`mb-20 last:mb-0`}>
            <div
              className={`flex flex-col ${
                index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
              } items-center gap-12`}
            >
              {/* Content */}
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  {feature.title}
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Image Placeholder */}
              <div className="flex-1">
                <div className="bg-white rounded-xl shadow-lg p-8 aspect-video flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="w-24 h-24 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <svg
                        className="w-12 h-12 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">{feature.image}</p>
                    <p className="text-xs">Feature preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
