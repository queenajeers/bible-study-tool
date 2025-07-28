// layout/BibleChatInterface.jsx
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

const Layout = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <div className="font-funnel h-screen flex overflow-hidden">
      <Navbar isMobile={isMobile} />
      <div className="flex-1 flex flex-col relative overflow-y-auto">
        <Outlet context={{ isMobile }} />
      </div>
    </div>
  );
};

export default Layout;
