// rubia-client\src\pages\Auth\SignInPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import * as userService from '../../services/UserService';

const inputClasses = 
  'mt-2 w-full rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-zinc-50';

const actionButtonClassName = 'w-full rounded-xl py-3 text-[11px] tracking-[0.2em]';

const SignInPage = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
        const res = await userService.loginUser({ 
        email: identifier, 
        password 
      });
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('id', res.data.id);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('firstName', res.data.firstName);

      const userPayload = {
        id: res.data.id,
        username: res.data.username,
        role: res.data.role,
        gender: res.data.gender
      };
      localStorage.setItem('user', JSON.stringify(userPayload));
      window.dispatchEvent(new Event('local-auth-update'));

      if (res.data.role === 'trainer') {
        navigate('/'); 
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
        alert(err.response?.data?.message || "Login Failed. Please check your credentials.");
    }
  };

  return (
    <>
      {/* Brand/Logo Section */}
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-4 border-zinc-900 bg-zinc-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] group-hover:rotate-12 transition-transform">
        <div className="h-8 w-8 rounded-full border-2 border-blue-300 bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center overflow-hidden">
          <div className="absolute top-1 left-2 h-4 w-4 rounded-full bg-white/30 blur-[1px]"></div>
          <div className="h-full w-1 bg-white/10 rotate-45"></div>
        </div>
      </div>
      <div className="flex flex-col mb-6">
        <p className="text-xl font-black uppercase italic tracking-tighter text-zinc-900">
          ROTOM<span className="text-[#ff1c1c]">PC</span>
        </p>
      </div>

      <p className="text-3xl font-bold tracking-tight text-zinc-600 sm:text-4xl">
        Log In
      </p>

      <p className="mt-3 text-sm leading-6 text-zinc-600">
        Access your account using your username or email address.
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleLogin}>
        <div>
          <label htmlFor="signin-identifier" className="text-sm font-medium text-zinc-700">
            Username or Email
          </label>
          <input 
            id="signin-identifier"
            type="text" 
            onChange={(e) => setIdentifier(e.target.value)} 
            placeholder="e.g. ash_ketchum or ash@pallet.com" 
            className={inputClasses} 
            required 
          />
        </div>

        <div>
          <label htmlFor="signin-password" className="text-sm font-medium text-zinc-700">
            Password
          </label>
          <input 
            id="signin-password"
            type="password" 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Enter your password" 
            className={inputClasses} 
            required 
          />
        </div>

        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="flex items-center gap-2 text-zinc-600 cursor-pointer">
            <input type="checkbox" className="h-4 w-4 rounded border-zinc-300 accent-zinc-900" />
            <span>Remember me</span>
          </label>
          <button type="button" className="font-medium text-zinc-700 transition hover:text-zinc-900">
            Forgot Password?
          </button>
        </div>

        <Button type="submit" variant="primary" className={actionButtonClassName}>
          Log In
        </Button>
        
        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          <Button type="button" variant="secondary" className={actionButtonClassName}>
            Log In with Google
          </Button>
          <Button type="button" variant="secondary" className={actionButtonClassName}>
            Log In with Apple
          </Button>
        </div>
      </form>

      <div className="mt-8 border-t border-zinc-200 pt-6 text-sm text-zinc-600">
        No account yet?{' '}
        <Link 
          to="/auth/signup" 
          className="font-semibold text-zinc-900 transition hover:text-zinc-600"
        >
          Sign Up
        </Link>
      </div>
    </>
  );
};

export default SignInPage;