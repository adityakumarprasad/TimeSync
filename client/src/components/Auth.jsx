import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User, ShieldAlert } from 'lucide-react';
import { RiTimerFlashLine } from 'react-icons/ri';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login, register, loading } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      if (!email || !password) return setError('Please fill in all fields');
      try {
        await login(email, password);
      } catch (err) {
        setError(err.message || 'Login failed');
      }
    } else {
      if (!username || !email || !password) return setError('Please fill in all fields');
      try {
        await register(username, email, password);
      } catch (err) {
        setError(err.message || 'Registration failed');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[linear-gradient(135deg,#10B981,#059669)] flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3 border border-emerald-400/20">
            <RiTimerFlashLine className="text-white w-6.5 h-6.5" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            TaskSync
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-light">Smart task management & time tracking</p>
        </div>

        <Card className="border-slate-200 bg-white shadow-xl shadow-slate-200/50 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-900 font-semibold">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-slate-500">
              {isLogin ? 'Login to continue tracking your productivity' : 'Sign up to get started'}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-600 text-sm"
                  >
                    <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-500" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="john_doe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {isLogin ? 'Email or Username' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    type={isLogin ? 'text' : 'email'}
                    placeholder={isLogin ? 'john@example.com or john_doe' : 'john@example.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[linear-gradient(135deg,#10B981,#059669)] hover:opacity-95 text-white shadow-lg shadow-emerald-500/20 py-5 transition-all duration-300 cursor-pointer font-semibold rounded-lg"
              >
                {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>

              <p className="text-sm text-slate-500 text-center">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold underline underline-offset-4 ml-1 cursor-pointer transition-colors"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
