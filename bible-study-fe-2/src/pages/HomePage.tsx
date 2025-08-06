import { useState } from "react";
import BiblicalTimeline from "../components/HomePage/BiblicalTimeline";
import Footer from "../components/HomePage/Footer";
import Hero from "../components/HomePage/Hero";

import MainFeature from "../components/HomePage/MainFeature";
import NavbarHome from "../components/HomePage/NavbarHome";
import SecondaryFeature from "../components/HomePage/SecondaryFeature";
import WhosBehind from "../components/HomePage/WhosBehind";
import Features from "../components/HomePage/Features";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div>
      <div className="min-h-screen bg-[#f1eede]">
        <NavbarHome
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
        <Hero />
        <BiblicalTimeline />
        <Features />
        <WhosBehind />
        <Footer />
      </div>
    </div>
  );
}
