import React, { useState } from 'react';
import { Hotel, Sparkles, MapPin, Star } from 'lucide-react';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
      </div>

      {/* Floating Icons */}
      <div className="absolute top-20 left-20 text-white opacity-20 animate-bounce">
        <Hotel className="h-12 w-12" />
      </div>
      <div className="absolute top-40 right-32 text-white opacity-20 animate-bounce delay-500">
        <Star className="h-8 w-8" />
      </div>
      <div className="absolute bottom-32 left-1/4 text-white opacity-20 animate-bounce delay-1000">
        <MapPin className="h-10 w-10" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo & Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-2xl mb-4 transform hover:scale-110 transition-transform duration-300">
              <Hotel className="h-10 w-10 text-blue-600" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-2 flex items-center justify-center gap-2">
              StayNearEv
              <Sparkles className="h-8 w-8 text-yellow-300" />
            </h1>
            <p className="text-blue-100 text-lg">“Charge closer, drive farther.”</p>
          </div>

          {/* Card */}
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-4 px-6 font-semibold transition-all duration-300 ${
                  activeTab === 'login'
                    ? 'text-blue-600 border-b-4 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-4 px-6 font-semibold transition-all duration-300 ${
                  activeTab === 'signup'
                    ? 'text-blue-600 border-b-4 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Form Content */}
            <div className="p-8">
              {activeTab === 'login' ? (
                <div className="animate-fadeIn">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome Back! 👋
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Sign in to access your account
                  </p>
                  <LoginForm onSuccess={() => window.location.reload()} />
                </div>
              ) : (
                <div className="animate-fadeIn">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Create Account 🚀
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Join us and start your journey
                  </p>
                  <SignupForm onSuccess={() => setActiveTab('login')} />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-4 text-center text-sm text-gray-600">
              <p>
                {activeTab === 'login' 
                  ? "Don't have an account? " 
                  : "Already have an account? "}
                <button
                  onClick={() => setActiveTab(activeTab === 'login' ? 'signup' : 'login')}
                  className="text-blue-600 font-semibold hover:text-blue-700 hover:underline"
                >
                  {activeTab === 'login' ? 'Sign up now' : 'Login here'}
                </button>
              </p>
            </div>
          </div>

          {/* Bottom Text */}
          <p className="text-center text-white/80 text-sm mt-6">
            © 2025 StayNearBy.Charge closer, drive farther.
          </p>
        </div>
      </div>

    <style>{`
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-in-out;
  }
`}</style>

    </div>
  );
};

export default LoginPage;