import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import MediaLibraryDialog from "@/components/MediaLibraryDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFamilyTree } from "@/hooks/useFamilyTree";
import { Maximize2, RotateCw, Download, Image as ImageIcon, Scan } from "lucide-react";

// === خطوط العنوان المتاحة (مثل الصفحة الرئيسية) ===
const TITLE_FONTS = [
  { key: "Cairo",       label: "Cairo (افتراضي)",      css: "'Cairo', sans-serif" },
  { key: "DecoThuluth", label: "ثلث (DecoThuluth)",    css: "'DecoThuluth','Cairo',sans-serif" },
  { key: "DiwaniBent",  label: "ديواني (DiwaniBent)",  css: "'DiwaniBent','Cairo',sans-serif" },
  { key: "JassminTypo", label: "جاسمين (JassminTypo)", css: "'JassminTypo','Cairo',sans-serif" },
];


export default function FamilyImagePage({ isAdmin = false, onLogout }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // نوع خط العنوان (نفس تخزين الصفحة الرئيسية)
const [titleFontKey, setTitleFontKey] = useState(
  () => localStorage.getItem("titleFontKey") || "Cairo"
);
const titleFontCss =
  TITLE_FONTS.find(f => f.key === titleFontKey)?.css || TITLE_FONTS[0].css;


  // صورة الشجرة (يمكن تغييرها من المكتبة)
  const [familyImage, setFamilyImage] = useState(
    () => localStorage.getItem("familyImage") || "/assets/members/family_tree.jpg"
  );

  // زوم + دوران
  const [zoom, setZoom] = useState(() => {
    const v = Number(localStorage.getItem("imageZoom"));
    return Number.isFinite(v) && v > 0 ? v : 1;
  });
  const ZOOM_STEP = 0.1;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;

  const [rotation, setRotation] = useState(0); // 0/90/180/270

  // مراجع/قياسات
  const stageRef = useRef(null); // الحاوية التي تحتوي أشرطة التمرير
  const imgRef = useRef(null);
  const [imgNaturalWidth, setImgNaturalWidth] = useState(null);
  const [imgNaturalHeight, setImgNaturalHeight] = useState(null);

  // تكبير/تصغير بالأزرار
  const handleZoomIn = () =>
    setZoom((z) => {
      const v = Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2));
      localStorage.setItem("imageZoom", v);
      return v;
    });

  const handleZoomOut = () =>
    setZoom((z) => {
      const v = Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2));
      localStorage.setItem("imageZoom", v);
      return v;
    });

  const handleZoomReset = () => {
    setZoom(1);
    localStorage.setItem("imageZoom", 1);
    if (stageRef.current) {
      stageRef.current.scrollLeft = 0;
      stageRef.current.scrollTop = 0;
    }
    setRotation(0);
  };

  // عجلة الفأرة للتكبير/التصغير
  const onWheel = (e) => {
    e.preventDefault();
    if (e.deltaY > 0) handleZoomOut();
    else handleZoomIn();
  };

  // سحب لتحريك (نحرّك scroll بدلاً من translate)
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const scrollStartRef = useRef({ left: 0, top: 0 });

  const onMouseDown = (e) => {
    if (!stageRef.current) return;
    setDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    scrollStartRef.current = {
      left: stageRef.current.scrollLeft,
      top: stageRef.current.scrollTop,
    };
  };
  const onMouseMove = (e) => {
    if (!dragging || !stageRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    stageRef.current.scrollLeft = scrollStartRef.current.left - dx;
    stageRef.current.scrollTop = scrollStartRef.current.top - dy;
  };
  const endDrag = () => setDragging(false);

  // تدوير
  const rotateClockwise = () => setRotation((r) => (r + 90) % 360);

  // ملاءمة العرض (نراعي الدوران: عند 90/270 نستخدم الارتفاع كعرض فعلي)
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const fitToWidth = () => {
    if (!stageRef.current || !imgNaturalWidth || !imgNaturalHeight) return;
    const containerWidth = stageRef.current.clientWidth;
    const baseWidth = rotation % 180 === 0 ? imgNaturalWidth : imgNaturalHeight;
    const nextZoom = clamp(containerWidth / baseWidth, MIN_ZOOM, MAX_ZOOM);
    setZoom(nextZoom);
    // نُرجِع التمرير لليسار/الأعلى
    stageRef.current.scrollLeft = 0;
    stageRef.current.scrollTop = 0;
  };

  // ملء الشاشة
  const toggleFullscreen = async () => {
    const el = stageRef.current;
    if (!el) return;
    if (!document.fullscreenElement) await el.requestFullscreen();
    else await document.exitFullscreen();
  };

  // تنزيل الصورة
  const downloadImage = () => {
    const a = document.createElement("a");
    a.href = familyImage;
    a.download = "family_tree.jpg";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // العنوان
  const [title, setTitle] = useState(
    () => localStorage.getItem("treeName") || "شجرة عائلة الزهيران"
  );

  // حوار إعادة تسمية
  const [renameOpen, setRenameOpen] = useState(false);
  const [pendingName, setPendingName] = useState(title);
  const openRenameDialog = () => {
    setPendingName(title);
    setRenameOpen(true);
    setSidebarOpen(false);
  };
  const saveNewName = () => {
    const v = pendingName.trim();
    if (!v) return;
    setTitle(v);
    localStorage.setItem("treeName", v);
    setRenameOpen(false);
  };

  // مكتبة الوسائط
  const { images, fetchMedia, setBackground, background } = useFamilyTree();
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaSelectionMode, setMediaSelectionMode] = useState(null); 

  const handleOpenMediaLibrary = (target) => {
    setSidebarOpen(false);
    setMediaSelectionMode(target);
    setMediaOpen(true);
  };

  const handleMediaSelect = (img) => {
    if (mediaSelectionMode === "background") {
      setBackground(img);
    } else if (mediaSelectionMode === "family") {
      setFamilyImage(img);
      localStorage.setItem("familyImage", img);
      if (stageRef.current) {
        stageRef.current.scrollLeft = 0;
        stageRef.current.scrollTop = 0;
      }
      setRotation(0);
      setZoom(1);
      localStorage.setItem("imageZoom", "1");
    }
    setMediaOpen(false);
    setMediaSelectionMode(null);
  };

  // خلفية الصفحة
/*   const isImageBackground =
    background?.startsWith("data:image") ||
    background?.startsWith("http") ||
    background?.startsWith("/assets/"); */

  const isImageBackground = (() => {
  if (!background) return false;
  if (/^data:image/.test(background)) return true;         // data URI
  if (/^https?:\/\//.test(background)) return true;        // روابط http/https
  if (background.startsWith('/assets/')) return true;      // الأصول المدمجة
  if (background.startsWith('/uploads/')) return true;     // ← المهم لمسارك المحلي
  return /\.(png|jpe?g|webp|gif|svg)$/i.test(background);  // مسارات تنتهي بامتداد صورة
})();


  const backgroundStyle = isImageBackground
    ? { backgroundImage: `url(${background})`, backgroundRepeat: "no-repeat", backgroundSize: "cover", backgroundPosition: "center"}
    : {};
  const backgroundClass = !isImageBackground && background ? background : "bg-slate-900";

  // التقاط أبعاد الصورة الطبيعية
  const onImgLoad = () => {
    if (imgRef.current) {
      setImgNaturalWidth(imgRef.current.naturalWidth || null);
      setImgNaturalHeight(imgRef.current.naturalHeight || null);
    }
  };

  // اختصارات لوحة المفاتيح
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "+") handleZoomIn();
      if (e.key === "-") handleZoomOut();
      if (e.key === "0") handleZoomReset();
      if (e.key.toLowerCase() === "r") rotateClockwise();
      if (e.key.toLowerCase() === "f") fitToWidth();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [imgNaturalWidth, imgNaturalHeight, rotation]);

  return (
    <div className={`min-h-screen relative ${backgroundClass} text-white`} style={backgroundStyle}>
      <AppHeader
        title={title}
        onMenuClick={() => setSidebarOpen(true)}
        isAdmin={isAdmin}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onLoginClick={() => navigate("/")}
         titleFont={titleFontCss}
      />

      <AnimatePresence>
        {sidebarOpen && (
          <Sidebar
            isAdmin={isAdmin}
            onClose={() => setSidebarOpen(false)}
            onShowFamilyImage={() => {
              setSidebarOpen(false);
              navigate(`/tree/${isAdmin ? "admin" : "guest"}`);
            }}
            onOpenRenameTree={openRenameDialog}
            onOpenMediaLibrary={() => handleOpenMediaLibrary("background")}
            onResetToRoot={() => {
              setSidebarOpen(false);
              navigate(`/tree/${isAdmin ? "admin" : "guest"}`);
            }}
            onLogout={() => {
              setSidebarOpen(false);
              onLogout && onLogout();
            }}
          />
        )}
      </AnimatePresence>

      {/* شريط الأدوات (وسط) */}
      <div className="p-4 flex flex-wrap items-center justify-center gap-2 max-w-6xl mx-auto">
        <div className="flex flex-wrap gap-2 mx-auto">
          <Button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl bg-white text-[#0f172a] hover:bg-blue-600 hover:text-white"
          >
            رجوع
          </Button>

          {isAdmin && (
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenMediaLibrary("family")}
              className="bg-transparent border-white/30 hover:bg-white/10 text-white"
              title="تغيير صورة الشجرة"
            >
              <ImageIcon className="ml-2 h-4 w-4" />
              تغيير الصورة
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={fitToWidth}
            className="bg-transparent border-white/30 hover:bg-white/10 text-white"
            title="ملاءمة العرض"
          >
            <Scan className="ml-2 h-4 w-4" />
            ملاءمة العرض
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={rotateClockwise}
            className="bg-transparent border-white/30 hover:bg-white/10 text-white"
            title="تدوير 90°"
          >
            <RotateCw className="ml-2 h-4 w-4" />
            تدوير
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={toggleFullscreen}
            className="bg-transparent border-white/30 hover:bg-white/10 text-white"
            title="ملء الشاشة"
          >
            <Maximize2 className="ml-2 h-4 w-4" />
            ملء الشاشة
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={downloadImage}
            className="bg-transparent border-white/30 hover:bg-white/10 text-white"
            title="تنزيل الصورة"
          >
            <Download className="ml-2 h-4 w-4" />
            تنزيل
          </Button>
        </div>
      </div>

      {/* المسرح: أشرطة تمرير + سحب + تكبير/تصغير + تدوير */}
      <div className="px-4 pb-8 flex justify-center">
        <div
          ref={stageRef}
           className="tree-viewport relative overflow-auto rounded-lg border border-white/10
             cursor-grab active:cursor-grabbing w-full max-w-[1800px] h-[170vh]"
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}

        >
          {/* نُكبّر بتغيير الأبعاد الفعلية للصورة، ونبقي الدوران فقط */}
          <img
            ref={imgRef}
            src={familyImage}
            onLoad={onImgLoad}
            alt="صورة شجرة العائلة"
            style={{
              width:
                imgNaturalWidth && zoom ? imgNaturalWidth * zoom : "auto",
              height:
                imgNaturalHeight && zoom ? imgNaturalHeight * zoom : "auto",
              transform: `rotate(${rotation}deg)`,
              transformOrigin: "top left",
              display: "block",
              margin: "0 auto",
            }}
            className="max-w-none h-auto select-none pointer-events-none"
          />
        </div>
      </div>

      {/* حوار تغيير اسم الشجرة */}
      {renameOpen && (
  <AlertDialog open onOpenChange={setRenameOpen}>
    <AlertDialogContent dir="rtl" className="text-right">
      <AlertDialogHeader className="space-y-2 text-right sm:!text-right">
        <AlertDialogTitle className="text-yellow-300">
          تغيير اسم الشجرة
        </AlertDialogTitle>
        <AlertDialogDescription className="text-slate-300 leading-relaxed">
          أدخل الاسم الجديد واختر نوع الخط ثم اضغط حفظ.
        </AlertDialogDescription>
      </AlertDialogHeader>

      {/* حقل الاسم */}
      <div className="mt-2">
        <input
          value={pendingName}
          onChange={(e) => setPendingName(e.target.value)}
          className="w-full rounded-md border border-white/20 bg-slate-800 text-white px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="اكتب اسم الشجرة..."
        />
      </div>

      {/* اختيار نوع الخط */}
      <div className="mt-4">
        <label className="block mb-2 text-slate-300">نوع الخط</label>

        {/* حاوية الانتقاء + السهم */}
        <div className="relative group">
          <select
            value={titleFontKey}
            onChange={(e) => setTitleFontKey(e.target.value)}
            dir="rtl"
            className="w-full rounded-md border border-white/20 bg-slate-800 text-white pr-3 pl-10 py-2
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       appearance-none"
          >
            {TITLE_FONTS.map((f) => (
              <option key={f.key} value={f.key} style={{ fontFamily: f.css }}>
                {f.label}
              </option>
            ))}
          </select>

          {/* سهم ينعكس عند الفتح */}
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/80
                       transition-transform duration-200 group-focus-within:rotate-180"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* معاينة فورية */}
        <div className="mt-3 p-3 rounded-lg bg-slate-900/40">
          <span className="text-slate-200">المعاينة: </span>
          <b style={{ fontFamily: titleFontCss }} className="text-xl">
            {pendingName || title}
          </b>
        </div>
      </div>

      <AlertDialogFooter className="flex flex-row gap-2 justify-start sm:justify-start mt-4">
        <AlertDialogCancel className="text-slate-200 hover:text-white hover:bg-white/10">
          إلغاء
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={() => {
            const v = (pendingName || "").trim();
            if (!v) return;
            
            setTitle(v);
            localStorage.setItem("treeName", v);
            localStorage.setItem("titleFontKey", titleFontKey);
            setRenameOpen(false);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          حفظ
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)}


      {/* مكتبة الوسائط */}
      <MediaLibraryDialog
        open={mediaOpen}
        onOpenChange={setMediaOpen}
        images={images}
        onSelect={handleMediaSelect}
        isSelectionMode={!!mediaSelectionMode}
        onMediaUpdate={fetchMedia}
      />
    </div>
  );
}
