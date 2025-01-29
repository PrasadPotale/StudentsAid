import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Heart, LogOut, User, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">StudentAid</span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/donations"
                  className="text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                >
                  <Heart className="h-5 w-5" />
                  <span>Donations</span>
                </Link>
                <Link
                  to="/profile"
                  className="text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                >
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </Link>
                <Link
                  to="/admin"
                  className="text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                >
                  <Shield className="h-5 w-5" />
                  <span>Admin</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}