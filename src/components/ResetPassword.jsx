import React, { useState, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/SupabaseAuthContext';  

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const ResetPassword = () => {
  const q = useQuery();
  const token = q.get('token') || '';
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const { updatePassword } = useAuth();  

  const submit = async (e) => {
    e.preventDefault();
    if (pw1.length < 6) return alert('الحد الأدنى 6 أحرف');
    if (pw1 !== pw2) return alert('الكلمتان غير متطابقتين');
    await updatePassword(pw1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 text-white">
      <form onSubmit={submit} className="bg-slate-800/70 p-6 rounded-xl w-full max-w-md space-y-4 border border-white/20">
        <h2 className="text-xl font-bold">إدخال كلمة مرور جديدة</h2>
        <Input type="password" placeholder="كلمة المرور الجديدة" value={pw1} onChange={(e)=>setPw1(e.target.value)} required />
        <Input type="password" placeholder="تأكيد كلمة المرور" value={pw2} onChange={(e)=>setPw2(e.target.value)} required />
        <Button type="submit" className="w-full">حفظ</Button>
        <div className="text-sm"><Link to="/" className="text-yellow-400">الرجوع لتسجيل الدخول</Link></div>
      </form>
    </div>
  );
};

export default ResetPassword;
