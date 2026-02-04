import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/customSupabaseClient";

const sanitizeFileName = (name) =>
  `${Date.now()}-${name
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_\-.]/g, "")}`;

const ImageLibrary = ({
  images = [],
  setImages = () => {},
  onSelect,
  title,
  onMediaUpdate,
}) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast({ title: `حجم الملف أكبر من ${MAX_MB}MB`, variant: "destructive" });
      event.target.value = null;
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "الملف ليس صورة", variant: "destructive" });
      event.target.value = null;
      return;
    }

    setUploading(true);
    try {
      const fileName = sanitizeFileName(file.name);

     
      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      
      const { data } = supabase.storage.from("uploads").getPublicUrl(fileName);
      const publicUrl = data?.publicUrl || "";

      toast({ title: "تم رفع الصورة بنجاح!" });

      if (typeof onMediaUpdate === "function") {
        await onMediaUpdate(); 
      } else {
        setImages((prev) => [...prev, publicUrl]); 
      }
    } catch (err) {
      console.error("Upload error", err);
      toast({
        title: "خطأ أثناء الرفع",
        description: err.message || String(err),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = null; 
    }
  };

  const handleDelete = async (e, imgSrcToDelete) => {
    e.stopPropagation();
    if (!window.confirm("هل أنت متأكد من حذف هذه الصورة؟")) return;

    const name = decodeURIComponent(
      imgSrcToDelete.split("/").pop().split("?")[0]
    );

    if (!name) {
      
      setImages((prev) => prev.filter((i) => i !== imgSrcToDelete));
      toast({ title: "تم حذف الصورة (محليًا).", variant: "destructive" });
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase.storage.from("uploads").remove([name]);
      if (error) throw error;

      toast({ title: "تم حذف الصورة.", variant: "destructive" });

      if (typeof onMediaUpdate === "function") {
        await onMediaUpdate();
      } else {
        setImages((prev) => prev.filter((i) => i !== imgSrcToDelete));
      }
    } catch (err) {
      console.error("Delete error", err);
      toast({
        title: "خطأ في حذف الصورة",
        description: err.message || String(err),
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const canDelete = (imgSrc) => imgSrc && !imgSrc.startsWith("/assets/");

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {images.map((imgSrc) => (
          <motion.div
            key={imgSrc}
            layout
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect?.(imgSrc)}
            className="relative group cursor-pointer aspect-square bg-slate-700 rounded-md overflow-hidden border-2 border-transparent hover:border-blue-400"
          >
            <div className="relative w-full h-full">
  <img
    src={imgSrc}
    alt={title}
    className="absolute inset-0 w-full h-full object-cover"
    onError={(e) => {
      e.currentTarget.style.display = "none";
      const fb = e.currentTarget.nextElementSibling;
      if (fb) fb.style.display = "block";
    }}
  />
  <img
    src="/assets/members/default.svg"
    alt="fallback"
    className="absolute inset-0 w-full h-full object-cover"
    style={{ display: "none" }}
  />
</div>

            {canDelete(imgSrc) && (
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDelete(e, imgSrc)}
                disabled={deleting}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </motion.div>
        ))}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      <Button
        onClick={handleUploadClick}
        variant="outline"
        className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
        disabled={uploading}
      >
        <Upload className="h-4 w-4 ml-2" />
        {uploading ? "جارٍ الرفع..." : "رفع صورة جديدة"}
      </Button>
    </div>
  );
};

export default ImageLibrary;
