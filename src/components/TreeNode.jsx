import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, Edit, Trash2, ChevronDown } from "lucide-react";

const TreeNode = ({
  member,
  onAdd,
  onEdit,
  onDelete,
  onClick,
  onDoubleClick,
  expandedNodes,
  isAdmin,
}) => {
  const isExpanded = expandedNodes.has(member.id);
  const hasChildren = member.children && member.children.length > 0;

  return (
    <div className="tree">
      <div className="tree-root">
        {/* أعطينا كل بطاقة id ليسهّل التمرير للجذر لاحقًا */}
        <div id={`node-${member.id}`}>
          <motion.div
            layout
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative group w-44 cursor-pointer"
            onClick={() => onClick(member.id)}
            onDoubleClick={(e) => {
              // مهم: نوقف الانتشار حتى لا يشتغل onClick مع الدبل-كليك
              e.stopPropagation();
              e.preventDefault();
              onDoubleClick(member); // نرسل العضو للأب
            }}
          >
            {/* Card */}
            <div className="mb-10 w-44 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 p-[5px] rounded-xl shadow-lg group-hover:shadow-yellow-400/50 group-hover:scale-105 transition-all">
              <div className="rounded-lg overflow-hidden bg-slate-800 flex flex-col h-64 w-full">
                {/* الصورة */}
                <div className="relative flex-1">
                  <img
                    src={member.image_url || "/assets/members/default.svg"}
                    alt={member.name}
                    className="absolute inset-0 w-full h-full object-cover object-top"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/assets/members/default.svg";
                    }}
                  />
                  {member.isDeceased && (
                    <div className="absolute left-0 right-0 top-0 bg-black/60 text-yellow-300 text-xs font-bold text-center py-1">
                      انتقل إلى رحمة الله
                    </div>
                  )}
                </div>

                {/* الاسم */}
                <div className="h-10 bg-yellow-500 text-slate-900 font-bold tracking-wide flex items-center justify-center px-2">
                  {member.name}
                </div>
              </div>
            </div>

            {/* أزرار الإدارة */}
            {isAdmin && (
              <div className="absolute top-0 left-full ml-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd(member.id);
                  }}
                  className="p-2 bg-green-500 rounded-full text-white shadow-lg hover:bg-green-600 transition-colors"
                >
                  <PlusCircle size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(member);
                  }}
                  className="p-2 bg-blue-500 rounded-full text-white shadow-lg hover:bg-blue-600 transition-colors"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(member);
                  }}
                  className="p-2 bg-red-500 rounded-full text-white shadow-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            )}

            {/* زر التوسيع */}
            {hasChildren && (
              <div className="-bottom-8 absolute  inset-x-0 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center border-2 border-slate-800 shadow-sm"
                >
                  <ChevronDown className="w-5 h-5 text-white" />
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>

        {/* الأطفال */}
        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div
            
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto", transition: { delay: 0.2 } }}
              exit={{ opacity: 0, height: 0 }}
              className="w-fit mx-auto flex items-start gap-x-8 pt-8 relative children-container [--sibling-gap:2.0rem]"
            >
              {(member.children ?? []).slice().reverse().map((child) => (
  <div key={child.id} className="relative child-node">
    <TreeNode
      member={child}
      onAdd={onAdd}
      onEdit={onEdit}
      onDelete={onDelete}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      expandedNodes={expandedNodes}
      isAdmin={isAdmin}
    />
  </div>
))}

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TreeNode;
