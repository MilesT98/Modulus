import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, 
  Zap, 
  Target, 
  FileText, 
  BarChart3, 
  Plus, 
  Clock, 
  Search, 
  Bell, 
  Edit, 
  CheckCircle,
  Shield,
  Cpu,
  Users,
  Star,
  Crown,
  Menu,
  X
} from 'lucide-react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    funding_body: '',
    tech_area: ''
  });
  const [dashboardStats, setDashboardStats] = useState(null);
  const [alertPreferences, setAlertPreferences] = useState({
    keywords: [],
    tech_areas: [],
    funding_bodies: []
  });

  // Auth forms state
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    company_name: '',
    full_name: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile();
    }
  }, []);

  useEffect(() => {
    if (user && currentView === 'opportunities') {
      fetchOpportunities();
    }
  }, [user, currentView, searchTerm, selectedFilters]);

  useEffect(() => {
    if (user && currentView === 'dashboard') {
      fetchDashboardStats();
    }
  }, [user, currentView]);

  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('token');
    }
  };

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedFilters.funding_body) params.funding_body = selectedFilters.funding_body;
      if (selectedFilters.tech_area) params.tech_area = selectedFilters.tech_area;

      const response = await api.get('/api/opportunities', { params });
      setOpportunities(response.data);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    }
    setLoading(false);
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/api/dashboard/stats');
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  // Memoized input component to prevent focus loss
  const StableInput = React.memo(({ type, value, onChange, placeholder, label, required = false }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        placeholder={placeholder}
      />
    </div>
  ));

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, loginForm);
      localStorage.setItem('token', response.data.access_token);
      setUser(response.data.user);
      setCurrentView('dashboard');
      setLoginForm({ email: '', password: '' });
    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  }, [loginForm]);

  const handleRegister = useCallback(async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, registerForm);
      localStorage.setItem('token', response.data.access_token);
      setUser(response.data.user);
      setCurrentView('dashboard');
      setRegisterForm({ email: '', password: '', company_name: '', full_name: '' });
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  }, [registerForm]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentView('home');
  };

  const handleUpgrade = async (tier) => {
    try {
      await api.post('/api/users/upgrade', null, { params: { tier } });
      alert(`Successfully upgraded to ${tier.toUpperCase()} tier!`);
      fetchUserProfile();
      fetchDashboardStats();
    } catch (error) {
      alert('Upgrade failed: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'free': return 'text-gray-600 bg-gray-100';
      case 'pro': return 'text-blue-600 bg-blue-100';
      case 'enterprise': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'free': return <Users className="w-4 h-4" />;
      case 'pro': return <Star className="w-4 h-4" />;
      case 'enterprise': return <Crown className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const BackButton = ({ onClick, text = "Back" }) => (
    <button
      onClick={onClick}
      className="flex items-center text-cyan-600 hover:text-cyan-700 font-medium mb-6 transition-colors"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {text}
    </button>
  );

  const NavBar = () => (
    <nav className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div 
              className="text-2xl font-bold text-cyan-400 cursor-pointer flex items-center"
              onClick={() => setCurrentView('home')}
            >
              <div className="w-8 h-8 bg-cyan-400 rounded mr-2 flex items-center justify-center">
                <div className="w-4 h-4 bg-slate-900 rounded-sm"></div>
              </div>
              Modulus Defence
            </div>
            {user && (
              <div className="hidden md:flex space-x-6">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                    currentView === 'dashboard' ? 'bg-slate-700 text-cyan-400' : 'hover:bg-slate-700'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('opportunities')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                    currentView === 'opportunities' ? 'bg-slate-700 text-cyan-400' : 'hover:bg-slate-700'
                  }`}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Opportunities
                </button>
                <button
                  onClick={() => setCurrentView('alerts')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                    currentView === 'alerts' ? 'bg-slate-700 text-cyan-400' : 'hover:bg-slate-700'
                  }`}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Alert Settings
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center ${getTierColor(user.tier)}`}>
                  {getTierIcon(user.tier)} 
                  <span className="ml-1">{user.tier.toUpperCase()}</span>
                </div>
                <span className="text-sm text-gray-300">{user.company_name}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="space-x-2">
                <button
                  onClick={() => setCurrentView('login')}
                  className="text-cyan-400 hover:text-cyan-300 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => setCurrentView('register')}
                  className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );

  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Navigate UK Defence
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600"> Funding & Contracts</span>
              <br />with Confidence
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto">
              Your central, trusted resource for UK defence opportunities. Access real-time funding alerts, 
              expert analysis, and comprehensive procurement guidance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setCurrentView('register')}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
              >
                Start Free Trial
              </button>
              <button
                onClick={() => setCurrentView('opportunities')}
                className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 px-8 py-4 rounded-lg text-lg font-semibold transition-all"
              >
                Browse Opportunities
              </button>
            </div>
          </div>
        </div>

        {/* Geometric background pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-cyan-500/10 rounded-full"></div>
          <div className="absolute top-1/2 -left-8 w-48 h-48 bg-blue-500/10 rounded-full"></div>
          <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-purple-500/5 rounded-full"></div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Why Choose Modulus Defence?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built specifically for UK defence SMEs, we provide the insights and tools you need to succeed in the complex defence procurement landscape.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-cyan-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Real-Time Alerts</h3>
              <p className="text-gray-600">
                Get instant notifications for new opportunities matching your expertise and interests. Never miss a deadline again.
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Expert Analysis</h3>
              <p className="text-gray-600">
                Deep-dive opportunity assessments with competitive landscape analysis and bid guidance from defence experts.
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Procurement Guidance</h3>
              <p className="text-gray-600">
                Navigate the new Procurement Act with confidence using our comprehensive guides and compliance checklists.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Choose Your Access Level
            </h2>
            <p className="text-xl text-gray-600">
              Start free and upgrade as your business grows
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-slate-900 mb-4">£0<span className="text-lg text-gray-500">/month</span></div>
                <p className="text-gray-600">Perfect for getting started</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Basic opportunity listings
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  48-hour delay on updates
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  General procurement guides
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Basic search and filters
                </li>
              </ul>
              <button
                onClick={() => setCurrentView('register')}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Tier */}
            <div className="bg-white rounded-xl shadow-xl p-8 border-2 border-cyan-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-cyan-500 text-white px-4 py-2 rounded-full text-sm font-semibold">Most Popular</span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Pro / SME</h3>
                <div className="text-4xl font-bold text-slate-900 mb-4">£49<span className="text-lg text-gray-500">/month</span></div>
                <p className="text-gray-600">For growing defence SMEs</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Real-time opportunity alerts
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Expert opportunity analysis
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Advanced Procurement Act hub
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Community forum access
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Monthly expert webinars
                </li>
              </ul>
              <button
                onClick={() => setCurrentView('register')}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Start Pro Trial
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-purple-200">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Enterprise</h3>
                <div className="text-4xl font-bold text-slate-900 mb-4">£199<span className="text-lg text-gray-500">/month</span></div>
                <p className="text-gray-600">For established organizations</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Multi-user licenses
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Custom reporting & briefings
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Priority support
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Exclusive event access
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Dedicated account manager
                </li>
              </ul>
              <button
                onClick={() => setCurrentView('register')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const LoginPage = () => (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton onClick={() => setCurrentView('home')} text="Back to Home" />
      </div>
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-2 text-gray-600">Sign in to your Modulus Defence account</p>
          </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <StableInput
              type="email"
              required
              value={loginForm.email}
              onChange={(e) => setLoginForm(prev => ({...prev, email: e.target.value}))}
              placeholder="your.email@company.com"
              label="Email"
            />
            <StableInput
              type="password"
              required
              value={loginForm.password}
              onChange={(e) => setLoginForm(prev => ({...prev, password: e.target.value}))}
              placeholder="••••••••"
              label="Password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Sign In
          </button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => setCurrentView('register')}
              className="text-cyan-600 hover:text-cyan-700 font-medium"
            >
              Don't have an account? Register here
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const RegisterPage = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <BackButton onClick={() => setCurrentView('home')} text="Back to Home" />
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">Get started with Modulus Defence</h2>
          <p className="mt-2 text-gray-600">Create your free account in seconds</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                required
                value={registerForm.full_name}
                onChange={(e) => setRegisterForm(prev => ({...prev, full_name: e.target.value}))}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="John Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input
                type="text"
                required
                value={registerForm.company_name}
                onChange={(e) => setRegisterForm(prev => ({...prev, company_name: e.target.value}))}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Your Defence Company Ltd"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                required
                value={registerForm.email}
                onChange={(e) => setRegisterForm(prev => ({...prev, email: e.target.value}))}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="your.email@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                required
                value={registerForm.password}
                onChange={(e) => setRegisterForm(prev => ({...prev, password: e.target.value}))}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Create Account
          </button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => setCurrentView('login')}
              className="text-cyan-600 hover:text-cyan-700 font-medium"
            >
              Already have an account? Sign in here
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const DashboardPage = () => (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user.full_name}</h1>
          <p className="text-gray-600 mt-2">Here's what's happening with UK defence opportunities</p>
        </div>

        {/* Stats Cards */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-cyan-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-cyan-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Opportunities</p>
                  <p className="text-2xl font-bold text-slate-900">{dashboardStats.total_opportunities}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Plus className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New This Week</p>
                  <p className="text-2xl font-bold text-slate-900">{dashboardStats.new_this_week}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Closing Soon</p>
                  <p className="text-2xl font-bold text-slate-900">{dashboardStats.closing_soon}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Tier & Upgrade */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Your Current Plan: {getTierIcon(user.tier)} {user.tier.toUpperCase()}
              </h3>
              <p className="text-gray-600 mb-4">
                {user.tier === 'free' 
                  ? 'Upgrade to Pro for real-time alerts and expert analysis'
                  : user.tier === 'pro'
                  ? 'You have access to all Pro features including real-time alerts'
                  : 'You have full Enterprise access with priority support'
                }
              </p>
              {dashboardStats && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-900">Your Benefits:</h4>
                  <ul className="space-y-1">
                    {dashboardStats.tier_benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {user.tier === 'free' && (
                <button
                  onClick={() => handleUpgrade('pro')}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Upgrade to Pro
                </button>
              )}
              {user.tier === 'pro' && (
                <button
                  onClick={() => handleUpgrade('enterprise')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Upgrade to Enterprise
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setCurrentView('opportunities')}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Search className="w-5 h-5 mr-3 text-cyan-600" />
                  <div>
                    <p className="font-medium text-slate-900">Browse Opportunities</p>
                    <p className="text-sm text-gray-600">Find the latest defence funding opportunities</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setCurrentView('alerts')}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Bell className="w-5 h-5 mr-3 text-cyan-600" />
                  <div>
                    <p className="font-medium text-slate-900">Set Up Alerts</p>
                    <p className="text-sm text-gray-600">Configure personalized opportunity notifications</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Edit className="w-5 h-5 mr-3 text-green-600" />
                <div>
                  <p className="font-medium text-slate-900">Account Created</p>
                  <p className="text-sm text-gray-600">Welcome to Modulus Defence!</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <CheckCircle className="w-5 h-5 mr-3 text-blue-600" />
                <div>
                  <p className="font-medium text-slate-900">Profile Setup</p>
                  <p className="text-sm text-gray-600">Your profile is ready for opportunities</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const OpportunitiesPage = () => (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user && <BackButton onClick={() => setCurrentView('dashboard')} text="Back to Dashboard" />}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Defence Opportunities</h1>
          <p className="text-gray-600 mt-2">
            {user?.tier === 'free' 
              ? 'Browse available opportunities (48-hour delay for free accounts)'
              : 'Real-time access to all defence funding opportunities'
            }
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search opportunities..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Funding Body</label>
              <select
                value={selectedFilters.funding_body}
                onChange={(e) => setSelectedFilters(prev => ({...prev, funding_body: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="">All Funding Bodies</option>
                <option value="DSTL">DSTL</option>
                <option value="UKRI">UKRI</option>
                <option value="MOD">MOD</option>
                <option value="Innovate UK">Innovate UK</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tech Area</label>
              <select
                value={selectedFilters.tech_area}
                onChange={(e) => setSelectedFilters(prev => ({...prev, tech_area: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="">All Tech Areas</option>
                <option value="Artificial Intelligence">AI</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Quantum Computing">Quantum</option>
                <option value="Robotics">Robotics</option>
              </select>
            </div>
          </div>
        </div>

        {/* Opportunities List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
            <p className="mt-2 text-gray-600">Loading opportunities...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {opportunities.map((opp) => (
              <div key={opp.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-900">{opp.title}</h3>
                      {opp.is_delayed && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                          Delayed for Free Users
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTierColor(opp.tier_required)}`}>
                        {opp.tier_required.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-cyan-600 font-medium mb-2">{opp.funding_body}</p>
                    <p className="text-gray-600 mb-4">{opp.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Closing Date</p>
                    <p className="text-sm text-slate-900">
                      {new Date(opp.closing_date).toLocaleDateString()}
                    </p>
                  </div>
                  {opp.funding_amount && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Funding</p>
                      <p className="text-sm text-slate-900">{opp.funding_amount}</p>
                    </div>
                  )}
                  {opp.trl_level && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">TRL Level</p>
                      <p className="text-sm text-slate-900">{opp.trl_level}</p>
                    </div>
                  )}
                  {opp.mod_department && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Department</p>
                      <p className="text-sm text-slate-900">{opp.mod_department}</p>
                    </div>
                  )}
                </div>

                {opp.tech_areas && opp.tech_areas.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-500 mb-2">Technology Areas</p>
                    <div className="flex flex-wrap gap-2">
                      {opp.tech_areas.map((tech, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <a
                    href={opp.official_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 hover:text-cyan-700 font-medium text-sm flex items-center"
                  >
                    View Official Listing →
                  </a>
                  <div className="text-xs text-gray-500">
                    Posted {new Date(opp.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}

            {opportunities.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-600">No opportunities found matching your criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const AlertsPage = () => (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton onClick={() => setCurrentView('dashboard')} text="Back to Dashboard" />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Alert Preferences</h1>
          <p className="text-gray-600 mt-2">
            {user?.tier === 'free' 
              ? 'Upgrade to Pro to receive real-time email alerts for matching opportunities'
              : 'Configure your personalized opportunity alerts'
            }
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          {user?.tier === 'free' ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Real-Time Alerts Available in Pro</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Upgrade to Pro to receive instant email notifications when new opportunities match your criteria.
              </p>
              <button
                onClick={() => handleUpgrade('pro')}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Upgrade to Pro - £49/month
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                <input
                  type="text"
                  placeholder="e.g., AI, machine learning, cybersecurity"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated keywords to watch for</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Technology Areas</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['Artificial Intelligence', 'Cybersecurity', 'Quantum Computing', 'Robotics', 'Maritime Defence', 'Aerospace'].map((tech) => (
                    <label key={tech} className="flex items-center">
                      <input type="checkbox" className="rounded text-cyan-600 focus:ring-cyan-500" />
                      <span className="ml-2 text-sm text-gray-700">{tech}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Funding Bodies</label>
                <div className="grid grid-cols-2 gap-2">
                  {['DSTL', 'UKRI', 'MOD', 'Innovate UK', 'Defence Equipment and Support'].map((body) => (
                    <label key={body} className="flex items-center">
                      <input type="checkbox" className="rounded text-cyan-600 focus:ring-cyan-500" />
                      <span className="ml-2 text-sm text-gray-700">{body}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Funding</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent">
                    <option value="">No minimum</option>
                    <option value="100000">£100K</option>
                    <option value="500000">£500K</option>
                    <option value="1000000">£1M</option>
                    <option value="5000000">£5M</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Funding</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent">
                    <option value="">No maximum</option>
                    <option value="1000000">£1M</option>
                    <option value="5000000">£5M</option>
                    <option value="10000000">£10M</option>
                    <option value="50000000">£50M</option>
                  </select>
                </div>
              </div>

              <button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg font-semibold transition-colors">
                Save Alert Preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="App">
      <NavBar />
      
      {currentView === 'home' && <HomePage />}
      {currentView === 'login' && <LoginPage />}
      {currentView === 'register' && <RegisterPage />}
      {currentView === 'dashboard' && user && <DashboardPage />}
      {currentView === 'opportunities' && <OpportunitiesPage />}
      {currentView === 'alerts' && user && <AlertsPage />}
    </div>
  );
}

export default App;
