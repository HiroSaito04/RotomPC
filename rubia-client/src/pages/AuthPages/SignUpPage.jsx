// rubia-client\src\pages\Auth\SignUpPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import * as userService from '../../services/UserService';

const inputClasses = 
  'mt-2 w-full rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-zinc-50';

const actionButtonClassName = 'w-full rounded-xl py-3 text-[11px] tracking-[0.2em]';

const SignUpPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '',
    age: '', gender: '', contactNumber: '', username: '', address: 'N/A'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!/^09\d{9}$/.test(formData.contactNumber)) {
      return alert("Contact must be 11 digits starting with 09");
    }

    if (formData.password.length < 8) {
      return alert("Password is too short.");
    }

    try {
      const payload = {
        ...formData,
        email: formData.email.toLowerCase().trim(),
        username: formData.username.trim()
      };

      await userService.createUser(payload);
      alert("Registration Successful!");
      navigate('/auth/signin');
    } catch (err) {
      alert(err.response?.data?.message || "Error signing up");
    }
  };

  return (
    <>
      {/* Logo Section */}
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
       Sign Up
      </p>
      <p className="mt-3 text-sm leading-6 text-zinc-600">
        Create your account with the same monochrome layout pattern and shared button treatment.
      </p>
      <form className="mt-8 space-y-5" onSubmit={handleSignUp}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName">First Name</label>
            <input 
              id="firstName" type="text" onChange={handleChange} className={inputClasses} 
              required minLength="2" maxLength="50" pattern="^[A-Za-z\s\-']+$"
              title="Only letters, hyphens, and apostrophes allowed"
            />
          </div>
          <div>
            <label htmlFor="lastName">Last Name</label>
            <input 
              id="lastName" type="text" onChange={handleChange} className={inputClasses} 
              required minLength="2" maxLength="50" pattern="^[A-Za-z\s\-']+$"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="username">Username</label>
            <input 
              id="username" placeholder="Optional" type="text" onChange={handleChange} 
              className={inputClasses} minLength="3" maxLength="30" pattern="^[a-zA-Z0-9._]+$"
            />
          </div>
          <div>
            <label htmlFor="age">Age</label>
            <input 
              id="age" type="number" onChange={handleChange} className={inputClasses} 
              required min="18" max="100"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="gender">Gender</label>
            <select id="gender" onChange={handleChange} className={inputClasses} required>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="contactNumber">Contact Number</label>
            <input 
              id="contactNumber" type="text" maxLength="11" placeholder="09XXXXXXXXX" 
              onChange={handleChange} className={inputClasses} required 
              pattern="^09\d{9}$" title="Must be 11 digits starting with 09"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email">Email Address</label>
          <input id="email" type="email" onChange={handleChange} className={inputClasses} required />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-zinc-700">
            Password
          </label>
          <input 
            id="password" 
            type="password" 
            onChange={handleChange} 
            className={inputClasses} 
            required 
            minLength="8" 
            maxLength="72"
            pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{}|;':/<>?,.])[A-Za-z\d!@#$%^&*()_+\-=[\]{}|;':/<>?,.]{8,72}$"
            title="Must contain at least 8 characters, including one uppercase, one lowercase, one number, and one special character."
          />
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Use 8 or more characters with a mix of letters, numbers & symbols.
          </p>
        </div>

        <Button type="submit" variant="primary" className={actionButtonClassName}>
          Create Account
        </Button>

        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          <Button type="button" variant="secondary" className={actionButtonClassName}>
            Sign Up with Google
          </Button>
          <Button type="button" variant="secondary" className={actionButtonClassName}>
            Sign Up with Apple
          </Button>
        </div>
      </form>

      <div className="mt-8 border-t border-zinc-200 pt-6 text-sm text-zinc-600">
        Already have an account?{' '}
        <Link 
          to="/auth/signin" 
          className="font-semibold text-zinc-900 transition hover:text-zinc-600"
        >
          Log In
        </Link>
      </div>
    </>
  );
};

export default SignUpPage;