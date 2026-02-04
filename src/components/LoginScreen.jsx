import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Lock, User, Mail, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';


const LoginScreen = ({ onGuestLogin, onAdminLogin }) => {
  const [email, setEmail] = useState('admin@local');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { signIn } = useAuth();


  const handleLogin = async () => {
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: 'فشل تسجيل الدخول', variant: 'destructive' });
    } else {
      
      onAdminLogin?.();
    }
  };

  const handleKeyPress = (e) => e.key === 'Enter' && handleLogin();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="relative z-10 w-full max-w-md bg-slate-900/70 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center text-white shadow-2xl"
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-4 flex justify-center"
        >
          <img
            alt="شجرة عائلة"
            className="max-w-full h-auto"
            style={{ width: '80%', objectFit: 'contain' }}
            src="https://horizons-cdn.hostinger.com/3b9f750c-9a70-44be-818f-4a1a1766eaeb/e8e130afa368c9e169602233725b28a9.png"
          />
        </motion.div>

        <motion.p
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-gray-300 mb-8"
        >
          أهلاً بكم في شجرة العائلة الرقمية
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="space-y-4 text-left"
        >
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="email"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-800/50 border-white/20 text-white pl-4 pr-10 h-12 text-lg focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>

          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyPress}
              className="bg-slate-800/50 border-white/20 text-white pl-4 pr-10 h-12 text-lg focus:ring-yellow-500 focus:border-yellow-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link to="/forgot" className="text-yellow-400 hover:underline">
              نسيت كلمة المرور؟
            </Link>
          </div>

          <Button
            onClick={handleLogin}
            className="w-full text-lg py-6 bg-yellow-600 hover:bg-yellow-700 text-slate-900 font-bold"
          >
            <Lock className="ml-2" /> الدخول
          </Button>

          <Button
            onClick={onGuestLogin}
            variant="outline"
            className="w-full text-lg py-6 bg-transparent border-white/30 hover:bg-white/10 text-white"
          >
            <User className="ml-2" /> الدخول كزائر
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
