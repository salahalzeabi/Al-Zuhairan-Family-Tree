import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Upload, Trash2, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/customSupabaseClient";

const MediaLibraryDialog = ({
  open,
  onOpenChange,
  images,
  onSelect,
  isSelectionMode,
  onMediaUpdate,
}) => {
  const fileInputRef = useRef(null);
  const [uploadingFiles, setUploadingFiles] = useState([]);

  useEffect(() => {
    
    return () => {
      uploadingFiles.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
    };
  }, [uploadingFiles]);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;


    const MAX_MB = 5;
    for (const f of files) {
      if (!f.type.startsWith("image/")) {
        toast({ title: "يجب رفع صور فقط", variant: "destructive" });
        event.target.value = null;
        return;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        toast({ title: `الحد الأقصى ${MAX_MB}MB`, variant: "destructive" });
        event.target.value = null;
        return;
      }
    }


    const newUploadingFiles = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);
    event.target.value = null;

    try {
      
      const uploadedNames = await Promise.all(
        files.map(async (file) => {
          const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}-${file.name.replace(/\s+/g, "_")}`;

          const { error: uploadError } = await supabase.storage
            .from("uploads")
            .upload(fileName, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) throw uploadError;

      

          return fileName;
        })
      );

  
      setUploadingFiles((prev) =>
        prev.filter((p) => !newUploadingFiles.some((n) => n.id === p.id))
      );

      toast({ title: `تم رفع ${uploadedNames.length} صورة بنجاح!` });

      
      onMediaUpdate?.();
    } catch (err) {
      
      setUploadingFiles((prev) =>
        prev.filter((p) => !newUploadingFiles.some((n) => n.id === p.id))
      );
      toast({
        title: "خطأ أثناء الرفع",
        description: err.message || String(err),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (e, imgSrcToDelete) => {
    e.stopPropagation();
    try {
    
      const name = decodeURIComponent(
        imgSrcToDelete.split("/").pop().split("?")[0]
      );
      const { error } = await supabase.storage.from("uploads").remove([name]);
      if (error) throw error;

      toast({ title: "تم حذف الصورة.", variant: "destructive" });
      onMediaUpdate?.();
    } catch (error) {
      toast({
        title: "خطأ في حذف الصورة",
        description: error.message || String(error),
        variant: "destructive",
      });
    }
  };

  const handleDeleteAll = async () => {
    const uploadedImages = images.filter(
      (src) => src && !src.startsWith("/assets/")
    );
    if (!uploadedImages.length) {
      toast({ title: "لا توجد صور مرفوعة لحذفها." });
      return;
    }

    const names = uploadedImages.map((url) =>
      decodeURIComponent(url.split("/").pop().split("?")[0])
    );

    try {
      const { error } = await supabase.storage.from("uploads").remove(names);
      if (error) throw error;

      toast({ title: "تم حذف جميع الصور المرفوعة.", variant: "destructive" });
      onMediaUpdate?.();
    } catch (err) {
      toast({
        title: "خطأ في حذف الصور",
        description: err.message || String(err),
        variant: "destructive",
      });
    }
  };

  const canDelete = (imgSrc) => imgSrc && !imgSrc.startsWith("/assets/");
  const hasUploadedImages = images.some(
    (imgSrc) => imgSrc && !imgSrc.startsWith("/assets/")
  );
  const isUploading = uploadingFiles.length > 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 w-full max-w-6xl mx-4 border border-white/20 shadow-2xl flex flex-col h-[90vh]"
      >
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">
            {isSelectionMode ? "اختر صورة" : "مكتبة الوسائط"}
          </h2>
          <div className="flex gap-2">
            {hasUploadedImages && !isSelectionMode && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon" className="h-10 w-10">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-900/80 backdrop-blur-xl border border-white/20 text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="space-y-2 text-right sm:!text-right">
                      هل أنت متأكد تمامًا؟
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-yellow-300 text-right sm:!text-right">
                      سيؤدي هذا الإجراء إلى حذف جميع الصور التي قمت برفعها بشكل
                      دائم. لا يمكن التراجع عن هذا الإجراء.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex flex-row gap-2 justify-start sm:justify-start">
                    <AlertDialogCancel className="bg-gray-600 hover:bg-gray-700 text-white border-none">
                      إلغاء
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAll}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      حذف الكل
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto pr-3">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4">
            {uploadingFiles.map((file) => (
              <div
                key={file.id}
                className="relative aspect-square bg-slate-800 rounded-lg overflow-hidden"
              >
                <img
                  src={file.preview}
                  alt="Uploading preview"
                  className="w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              </div>
            ))}

            {images.map((imgSrc) => (
              <motion.div
                key={imgSrc}
                layout
                whileHover={{ scale: 1.05 }}
                className="relative group cursor-pointer aspect-square bg-slate-700 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-400"
                onClick={isSelectionMode ? () => onSelect?.(imgSrc) : undefined}
              >
<div className="relative w-full h-full">

  <img
    src={imgSrc}
    alt="media content"
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

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {isSelectionMode && (
                    <Button
                      size="icon"
                      className="h-10 w-10 bg-green-500 hover:bg-green-600 rounded-full"
                      onClick={() => onSelect?.(imgSrc)}
                    >
                      <CheckCircle className="h-5 w-5" />
                    </Button>
                  )}
                  {canDelete(imgSrc) && !isSelectionMode && (
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 left-1 h-8 w-8 rounded-full"
                      onClick={(e) => handleDelete(e, imgSrc)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {!isSelectionMode && (
          <div className="pt-6 flex-shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              multiple
              disabled={isUploading}
            />
            <Button
              onClick={handleUploadClick}
              className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700 text-white disabled:text-white"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-5 w-5 ml-3 animate-spin" />
                  جاري رفع {uploadingFiles.length} صور...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 ml-3" />
                  رفع صور جديدة
                </>
              )}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MediaLibraryDialog;
