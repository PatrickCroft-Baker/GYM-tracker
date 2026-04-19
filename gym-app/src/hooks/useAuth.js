import { useState, useEffect } from 'react';
import { sb } from '../lib/supabase';

export default function useAuth() {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email, password) {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email, password) {
    const { error } = await sb.auth.signUp({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    await sb.auth.signOut();
  }

  return { user, signIn, signUp, signOut };
}
