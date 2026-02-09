
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { fetchUsers } from '../services/dashboardService';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Mail, Phone, MoreHorizontal, Plus, Edit, Trash2, AlertTriangle, User as UserIcon } from 'lucide-react';

const getDisplayName = (user: User): string => {
  return user.fullName || user.username || user.email.split('@')[0];
};

export const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToToggle, setUserToToggle] = useState<User | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const { user: currentUser } = useAuth();
  const { navigate } = useApp();

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchUsers();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('Failed to load users');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const togglePermission = (user: User) => {
    // Prevent admin from disabling themselves
    if (currentUser?.role === 'ADMIN' && user.id === currentUser.id) {
      alert('You cannot disable your own account.');
      return;
    }

    // Show confirmation modal for disabling users
    if (user.isActive) {
      setUserToToggle(user);
    } else {
      // For enabling, proceed directly
      performToggle(user);
    }
  };

  const performToggle = async (user: User) => {
    setTogglingUserId(user.id);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/admin/users/${user.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === user.id
            ? { ...u, isActive: !u.isActive }
            : u
        )
      );
    } catch (err) {
      console.error('Failed to update user status:', err);
      // Could show a toast notification here
    } finally {
      setTogglingUserId(null);
    }
  };

  const confirmToggle = () => {
    if (userToToggle) {
      performToggle(userToToggle);
      setUserToToggle(null);
    }
  };

  const handleEdit = (userId: string) => {
    setActiveDropdown(null);
    navigate(`/users/edit/${userId}`);
  };

  const handleDeleteClick = (user: User) => {
    setActiveDropdown(null);
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400) {
          alert(errorData.message || 'Cannot delete the last admin user');
        } else {
          throw new Error(errorData.message || 'Failed to delete user');
        }
        setUserToDelete(null);
        return;
      }

      // Remove user from local state
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete user');
      setUserToDelete(null);
    }
  };

  return (
    <div className="space-y-6 relative min-h-screen pb-20">
       {/* Header */}
       <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors duration-200">
        <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Team Members</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage access and roles for your organization.</p>
        </div>
        <button 
            type="button"
            onClick={() => navigate('/users/new')}
            className={`bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-medium shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-transform hover:-translate-y-0.5 flex items-center gap-2 ${currentUser?.role === 'ADMIN' ? '' : 'opacity-50 cursor-not-allowed'}`}
            disabled={currentUser?.role !== 'ADMIN'}
        >
            <Plus size={18} /> Add User
        </button>
       </div>

       {loading ? (
         <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm text-center transition-colors duration-200">
           <div className="text-lg text-slate-600 dark:text-slate-400">Loading users...</div>
         </div>
       ) : error ? (
         <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-red-200 dark:border-red-800 shadow-sm text-center transition-colors duration-200">
           <div className="text-lg text-red-600 dark:text-red-400">{error}</div>
         </div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" onClick={() => setActiveDropdown(null)}>
           {users.length === 0 ? (
             <div className="col-span-full bg-white dark:bg-slate-800 p-12 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
               <UserIcon className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
               <h3 className="text-lg font-medium text-slate-800 dark:text-white">No Users Found</h3>
               <p className="text-slate-400 dark:text-slate-500">No team members have been added yet.</p>
             </div>
           ) : (
             users.map(user => (
               <div key={user.id} className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group relative overflow-visible" onClick={(e) => e.stopPropagation()}>
                   <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${user.isActive ? 'from-indigo-500 via-purple-500 to-pink-500' : 'from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700'} opacity-0 group-hover:opacity-100 transition-opacity rounded-t-3xl`}></div>
                   
                   <div className="flex justify-between items-start mb-6">
                       <div className="flex items-center gap-4 flex-1">
                           <div className="relative">
                               {user.avatarUrl ? (
                                   <img src={user.avatarUrl} className={`w-16 h-16 rounded-2xl object-cover shadow-sm ${!user.isActive && 'grayscale opacity-70'}`} alt={getDisplayName(user)} />
                               ) : (
                                   <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm ${!user.isActive && 'opacity-70 grayscale'}`}>
                                       <span className="text-2xl font-bold">{getDisplayName(user).charAt(0).toUpperCase()}</span>
                                   </div>
                               )}
                               <span className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white dark:border-slate-800 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
                           </div>
                           <div className="flex-1 min-w-0">
                               <h3 className={`font-bold text-xl mb-1 ${user.isActive ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-500'}`}>{getDisplayName(user)}</h3>
                               <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{user.designation || 'No designation'}</p>
                           </div>
                       </div>
                       
                       <div className="relative">
                           <button 
                                onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
                                className="text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full transition-colors"
                           >
                               <MoreHorizontal size={20} />
                           </button>
                           
                           {/* Dropdown Menu */}
                           {activeDropdown === user.id && (
                               <div className="absolute right-0 top-10 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
                                   <button 
                                        onClick={() => handleEdit(user.id)}
                                        className="w-full text-left px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2"
                                    >
                                       <Edit size={16} /> Edit User
                                   </button>
                                   <button 
                                        onClick={() => handleDeleteClick(user)}
                                        className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 border-t border-slate-50 dark:border-slate-700"
                                    >
                                       <Trash2 size={16} /> Remove User
                                   </button>
                               </div>
                           )}
                       </div>
                   </div>
                   
                   <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl">
                            <Mail size={16} className="text-slate-400 dark:text-slate-500" /> 
                            <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl">
                            <Phone size={16} className="text-slate-400 dark:text-slate-500" /> 
                            {user.phone}
                        </div>
                   </div>

                   <div className="pt-4 border-t border-slate-50 dark:border-slate-700 flex justify-between items-center">
                       <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${user.role === 'ADMIN' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300'}`}>
                           {user.role}
                       </span>
                       
                       <div className="flex items-center gap-3">
                            <label className={`relative inline-flex items-center ${togglingUserId === user.id ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                <input 
                                  type="checkbox" 
                                  className="sr-only peer" 
                                  checked={user.isActive} 
                                  onChange={() => togglePermission(user)}
                                  disabled={togglingUserId === user.id}
                                />
                                <div className={`w-9 h-5 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-100 dark:peer-focus:ring-indigo-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${
                                  togglingUserId === user.id 
                                    ? 'bg-slate-300 dark:bg-slate-500' 
                                    : 'bg-slate-200 dark:bg-slate-600 peer-checked:bg-indigo-600'
                                }`}></div>
                            </label>
                       </div>
                   </div>
               </div>
             ))
           )}
         </div>
       )}

        {/* Delete User Modal */}
        {userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setUserToDelete(null)}></div>
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full relative z-10 shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-100 dark:border-slate-700">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-center text-slate-800 dark:text-white mb-2">Remove User?</h3>
                  <p className="text-center text-slate-500 dark:text-slate-400 mb-8">Are you sure you want to remove <span className="font-semibold text-slate-800 dark:text-slate-200">{getDisplayName(userToDelete)}</span>? This action cannot be undone.</p>
                  <div className="flex gap-3">
                      <button onClick={() => setUserToDelete(null)} className="flex-1 py-3 font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl transition-colors">
                          Cancel
                      </button>
                      <button onClick={confirmDelete} className="flex-1 py-3 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-colors">
                          Yes, Remove
                      </button>
                  </div>
              </div>
          </div>
        )}

        {/* Disable User Confirmation Modal */}
        {userToToggle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setUserToToggle(null)}></div>
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full relative z-10 shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-100 dark:border-slate-700">
                  <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-center text-slate-800 dark:text-white mb-2">Disable User?</h3>
                  <p className="text-center text-slate-500 dark:text-slate-400 mb-8">Are you sure you want to disable <span className="font-semibold text-slate-800 dark:text-slate-200">{getDisplayName(userToToggle)}</span>? They will lose access to the system.</p>
                  <div className="flex gap-3">
                      <button onClick={() => setUserToToggle(null)} className="flex-1 py-3 font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl transition-colors">
                          Cancel
                      </button>
                      <button onClick={confirmToggle} className="flex-1 py-3 font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-lg shadow-amber-200 dark:shadow-none transition-colors">
                          Yes, Disable
                      </button>
                  </div>
              </div>
          </div>
        )}
    </div>
  );
};
