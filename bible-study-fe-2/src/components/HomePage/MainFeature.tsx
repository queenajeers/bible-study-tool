import React, { useRef, useEffect } from "react";

const MainFeature: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play();
          } else {
            videoRef.current?.pause();
          }
        });
      },
      {
        threshold: 0.3, // Start video when 30% of the section is visible
        rootMargin: "0px",
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-20 px-6 lg:px-8">
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

          {/* Right side - Video */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <video
              className="w-full h-auto"
              autoPlay
              loop
              muted
              playsInline
              style={{ aspectRatio: "16/9" }}
            >
              <source src="/vidoes/context.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MainFeature;
