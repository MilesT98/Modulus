import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  Building, 
  DollarSign, 
  Calendar, 
  Target, 
  Bell, 
  Users, 
  Star, 
  Crown, 
  CheckCircle, 
  ArrowLeft, 
  FileText, 
  Lock, 
  X, 
  TrendingUp, 
  Clock,
  ExternalLink,
  Filter,
  Zap,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [opportunities, setOpportunities] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    total_opportunities: 0,
    new_this_week: 0,
    closing_soon: 0,
    tier_benefits: []
  });
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDemoSwitcher, setShowDemoSwitcher] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // API setup
  const api = axios.create({
    baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'
  });

  // Add auth token to requests
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Handle auth errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setUser(null);
        setCurrentView('login');
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile();
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/opportunities');
      setOpportunities(response.data);
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    if (!user) return;
    
    try {
      const response = await api.get('/api/dashboard/stats');
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOpportunities();
      fetchDashboardStats();
    }
  }, [user]);

  useEffect(() => {
    if (currentView === 'opportunities' && user) {
      fetchOpportunities();
    }
  }, [currentView, user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentView('home');
  };

  const handleUpgrade = async (tier) => {
    try {
      await api.post(`/api/users/upgrade?tier=${tier}`);
      await fetchUserProfile();
      setShowUpgradeModal(false);
    } catch (error) {
      console.error('Upgrade failed:', error);
    }
  };

  const handleDemoTierSwitch = async (tier) => {
    try {
      await api.post(`/api/users/upgrade?tier=${tier}`);
      await fetchUserProfile();
      setShowDemoSwitcher(false);
      
      // Refresh data after tier change
      setTimeout(() => {
        fetchOpportunities();
        fetchDashboardStats();
      }, 1000);
    } catch (error) {
      console.error('Tier switch failed:', error);
    }
  };

  // Demo Tier Switcher Component
  const DemoTierSwitcher = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
        <button 
          onClick={() => setShowDemoSwitcher(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Demo Tier Switcher</h3>
          <p className="text-gray-600 mb-6">
            Switch between subscription tiers to test different features
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => handleDemoTierSwitch('free')}
              className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Users className="w-5 h-5 mr-2" />
              Free Tier
            </button>
            <button
              onClick={() => handleDemoTierSwitch('pro')}
              className="w-full flex items-center justify-center px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              <Star className="w-5 h-5 mr-2" />
              Pro Tier
            </button>
            <button
              onClick={() => handleDemoTierSwitch('enterprise')}
              className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Crown className="w-5 h-5 mr-2" />
              Enterprise Tier
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Upgrade Modal Component
  const UpgradeModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
        <button 
          onClick={() => setShowUpgradeModal(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-cyan-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Pro Feature Required</h3>
          <p className="text-gray-600 mb-6">
            This feature is available to Pro and Enterprise subscribers. Upgrade now to unlock advanced procurement intelligence.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                handleUpgrade('pro');
              }}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              Upgrade to Pro - £49/month
            </button>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full text-gray-600 hover:text-gray-800 px-4 py-2 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // UK Defence Procurement Guide Component
  const ProcurementActHub = () => {
    const [openAccordions, setOpenAccordions] = useState({});
    
    const toggleAccordion = (section) => {
      setOpenAccordions(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    };

    if (user?.tier === 'free') {
      // Free Tier - Locked Content
      return (
        <div className="min-h-screen bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <BackButton onClick={() => setCurrentView('dashboard')} text="Back to Dashboard" />
            
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <Lock className="w-12 h-12 text-cyan-600" />
              </div>
              
              <h1 className="text-4xl font-bold text-slate-900 mb-4">UK Defence Procurement Guide</h1>
              <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto border-2 border-cyan-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  Unlock the Complete Defence Procurement Guide
                </h2>
                <p className="text-gray-600 mb-6">
                  Get comprehensive guidance on MOD procurement, from registration to contract delivery, plus expert consultancy support.
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center text-left">
                    <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center mr-4">
                      <CheckCircle className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Complete Registration Guide</h4>
                      <p className="text-sm text-gray-600">Step-by-step guidance for DSP, DASA, and framework registrations</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-left">
                    <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center mr-4">
                      <CheckCircle className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Bidding Process Mastery</h4>
                      <p className="text-sm text-gray-600">Expert guidance on ITT/RFP responses and proposal development</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-left">
                    <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center mr-4">
                      <CheckCircle className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Consultancy Support</h4>
                      <p className="text-sm text-gray-600">Direct access to procurement experts and strategic advisory</p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleUpgrade('pro')}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-4 rounded-lg font-semibold text-lg transition-colors"
                >
                  Upgrade to Pro - £49/month
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Pro/Enterprise Tier - Full UK Defence Procurement Guide content would go here
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackButton onClick={() => setCurrentView('dashboard')} text="Back to Dashboard" />
          
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl p-8 mb-8 text-white">
            <h1 className="text-4xl font-bold mb-4">UK Defence Procurement Guide for SMEs</h1>
            <p className="text-xl text-blue-100">
              Complete roadmap from initial registration to successful contract delivery with the Ministry of Defence
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Introduction to UK Defence Procurement</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 mb-4">
                The UK Ministry of Defence (MOD) is one of the largest procurement organizations in Europe, investing billions annually in defense contracts. 
                For UK Small and Medium-sized Enterprises (SMEs), engaging with MOD procurement offers significant growth opportunities and a chance to contribute to national security.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h3 className="text-xl font-bold text-green-900 mb-4">Why Engage with MOD Procurement?</h3>
                  <ul className="space-y-2 text-green-800">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>£20+ billion annually</strong> with commitment to 2.5% of GDP by 2027</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Government backing</strong> for increased SME participation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Innovation demand</strong> in AI, autonomous systems, cybersecurity</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Long-term stability</strong> and expansion potential</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-cyan-50 p-6 rounded-lg border border-cyan-200">
                  <h3 className="text-xl font-bold text-cyan-900 mb-4">How We Can Help You Here:</h3>
                  <ul className="space-y-2 text-cyan-800">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-cyan-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Market Entry Strategy Sessions</strong> - Assess MOD market fit for your capabilities</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-cyan-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>"Why Us for MOD?" Development</strong> - Articulate your unique defence sector value</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Navigate MOD Procurement?</h3>
            <p className="text-xl text-cyan-100 mb-6">
              Our expert team can provide tailored guidance for your defence contracting journey.
            </p>
            <div className="space-x-4">
              <button className="bg-white text-cyan-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Book Strategy Session
              </button>
              <button className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-cyan-600 transition-colors">
                Contact Expert Team
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Back Button Component
  const BackButton = ({ onClick, text = "Back" }) => (
    <button
      onClick={onClick}
      className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {text}
    </button>
  );

  // Helper functions
  const getTierColor = (tier) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'pro': return 'bg-cyan-100 text-cyan-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Navigation Bar Component
  const NavBar = () => (
    <nav className="bg-slate-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => setCurrentView('home')}
              className="text-white text-xl font-bold hover:text-cyan-400 transition-colors"
            >
              Modulus Defence
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {user && (
              <>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('opportunities')}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Opportunities
                </button>
                <button
                  onClick={() => {
                    if (user?.tier === 'free') {
                      setShowUpgradeModal(true);
                    } else {
                      setCurrentView('procurement-act');
                    }
                  }}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Procurement Guide
                  {user?.tier === 'free' && <Lock className="w-3 h-3 ml-1" />}
                </button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center ${getTierColor(user.tier)}`}>
                  <span>{user.tier.toUpperCase()}</span>
                </div>
                <span className="text-sm text-gray-300">{user.company_name}</span>
                <button
                  onClick={() => setShowDemoSwitcher(true)}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  <Crown className="w-4 h-4 mr-1" />
                  Demo
                </button>
                <button
                  onClick={handleLogout}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setCurrentView('login')}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => setCurrentView('register')}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );

  // Home Page Component
  const HomePage = () => (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Navigate UK Defence Funding & Contracts with Confidence
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Your trusted platform for discovering government funding opportunities, understanding procurement regulations, 
              and connecting with the UK defence ecosystem.
            </p>
            <div className="space-x-4">
              <button
                onClick={() => setCurrentView('register')}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                Start Free Trial
              </button>
              <button
                onClick={() => setCurrentView('login')}
                className="border border-white text-white hover:bg-white hover:text-slate-900 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Everything you need to succeed in UK defence procurement
            </h2>
            <p className="text-xl text-gray-600">
              From discovery to delivery, we've got you covered
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Real-Time Opportunities</h3>
              <p className="text-gray-600">
                Access live funding opportunities and contracts from MOD, DASA, Dstl and other key defence organizations. 
                Get instant alerts for opportunities that match your expertise.
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Procurement Act Guidance</h3>
              <p className="text-gray-600">
                Navigate the complexities of the new Procurement Act 2023 with expert insights, 
                compliance checklists and practical guidance tailored for defence SMEs.
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Smart Alerts</h3>
              <p className="text-gray-600">
                Configure intelligent alerts based on your technology areas, funding preferences and business focus. 
                Never miss an opportunity that's right for your company.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Login Page Component
  const LoginPage = () => {
    const handleSubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      try {
        const response = await api.post('/api/auth/login', {
          email: formData.get('email'),
          password: formData.get('password')
        });
        
        localStorage.setItem('token', response.data.access_token);
        setUser(response.data.user);
        setCurrentView('dashboard');
      } catch (error) {
        alert('Login failed: ' + (error.response?.data?.detail || 'Unknown error'));
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Email address"
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
              <div>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="Password"
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              >
                Sign in
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setCurrentView('register')}
                className="text-cyan-600 hover:text-cyan-700"
              >
                Don't have an account? Sign up
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Register Page Component
  const RegisterPage = () => {
    const handleSubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      try {
        const response = await api.post('/api/auth/register', {
          full_name: formData.get('full_name'),
          company_name: formData.get('company_name'),
          email: formData.get('email'),
          password: formData.get('password')
        });
        
        localStorage.setItem('token', response.data.access_token);
        setUser(response.data.user);
        setCurrentView('dashboard');
      } catch (error) {
        alert('Registration failed: ' + (error.response?.data?.detail || 'Unknown error'));
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <input
                name="full_name"
                type="text"
                required
                placeholder="Full Name"
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              />
              <input
                name="company_name"
                type="text"
                required
                placeholder="Company Name"
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              />
              <input
                name="email"
                type="email"
                required
                placeholder="Email Address"
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              />
              <input
                name="password"
                type="password"
                required
                placeholder="Password"
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              >
                Create Account
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setCurrentView('login')}
                className="text-cyan-600 hover:text-cyan-700"
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Dashboard Page Component
  const DashboardPage = () => (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back, {user?.full_name}
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with UK defence opportunities today
          </p>
        </div>

        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-cyan-100 rounded-lg">
                  <Target className="w-6 h-6 text-cyan-600" />
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
                  <TrendingUp className="w-6 h-6 text-green-600" />
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => setCurrentView('opportunities')}
                className="w-full flex items-center p-4 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors text-left"
              >
                <Search className="w-5 h-5 text-cyan-600 mr-3" />
                <div>
                  <div className="font-medium text-slate-900">Browse Opportunities</div>
                  <div className="text-sm text-gray-600">Discover new funding and contracts</div>
                </div>
              </button>

              <button
                onClick={() => {
                  if (user?.tier === 'free') {
                    setShowUpgradeModal(true);
                  } else {
                    setCurrentView('procurement-act');
                  }
                }}
                className="w-full flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
              >
                <FileText className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <div className="font-medium text-slate-900">UK Defence Procurement Guide</div>
                  <div className="text-sm text-gray-600">Complete guide to MOD procurement</div>
                </div>
              </button>

              {user?.tier !== 'free' && (
                <button
                  onClick={async () => {
                    setIsRefreshing(true);
                    try {
                      const response = await api.post('/api/data/refresh');
                      
                      // Show detailed success message
                      const message = `✅ Enhanced Actify Defence Aggregation Complete!

📊 ${response.data.message}

🌍 Sources: ${response.data.source_info}

🔢 Total Opportunities: ${response.data.opportunities_count}

🎯 Features Applied:
• Advanced keyword filtering ✓
• SME relevance scoring ✓  
• Technology classification ✓
• Multi-source deduplication ✓
• Confidence scoring ✓

Opportunities have been refreshed with enhanced metadata including SME scores, technology tags, and priority rankings.`;

                      alert(message);
                      
                      // Refresh data to show new opportunities
                      fetchOpportunities();
                      fetchDashboardStats();
                    } catch (error) {
                      alert('❌ Data refresh failed: ' + (error.response?.data?.detail || 'Unknown error'));
                    } finally {
                      setIsRefreshing(false);
                    }
                  }}
                  disabled={isRefreshing}
                  className="w-full flex items-center p-4 bg-gradient-to-r from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 rounded-lg transition-colors text-left border-2 border-cyan-200"
                >
                  <Zap className={`w-5 h-5 text-cyan-600 mr-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <div>
                    <div className="font-medium text-slate-900">
                      {isRefreshing ? 'Running Enhanced Actify Defence Aggregation...' : '🧠 Enhanced Actify Defence Aggregation'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {isRefreshing ? 'Collecting from global sources with AI filtering...' : 'Multi-source aggregation with keyword prioritization, SME scoring & tech classification'}
                    </div>
                  </div>
                </button>
              )}

              <button
                onClick={() => setCurrentView('alerts')}
                className="w-full flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"
              >
                <Bell className="w-5 h-5 text-purple-600 mr-3" />
                <div>
                  <div className="font-medium text-slate-900">Configure Alerts</div>
                  <div className="text-sm text-gray-600">Set up personalized notifications</div>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Your Benefits</h2>
            <div className="space-y-3">
              {dashboardStats?.tier_benefits.map((benefit, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>

            {user?.tier === 'free' && (
              <div className="mt-6 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                <h3 className="font-semibold text-slate-900 mb-2">Upgrade to Pro</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Get real-time access, advanced filtering, and expert insights
                </p>
                <button
                  onClick={() => handleUpgrade('pro')}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Upgrade Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Simple Opportunities Page
  const OpportunitiesPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [techFilter, setTechFilter] = useState('all');
    const [valueFilter, setValueFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    const filteredOpportunities = opportunities.filter(opp => {
      const matchesSearch = searchTerm === '' || 
        opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSource = sourceFilter === 'all' || opp.source.toLowerCase().includes(sourceFilter.toLowerCase());
      
      const matchesTech = techFilter === 'all' || 
        (opp.enhanced_metadata?.tech_tags && opp.enhanced_metadata.tech_tags.some(tag => 
          tag.toLowerCase().includes(techFilter.toLowerCase())
        ));
      
      const matchesValue = valueFilter === 'all' || 
        (valueFilter === 'low' && opp.enhanced_metadata?.sme_score >= 0.7) ||
        (valueFilter === 'medium' && opp.enhanced_metadata?.sme_score >= 0.5 && opp.enhanced_metadata?.sme_score < 0.7) ||
        (valueFilter === 'high' && opp.enhanced_metadata?.sme_score < 0.5);
      
      return matchesSearch && matchesSource && matchesTech && matchesValue;
    });

    // Get unique sources for filter dropdown
    const availableSources = [...new Set(opportunities.map(opp => opp.source))];
    
    // Get unique tech areas for filter dropdown
    const availableTechAreas = [...new Set(
      opportunities.flatMap(opp => opp.enhanced_metadata?.tech_tags || [])
    )];

    const getSourceBadgeColor = (source) => {
      if (source.includes('EU') || source.includes('TED')) return 'bg-blue-100 text-blue-800';
      if (source.includes('NATO') || source.includes('NSPA')) return 'bg-indigo-100 text-indigo-800';
      if (source.includes('USA') || source.includes('SAM')) return 'bg-red-100 text-red-800';
      if (source.includes('Australia') || source.includes('AusTender')) return 'bg-green-100 text-green-800';
      if (source.includes('BAE') || source.includes('Leonardo') || source.includes('Thales') || source.includes('Rolls-Royce')) return 'bg-purple-100 text-purple-800';
      return 'bg-gray-100 text-gray-800'; // UK sources
    };

    const getSMEBadgeColor = (score) => {
      if (score >= 0.7) return 'bg-green-100 text-green-800';
      if (score >= 0.5) return 'bg-yellow-100 text-yellow-800';
      return 'bg-red-100 text-red-800';
    };

    const getSMELabel = (score) => {
      if (score >= 0.7) return `High SME Fit (${(score * 100).toFixed(0)}%)`;
      if (score >= 0.5) return `Medium SME Fit (${(score * 100).toFixed(0)}%)`;
      return `Low SME Fit (${(score * 100).toFixed(0)}%)`;
    };

    const formatDeadline = (deadline) => {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const daysUntil = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntil <= 7) return `🔴 ${daysUntil} days`;
      if (daysUntil <= 14) return `🟡 ${daysUntil} days`;
      return `🟢 ${daysUntil} days`;
    };

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackButton onClick={() => setCurrentView('dashboard')} text="Back to Dashboard" />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">⚔️ Defence Opportunities</h1>
            <p className="text-gray-600">
              Comprehensive defence procurement opportunities from {user?.tier !== 'free' ? 'multiple global sources' : 'UK government sources'} with AI-powered filtering and SME relevance scoring
            </p>
          </div>

          {/* Enhanced Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search opportunities, technologies, or agencies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Filter className="w-5 h-5 mr-2" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="all">All Sources</option>
                    {availableSources.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Technology Area</label>
                  <select
                    value={techFilter}
                    onChange={(e) => setTechFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="all">All Technologies</option>
                    {availableTechAreas.map(tech => (
                      <option key={tech} value={tech}>{tech}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SME Relevance</label>
                  <select
                    value={valueFilter}
                    onChange={(e) => setValueFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="all">All Opportunities</option>
                    <option value="low">High SME Fit (≥70%)</option>
                    <option value="medium">Medium SME Fit (50-70%)</option>
                    <option value="high">Lower SME Fit (&lt;50%)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              {filteredOpportunities.length} opportunities found
            </h2>
            
            {user?.tier !== 'free' && (
              <div className="text-sm text-gray-600">
                Showing real-time opportunities from UK, EU, NATO, Global Allies, and Prime Contractors
              </div>
            )}
          </div>

          {filteredOpportunities.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
              <p className="text-gray-600">Try adjusting your search terms or filters, or refresh the data</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredOpportunities.map((opportunity) => (
                <div key={opportunity.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(opportunity.tier_required)}`}>
                          {opportunity.tier_required.toUpperCase()}
                        </span>
                        
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceBadgeColor(opportunity.source)}`}>
                          {opportunity.source}
                        </span>
                        
                        {opportunity.enhanced_metadata?.sme_score && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSMEBadgeColor(opportunity.enhanced_metadata.sme_score)}`}>
                            {getSMELabel(opportunity.enhanced_metadata.sme_score)}
                          </span>
                        )}
                        
                        {opportunity.enhanced_metadata?.priority_score >= 30 && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                            🔥 High Priority
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {opportunity.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">
                    {opportunity.description}
                  </p>

                  {/* Technology Tags */}
                  {opportunity.enhanced_metadata?.tech_tags && opportunity.enhanced_metadata.tech_tags.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {opportunity.enhanced_metadata.tech_tags.slice(0, 3).map((tech, index) => (
                          <span key={index} className="px-2 py-1 bg-cyan-50 text-cyan-700 text-xs rounded-md">
                            {tech}
                          </span>
                        ))}
                        {opportunity.enhanced_metadata.tech_tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md">
                            +{opportunity.enhanced_metadata.tech_tags.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm">
                      <Building className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-700">{opportunity.funding_body}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-700">{opportunity.funding_amount}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-700">
                        Closes: {new Date(opportunity.closing_date).toLocaleDateString()} ({formatDeadline(opportunity.closing_date)})
                      </span>
                    </div>
                  </div>

                  {/* Keywords Matched */}
                  {opportunity.enhanced_metadata?.keywords_matched && opportunity.enhanced_metadata.keywords_matched.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 mb-1">Matched Keywords:</div>
                      <div className="text-xs text-gray-600">
                        {opportunity.enhanced_metadata.keywords_matched.slice(0, 5).join(', ')}
                        {opportunity.enhanced_metadata.keywords_matched.length > 5 && '...'}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (opportunity.tier_required !== 'free' && user?.tier === 'free') {
                        setShowUpgradeModal(true);
                      } else {
                        window.open(opportunity.official_link, '_blank');
                      }
                    }}
                    className="w-full flex items-center justify-center px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Alerts Page Component
  const AlertsPage = () => (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton onClick={() => setCurrentView('dashboard')} text="Back to Dashboard" />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Alert Preferences</h1>
          <p className="text-gray-600 mt-2">
            Configure personalized notifications for opportunities that match your interests
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keywords (comma-separated)
              </label>
              <input
                name="keywords"
                type="text"
                placeholder="e.g., AI, cybersecurity, quantum computing"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            <div className="pt-6 border-t border-gray-200">
              <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                Save Alert Preferences
              </button>
            </div>
          </div>
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
      {currentView === 'procurement-act' && user && <ProcurementActHub />}
      
      {showUpgradeModal && <UpgradeModal />}
      {showDemoSwitcher && <DemoTierSwitcher />}
    </div>
  );
}

export default App;
