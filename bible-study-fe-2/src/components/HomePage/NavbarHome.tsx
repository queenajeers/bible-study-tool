import React from "react";
import { Menu, X } from "lucide-react";

interface NavbarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const NavbarHome: React.FC<NavbarProps> = ({
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  return (
    <nav className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-lg font-medium text-gray-900">BibleStudy</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#faq"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              FAQ
            </a>
            <a
              href="#pricing"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Pricing
            </a>
            <a
              href="#login"
              className="text-sm text-gray-900 hover:text-gray-600 transition-colors"
            >
              Log in
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#f5f4f0] border-t border-gray-200">
          <div className="px-6 py-4 space-y-3">
            <a
              href="#faq"
              className="block text-sm text-gray-600 hover:text-gray-900"
            >
              FAQ
            </a>
            <a
              href="#pricing"
              className="block text-sm text-gray-600 hover:text-gray-900"
            >
              Pricing
            </a>
            <a
              href="#login"
              className="block text-sm text-gray-900 hover:text-gray-600"
            >
              Log in
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavbarHome;
