import React from "react";

const Footer: React.FC = () => {
  const upcomingFeatures = [
    "Audio Bible Integration",
    "Group Study Tools",
    "Sermon Note Templates",
    "Mobile App Launch",
  ];

  return (
    <footer className="bg-neutral-800 text-neutral-300 py-16 px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-medium mb-4 text-neutral-200">
              BibleStudy
            </h3>
            <p className="text-neutral-400 mb-6 text-sm leading-relaxed">
              Empowering believers worldwide to dive deeper into God's Word with
              confidence and understanding.
            </p>
            <button className="bg-yellow-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors">
              Donate
            </button>
          </div>

          {/* Upcoming Features */}
          <div>
            <h4 className="text-lg font-medium mb-6 text-neutral-200">
              Coming Soon
            </h4>
            <ul className="space-y-3">
              {upcomingFeatures.map((feature, index) => (
                <li
                  key={index}
                  className="text-neutral-400 text-sm flex items-center gap-3"
                >
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-medium mb-6 text-neutral-200">
              Connect With Us
            </h4>
            <div className="space-y-3">
              <p className="text-neutral-400 text-sm">support@biblestudy.com</p>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Follow our journey as we build tools to help you grow in faith.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-700 mt-12 pt-8 text-center">
          <p className="text-neutral-400 text-sm">
            © 2025 BibleStudy. Made with love for the body of Christ.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
