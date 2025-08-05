import React from "react";

const LogoStrip: React.FC = () => {
  const publications = [
    "CHRISTIANITY TODAY",
    "THE GOSPEL COALITION",
    "DESIRING GOD",
    "CROSSWAY",
    "LIFEWAY",
    "FOCUS ON THE FAMILY",
  ];

  return (
    <section className="bg-[#f5f4f0] py-12 px-6 lg:px-8 border-b border-gray-200">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            As seen in
          </span>
          <div className="flex items-center space-x-8 lg:space-x-12">
            {publications.map((pub, index) => (
              <span
                key={index}
                className="text-xs text-gray-600 font-medium tracking-wide"
              >
                {pub}
              </span>
            ))}
          </div>
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            As seen in
          </span>
        </div>
      </div>
    </section>
  );
};

export default LogoStrip;
