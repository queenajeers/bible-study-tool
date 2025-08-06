import React, { useState } from "react";
import { Info } from "lucide-react";

type ancientButtonProps = {
  onClick: () => void;
  children: string;
};

export const AncientButton = ({
  onClick,
  children = "Background & Context",
}: ancientButtonProps) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);

    // Reset animation state
    setTimeout(() => {
      setIsClicked(false);
    }, 200);

    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`mt-3 inline-flex items-center gap-2 px-2 py-2 text-xs font-medium 
                 border-2 border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 
                 text-slate-900 rounded-md hover:from-slate-100 hover:to-slate-200 
                 hover:-translate-y-0.5 transition-all duration-200 
                 shadow-sm hover:shadow-md font-serif tracking-wide
                 hover:border-slate-800 cursor-pointer
                 ${isClicked ? "scale-95" : "scale-100"}`}
      style={{
        textShadow: "0 1px 0 rgba(241, 245, 249, 0.8)",
        transform: isClicked ? "scale(0.95) translateY(1px)" : "",
        transition: "all 0.1s ease-out",
      }}
    >
      <Info className="w-4 h-4" />
      {children}
    </button>
  );
};
