import React, { useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import FamilyMemberDialog from "@/components/FamilyMemberDialog";
import TreeNode from "@/components/TreeNode";
import MediaLibraryDialog from "@/components/MediaLibraryDialog";
import ForgotPassword from '@/components/ForgotPassword';
import ResetPassword from '@/components/ResetPassword';

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
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import LoginScreen from "@/components/LoginScreen";
import { Routes, Route, useNavigate } from "react-router-dom";
import FamilyImagePage from "@/components/FamilyImagePage";



const TITLE_FONTS = [
  { key: 'Cairo',       label: 'Cairo (افتراضي)',         css: "'Cairo', sans-serif" },
  { key: 'DecoThuluth', label: 'ثلث (DecoThuluth)',       css: "'DecoThuluth','Cairo',sans-serif" },
  { key: 'DiwaniBent',  label: 'ديواني (DiwaniBent)',     css: "'DiwaniBent','Cairo',sans-serif" },
  { key: 'JassminTypo', label: 'جاسمين (JassminTypo)',    css: "'JassminTypo','Cairo',sans-serif" },
];


const findNodeAndPath = (node, nodeId, path = []) => {
  if (!node) return null;
  const currentPath = [...path, node.id];
  if (node.id === nodeId) {
    return { node, path: currentPath };
  }
  for (const child of node.children || []) {
    const result = findNodeAndPath(child, nodeId, currentPath);
    if (result) return result;
  }
  return null;
};

function FamilyTreeApp({ isAdmin, onLogout }) {
  const {
    familyData,
    allMembers,
    viewRootId,
    setViewRootId,
    expandedNodes,
    setExpandedNodes,
    background,
    setBackground,
    logo,
    setLogo,
    images,
    loading,
    addMember,
    editMember,
    deleteMember,
    fetchMedia,
  } = useFamilyTree();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [newMemberData, setNewMemberData] = useState(null);
  const [parentId, setParentId] = useState(null);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [mediaLibraryTarget, setMediaLibraryTarget] = useState(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  //const [treeName, setTreeName] = useState('شجرة عائلة الزهيران');
  const [treeName, setTreeName] = useState(
  () => localStorage.getItem('treeName') || 'شجرة عائلة الزهيران');
  const [renameOpen, setRenameOpen] = useState(false);
  const [pendingName, setPendingName] = useState(treeName);





  const viewportRef = useRef(null);


const navigate = useNavigate();

const handleShowFamilyImage = () => {
  setSidebarOpen(false);         
  navigate("/tree/image");        
};

const openRenameDialog = () => {
  setPendingName(treeName);
  setRenameOpen(true);
  setSidebarOpen(false); 
};


const [titleFontKey, setTitleFontKey] = useState(
  () => localStorage.getItem("titleFontKey") || "Cairo"
);


const titleFontCss =
  TITLE_FONTS.find(f => f.key === titleFontKey)?.css || TITLE_FONTS[0].css;


const saveNewName = () => {
  const v = pendingName.trim();
  if (!v) return;

 
  setTreeName(v);
  localStorage.setItem("treeName", v);

  
  localStorage.setItem("titleFontKey", titleFontKey);

  setRenameOpen(false);
};






  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId);
      return next;
    });
  };

  const handleNodeClick = (memberId) => toggleNode(memberId);

  const handleNodeDoubleClick = () => {
    const rootId =
      allMembers?.find((m) => !m.parent_id)?.id ??
      (allMembers && allMembers[0]?.id);

    if (!rootId) return;

    setExpandedNodes(new Set());

    setViewRootId(rootId);
    requestAnimationFrame(() => {
      const viewport = viewportRef.current;
      const rootEl = document.getElementById(`node-${rootId}`);

      if (viewport && rootEl) {
        const vpRect = viewport.getBoundingClientRect();
        const offsetLeft = rootEl.offsetLeft - vpRect.width * 0.2; 
        const offsetTop = rootEl.offsetTop - vpRect.height * 0.2;

        viewport.scrollTo({
          left: Math.max(0, offsetLeft),
          top: Math.max(0, offsetTop),
          behavior: "smooth",
        });
      } else if (viewport) {
        viewport.scrollTo({ left: 0, top: 0, behavior: "smooth" });
      } else {
        window.scrollTo({ left: 0, top: 0, behavior: "smooth" });
      }
    });
  };

  const handleAddSubmit = async (memberData) => {
    if (!isAdmin) return;
    await addMember(memberData, parentId);
    setNewMemberData(null);
  };

  const handleEditSubmit = async (memberData) => {
    if (!isAdmin) return;
    await editMember(memberData, editingMember.id);
  };

  const handleDeleteConfirm = async () => {
    if (!isAdmin || !memberToDelete) return;
    await deleteMember(memberToDelete);
    setDeleteConfirmationOpen(false);
    setMemberToDelete(null);
  };

  const openDeleteConfirmation = (member) => {
    if (!isAdmin) return;
    setMemberToDelete(member);
    setDeleteConfirmationOpen(true);
  };

  const handleAddChild = (parentMemberId) => {
    if (!isAdmin) return;
    setParentId(parentMemberId);
    setEditingMember(null);
    setNewMemberData({ name: "", image_url: "/assets/members/default.svg" });
    setDialogOpen(true);
  };

  const handleEditMember = (member) => {
    if (!isAdmin) return;
    setEditingMember(member);
    setNewMemberData(null);
    setParentId(null);
    setDialogOpen(true);
  };

