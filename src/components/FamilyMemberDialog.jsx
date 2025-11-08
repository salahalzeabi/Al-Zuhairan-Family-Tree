import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FamilyMemberDialog = ({ open, onOpenChange, onSubmit, initialData, isEditing, onImageSelect }) => {
    const [name, setName] = useState('');
    const [imageUrl, setImageUrl] = useState('/assets/members/default.svg');

    useEffect(() => {
        if (open && initialData) {
            setName(initialData.name || '');
            setImageUrl(initialData.image_url || '/assets/members/default.svg');
        }
    }, [initialData, open]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name) return;
        onSubmit({ ...initialData, name, image_url: imageUrl });
        onOpenChange(false);
    };

    const handleImageChangeClick = () => {
        if (onImageSelect) {
            onImageSelect();
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 w-full max-w-md mx-4 border border-white/20 shadow-2xl"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">{isEditing ? 'تعديل بيانات العضو' : 'إضافة عضو جديد'}</h2>
                    <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-white hover:bg-white/20"><X className="h-6 w-6" /></Button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col items-center gap-4">
                        <img src={imageUrl} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-slate-600" onError={(e) => { e.target.onerror = null; e.target.src='/assets/members/default.svg'}}/>
                        <Button type="button" onClick={handleImageChangeClick} className="bg-white/20 hover:bg-white/30 text-white">
                            <ImageIcon className="h-4 w-4 ml-2" />
                            تغيير الصورة
                        </Button>
                    </div>
                    <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="اسم العضو"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-md py-3 px-4 pr-10 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full text-lg py-3 bg-blue-600 hover:bg-blue-700 text-white">
                        {isEditing ? 'حفظ التغييرات' : 'إضافة العضو'}
                    </Button>
                </form>
            </motion.div>
        </div>
    );
};

export default FamilyMemberDialog;