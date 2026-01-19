
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { User as UserIcon, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import { CustomSelect } from '../components/CustomSelect';
import { useApp } from '../context/AppContext';

export const AdminUserForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const { navigate } = useApp();
  
  // User State - removed random avatarUrl default
  const [userData, setUserData] = useState<Partial<User>>({
      name: '', username: '', password: '', email: '', phone: '', designation: '', role: 'STAFF', isActive: true, avatarUrl: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if we are in Edit mode (for future implementation)
  useEffect(() => {
    // For now, this is always add mode
    setEditUserId(null);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!userData.name?.trim()) newErrors.name = 'Full name is required';
    if (!userData.designation?.trim()) newErrors.designation = 'Designation is required';
    if (!userData.email?.trim()) newErrors.email = 'Email is required';
    if (!userData.phone?.trim()) newErrors.phone = 'Phone number is required';
    if (!userData.username?.trim()) newErrors.username = 'Username is required';
    if (!editUserId && !userData.password?.trim()) newErrors.password = 'Password is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (userData.email && !emailRegex.test(userData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (basic)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (userData.phone && !phoneRegex.test(userData.phone.replace(/[\s\-\(\)\.]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch('http://localhost:3000/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: userData.name,
          username: userData.username,
          password: userData.password,
          email: userData.email,
          phone: userData.phone,
          designation: userData.designation,
          role: userData.role,
          isActive: userData.isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      // Show success toast
      setShowSuccessToast(true);
      
      // Reset form
      setUserData({
        name: '', username: '', password: '', email: '', phone: '', designation: '', role: 'STAFF', isActive: true, avatarUrl: ''
      });
      setErrors({});

      // Redirect after a short delay
      setTimeout(() => {
        setShowSuccessToast(false);
        navigate('/users');
      }, 2000);

    } catch (err) {
      console.error('Failed to create user:', err);
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to create user' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = [
    { value: 'ADMIN', label: 'Administrator' },
    { value: 'STAFF', label: 'Staff Member' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 relative">
       {/* Success Toast */}
       {showSuccessToast && (
         <div className="fixed top-4 right-4 z-50 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
           <CheckCircle size={20} />
           <span className="font-medium">User created successfully!</span>
         </div>
       )}

       <div className="flex items-center gap-4">
            <button onClick={() => navigate('/users')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
                <ArrowLeft size={24} />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{editUserId ? 'Edit User' : 'Add New User'}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{editUserId ? 'Update user details and permissions.' : 'Create a new account for a staff member or admin.'}</p>
            </div>
       </div>

       <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 space-y-8 overflow-visible">
           <div className="space-y-6">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-700 mb-4 overflow-hidden border-4 border-white dark:border-slate-600 shadow-lg flex items-center justify-center">
                        {userData.avatarUrl ? (
                            <img src={userData.avatarUrl} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                            <UserIcon className="text-slate-300 dark:text-slate-500" size={48} />
                        )}
                    </div>
                    {/* Placeholder for future upload functionality */}
                    <button type="button" className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Change Avatar</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">Full Name</label>
                        <div className="relative">
                            <input 
                                required
                                value={userData.name}
                                onChange={e => setUserData({...userData, name: e.target.value})}
                                className={`w-full bg-slate-50 dark:bg-slate-900 border p-3 pl-4 rounded-xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-500 outline-none transition-all dark:text-slate-100 ${
                                  errors.name ? 'border-red-300 dark:border-red-600' : 'border-slate-200 dark:border-slate-700'
                                }`} 
                                placeholder="John Doe"
                            />
                        </div>
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">Designation</label>
                        <div className="relative">
                            <input 
                                required
                                value={userData.designation}
                                onChange={e => setUserData({...userData, designation: e.target.value})}
                                className={`w-full bg-slate-50 dark:bg-slate-900 border p-3 pl-4 rounded-xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-500 outline-none transition-all dark:text-slate-100 ${
                                  errors.designation ? 'border-red-300 dark:border-red-600' : 'border-slate-200 dark:border-slate-700'
                                }`} 
                                placeholder="e.g. IT Manager"
                            />
                        </div>
                        {errors.designation && <p className="text-red-500 text-xs mt-1">{errors.designation}</p>}
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">Email Address</label>
                        <div className="relative">
                            <input 
                                type="email"
                                required
                                value={userData.email}
                                onChange={e => setUserData({...userData, email: e.target.value})}
                                className={`w-full bg-slate-50 dark:bg-slate-900 border p-3 pl-4 rounded-xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-500 outline-none transition-all dark:text-slate-100 ${
                                  errors.email ? 'border-red-300 dark:border-red-600' : 'border-slate-200 dark:border-slate-700'
                                }`} 
                                placeholder="john@company.com"
                            />
                        </div>
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">Phone Number</label>
                        <div className="relative">
                            <input 
                                required
                                value={userData.phone}
                                onChange={e => setUserData({...userData, phone: e.target.value})}
                                className={`w-full bg-slate-50 dark:bg-slate-900 border p-3 pl-4 rounded-xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-500 outline-none transition-all dark:text-slate-100 ${
                                  errors.phone ? 'border-red-300 dark:border-red-600' : 'border-slate-200 dark:border-slate-700'
                                }`} 
                                placeholder="+1 555 000 0000"
                            />
                        </div>
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">Username</label>
                        <input 
                            required
                            value={userData.username}
                            onChange={e => setUserData({...userData, username: e.target.value})}
                            className={`w-full bg-slate-50 dark:bg-slate-900 border p-3 pl-4 rounded-xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-500 outline-none transition-all dark:text-slate-100 ${
                              errors.username ? 'border-red-300 dark:border-red-600' : 'border-slate-200 dark:border-slate-700'
                            }`} 
                            placeholder="johndoe"
                        />
                        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">Password</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? 'text' : 'password'}
                                required={!editUserId} // Only required for new users
                                value={userData.password}
                                onChange={e => setUserData({...userData, password: e.target.value})}
                                className={`w-full bg-slate-50 dark:bg-slate-900 border p-3 pl-4 pr-12 rounded-xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-500 outline-none transition-all dark:text-slate-100 ${
                                  errors.password ? 'border-red-300 dark:border-red-600' : 'border-slate-200 dark:border-slate-700'
                                }`} 
                                placeholder="••••••••"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">System Role</label>
                        <CustomSelect 
                            value={userData.role as string} 
                            onChange={(val) => setUserData({...userData, role: val as any})} 
                            options={roleOptions} 
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div>
                            <span className="font-bold text-slate-800 dark:text-white block">Account Status</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">Enable or disable login access</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={userData.isActive} onChange={() => setUserData({...userData, isActive: !userData.isActive})} />
                            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-100 dark:peer-focus:ring-indigo-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>
                </div>
           </div>

           <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700">
               {errors.submit && (
                 <div className="flex-1 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-200 dark:border-red-800">
                   {errors.submit}
                 </div>
               )}
               <button type="button" onClick={() => {/* navigate('/users') */}} className="px-6 py-3 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                   Cancel
               </button>
               <button 
                 type="submit" 
                 disabled={isSubmitting}
                 className={`px-8 py-3 font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-colors ${
                   isSubmitting 
                     ? 'bg-indigo-400 cursor-not-allowed text-white' 
                     : 'bg-indigo-600 text-white hover:bg-indigo-700'
                 }`}
               >
                 {isSubmitting ? 'Creating User...' : (editUserId ? 'Update User' : 'Create User')}
               </button>
           </div>
       </form>
    </div>
  );
};
