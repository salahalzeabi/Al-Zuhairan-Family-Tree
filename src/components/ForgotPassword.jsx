import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const { requestPasswordReset } = useAuth();
  const { toast } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast({ title: 'أدخل بريدًا إلكترونيًا صالحًا', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await requestPasswordReset(email);
      if (error) {
        toast({
          title: 'فشل إرسال الرابط',
          description: error.message || 'حاول مرة أخرى لاحقًا',
          variant: 'destructive',
        });
        return;
      }
      toast({ title: 'تم إرسال رابط إعادة التعيين إلى بريدك' });
      setEmail('');
    } catch (err) {
      toast({
        title: 'حدث خطأ',
        description: String(err),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 text-white">
      <form
        onSubmit={submit}
        className="bg-slate-800/70 p-6 rounded-xl w-full max-w-md space-y-4 border border-white/20"
      >
        <h2 className="text-xl font-bold">إعادة تعيين كلمة المرور</h2>

        <div>
          <label className="block text-sm text-slate-300 mb-2">البريد الإلكتروني</label>
          <Input
            type="email"
            placeholder="بريدك الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'جاري الإرسال...' : 'إرسال الرابط'}
        </Button>

        <p className="text-sm text-gray-300">
          سيُرسل رابط إعادة الضبط إلى بريدك. (أو سيظهر في Console إن لم تُضبط SMTP)
        </p>
      </form>
    </div>
  );
};

export default ForgotPassword;

