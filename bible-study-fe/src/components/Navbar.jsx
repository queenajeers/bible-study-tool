import React from "react";
import { Home as HomeIcon, BookOpen, BarChart } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const Navbar = ({ isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: HomeIcon, label: "Home", path: "/" },
    { icon: BookOpen, label: "Bible Study", path: "/biblestudy" },
    { icon: BarChart, label: "Insights", path: "/insights" },
  ];

  return !isMobile ? (
    <nav className="bg-gray-800 w-16 flex flex-col">
      <div className="flex-1 py-4">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <div
              key={index}
              onClick={() => navigate(item.path)}
              className={`mx-2 mb-2 p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center relative group ${
                isActive
                  ? "bg-gray-700 text-orange-400"
                  : "hover:bg-gray-700 text-gray-400 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  ) : (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-30">
      <div className="flex justify-around py-2">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <div
              key={index}
              onClick={() => navigate(item.path)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                isActive ? "text-orange-400" : "text-gray-400 hover:text-white"
              }`}
            >
              <item.icon className="w-6 h-6" />
            </div>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;