const openMediaLibrary = (target) => {
  if (!isAdmin) return;
  setMediaLibraryTarget(target);
  fetchMedia();                
  setMediaLibraryOpen(true);
  setSidebarOpen(false);
};


  const handleMediaSelect = (image) => {
    setMediaLibraryOpen(false);
    if (!isAdmin) return;
    if (mediaLibraryTarget === "logo") {
      setLogo(image);
    } else if (mediaLibraryTarget === "background") {
      setBackground(image);
    } else if (mediaLibraryTarget === "member") {
      if (editingMember) {
        setEditingMember((prev) => ({ ...prev, image_url: image }));
      } else {
        setNewMemberData((prev) => ({ ...prev, image_url: image }));
      }
      setDialogOpen(true);
    }
  };

  const handleOpenMemberImageSelect = () => {
    setMediaLibraryTarget("member");
    setMediaLibraryOpen(true);
    setDialogOpen(false);
  };



    const isImageBackground = (() => {
  if (!background) return false;
  if (/^data:image/.test(background)) return true;         
  if (/^https?:\/\//.test(background)) return true;        
  if (background.startsWith('/assets/')) return true;      
  if (background.startsWith('/uploads/')) return true;     
  return /\.(png|jpe?g|webp|gif|svg)$/i.test(background);  
})();



  const backgroundStyle = isImageBackground
    ? {
        backgroundImage: `url(${background})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",

      }
    : {};
  const backgroundClass = !isImageBackground ? background : "";


const [zoom, setZoom] = useState(() => {
  const v = Number(localStorage.getItem("treeZoom"));
  return Number.isFinite(v) && v > 0 ? v : 1;
});
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

const handleZoomIn = () =>
  setZoom(z => {
    const v = Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2));
    localStorage.setItem("treeZoom", v);
    return v;
  });

const handleZoomOut = () =>
  setZoom(z => {
    const v = Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2));
    localStorage.setItem("treeZoom", v);
    return v;
  });

const handleZoomReset = () => {
  setZoom(1);
  localStorage.setItem("treeZoom", 1);
};





  const viewRootNode = familyData
    ? findNodeAndPath(familyData, viewRootId)?.node
    : null;




  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
        <p className="mt-4 text-xl">جاري تحميل بيانات شجرة العائلة...</p>
      </div>
    );
  }




  return (
    <>
      <Helmet>
        <title>{treeName}</title>
        <meta
          name="description"
          content={`تطبيق تفاعلي لعرض وإدارة ${treeName}.`}
        />
      </Helmet>

      <div
        className={`min-h-screen relative ${backgroundClass}`}
        style={backgroundStyle}
      >
        <AppHeader
          title={treeName}       
          logo={logo}
          onMenuClick={() => setSidebarOpen(true)}
          isAdmin={isAdmin}
          onLogout={onLogout}
            zoom={zoom}
  onZoomIn={handleZoomIn}
  onZoomOut={handleZoomOut}
  onZoomReset={handleZoomReset}
   onLoginClick={() => navigate("/")} 
    titleFont={titleFontCss}      
        />

   
        <div
          ref={viewportRef}
          className="tree-viewport relative z-0 pt-8 px-8 text-center overflow-x-auto overflow-y-auto min-h-[calc(100vh-80px)]"
        >
       
          <div className="tree-canvas inline-block min-w-max"
          style={{
      transform: `scale(${zoom})`,
      transformOrigin: "top center",   
      willChange: "transform",
    }}>
            <div className="inline-block">
              {viewRootNode ? (
                <div id={`node-${viewRootNode.id}`}>
                  <TreeNode
                    member={viewRootNode}
                    onAdd={handleAddChild}
                    onEdit={handleEditMember}
                    onDelete={openDeleteConfirmation}
                    onClick={handleNodeClick}
                    onDoubleClick={handleNodeDoubleClick}
                    expandedNodes={expandedNodes}
                    isAdmin={isAdmin}
                  />
                </div>
              ) : (
                <div className="text-white text-2xl">
                  <p>لم يتم إنشاء شجرة العائلة بعد.</p>
                  {isAdmin && (
                    <Button
                      onClick={() => handleAddChild(null)}
                      className="mt-4"
                    >
                      ابدأ بإنشاء الجد الأول
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
    

        <AnimatePresence>
          {sidebarOpen && (
            <Sidebar
              onClose={() => setSidebarOpen(false)}
              onOpenMediaLibrary={openMediaLibrary}
              onResetToRoot={() => {
                if (!allMembers || allMembers.length === 0) return;
                const rootId =
                  allMembers.find((m) => !m.parent_id)?.id || allMembers[0].id;
                setViewRootId(rootId);
                setExpandedNodes(new Set([rootId]));
                setSidebarOpen(false);
              }}
              isAdmin={isAdmin}
              onShowFamilyImage={handleShowFamilyImage} 
              onOpenRenameTree={openRenameDialog}
                onLogout={() => {             
    setSidebarOpen(false);       
    onLogout();                  
  }}
   
            />
          )}
        </AnimatePresence>

        {isAdmin && (
          <FamilyMemberDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onSubmit={editingMember ? handleEditSubmit : handleAddSubmit}
            initialData={editingMember || newMemberData}
            isEditing={!!editingMember}
            onImageSelect={handleOpenMemberImageSelect}
          />
        )}

       

        {isAdmin && (
          <MediaLibraryDialog
            open={mediaLibraryOpen}
            onOpenChange={setMediaLibraryOpen}
            images={images}
            onSelect={handleMediaSelect}
            isSelectionMode={!!mediaLibraryTarget}
            onMediaUpdate={fetchMedia}
          />
        )}


{renameOpen && (
  <AlertDialog open onOpenChange={setRenameOpen}>
  <AlertDialogContent dir="rtl" className="text-right">
    <AlertDialogHeader className="space-y-2 text-right sm:!text-right">
      <AlertDialogTitle className="text-yellow-300 text-right sm:!text-right">
        تغيير اسم الشجرة
      </AlertDialogTitle>
      <AlertDialogDescription className="text-slate-300 text-right sm:!text-right leading-relaxed">
        أدخل الاسم الجديد واختر نوع الخط ثم اضغط حفظ.
      </AlertDialogDescription>
    </AlertDialogHeader>

    <div className="mt-2">
      <input
        value={pendingName}
        onChange={(e) => setPendingName(e.target.value)}
        className="w-full rounded-md border border-white/20 bg-slate-800 text-white px-3 py-2
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="اكتب اسم الشجرة..."
      />
    </div>


    <div className="mt-4">
  <label className="block mb-2 text-slate-300">نوع الخط</label>

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

  <div className="mt-3 p-3 rounded-lg bg-slate-900/40">
    <span className="text-slate-200">المعاينة: </span>
    <b style={{ fontFamily: titleFontCss }} className="text-xl">
      {pendingName || treeName}
    </b>
  </div>
</div>


    <AlertDialogFooter className="flex flex-row gap-2 justify-start sm:justify-start mt-4">
      <AlertDialogCancel className="text-slate-200 hover:text-white hover:bg-white/10">
        إلغاء
      </AlertDialogCancel>
      <AlertDialogAction
        onClick={saveNewName}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        حفظ
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

)}


        
        {isAdmin && (
          <AlertDialog
            open={deleteConfirmationOpen}
            onOpenChange={setDeleteConfirmationOpen}
          >
            <AlertDialogContent dir="rtl" className="text-right">
              <AlertDialogHeader className="space-y-2 text-right sm:!text-right">
                <AlertDialogTitle className="text-yellow-300 text-right sm:!text-right">
                  هل أنت متأكد؟
                </AlertDialogTitle>

                <AlertDialogDescription className="text-slate-300 text-right sm:!text-right leading-relaxed">
                  هل تريد بالتأكيد حذف{" "}
                  <bdi className="font-semibold text-sky-200">
                    {memberToDelete?.name}
                  </bdi>{" "}
                  ؟ لا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter className="flex flex-row gap-2 justify-start sm:justify-start">
                <AlertDialogCancel className="text-slate-200 hover:text-white hover:bg-white/10">
                  إلغاء
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  حذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          
        )}
      </div>
    </>
  );
}

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    setIsAdmin(true);
    navigate("/tree/admin");
  };

  const handleGuestLogin = () => {
    setIsAdmin(false);
    navigate("/tree/guest");
  };

  const handleLogout = () => {
    setIsAdmin(false);
    navigate("/");
  };

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <LoginScreen
              onAdminLogin={handleLoginSuccess}
              onGuestLogin={handleGuestLogin}
            />
          }
        />
     
  <Route path="/forgot" element={<ForgotPassword />} />
  <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/tree/:mode"
          element={<FamilyTreeApp isAdmin={isAdmin} onLogout={handleLogout} />}
        />
        

       <Route
  path="/tree/image"
  element={<FamilyImagePage isAdmin={isAdmin} onLogout={handleLogout} />}
/>
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
