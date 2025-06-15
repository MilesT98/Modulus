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
  AlertCircle,
  Globe,
  Award,
  Briefcase,
  Calendar as CalendarIcon,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
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
  const [linkStatus, setLinkStatus] = useState({});

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

  const checkLinkStatus = async (url, opportunityId) => {
    try {
      // Simple client-side check - in production you'd want server-side validation
      const response = await fetch(url, { 
        method: 'HEAD', 
        mode: 'no-cors',
        timeout: 5000 
      });
      setLinkStatus(prev => ({
        ...prev,
        [opportunityId]: { status: 'available', checked: new Date() }
      }));
    } catch (error) {
      setLinkStatus(prev => ({
        ...prev,
        [opportunityId]: { status: 'unavailable', checked: new Date(), error: error.message }
      }));
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

  const handleOpportunityClick = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setCurrentView('opportunity-detail');
    
    // Check link status when opportunity is selected
    if (opportunity.official_link) {
      checkLinkStatus(opportunity.official_link, opportunity.id || opportunity._id);
    }
  };

  const handleExternalLinkClick = (url, opportunityId) => {
    const status = linkStatus[opportunityId];
    
    if (status && status.status === 'unavailable') {
      // Show fallback message for broken links
      alert('This link appears to be unavailable. You may want to search for this opportunity directly on the funding body\'s website.');
      return;
    }
    
    // Open in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
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

  // Opportunity Detail Page Component
  const OpportunityDetailPage = () => {
    if (!selectedOpportunity) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Opportunity Not Found</h2>
            <p className="text-gray-600 mb-6">The requested opportunity could not be loaded.</p>
            <button
              onClick={() => setCurrentView('opportunities')}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Back to Opportunities
            </button>
          </div>
        </div>
      );
    }

    const opportunity = selectedOpportunity;
    const opportunityId = opportunity.id || opportunity._id;
    const status = linkStatus[opportunityId];
    
    // Check if user has access to this opportunity
    const hasAccess = user?.tier !== 'free' || 
                     opportunity.tier_required === 'free' || 
                     !opportunity.is_delayed;

    if (!hasAccess) {
      return (
        <div className="min-h-screen bg-slate-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <BackButton onClick={() => setCurrentView('opportunities')} text="Back to Opportunities" />
            
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <Lock className="w-12 h-12 text-cyan-600" />
              </div>
              
              <h1 className="text-4xl font-bold text-slate-900 mb-4">Pro Access Required</h1>
              <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto border-2 border-cyan-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  Unlock Full Opportunity Details
                </h2>
                <p className="text-gray-600 mb-6">
                  This opportunity requires Pro or Enterprise access to view complete details and analysis.
                </p>
                
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

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackButton onClick={() => setCurrentView('opportunities')} text="Back to Opportunities" />
          
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl p-8 mb-8 text-white">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold mr-3 ${
                    opportunity.tier_required === 'free' ? 'bg-gray-100 text-gray-800' :
                    opportunity.tier_required === 'pro' ? 'bg-cyan-100 text-cyan-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {opportunity.tier_required?.toUpperCase() || 'FREE'}
                  </div>
                  {opportunity.is_delayed && (
                    <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                      DELAYED ACCESS
                    </div>
                  )}
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                  {opportunity.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-blue-100">
                  <div className="flex items-center">
                    <Building className="w-5 h-5 mr-2" />
                    <span>{opportunity.funding_body}</span>
                  </div>
                  {opportunity.mod_department && (
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      <span>{opportunity.mod_department}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    <span>Closes: {new Date(opportunity.closing_date || opportunity.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Description Section */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Description</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {opportunity.description}
                  </p>
                  {opportunity.detailed_description && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Additional Details</h3>
                      <p className="text-gray-700">
                        {opportunity.detailed_description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Technology & Requirements */}
              {(opportunity.tech_areas?.length > 0 || opportunity.tech_tags?.length > 0) && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Technology Areas</h2>
                  <div className="flex flex-wrap gap-2">
                    {(opportunity.tech_areas || opportunity.tech_tags || []).map((tech, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhanced Metadata - For Pro/Enterprise Users */}
              {user?.tier !== 'free' && opportunity.enhanced_metadata && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Enhanced Analysis</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {opportunity.enhanced_metadata.sme_score !== undefined && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">SME Relevance Score</span>
                          <span className="text-lg font-bold text-green-600">
                            {Math.round(opportunity.enhanced_metadata.sme_score * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{width: `${opportunity.enhanced_metadata.sme_score * 100}%`}}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {opportunity.enhanced_metadata.confidence_score !== undefined && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Confidence Score</span>
                          <span className="text-lg font-bold text-blue-600">
                            {Math.round(opportunity.enhanced_metadata.confidence_score * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{width: `${opportunity.enhanced_metadata.confidence_score * 100}%`}}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {opportunity.enhanced_metadata.keywords_matched?.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Matched Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {opportunity.enhanced_metadata.keywords_matched.slice(0, 10).map((keyword, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Key Information & Actions */}
            <div className="space-y-6">
              
              {/* Key Facts */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Key Facts</h3>
                <div className="space-y-4">
                  
                  <div className="flex items-start">
                    <Building className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">Organization</div>
                      <div className="text-gray-900">{opportunity.funding_body}</div>
                    </div>
                  </div>

                  {opportunity.mod_department && (
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-500">Department</div>
                        <div className="text-gray-900">{opportunity.mod_department}</div>
                      </div>
                    </div>
                  )}

                  {opportunity.contract_type && (
                    <div className="flex items-start">
                      <Briefcase className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-500">Contract Type</div>
                        <div className="text-gray-900">{opportunity.contract_type}</div>
                      </div>
                    </div>
                  )}

                  {opportunity.trl_level && (
                    <div className="flex items-start">
                      <Award className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-500">Technology Readiness Level</div>
                        <div className="text-gray-900">{opportunity.trl_level}</div>
                      </div>
                    </div>
                  )}

                  {opportunity.funding_amount && (
                    <div className="flex items-start">
                      <DollarSign className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-500">Funding Range</div>
                        <div className="text-gray-900">{opportunity.funding_amount}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start">
                    <CalendarIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">Application Deadline</div>
                      <div className="text-gray-900 font-semibold">
                        {new Date(opportunity.closing_date || opportunity.deadline).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {opportunity.date_scraped && (
                    <div className="flex items-start">
                      <Clock className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-500">Last Updated</div>
                        <div className="text-gray-900">
                          {new Date(opportunity.date_scraped).toLocaleDateString('en-GB')}
                        </div>
                      </div>
                    </div>
                  )}

                  {opportunity.reference_number && (
                    <div className="flex items-start">
                      <FileText className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-500">Reference Number</div>
                        <div className="text-gray-900 font-mono text-sm">{opportunity.reference_number}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Section */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Access Original Opportunity</h3>
                
                {/* Link Status Indicator */}
                {status && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    status.status === 'available' ? 'bg-green-50 border border-green-200' :
                    'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center">
                      {status.status === 'available' ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                      )}
                      <span className={`text-sm font-medium ${
                        status.status === 'available' ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {status.status === 'available' ? 'Link Available' : 'Link Unavailable'}
                      </span>
                    </div>
                    {status.status === 'unavailable' && (
                      <p className="text-sm text-red-700 mt-1">
                        This link may be expired or temporarily unavailable. Try searching directly on the organization's website.
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={() => handleExternalLinkClick(opportunity.official_link, opportunityId)}
                  className={`w-full flex items-center justify-center px-6 py-4 rounded-lg font-semibold transition-colors ${
                    status?.status === 'unavailable' 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                  }`}
                  disabled={status?.status === 'unavailable'}
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  {status?.status === 'unavailable' ? 'Link Unavailable' : 'View on Official Site'}
                </button>

                {status?.status === 'unavailable' && (
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => window.open(`https://www.google.com/search?q="${opportunity.title}" ${opportunity.funding_body}`, '_blank')}
                      className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Search on Google
                    </button>
                    <button
                      onClick={() => window.open(`https://www.contractsfinder.service.gov.uk/Search`, '_blank')}
                      className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Browse {opportunity.funding_body}
                    </button>
                  </div>
                )}

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This link will open in a new tab so you can easily return to Modulus Defence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Funding Opportunities Page Component
  const FundingOpportunitiesPage = () => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    
    const fundingProviders = [
      // 1. Dedicated Defence & Security Venture Capital (VC) Funds
      {
        category: "Defence & Security VC",
        name: "Shield Capital",
        focus: "Early-stage companies building technologies that matter in artificial intelligence, autonomy, cybersecurity, and space, with a mission focus on the convergence of commercial technology and national security.",
        stage: "Early-stage (Seed, Series A)",
        geographic: "Primarily US, but invests globally in relevant areas",
        link: "https://shieldcap.com/"
      },
      {
        category: "Defence & Security VC",
        name: "Paladin Capital Group",
        focus: "Global multi-stage investor focusing on cybersecurity, artificial intelligence, big data, and advanced computing, with significant defence and national security applications.",
        stage: "Multi-stage (growth equity to later stage)",
        geographic: "Global",
        link: "https://www.paladincapgroup.com/investments/"
      },
      {
        category: "Defence & Security VC",
        name: "Lockheed Martin Ventures",
        focus: "Accelerating next-generation technologies strategically important to aerospace and defence, helping customers stay ahead of emerging threats.",
        stage: "Strategic investments",
        geographic: "Global",
        link: "https://uktechnews.info/2024/02/05/q5d-nabs-10m-series-a-funding-round-led-by-lockheed-martin-ventures/"
      },
      {
        category: "Defence & Security VC",
        name: "RTX Ventures (Raytheon Technologies Ventures)",
        focus: "Investing in early-stage companies that will transform aerospace and defense across areas like autonomy & sensing, compute, advanced manufacturing, space, data, analytics & code, and propulsion.",
        stage: "Early-stage",
        geographic: "Global (strategic to RTX)",
        link: "https://www.rtx.com/who-we-are/ventures"
      },
      {
        category: "Defence & Security VC",
        name: "AE Industrial Partners (AEI)",
        focus: "Private equity firm specializing in Aerospace, Defense & Government Services, Space, Power Generation, and Specialty Industrial markets.",
        stage: "Growth equity, buyouts",
        geographic: "Primarily North America, but with global reach for portfolio companies",
        link: "https://www.aeroequity.com/focus/"
      },
      {
        category: "Defence & Security VC",
        name: "True Global Ventures",
        focus: "Global investment fund across various sectors including deep tech, often with relevance to digital security.",
        stage: "Varies by specific fund",
        geographic: "Global",
        link: "https://www.stradley.com/insights/publications/2023/11/true-global-ventures-4-plus-fund"
      },
      
      // 2. Corporate Venture Capital (CVC) & Innovation Arms
      {
        category: "Corporate VC & Innovation",
        name: "Thales Group (Thales Corporate Ventures / Thales Startups)",
        focus: "Investing in digital and 'deep tech' innovations (Big Data, AI, connectivity, cybersecurity, and quantum technology) that align with their strategic interests. Engages through partnerships, investment, and acquisitions.",
        stage: "Strategic partnerships, corporate venturing",
        geographic: "Global",
        link: "https://www.thalesgroup.com/en/thales-startups"
      },
      {
        category: "Corporate VC & Innovation",
        name: "Rolls-Royce (Innovation & Future Programmes)",
        focus: "Actively seeks innovation and partners with SMEs in advanced materials, digital, and propulsion systems; often through collaborative R&D and strategic partnerships.",
        stage: "Collaborative R&D, strategic partnerships, potential for future acquisition",
        geographic: "Global",
        link: "https://www.rolls-royce.com/innovation.aspx"
      },
      
      // 3. Generalist Deep Tech / Hard Tech VCs
      {
        category: "Deep Tech & Dual-Use VC",
        name: "Octopus Ventures",
        focus: "Broad deep tech, AI, fintech, health tech, and other sectors; dual-use potential is often a factor.",
        stage: "Pre-seed, Seed, Series A, and later-stage",
        geographic: "UK & Europe",
        link: "https://octopusventures.com/"
      },
      {
        category: "Deep Tech & Dual-Use VC",
        name: "MMC Ventures",
        focus: "AI and data-driven companies, including enterprise AI, fintech, data-driven health, data infrastructure, and cloud.",
        stage: "Series A specialist",
        geographic: "Europe",
        link: "https://mmc.vc/about-us/"
      },
      {
        category: "Deep Tech & Dual-Use VC",
        name: "Amadeus Capital Partners",
        focus: "Deep tech across various sectors, including AI, cybersecurity, and space technologies.",
        stage: "Early Stage EIS Fund and other funds",
        geographic: "Global",
        link: "https://amadeuscapital.com/our-approach/"
      },
      {
        category: "Deep Tech & Dual-Use VC",
        name: "Playfair Capital",
        focus: "Early-stage technology companies across various sectors, including those with dual-use potential.",
        stage: "Early-stage VC",
        geographic: "UK & Europe",
        link: "https://playfair.vc/"
      },
      {
        category: "Deep Tech & Dual-Use VC",
        name: "2048 Ventures",
        focus: "Vertical AI, Deep Tech Infrastructure, Healthcare, and Biotech; includes next-gen drone operating systems.",
        stage: "Pre-seed rounds",
        geographic: "US & Canada",
        link: "https://2048.vc/"
      },
      
      // 4. UK Government-Backed Investment Schemes
      {
        category: "Government-Backed Schemes",
        name: "British Business Bank",
        focus: "Facilitates access to finance for smaller businesses via partner funds, covering venture capital, debt finance, and regional funds. (This is an enabler, guiding to many other funds used by Defence SMEs).",
        stage: "Varies by program/partner fund",
        geographic: "UK",
        link: "https://www.british-business-bank.co.uk/how-we-help/"
      },
      {
        category: "Government-Backed Schemes",
        name: "Northern Powerhouse Investment Fund (NPIF)",
        focus: "Addresses market weakness in providing venture debt, debt, and equity finance to SMEs in the North of England. Includes advanced manufacturing, tech, and digital sectors relevant to defence.",
        stage: "Seed, early-stage, growth debt/equity",
        geographic: "North of England, UK",
        link: "https://npif.co.uk/"
      },
      {
        category: "Government-Backed Schemes",
        name: "Midlands Engine Investment Fund (MEIF)",
        focus: "Provides debt and equity finance to SMEs across the Midlands. Similar sectoral relevance to NPIF.",
        stage: "Seed, early-stage, growth debt/equity",
        geographic: "Midlands, UK",
        link: "https://meif.co.uk/"
      },
      
      // 5. University Spin-Out Funds
      {
        category: "University Spin-Out Funds",
        name: "Oxford Science Enterprises (OSE)",
        focus: "Investing in deep tech and life sciences spin-outs from the University of Oxford, including AI, quantum, and advanced materials.",
        stage: "Seed to Series A/B",
        geographic: "Oxford, UK (for source of tech)",
        link: "https://oxfordscienceenterprises.com/"
      },
      {
        category: "University Spin-Out Funds",
        name: "Cambridge Enterprise (University of Cambridge)",
        focus: "Commercializing University of Cambridge research through licensing, consultancy, and creating new spin-out companies across various tech sectors.",
        stage: "Seed funding for spin-outs",
        geographic: "Cambridge, UK (for source of tech)",
        link: "https://www.enterprise.cam.ac.uk/"
      },
      {
        category: "University Spin-Out Funds",
        name: "Imperial College Innovations",
        focus: "Commercializing research from Imperial College London, with strong departments in engineering, AI, and science.",
        stage: "Spin-out seed funding",
        geographic: "London, UK (for source of tech)",
        link: "https://www.imperial.ac.uk/enterprise/commercialisation/imperial-innovations/"
      },
      
      // 6. Growth Equity / Debt Providers
      {
        category: "Growth Equity & Debt",
        name: "Gresham House Ventures",
        focus: "Provides growth capital for innovative UK software and digitally-enabled businesses.",
        stage: "Growth capital",
        geographic: "UK",
        link: "https://greshamhouse.com/businesses/private-equity/gresham-house-ventures/"
      },
      {
        category: "Growth Equity & Debt",
        name: "HSBC Innovation Banking (formerly Silicon Valley Bank UK)",
        focus: "Provides banking and debt solutions tailored for technology and innovation companies, including venture debt.",
        stage: "Growth-stage debt, venture debt",
        geographic: "UK",
        link: "https://www.business.hsbc.uk/en-gb/campaigns/innovation-banking"
      },
      
      // 7. Private Equity Firms
      {
        category: "Private Equity",
        name: "Inflexion",
        focus: "High-growth, market-leading companies with strong internationalization potential; sectors include technology and business services.",
        stage: "Mid-market private equity",
        geographic: "Global (based in UK)",
        link: "https://www.inflexion.com/"
      },
      {
        category: "Private Equity",
        name: "ECI Partners",
        focus: "Growth-focused private equity group investing in businesses across services, consumer, and technology/software.",
        stage: "Growth-focused private equity (£15m-£200m investment)",
        geographic: "UK & Europe",
        link: "https://www.ecipartners.com/"
      },
      {
        category: "Private Equity",
        name: "Livingbridge",
        focus: "Backs management teams to build 'best in class' businesses across various sectors, including technology.",
        stage: "Mid-market private equity",
        geographic: "UK",
        link: "https://www.livingbridge.com/"
      },
      
      // 8. Accelerators & Incubators
      {
        category: "Accelerators & Incubators",
        name: "National Security Innovation Network (NSIN) Accelerators",
        focus: "Provides funding, prototyping, and resources for translating high-potential concepts into minimum viable products for national security.",
        stage: "Early-stage, accelerator programs",
        geographic: "Primarily US, but global partnerships",
        link: "https://www.nsin.mil/"
      },
      {
        category: "Accelerators & Incubators",
        name: "Techstars",
        focus: "Operates accelerators focusing on commercially viable startups with dual-purpose technologies, including aerospace and defence.",
        stage: "Early-stage, accelerator programs",
        geographic: "Global (via various programs)",
        link: "https://www.techstars.com/"
      },
      {
        category: "Accelerators & Incubators",
        name: "Plug and Play (Aerospace & Defense Innovation)",
        focus: "Finds and supports aerospace and defence startups through investment and mentorship, focusing on advanced defence technologies, hardware, aeronautics, and advanced air mobility.",
        stage: "Early-stage, accelerator programs",
        geographic: "Global (via various programs)",
        link: "https://www.plugandplaytechcenter.com/industries/aerospace"
      },
      
      // 9. Equity Crowdfunding Platforms
      {
        category: "Equity Crowdfunding",
        name: "Seedrs",
        focus: "Equity crowdfunding platform for businesses to raise capital across various sectors. Defence SMEs may find investors here, but it's less targeted.",
        stage: "Early-stage to growth",
        geographic: "UK, Europe",
        link: "https://www.seedrs.com/raise"
      },
      {
        category: "Equity Crowdfunding",
        name: "Crowdcube",
        focus: "Equity crowdfunding platform enabling businesses to raise finance from a community of investors. Defence SMEs may find investors here, but it's less targeted.",
        stage: "Early-stage to growth",
        geographic: "UK, Europe",
        link: "https://www.crowdcube.com/raise"
      }
    ];

    const categories = [
      { value: 'all', label: 'All Categories' },
      { value: 'Defence & Security VC', label: 'Defence & Security VC' },
      { value: 'Corporate VC & Innovation', label: 'Corporate VC & Innovation' },
      { value: 'Deep Tech & Dual-Use VC', label: 'Deep Tech & Dual-Use VC' },
      { value: 'Government-Backed Schemes', label: 'Government-Backed Schemes' },
      { value: 'University Spin-Out Funds', label: 'University Spin-Out Funds' },
      { value: 'Growth Equity & Debt', label: 'Growth Equity & Debt' },
      { value: 'Private Equity', label: 'Private Equity' },
      { value: 'Accelerators & Incubators', label: 'Accelerators & Incubators' },
      { value: 'Equity Crowdfunding', label: 'Equity Crowdfunding' }
    ];

    const filteredProviders = selectedCategory === 'all' 
      ? fundingProviders 
      : fundingProviders.filter(provider => provider.category === selectedCategory);

    const getCategoryIcon = (category) => {
      switch (category) {
        case 'Defence & Security VC': return <Target className="w-5 h-5" />;
        case 'Corporate VC & Innovation': return <Building className="w-5 h-5" />;
        case 'Deep Tech & Dual-Use VC': return <Zap className="w-5 h-5" />;
        case 'Government-Backed Schemes': return <Award className="w-5 h-5" />;
        case 'University Spin-Out Funds': return <Star className="w-5 h-5" />;
        case 'Growth Equity & Debt': return <TrendingUp className="w-5 h-5" />;
        case 'Private Equity': return <Briefcase className="w-5 h-5" />;
        case 'Accelerators & Incubators': return <Globe className="w-5 h-5" />;
        case 'Equity Crowdfunding': return <Users className="w-5 h-5" />;
        default: return <DollarSign className="w-5 h-5" />;
      }
    };

    const getCategoryColor = (category) => {
      switch (category) {
        case 'Defence & Security VC': return 'bg-red-100 text-red-800';
        case 'Corporate VC & Innovation': return 'bg-blue-100 text-blue-800';
        case 'Deep Tech & Dual-Use VC': return 'bg-purple-100 text-purple-800';
        case 'Government-Backed Schemes': return 'bg-green-100 text-green-800';
        case 'University Spin-Out Funds': return 'bg-yellow-100 text-yellow-800';
        case 'Growth Equity & Debt': return 'bg-cyan-100 text-cyan-800';
        case 'Private Equity': return 'bg-gray-100 text-gray-800';
        case 'Accelerators & Incubators': return 'bg-pink-100 text-pink-800';
        case 'Equity Crowdfunding': return 'bg-indigo-100 text-indigo-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackButton onClick={() => setCurrentView('dashboard')} text="Back to Dashboard" />
          
          {/* Header Section */}
          <div className="bg-gradient-to-r from-green-900 to-blue-900 rounded-xl p-8 mb-8 text-white">
            <div className="flex items-center mb-4">
              <DollarSign className="w-8 h-8 mr-3" />
              <h1 className="text-4xl font-bold">Funding Opportunities for Defence SMEs</h1>
            </div>
            <p className="text-xl text-green-100 mb-4">
              Comprehensive directory of private investment and funding opportunities specifically for UK Defence SMEs
            </p>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-green-100">
                <strong>Note:</strong> This page focuses on capital funding and private investment opportunities, not government contracts. 
                For procurement and contract opportunities, visit our <button 
                  onClick={() => setCurrentView('opportunities')} 
                  className="underline hover:text-white transition-colors"
                >
                  Opportunities page
                </button>.
              </p>
            </div>
          </div>

          {/* Filter Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{filteredProviders.length}</div>
                  <div className="text-sm text-gray-600">Funding Sources</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
              <div className="text-2xl font-bold text-red-600">6</div>
              <div className="text-sm text-gray-600">Defence-Focused VCs</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">5</div>
              <div className="text-sm text-gray-600">Deep Tech VCs</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
              <div className="text-2xl font-bold text-green-600">3</div>
              <div className="text-sm text-gray-600">Government Schemes</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
              <div className="text-2xl font-bold text-purple-600">9</div>
              <div className="text-sm text-gray-600">Other Sources</div>
            </div>
          </div>

          {/* Funding Providers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProviders.map((provider, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-cyan-300 hover:shadow-md transition-all duration-200"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className={`p-2 rounded-lg mr-3 ${getCategoryColor(provider.category)}`}>
                        {getCategoryIcon(provider.category)}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">
                        {provider.name}
                      </h3>
                    </div>
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(provider.category)}`}>
                      {provider.category}
                    </div>
                  </div>
                </div>

                {/* Main Investment Focus */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Target className="w-4 h-4 mr-2 text-gray-500" />
                    Defence Investment Focus
                  </h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {provider.focus}
                  </p>
                </div>

                {/* Key Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-start">
                    <TrendingUp className="w-4 h-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-gray-500">Investment Stage</div>
                      <div className="text-sm text-gray-900">{provider.stage}</div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-gray-500">Geographic Focus</div>
                      <div className="text-sm text-gray-900">{provider.geographic}</div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => window.open(provider.link, '_blank', 'noopener,noreferrer')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit {provider.name}
                </button>
              </div>
            ))}
          </div>

          {/* Bottom CTA Section */}
          <div className="mt-12 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Secure Funding for Your Defence SME?</h3>
            <p className="text-xl text-cyan-100 mb-6">
              These funding sources are actively investing in defence and dual-use technologies. Research each one that matches your stage and focus area.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Early Stage (Pre-Seed/Seed)</h4>
                <p className="text-sm text-cyan-100">Focus on Shield Capital, university funds, and accelerators</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Growth Stage (Series A+)</h4>
                <p className="text-sm text-cyan-100">Consider Paladin Capital, Octopus Ventures, and growth equity firms</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Mature Companies</h4>
                <p className="text-sm text-cyan-100">Explore private equity firms and corporate venture arms</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
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
                  onClick={() => setCurrentView('funding-opportunities')}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Funding
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
                onClick={() => setCurrentView('funding-opportunities')}
                className="w-full flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"
              >
                <DollarSign className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <div className="font-medium text-slate-900">Funding Opportunities</div>
                  <div className="text-sm text-gray-600">Private investment & capital funding for Defence SMEs</div>
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
            <h2 className="text-xl font-bold text-slate-900 mb-4">Your Tier Benefits</h2>
            <div className="space-y-3">
              {dashboardStats.tier_benefits?.map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
            
            {user?.tier === 'free' && (
              <div className="mt-6 p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                <h4 className="font-semibold text-cyan-900 mb-2">Upgrade to Pro</h4>
                <p className="text-sm text-cyan-800 mb-3">
                  Get real-time alerts, enhanced analysis, and priority access to opportunities.
                </p>
                <button
                  onClick={() => handleUpgrade('pro')}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Upgrade Now - £49/month
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Opportunities Page Component
  const OpportunitiesPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFundingBody, setSelectedFundingBody] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Get unique funding bodies for filter dropdown
    const fundingBodies = [...new Set(opportunities.map(opp => opp.funding_body))].sort();

    // Filter opportunities based on search and filters
    const filteredOpportunities = opportunities.filter(opportunity => {
      const matchesSearch = !searchTerm || 
        opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opportunity.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFundingBody = !selectedFundingBody || 
        opportunity.funding_body === selectedFundingBody;

      return matchesSearch && matchesFundingBody;
    });

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackButton onClick={() => setCurrentView('dashboard')} text="Back to Dashboard" />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Defence Opportunities</h1>
            <p className="text-gray-600 mt-2">
              Discover funding and contract opportunities from leading UK defence organizations
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search opportunities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
              </button>
            </div>

            {showFilters && (
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Funding Body</label>
                    <select
                      value={selectedFundingBody}
                      onChange={(e) => setSelectedFundingBody(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    >
                      <option value="">All Organizations</option>
                      {fundingBodies.map(body => (
                        <option key={body} value={body}>{body}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Summary */}
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {filteredOpportunities.length} of {opportunities.length} opportunities
              {user?.tier === 'free' && (
                <span className="ml-2 text-yellow-600 font-medium">
                  (Pro/SME content delayed 48 hours)
                </span>
              )}
            </p>
          </div>

          {/* Opportunities Grid */}
          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading opportunities...</p>
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="text-center py-20">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No opportunities found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or check back later for new opportunities.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOpportunities.map((opportunity, index) => (
                <div 
                  key={opportunity.id || opportunity._id || index} 
                  onClick={() => handleOpportunityClick(opportunity)}
                  className="opportunity-card hover-card cursor-pointer group bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-cyan-300 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      opportunity.tier_required === 'free' ? 'bg-gray-100 text-gray-800' :
                      opportunity.tier_required === 'pro' ? 'bg-cyan-100 text-cyan-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {opportunity.tier_required?.toUpperCase() || 'FREE'}
                    </div>
                    
                    {opportunity.is_delayed && (
                      <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                        DELAYED
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-cyan-600 transition-colors line-clamp-2">
                    {opportunity.title}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{opportunity.funding_body}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>Closes: {new Date(opportunity.closing_date || opportunity.deadline).toLocaleDateString()}</span>
                    </div>

                    {opportunity.funding_amount && (
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{opportunity.funding_amount}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                    {opportunity.description}
                  </p>

                  {/* Enhanced metadata for Pro users */}
                  {user?.tier !== 'free' && opportunity.enhanced_metadata && (
                    <div className="space-y-2 mb-4">
                      {opportunity.enhanced_metadata.sme_score !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">SME Score:</span>
                          <span className="text-xs font-semibold text-green-600">
                            {Math.round(opportunity.enhanced_metadata.sme_score * 100)}%
                          </span>
                        </div>
                      )}
                      
                      {opportunity.enhanced_metadata.keywords_matched?.length > 0 && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Matched Keywords:</div>
                          <div className="text-xs text-gray-600">
                            {opportunity.enhanced_metadata.keywords_matched.slice(0, 5).join(', ')}
                            {opportunity.enhanced_metadata.keywords_matched.length > 5 && '...'}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-cyan-600 font-medium group-hover:text-cyan-700 transition-colors">
                      Click to view details →
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-cyan-600 transition-colors" />
                  </div>
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
      {currentView === 'funding-opportunities' && <FundingOpportunitiesPage />}
      {currentView === 'opportunity-detail' && <OpportunityDetailPage />}
      {currentView === 'alerts' && user && <AlertsPage />}
      {currentView === 'procurement-act' && user && <ProcurementActHub />}
      
      {showUpgradeModal && <UpgradeModal />}
      {showDemoSwitcher && <DemoTierSwitcher />}
    </div>
  );
}

export default App;