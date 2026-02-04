import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';

import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSession = useCallback(async (sesh) => {
    setSession(sesh);
    setUser(sesh?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let sub;
    const getSession = async () => {
      try {
        const res = await supabase.auth.getSession();
        const session = res?.data?.session ?? null;
        handleSession(session);
      } catch (err) {
        console.error('getSession error', err);
        setLoading(false);
      }
    };

    getSession();
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      handleSession(session);
    });
    sub = data?.subscription ?? data;

    return () => {
      try {
        if (sub && typeof sub.unsubscribe === 'function') sub.unsubscribe();
      } catch (err) {

      }
    };
  }, [handleSession]);

  const signUp = useCallback(
    async (email, password, options) => {
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options,
        });

        if (error) {
          toast({
            variant: 'destructive',
            title: 'Sign up Failed',
            description: error.message || 'Something went wrong',
          });
        }

        return { error };
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Sign up Failed',
          description: String(err),
        });
        return { error: err };
      }
    },
    [toast]
  );

  const signIn = useCallback(
    async (email, password) => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast({
            variant: 'destructive',
            title: 'Sign in Failed',
            description: error.message || 'Something went wrong',
          });
        }

        return { error };
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Sign in Failed',
          description: String(err),
        });
        return { error: err };
      }
    },
    [toast]
  );

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Sign out Failed',
          description: error.message || 'Something went wrong',
        });
      }

      return { error };
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Sign out Failed',
        description: String(err),
      });
      return { error: err };
    }
  }, [toast]);


  const requestPasswordReset = useCallback(
    async (email, opts = {}) => {
      try {
        if (!email) {
          const msg = 'البريد الإلكتروني مطلوب';
          toast({ title: msg, variant: 'destructive' });
          return { error: new Error(msg) };
        }

        const redirectTo = opts.redirectTo ?? `${window.location.origin}/reset-password`;

        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo,
        });

        if (error) {
          toast({
            variant: 'destructive',
            title: 'فشل إرسال رابط إعادة التعيين',
            description: error.message || 'حاول مرة أخرى لاحقًا',
          });
          return { error };
        }

        toast({ title: 'تم إرسال رابط إعادة التعيين إلى بريدك' });
        return { data };
      } catch (err) {
        console.error('requestPasswordReset error', err);
        toast({
          variant: 'destructive',
          title: 'حدث خطأ',
          description: String(err),
        });
        return { error: err };
      }
    },
    [toast]
  );

const updatePassword = useCallback(
  async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast({ title: 'فشل تغيير كلمة المرور', variant: 'destructive' });
        return { error };
      }

      toast({ title: 'تم تغيير كلمة المرور بنجاح' });
      return { data };

    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'حدث خطأ',
        description: String(err),
      });
      return { error: err };
    }
  },
  [toast]
);


  const value = useMemo(() => ({
  user,
  session,
  loading,
  signUp,
  signIn,
  signOut,
  requestPasswordReset,
  updatePassword,   
}), [user, session, loading, signUp, signIn, signOut, requestPasswordReset, updatePassword]);


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};



