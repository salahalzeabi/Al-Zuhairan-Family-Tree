import React from "react";
import { Menu, ShieldCheck, Plus, Minus, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

const AppHeader = ({
  onMenuClick,
  isAdmin,
  title,
  logo,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onLoginClick,
  titleFont = "'Cairo', sans-serif",
}) => {
  return (
    <header className="sticky top-0 z-30 p-4 flex justify-between items-center bg-black/30 backdrop-blur-lg border-b border-white/10">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="text-white hover:bg-white/20"
          aria-label="فتح القائمة"
        >
          <Menu className="h-6 w-6" />
        </Button>

        {isAdmin ? (
          <div className="flex items-center gap-2 bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm border border-green-500/50">
            <ShieldCheck className="h-4 w-4" />
            <span>وضع المسؤول</span>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            onClick={onLoginClick} 
            className="text-white hover:bg-white/20 px-3 py-1 rounded-full border border-white/20"
            aria-label="تسجيل الدخول"
            title="تسجيل الدخول"
          >
            تسجيل الدخول
          </Button>
        )}
      </div>
      {/* الوسط: العنوان */}
      <div className="flex items-center">
        <h1
          style={{ fontFamily: titleFont }} 
          className="text-white tracking-normal text-2xl sm:text-4xl"
        >
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 bg-white/10 rounded-xl px-2 py-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onZoomOut}
          className="text-white hover:bg-white/20 h-8 w-8"
          title="تصغير"
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <span className="min-w-[48px] text-center text-white/90 text-sm">
          {Math.round((zoom ?? 1) * 100)}%
        </span>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onZoomIn}
          className="text-white hover:bg-white/20 h-8 w-8"
          title="تكبير"
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onZoomReset}
          className="text-white hover:bg-white/20 h-8 w-8"
          title="إرجاع 100%"
          aria-label="Reset zoom"
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;
