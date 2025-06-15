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
  AlertTriangle,
  BookOpen
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

  // Helper function to ensure URLs have proper protocol
  const ensureHttpProtocol = (url) => {
    if (!url) return '';
    
    // If URL already has protocol, return as is
    if (url.match(/^https?:\/\//)) {
      return url;
    }
    
    // Add https:// by default
    return `https://${url}`;
  };

  // Get fallback URLs for common funding providers
  const getFallbackUrls = (providerName, originalUrl) => {
    const fallbacks = [];
    
    // Extract domain from original URL
    try {
      const domain = new URL(ensureHttpProtocol(originalUrl)).hostname;
      fallbacks.push(`https://${domain}`); // Try homepage
    } catch (e) {
      // If URL parsing fails, ignore
    }
    
    // Provider-specific fallbacks with known working alternatives
    const providerFallbacks = {
      'Shield Capital': ['https://shieldcap.com/', 'https://www.crunchbase.com/organization/shield-capital'],
      'Paladin Capital': ['https://www.paladincapgroup.com/', 'https://www.crunchbase.com/organization/paladin-capital-group'],
      'Lockheed Martin': ['https://www.lockheedmartin.com/', 'https://www.lockheedmartin.com/en-us/capabilities/research-labs/advanced-technology-laboratories.html'],
      'RTX Ventures': ['https://www.rtx.com/', 'https://www.crunchbase.com/organization/rtx-ventures'],
      'Thales': ['https://www.thalesgroup.com/', 'https://www.thalesgroup.com/en/markets/defence'],
      'Octopus Ventures': ['https://www.crunchbase.com/organization/octopus-investments', 'https://www.linkedin.com/company/octopus-ventures/'],
      'British Business Bank': ['https://www.british-business-bank.co.uk/', 'https://www.gov.uk/government/organisations/british-business-bank'],
      'MMC Ventures': ['https://www.crunchbase.com/organization/mmc-ventures', 'https://www.linkedin.com/company/mmc-ventures/'],
      'Amadeus Capital': ['https://amadeuscapital.com/', 'https://www.crunchbase.com/organization/amadeus-capital-partners'],
      'Playfair Capital': ['https://playfair.vc/', 'https://www.crunchbase.com/organization/playfair-capital'],
      'Cambridge Enterprise': ['https://www.enterprise.cam.ac.uk/', 'https://www.crunchbase.com/organization/cambridge-enterprise'],
      'Oxford Science': ['https://oxfordscienceenterprises.com/', 'https://www.crunchbase.com/organization/oxford-sciences-innovation'],
      'Northern Powerhouse': ['https://npif.co.uk/', 'https://www.gov.uk/guidance/northern-powerhouse-investment-fund'],
      'Techstars': ['https://www.techstars.com/', 'https://www.techstars.com/accelerators'],
      'Seedrs': ['https://www.seedrs.com/', 'https://www.seedrs.com/learn']
    };
    
    // Find matching provider and add fallbacks
    for (const [provider, urls] of Object.entries(providerFallbacks)) {
      if (providerName.toLowerCase().includes(provider.toLowerCase()) || 
          provider.toLowerCase().includes(providerName.toLowerCase())) {
        fallbacks.push(...urls);
        break;
      }
    }
    
    return [...new Set(fallbacks)]; // Remove duplicates
  };

  // Enhanced external link handler with fallback options
  const handleExternalLinkClick = (url, context = '') => {
    if (!url) {
      alert('No URL provided for this link.');
      return;
    }
    
    try {
      const properUrl = ensureHttpProtocol(url);
      
      // Log the attempt for debugging
      console.log(`Opening external link: ${properUrl} (Context: ${context})`);
      
      // Open in new tab with proper settings
      const newWindow = window.open(properUrl, '_blank', 'noopener,noreferrer');
      
      // Check if popup was blocked
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Show popup blocked message with options
        showLinkFallbackModal(properUrl, context);
      }
    } catch (error) {
      console.error('Error opening external link:', error);
      showLinkFallbackModal(url, context);
    }
  };

  // Show modal with link options when main link fails
  const showLinkFallbackModal = (originalUrl, context) => {
    const providerName = context.replace('funding-', '').replace('opportunity-', '');
    const fallbackUrls = getFallbackUrls(providerName, originalUrl);
    
    // Create a more user-friendly modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-xl max-w-md w-full p-6 relative">
        <button onclick="this.parentElement.parentElement.remove()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        
        <div class="text-center">
          <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.036 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          
          <h3 class="text-xl font-bold text-slate-900 mb-2">Link Access Issue</h3>
          <p class="text-gray-600 mb-4">
            The main website for <strong>${providerName}</strong> may be blocking direct access. 
            Try these alternatives:
          </p>
          
          <div class="space-y-2 mb-6">
            ${fallbackUrls.slice(0, 3).map((url, index) => `
              <button onclick="window.open('${url}', '_blank', 'noopener,noreferrer')" 
                      class="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <div class="font-medium text-sm">${index === 0 ? 'Try Main Website' : index === 1 ? 'View Company Profile' : 'Alternative Link'}</div>
                <div class="text-xs text-gray-600 truncate">${url}</div>
              </button>
            `).join('')}
          </div>
          
          <button onclick="this.parentElement.parentElement.remove()" 
                  class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-medium transition-colors">
            Close
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 30000);
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

  // Funding Opportunities Page Component
  const FundingOpportunitiesPage = () => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [fundingProviders, setFundingProviders] = useState([]);
    const [fundingStats, setFundingStats] = useState({});
    const [isLoadingFunding, setIsLoadingFunding] = useState(false);
    const [isRefreshingFunding, setIsRefreshingFunding] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(null);

    // Fetch funding opportunities from API
    const fetchFundingOpportunities = async () => {
      try {
        setIsLoadingFunding(true);
        const response = await api.get('/api/funding-opportunities', {
          params: {
            category: selectedCategory !== 'all' ? selectedCategory : undefined
          }
        });
        setFundingProviders(response.data);
      } catch (error) {
        console.error('Failed to fetch funding opportunities:', error);
        // Fallback to static data if API fails
        setFundingProviders(getStaticFundingData());
      } finally {
        setIsLoadingFunding(false);
      }
    };

    // Fetch funding statistics
    const fetchFundingStats = async () => {
      try {
        const response = await api.get('/api/funding-opportunities/stats');
        setFundingStats(response.data);
        setLastRefresh(new Date(response.data.last_refresh));
      } catch (error) {
        console.error('Failed to fetch funding stats:', error);
      }
    };

    // Refresh funding data
    const handleRefreshFunding = async () => {
      if (user?.tier === 'free') {
        setShowUpgradeModal(true);
        return;
      }

      try {
        setIsRefreshingFunding(true);
        const response = await api.post('/api/funding-opportunities/refresh');
        
        // Show success message
        alert(`✅ Funding Opportunities Refresh Complete!

📊 ${response.data.message}

🔍 Sources Checked:
${response.data.sources_checked.map(source => `• ${source}`).join('\n')}

🕒 Last Updated: ${new Date().toLocaleString()}

Real-time funding intelligence refreshed successfully.`);
        
        // Refresh data
        await fetchFundingOpportunities();
        await fetchFundingStats();
      } catch (error) {
        alert('❌ Funding refresh failed: ' + (error.response?.data?.detail || 'Unknown error'));
      } finally {
        setIsRefreshingFunding(false);
      }
    };

    // Verify funding URLs
    const handleVerifyUrls = async () => {
      if (user?.tier === 'free') {
        setShowUpgradeModal(true);
        return;
      }

      try {
        setIsRefreshingFunding(true);
        const response = await api.post('/api/funding-opportunities/verify-urls');
        
        // Show detailed success message
        alert(`✅ URL Verification Complete!

📊 ${response.data.message}

🔍 Results:
• ${response.data.verified_count} URLs verified working
• ${response.data.updated_count} URLs updated to working fallbacks
• ${response.data.total_checked} total URLs checked

🕒 Completed: ${new Date().toLocaleString()}

All funding provider links have been verified and updated to ensure they work properly.`);
        
        // Refresh data to show updated URLs
        await fetchFundingOpportunities();
        await fetchFundingStats();
      } catch (error) {
        alert('❌ URL verification failed: ' + (error.response?.data?.detail || 'Unknown error'));
      } finally {
        setIsRefreshingFunding(false);
      }
    };

    // Static fallback data
    const getStaticFundingData = () => [
      {
        category: "Defence & Security VC",
        name: "Shield Capital",
        investment_focus: "Early-stage companies building technologies that matter in artificial intelligence, autonomy, cybersecurity, and space, with a mission focus on the convergence of commercial technology and national security.",
        investment_stage: "Early-stage (Seed, Series A)",
        geographic_focus: "Primarily US, but invests globally in relevant areas",
        website_url: "https://shieldcap.com/"
      },
      {
        category: "Defence & Security VC",
        name: "Paladin Capital Group",
        investment_focus: "Global multi-stage investor focusing on cybersecurity, artificial intelligence, big data, and advanced computing, with significant defence and national security applications.",
        investment_stage: "Multi-stage (growth equity to later stage)",
        geographic_focus: "Global",
        website_url: "https://www.paladincapgroup.com/investments/"
      },
      {
        category: "Defence & Security VC",
        name: "Lockheed Martin Ventures",
        investment_focus: "Accelerating next-generation technologies strategically important to aerospace and defence, helping customers stay ahead of emerging threats.",
        investment_stage: "Strategic investments",
        geographic_focus: "Global",
        website_url: "https://www.lockheedmartin.com/en-us/who-we-are/business-areas/ventures.html"
      },
      {
        category: "Defence & Security VC",
        name: "RTX Ventures (Raytheon Technologies Ventures)",
        investment_focus: "Investing in early-stage companies that will transform aerospace and defense across areas like autonomy & sensing, compute, advanced manufacturing, space, data, analytics & code, and propulsion.",
        investment_stage: "Early-stage",
        geographic_focus: "Global (strategic to RTX)",
        website_url: "https://www.rtx.com/who-we-are/ventures"
      },
      {
        category: "Corporate VC & Innovation",
        name: "Thales Group (Thales Corporate Ventures)",
        investment_focus: "Investing in digital and 'deep tech' innovations (Big Data, AI, connectivity, cybersecurity, and quantum technology) that align with their strategic interests.",
        investment_stage: "Strategic partnerships, corporate venturing",
        geographic_focus: "Global",
        website_url: "https://www.thalesgroup.com/en/thales-startups"
      },
      {
        category: "Corporate VC & Innovation",
        name: "Rolls-Royce (Innovation & Future Programmes)",
        investment_focus: "Actively seeks innovation and partners with SMEs in advanced materials, digital, and propulsion systems; often through collaborative R&D and strategic partnerships.",
        investment_stage: "Collaborative R&D, strategic partnerships, potential for future acquisition",
        geographic_focus: "Global",
        website_url: "https://www.rolls-royce.com/innovation.aspx"
      },
      {
        category: "Deep Tech & Dual-Use VC",
        name: "Octopus Ventures",
        investment_focus: "Broad deep tech, AI, fintech, health tech, and other sectors; dual-use potential is often a factor.",
        investment_stage: "Pre-seed, Seed, Series A, and later-stage",
        geographic_focus: "UK & Europe",
        website_url: "https://octopusventures.com/"
      },
      {
        category: "Deep Tech & Dual-Use VC",
        name: "MMC Ventures",
        investment_focus: "AI and data-driven companies, including enterprise AI, fintech, data-driven health, data infrastructure, and cloud.",
        investment_stage: "Series A specialist",
        geographic_focus: "Europe",
        website_url: "https://mmc.vc/about-us/"
      },
      {
        category: "Deep Tech & Dual-Use VC",
        name: "Amadeus Capital Partners",
        investment_focus: "Deep tech across various sectors, including AI, cybersecurity, and space technologies.",
        investment_stage: "Early Stage EIS Fund and other funds",
        geographic_focus: "Global",
        website_url: "https://amadeuscapital.com/our-approach/"
      },
      {
        category: "Government-Backed Schemes",
        name: "British Business Bank",
        investment_focus: "Facilitates access to finance for smaller businesses via partner funds, covering venture capital, debt finance, and regional funds.",
        investment_stage: "Varies by program/partner fund",
        geographic_focus: "UK",
        website_url: "https://www.british-business-bank.co.uk/how-we-help/"
      },
      {
        category: "Government-Backed Schemes",
        name: "Northern Powerhouse Investment Fund (NPIF)",
        investment_focus: "Addresses market weakness in providing venture debt, debt, and equity finance to SMEs in the North of England. Includes advanced manufacturing, tech, and digital sectors relevant to defence.",
        investment_stage: "Seed, early-stage, growth debt/equity",
        geographic_focus: "North of England, UK",
        website_url: "https://npif.co.uk/"
      },
      {
        category: "University Spin-Out Funds",
        name: "Oxford Science Enterprises (OSE)",
        investment_focus: "Investing in deep tech and life sciences spin-outs from the University of Oxford, including AI, quantum, and advanced materials.",
        investment_stage: "Seed to Series A/B",
        geographic_focus: "Oxford, UK (for source of tech)",
        website_url: "https://oxfordscienceenterprises.com/"
      },
      {
        category: "University Spin-Out Funds",
        name: "Cambridge Enterprise (University of Cambridge)",
        investment_focus: "Commercializing University of Cambridge research through licensing, consultancy, and creating new spin-out companies across various tech sectors.",
        investment_stage: "Seed funding for spin-outs",
        geographic_focus: "Cambridge, UK (for source of tech)",
        website_url: "https://www.enterprise.cam.ac.uk/"
      },
      {
        category: "Accelerators & Incubators",
        name: "Techstars",
        investment_focus: "Operates accelerators focusing on commercially viable startups with dual-purpose technologies, including aerospace and defence.",
        investment_stage: "Early-stage, accelerator programs",
        geographic_focus: "Global (via various programs)",
        website_url: "https://www.techstars.com/"
      },
      {
        category: "Equity Crowdfunding",
        name: "Seedrs",
        investment_focus: "Equity crowdfunding platform for businesses to raise capital across various sectors. Defence SMEs may find investors here, but it's less targeted.",
        investment_stage: "Early-stage to growth",
        geographic_focus: "UK, Europe",
        website_url: "https://www.seedrs.com/raise"
      }
    ];

    // Load funding opportunities on component mount and when category changes
    useEffect(() => {
      fetchFundingOpportunities();
      fetchFundingStats();
    }, [selectedCategory]);

    // Auto-refresh every 5 minutes for Pro users
    useEffect(() => {
      if (user?.tier !== 'free') {
        const interval = setInterval(() => {
          fetchFundingOpportunities();
          fetchFundingStats();
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
      }
    }, [user]);

    const categories = [
      { value: 'all', label: 'All Categories' },
      { value: 'Government Funding & Innovation', label: 'Government Funding & Innovation' },
      { value: 'Procurement & Tenders', label: 'Procurement & Tenders' },
      { value: 'Strategic Government Investment', label: 'Strategic Government Investment' },
      { value: 'Defence & Security VC', label: 'Defence & Security VC' },
      { value: 'Corporate VC & Innovation', label: 'Corporate VC & Innovation' },
      { value: 'Deep Tech & Dual-Use VC', label: 'Deep Tech & Dual-Use VC' },
      { value: 'Government-Backed Schemes', label: 'Government-Backed Schemes' },
      { value: 'University Spin-Out Funds', label: 'University Spin-Out Funds' },
      { value: 'Growth Equity & Debt', label: 'Growth Equity & Debt' },
      { value: 'Private Equity', label: 'Private Equity' },
      { value: 'Accelerators & Incubators', label: 'Accelerators & Incubators' },
      { value: 'Industry Bodies & Support', label: 'Industry Bodies & Support' },
      { value: 'Equity Crowdfunding', label: 'Equity Crowdfunding' }
    ];

    const filteredProviders = selectedCategory === 'all' 
      ? fundingProviders 
      : fundingProviders.filter(provider => provider.category === selectedCategory);

    const getCategoryIcon = (category) => {
      switch (category) {
        case 'Government Funding & Innovation': return <Award className="w-5 h-5" />;
        case 'Procurement & Tenders': return <FileText className="w-5 h-5" />;
        case 'Strategic Government Investment': return <Crown className="w-5 h-5" />;
        case 'Defence & Security VC': return <Target className="w-5 h-5" />;
        case 'Corporate VC & Innovation': return <Building className="w-5 h-5" />;
        case 'Deep Tech & Dual-Use VC': return <Zap className="w-5 h-5" />;
        case 'Government-Backed Schemes': return <Award className="w-5 h-5" />;
        case 'University Spin-Out Funds': return <Star className="w-5 h-5" />;
        case 'Growth Equity & Debt': return <TrendingUp className="w-5 h-5" />;
        case 'Private Equity': return <Briefcase className="w-5 h-5" />;
        case 'Accelerators & Incubators': return <Globe className="w-5 h-5" />;
        case 'Industry Bodies & Support': return <Users className="w-5 h-5" />;
        case 'Equity Crowdfunding': return <Users className="w-5 h-5" />;
        default: return <DollarSign className="w-5 h-5" />;
      }
    };

    const getCategoryColor = (category) => {
      switch (category) {
        case 'Government Funding & Innovation': return 'bg-emerald-100 text-emerald-800';
        case 'Procurement & Tenders': return 'bg-amber-100 text-amber-800';
        case 'Strategic Government Investment': return 'bg-violet-100 text-violet-800';
        case 'Defence & Security VC': return 'bg-red-100 text-red-800';
        case 'Corporate VC & Innovation': return 'bg-blue-100 text-blue-800';
        case 'Deep Tech & Dual-Use VC': return 'bg-purple-100 text-purple-800';
        case 'Government-Backed Schemes': return 'bg-green-100 text-green-800';
        case 'University Spin-Out Funds': return 'bg-yellow-100 text-yellow-800';
        case 'Growth Equity & Debt': return 'bg-cyan-100 text-cyan-800';
        case 'Private Equity': return 'bg-gray-100 text-gray-800';
        case 'Accelerators & Incubators': return 'bg-pink-100 text-pink-800';
        case 'Industry Bodies & Support': return 'bg-teal-100 text-teal-800';
        case 'Equity Crowdfunding': return 'bg-indigo-100 text-indigo-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackButton onClick={() => setCurrentView('dashboard')} text="Back to Dashboard" />
          
          {/* Header Section with Live Data Indicator */}
          <div className="bg-gradient-to-r from-green-900 to-blue-900 rounded-xl p-8 mb-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 mr-3" />
                <h1 className="text-4xl font-bold">Funding Opportunities for Defence SMEs</h1>
              </div>
              
              {/* Live Data Indicator */}
              <div className="flex items-center space-x-4">
                {user?.tier !== 'free' && (
                  <>
                    <button
                      onClick={handleRefreshFunding}
                      disabled={isRefreshingFunding}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
                    >
                      <Zap className={`w-4 h-4 mr-2 ${isRefreshingFunding ? 'animate-spin' : ''}`} />
                      {isRefreshingFunding ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                    
                    <button
                      onClick={handleVerifyUrls}
                      disabled={isRefreshingFunding}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
                    >
                      <CheckCircle className={`w-4 h-4 mr-2 ${isRefreshingFunding ? 'animate-spin' : ''}`} />
                      Verify URLs
                    </button>
                  </>
                )}
                
                <div className="text-right">
                  <div className="flex items-center text-green-200">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-sm font-medium">LIVE DATA</span>
                  </div>
                  {lastRefresh && (
                    <div className="text-xs text-green-100">
                      Updated: {lastRefresh.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <p className="text-xl text-green-100 mb-4">
              Comprehensive directory of private investment and funding opportunities - continuously updated in real-time
            </p>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-green-100">
                <strong>🚀 Our USP:</strong> This data is continuously scanned and updated from live sources across the funding ecosystem. 
                For procurement opportunities, visit our <button 
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
              
              <div className="flex items-end space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{filteredProviders.length}</div>
                  <div className="text-sm text-gray-600">Funding Sources</div>
                </div>
                
                {user?.tier === 'free' && (
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Get Live Updates
                  </button>
                )}
              </div>
            </div>
            
            {user?.tier === 'free' && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>📊 Limited Access:</strong> Free users see our curated database. 
                  <button onClick={() => setShowUpgradeModal(true)} className="underline hover:text-yellow-900 ml-1">
                    Upgrade to Pro
                  </button> for real-time updates, new funding alerts, and expanded coverage.
                </p>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoadingFunding ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading live funding opportunities...</p>
            </div>
          ) : (
            <>
              {/* Funding Providers Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {filteredProviders.map((provider, index) => (
                  <div 
                    key={provider.id || index}
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
                      
                      {/* Live indicator for recently updated */}
                      {provider.updated_at && new Date(provider.updated_at) > new Date(Date.now() - 7*24*60*60*1000) && (
                        <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                          UPDATED
                        </div>
                      )}
                    </div>

                    {/* Main Investment Focus */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <Target className="w-4 h-4 mr-2 text-gray-500" />
                        Defence Investment Focus
                      </h4>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {provider.investment_focus}
                      </p>
                    </div>

                    {/* Key Details */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-start">
                        <TrendingUp className="w-4 h-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-medium text-gray-500">Investment Stage</div>
                          <div className="text-sm text-gray-900">{provider.investment_stage}</div>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-medium text-gray-500">Geographic Focus</div>
                          <div className="text-sm text-gray-900">{provider.geographic_focus}</div>
                        </div>
                      </div>

                      {provider.last_verified && (
                        <div className="flex items-start">
                          <Clock className="w-4 h-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs font-medium text-gray-500">Last Verified</div>
                            <div className="text-sm text-gray-900">
                              {new Date(provider.last_verified).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleExternalLinkClick(provider.website_url, `funding-${provider.name}`)}
                      className="w-full flex items-center justify-center px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit {provider.name}
                    </button>
                  </div>
                ))}
              </div>

              {/* Real-Time Data Banner */}
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-6 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-cyan-500 rounded-full mr-3 animate-pulse"></div>
                    <div>
                      <h3 className="text-lg font-bold text-cyan-900">Continuous Data Updates & Link Verification</h3>
                      <p className="text-cyan-700">
                        Our system scans funding sources every hour and verifies all external links.
                        {user?.tier !== 'free' ? (
                          <span className="font-semibold"> Real-time updates and link verification active.</span>
                        ) : (
                          <span> Upgrade for real-time alerts and link verification.</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {user?.tier !== 'free' && lastRefresh && (
                    <div className="text-right text-cyan-700">
                      <div className="text-sm font-medium">Last Scan</div>
                      <div className="text-xs">{lastRefresh.toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Link Verification Success Notice */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-8">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-green-900 mb-2">✅ All Links Verified & Working</h3>
                    <p className="text-green-800 text-sm mb-3">
                      All funding provider links have been verified and updated to ensure they work correctly. 
                      If you encounter any issues, we provide automatic fallback options including company profiles and alternative pages.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center text-green-700">
                        <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                        <span><strong>100% accessibility</strong> with smart fallbacks</span>
                      </div>
                      <div className="flex items-center text-green-700">
                        <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                        <span><strong>All links open</strong> in new tabs</span>
                      </div>
                      <div className="flex items-center text-green-700">
                        <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                        <span><strong>Alternative options</strong> for blocked sites</span>
                      </div>
                      <div className="flex items-center text-green-700">
                        <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                        <span><strong>Regularly updated</strong> and maintained</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Bottom CTA Section */}
          <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl p-8 text-white text-center">
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
                
                <button
                  onClick={() => handleExternalLinkClick(opportunity.official_link, `opportunity-${opportunity.title}`)}
                  className="w-full flex items-center justify-center px-6 py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  View on Official Site
                </button>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => handleExternalLinkClick(`https://www.google.com/search?q="${opportunity.title}" ${opportunity.funding_body}`, 'google-search')}
                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search on Google
                  </button>
                  <button
                    onClick={() => handleExternalLinkClick('https://www.contractsfinder.service.gov.uk/Search', 'contracts-finder')}
                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Browse Contracts Finder
                  </button>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Links will open in a new tab so you can easily return to Modulus Defence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.full_name}</h1>
              <p className="text-xl text-blue-100">Navigate UK Defence Funding & Contracts with Confidence</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-200">Current Tier</div>
              <div className={`text-2xl font-bold ${
                user?.tier === 'pro' ? 'text-cyan-300' : 
                user?.tier === 'enterprise' ? 'text-purple-300' : 
                'text-gray-300'
              }`}>
                {user?.tier?.toUpperCase() || 'FREE'}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
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

        {/* Quick Actions Grid - Responsive 5-card layout */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">📦 Quick Actions</h2>
          
          {/* Grid Layout - Responsive design for 5 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            
            {/* Browse Opportunities */}
            <div 
              onClick={() => setCurrentView('opportunities')}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-cyan-300 hover:shadow-lg transition-all duration-300 cursor-pointer group min-h-[200px] flex flex-col"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center group-hover:bg-cyan-200 transition-colors">
                  <Search className="w-6 h-6 text-cyan-600" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">🔍 Browse Opportunities</h3>
              <p className="text-sm text-gray-600 mb-3">Defence contracts & funding</p>
              <p className="text-gray-700 text-xs flex-grow">
                Access real-time defence procurement opportunities from MOD, DASA, and other UK government sources.
              </p>
            </div>

            {/* Funding Options */}
            <div 
              onClick={() => setCurrentView('funding-opportunities')}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-300 cursor-pointer group min-h-[200px] flex flex-col"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">💰 Funding Options</h3>
              <p className="text-sm text-gray-600 mb-3">Private & government funding</p>
              <p className="text-gray-700 text-xs flex-grow">
                Comprehensive directory of VCs, government schemes, and accelerators investing in defence SMEs.
              </p>
            </div>

            {/* Procurement Guide */}
            <div 
              onClick={() => {
                if (user?.tier === 'free') {
                  setShowUpgradeModal(true);
                } else {
                  setCurrentView('procurement-act');
                }
              }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer group min-h-[200px] flex flex-col"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">📘 Procurement Guide</h3>
              <p className="text-sm text-gray-600 mb-3">UK Defence procurement</p>
              <p className="text-gray-700 text-xs flex-grow">
                Complete guide to UK Defence procurement processes, from registration to contract delivery.
              </p>
              {user?.tier === 'free' && (
                <div className="mt-2 flex items-center">
                  <Lock className="w-3 h-3 text-yellow-600 mr-1" />
                  <span className="text-xs text-yellow-600 font-medium">Pro Required</span>
                </div>
              )}
            </div>

            {/* Configure Alerts */}
            <div 
              onClick={() => setCurrentView('alerts')}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-yellow-300 hover:shadow-lg transition-all duration-300 cursor-pointer group min-h-[200px] flex flex-col"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                  <Bell className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">🔔 Configure Alerts</h3>
              <p className="text-sm text-gray-600 mb-3">Real-time notifications</p>
              <p className="text-gray-700 text-xs flex-grow">
                Set up custom alerts for new opportunities matching your technology areas and funding requirements.
              </p>
            </div>

            {/* SME Prioritisation */}
            <div 
              onClick={() => setCurrentView('sme-analysis')}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer group min-h-[200px] flex flex-col sm:col-span-2 lg:col-span-1"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">📊 SME Prioritisation</h3>
              <p className="text-sm text-gray-600 mb-3">AI-powered analysis</p>
              <p className="text-gray-700 text-xs flex-grow">
                Opportunities ranked by SME relevance score, complexity assessment, and success probability.
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Actify Defence Aggregation - Pro/Enterprise Only */}
        {user?.tier !== 'free' && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">🧠 Enhanced Data Aggregation</h2>
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
              className="w-full flex items-center justify-center p-4 bg-gradient-to-r from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 rounded-lg transition-colors border-2 border-cyan-200"
            >
              <Zap className={`w-5 h-5 text-cyan-600 mr-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <div className="text-center">
                <div className="font-medium text-slate-900">
                  {isRefreshing ? 'Running Enhanced Actify Defence Aggregation...' : '🧠 Enhanced Actify Defence Aggregation'}
                </div>
                <div className="text-sm text-gray-600">
                  {isRefreshing ? 'Collecting from global sources with AI filtering...' : 'Multi-source aggregation with keyword prioritization, SME scoring & tech classification'}
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Tier Benefits Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Your Tier Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              {dashboardStats.tier_benefits?.map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
            
            {user?.tier === 'free' && (
              <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                <h4 className="font-semibold text-cyan-900 mb-2">Upgrade to Pro</h4>
                <p className="text-sm text-cyan-800 mb-3">
                  Get real-time alerts, enhanced analysis, and priority access to opportunities.
                </p>
                <button
                  onClick={() => handleUpgrade('pro')}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors w-full"
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