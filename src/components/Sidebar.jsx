import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  Image,
  UploadCloud,
  Users,
  Maximize,
  Minimize,
  TreeDeciduous,
  Pencil,
  Library,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const Sidebar = ({
  onClose,
  onOpenMediaLibrary,
  onResetToRoot,
  isAdmin,
  onShowFamilyImage,
  onOpenRenameTree,
  onLogout,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(
    !!document.fullscreenElement
  );
  const { toast } = useToast();

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        toast({
          title: "خطأ في وضع ملء الشاشة",
          description: `لم نتمكن من تفعيل وضع ملء الشاشة. ${err.message}`,
          variant: "destructive",
        });
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const fullscreenChangeHandler = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      toast({
        title: isCurrentlyFullscreen
          ? "تم تفعيل وضع ملء الشاشة"
          : "تم الخروج من وضع ملء الشاشة",
        description: isCurrentlyFullscreen
          ? "استمتع بالعرض الكامل!"
          : "لقد عدت إلى العرض العادي.",
      });
    };
    document.addEventListener("fullscreenchange", fullscreenChangeHandler);
    return () =>
      document.removeEventListener("fullscreenchange", fullscreenChangeHandler);
  }, [toast]);

  // Updated button classes for better visibility as per the image
  const buttonClasses =
    "w-full flex justify-between items-center text-lg py-4 px-4 bg-gray-800 hover:bg-blue-700 text-white rounded-xl";
  const primaryButtonClasses =
    "w-full flex justify-between items-center text-lg py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl";

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-0 right-0 h-full w-80 bg-slate-900/80 backdrop-blur-lg border-l border-white/20 z-40 p-6 flex flex-col text-white"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">القائمة</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {/* <Button onClick={onResetToRoot} className={buttonClasses}>
                    <span>العودة للجد الأول</span>
                    <Users className="h-5 w-5" />
                </Button> */}
        <Button
          onClick={onShowFamilyImage}
          className={buttonClasses}
          type="button"
        >
          <span>عرض شجرة العائلة</span>
          {/* <TreeDeciduous className="h-5 w-5" /> */}
          <img
            src="/assets/members/tree_icon.svg"
            className="h-10 w-10 icon"
          ></img>
        </Button>
        <Button onClick={handleFullscreenToggle} className={buttonClasses}>
          <span>
            {isFullscreen ? "الخروج من وضع ملء الشاشة" : "عرض ملء الشاشة"}
          </span>
          {isFullscreen ? (
            <Minimize className="h-5 w-5" />
          ) : (
            <Maximize className="h-5 w-5" />
          )}
        </Button>
        {isAdmin && (
          <>
            {/*             <Button
              onClick={() => onOpenMediaLibrary("logo")}
              className={buttonClasses}
            >
              <span>تغيير شعار العائلة</span>
              <UploadCloud className="h-5 w-5" />
            </Button> */}
            <Button onClick={onOpenRenameTree} className={buttonClasses}>
              <span>تغيير اسم الشجرة</span>
              <Pencil className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => onOpenMediaLibrary("background")}
              className={buttonClasses}
            >
              <span>تغيير خلفية</span>
              <Image className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => onOpenMediaLibrary(null)}
              className={primaryButtonClasses}
            >
              <span>مكتبة الوسائط</span>
              <Library className="h-5 w-5" />
            </Button>
            <Button
  onClick={onLogout}
  className="w-full flex justify-between items-center text-lg py-4 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl"
  type="button"
>
  <span>تسجيل الخروج</span>
  <LogOut className="h-5 w-5" />
</Button>
          </>
        )}

      </div>
    </motion.div>
  );
};

export default Sidebar;
