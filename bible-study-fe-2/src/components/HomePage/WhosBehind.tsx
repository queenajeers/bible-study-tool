import React from "react";

const WhosBehind: React.FC = () => {
  return (
    <section className="bg-[#f5f4f0] py-16 lg:py-24 px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          {/* Left Column - Question */}
          <div>
            <h2 className="text-2xl lg:text-3xl font-normal text-stone-800 leading-tight">
              Who's behind this?
            </h2>
          </div>

          {/* Right Column - Content */}
          <div className="space-y-6">
            <p className="text-stone-700 text-base leading-relaxed">
              Our founders are Bible scholars{" "}
              <a href="#" className="underline hover:no-underline">
                Dr. Sarah Mitchell
              </a>{" "}
              and{" "}
              <a href="#" className="underline hover:no-underline">
                Pastor David Chen
              </a>
              .
            </p>

            <p className="text-stone-700 text-base leading-relaxed">
              Our advisors include leaders from Compassion International, World
              Vision, The Gospel Coalition, Desiring God, Lifeway Christian
              Resources and seminary professors from Dallas Theological
              Seminary, Westminster Seminary, Southern Baptist Theological
              Seminary, and many more.
            </p>

            <p className="text-stone-700 text-base leading-relaxed font-medium">
              We're in this because we believe in the power of God's Word.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhosBehind;
