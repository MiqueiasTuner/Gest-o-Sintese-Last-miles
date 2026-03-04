import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  DollarSign, 
  Plus, 
  Search, 
  TrendingUp,
  Map as MapIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  XCircle,
  ArrowDownCircle,
  BarChart3,
  Calendar,
  LogOut,
  ChevronRight,
  ShieldCheck,
  MoreVertical,
  Wallet,
  CreditCard,
  Receipt,
  Menu,
  X,
  Download,
  Upload,
  Network,
  Globe,
  Activity,
  Shield,
  Cpu,
  Layers,
  AlertTriangle,
  Handshake,
  User,
  Lock
} from 'lucide-react';
import Papa from 'papaparse';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { db, auth } from './lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  Timestamp,
  where,
  writeBatch
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';

// --- Types ---
interface Partner {
  id: string;
  name: string;
  contact: string;
  state: string;
  cities: string;
  logo_url?: string;
  status: 'active' | 'cancelled';
  sla_incidents?: number;
  created_at: any;
}

interface Point {
  id: string;
  customer_name: string;
  address: string;
  city: string;
  state: string;
  partner_id: string;
  partner_name?: string;
  cost: number;
  status: 'pending' | 'completed' | 'cancelled';
  payment_status?: 'pending' | 'paid';
  sla_status?: 'within' | 'warning' | 'breached';
  equipment?: string;
  bandwidth?: string;
  created_at: any;
}

interface MonthlyStat {
  month: string;
  count: number;
  total_cost: number;
}

// --- Components ---

const PartnerLogo = ({ name, url, size = "md" }: { name: string, url?: string, size?: "sm" | "md" | "lg" }) => {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const sizes = {
    sm: "w-8 h-8 text-[10px]",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-xl"
  };

  if (url && url.trim() !== '') {
    return (
      <div className={cn("rounded-xl overflow-hidden border border-white/10 bg-slate-800 flex items-center justify-center shrink-0", sizes[size])}>
        <img src={url} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center text-white font-black relative overflow-hidden group shrink-0 shadow-inner", sizes[size])}>
      <div className="absolute inset-0 bg-indigo-500/10 opacity-50" />
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="relative">
          <Users size={size === "sm" ? 14 : size === "md" ? 20 : 28} className="text-indigo-400/60" />
          <Handshake size={size === "sm" ? 10 : size === "md" ? 14 : 20} className="absolute -bottom-1 -right-1 text-indigo-400" />
        </div>
      </div>
    </div>
  );
};

const BrazilMap = () => {
  return (
    <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden h-[400px] group transition-all duration-500 hover:border-white/20">
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Globe size={120} />
      </div>
      <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3 relative z-10">
        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
          <MapIcon size={20} />
        </div>
        Cobertura de Rede Nacional
      </h3>
      <div className="relative h-full flex items-center justify-center">
        {/* Simplified Brazil SVG Map */}
        <svg viewBox="0 0 500 500" className="w-full h-full opacity-20 text-slate-500 fill-current">
          <path d="M250,50 L300,70 L350,100 L380,150 L400,200 L420,250 L400,300 L350,350 L300,400 L250,450 L200,400 L150,350 L100,300 L80,250 L100,200 L120,150 L150,100 L200,70 Z" />
          {/* Mock nodes in Brazil states */}
          <circle cx="250" cy="150" r="4" className="fill-indigo-500 animate-pulse" />
          <circle cx="350" cy="250" r="4" className="fill-indigo-500 animate-pulse" />
          <circle cx="200" cy="350" r="4" className="fill-indigo-500 animate-pulse" />
          <circle cx="150" cy="200" r="4" className="fill-indigo-500 animate-pulse" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-4xl font-black text-white/10 uppercase tracking-[0.3em]">Brasil</p>
          <p className="text-[10px] font-black text-emerald-400/30 uppercase tracking-[0.2em] mt-2">Nós de Rede Ativos em 26 Estados</p>
        </div>
      </div>
    </div>
  );
};

const NetworkTopology = () => {
  return (
    <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden h-[400px] group transition-all duration-500 hover:border-white/20">
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Network size={120} />
      </div>
      <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3 relative z-10">
        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
          <Activity size={20} />
        </div>
        Topologia de Rede Ativa
      </h3>
      <div className="relative h-full flex items-center justify-center">
         <svg viewBox="0 0 800 400" className="w-full h-full opacity-30">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <g className="text-indigo-500/20">
              <line x1="400" y1="200" x2="150" y2="80" stroke="currentColor" strokeWidth="1" />
              <line x1="400" y1="200" x2="650" y2="120" stroke="currentColor" strokeWidth="1" />
              <line x1="400" y1="200" x2="250" y2="320" stroke="currentColor" strokeWidth="1" />
              <line x1="400" y1="200" x2="550" y2="280" stroke="currentColor" strokeWidth="1" />
              <line x1="150" y1="80" x2="250" y2="320" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4" />
              <line x1="650" y1="120" x2="550" y2="280" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4" />
            </g>
            
            <circle cx="400" cy="200" r="10" className="fill-indigo-500" filter="url(#glow)" />
            <circle cx="150" cy="80" r="5" className="fill-slate-600" />
            <circle cx="650" cy="120" r="5" className="fill-slate-600" />
            <circle cx="250" cy="320" r="5" className="fill-slate-600" />
            <circle cx="550" cy="280" r="5" className="fill-slate-600" />
            
            <circle cx="400" cy="200" r="20" className="stroke-indigo-500/20 fill-none animate-ping" />
         </svg>
         <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-5xl font-black text-white/5 uppercase tracking-[0.4em]">Sintese Core</p>
            <p className="text-[10px] font-black text-indigo-400/30 uppercase tracking-[0.3em] mt-4">Infraestrutura de Rede Nacional</p>
         </div>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center w-full gap-3 px-4 py-3 rounded-2xl transition-all duration-500 group relative overflow-hidden",
      active 
        ? "bg-white/10 text-white shadow-2xl shadow-indigo-500/20 border border-white/10 backdrop-blur-md" 
        : "text-slate-400 hover:bg-white/5 hover:text-slate-100 border border-transparent hover:border-white/5"
    )}
  >
    {active && (
      <motion.div 
        layoutId="active-pill"
        className="absolute left-0 w-1.5 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"
      />
    )}
    <div className="relative z-10 flex items-center gap-3">
      <Icon size={18} className={cn("transition-all duration-500", active ? "scale-110 text-indigo-400" : "group-hover:scale-110 group-hover:text-slate-200")} />
      <span className="font-black text-[10px] uppercase tracking-[0.2em]">{label}</span>
    </div>
    {active && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40">
        <ChevronRight size={12} />
      </div>
    )}
  </button>
);

const StatCard = ({ label, value, icon: Icon, trend, color }: { label: string, value: string | number, icon: any, trend?: string, color: string }) => {
  const isPositive = trend?.startsWith('+');
  const isNegative = trend?.startsWith('-');
  
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden group transition-all duration-500"
    >
      {/* Liquid Glass Background Effect */}
      <div className={cn(
        "absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500",
        color.replace('bg-', 'bg-')
      )} />
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={cn("p-4 rounded-2xl bg-white/5 border border-white/10 shadow-inner", color.replace('bg-', 'text-'))}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className={cn(
            "text-[10px] font-black px-3 py-1 rounded-full tracking-wider uppercase border",
            isPositive ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : 
            isNegative ? "text-rose-400 bg-rose-400/10 border-rose-400/20" : 
            "text-slate-400 bg-slate-400/10 border-slate-400/20"
          )}>
            {trend}
          </span>
        )}
      </div>
      <div className="relative z-10">
        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{label}</h3>
        <p className="text-3xl font-bold text-white tracking-tighter">{value}</p>
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<'dashboard' | 'partners' | 'points' | 'reports' | 'finance'>('dashboard');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Form states
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showEditPartnerModal, setShowEditPartnerModal] = useState<Partner | null>(null);
  const [showPointModal, setShowPointModal] = useState(false);
  const [showReductionModal, setShowReductionModal] = useState<{id: string, currentCost: number} | null>(null);
  const [reductionValue, setReductionValue] = useState(0);
  
  const [newPartner, setNewPartner] = useState({ name: '', contact: '', state: '', cities: '', logo_url: '' });
  const [newPoint, setNewPoint] = useState({ 
    customer_name: '', 
    address: '', 
    city: '', 
    state: '', 
    partner_id: '', 
    cost: 0, 
    status: 'pending' as const,
    sla_status: 'within' as 'within' | 'warning' | 'breached',
    equipment: '',
    bandwidth: ''
  });
  const [partnerFilter, setPartnerFilter] = useState<'active' | 'cancelled'>('active');
  const [pointFilter, setPointFilter] = useState<'active' | 'cancelled'>('active');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Data Listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const qPartners = query(collection(db, 'partners'), orderBy('name'));
    const unsubscribePartners = onSnapshot(qPartners, (snapshot) => {
      const partnersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Partner[];
      setPartners(partnersList);
    });

    const qPoints = query(collection(db, 'points'), orderBy('created_at', 'desc'));
    const unsubscribePoints = onSnapshot(qPoints, (snapshot) => {
      const pointsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Point[];
      setPoints(pointsList);
    });

    return () => {
      unsubscribePartners();
      unsubscribePoints();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Derived Stats
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const stats = useMemo(() => {
    let filteredPoints = points.filter(p => p.status !== 'cancelled');
    
    if (dateRange.start) {
      filteredPoints = filteredPoints.filter(p => {
        const date = p.created_at?.toDate ? p.created_at.toDate() : new Date();
        return date >= new Date(dateRange.start);
      });
    }
    if (dateRange.end) {
      filteredPoints = filteredPoints.filter(p => {
        const date = p.created_at?.toDate ? p.created_at.toDate() : new Date();
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        return date <= endDate;
      });
    }

    const activePartners = partners.filter(p => p.status !== 'cancelled');
    const totalCost = filteredPoints.reduce((acc, curr) => acc + curr.cost, 0);
    
    const pointsByStateMap: Record<string, number> = {};
    filteredPoints.forEach(p => {
      pointsByStateMap[p.state] = (pointsByStateMap[p.state] || 0) + 1;
    });
    
    const pointsByState = Object.entries(pointsByStateMap).map(([state, count]) => ({ state, count }));

    return {
      totalPartners: activePartners.length,
      totalPoints: filteredPoints.length,
      totalCost,
      pointsByState
    };
  }, [partners, points, dateRange]);

  const monthlyStats = useMemo(() => {
    const statsMap: Record<string, { count: number, total_cost: number }> = {};
    
    let filteredPoints = points.filter(p => p.status !== 'cancelled');
    
    if (dateRange.start) {
      filteredPoints = filteredPoints.filter(p => {
        const date = p.created_at?.toDate ? p.created_at.toDate() : new Date();
        return date >= new Date(dateRange.start);
      });
    }
    if (dateRange.end) {
      filteredPoints = filteredPoints.filter(p => {
        const date = p.created_at?.toDate ? p.created_at.toDate() : new Date();
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        return date <= endDate;
      });
    }

    filteredPoints.forEach(p => {
      const date = p.created_at?.toDate ? p.created_at.toDate() : new Date();
      const month = date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
      
      if (!statsMap[month]) {
        statsMap[month] = { count: 0, total_cost: 0 };
      }
      statsMap[month].count += 1;
      statsMap[month].total_cost += p.cost;
    });

    return Object.entries(statsMap).map(([month, data]) => ({
      month,
      ...data
    })).sort((a, b) => {
      // Simple sort for months (could be improved)
      return 0;
    });
  }, [points, dateRange]);

  const handleReportIncident = async (partnerId: string) => {
    try {
      const partner = partners.find(p => p.id === partnerId);
      if (!partner) return;
      
      const newIncidents = (partner.sla_incidents || 0) + 1;
      await updateDoc(doc(db, 'partners', partnerId), {
        sla_incidents: newIncidents
      });
      
      setPartners(partners.map(p => p.id === partnerId ? { ...p, sla_incidents: newIncidents } : p));
    } catch (error) {
      console.error("Erro ao registrar incidente:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (error: any) {
      console.error("Firebase Auth Error:", error.code, error.message);
      
      // Mapeamento de erros comuns do Firebase para mensagens amigáveis
      switch (error.code) {
        case 'auth/invalid-credential':
          setLoginError("E-mail ou senha incorretos. Verifique suas credenciais.");
          break;
        case 'auth/user-not-found':
          setLoginError("Usuário não encontrado. Verifique o e-mail informado.");
          break;
        case 'auth/wrong-password':
          setLoginError("Senha incorreta. Tente novamente.");
          break;
        case 'auth/too-many-requests':
          setLoginError("Muitas tentativas malsucedidas. Tente novamente mais tarde.");
          break;
        case 'auth/network-request-failed':
          setLoginError("Erro de conexão. Verifique sua internet.");
          break;
        case 'auth/invalid-email':
          setLoginError("Formato de e-mail inválido.");
          break;
        default:
          setLoginError("Erro ao acessar o painel. Verifique se o e-mail e senha estão corretos.");
      }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const csvContent = "nome,contato,estado,cidades,logo_url\nExemplo Empresa,João Silva,SP,\"São Paulo, Campinas\",https://exemplo.com/logo.png";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "modelo_importacao_parceiros.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[];
        if (data.length === 0) {
          setToast({ message: 'O arquivo está vazio.', type: 'error' });
          return;
        }

        try {
          const batch = writeBatch(db);
          data.forEach((row) => {
            const partnerRef = doc(collection(db, 'partners'));
            batch.set(partnerRef, {
              name: row.nome || row.name || '',
              contact: row.contato || row.contact || '',
              state: row.estado || row.state || '',
              cities: row.cidades || row.cities || row.cidade || row.city || '',
              logo_url: row.logo_url || '',
              status: 'active',
              created_at: Timestamp.now()
            });
          });

          await batch.commit();
          setToast({ message: `${data.length} parceiros importados com sucesso!`, type: 'success' });
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
          console.error("Erro na importação:", error);
          setToast({ message: 'Erro ao importar parceiros. Verifique o formato do arquivo.', type: 'error' });
        }
      },
      error: (error: any) => {
        console.error("Erro no parse do CSV:", error);
        setToast({ message: 'Erro ao ler o arquivo CSV.', type: 'error' });
      }
    });
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'partners'), {
        ...newPartner,
        status: 'active',
        created_at: Timestamp.now()
      });
      setToast({ message: 'Parceiro cadastrado com sucesso!', type: 'success' });
      setShowPartnerModal(false);
      setNewPartner({ name: '', contact: '', state: '', cities: '', logo_url: '' });
    } catch (error) {
      setToast({ message: 'Erro ao cadastrar parceiro.', type: 'error' });
    }
  };

  const handleUpdatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditPartnerModal) return;
    try {
      const partnerRef = doc(db, 'partners', showEditPartnerModal.id);
      await updateDoc(partnerRef, {
        name: showEditPartnerModal.name,
        contact: showEditPartnerModal.contact,
        state: showEditPartnerModal.state,
        cities: showEditPartnerModal.cities,
        logo_url: showEditPartnerModal.logo_url || ''
      });
      
      setToast({ message: 'Parceiro atualizado com sucesso!', type: 'success' });
      setShowEditPartnerModal(null);
    } catch (error) {
      setToast({ message: 'Erro ao atualizar parceiro.', type: 'error' });
    }
  };

  const handleAddPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const partner = partners.find(p => p.id === newPoint.partner_id);
      await addDoc(collection(db, 'points'), {
        ...newPoint,
        partner_name: partner?.name || 'N/A',
        payment_status: 'pending',
        created_at: Timestamp.now()
      });
      setToast({ message: 'Ponto cadastrado com sucesso!', type: 'success' });
      setShowPointModal(false);
      setNewPoint({ 
        customer_name: '', 
        address: '', 
        city: '', 
        state: '', 
        partner_id: '', 
        cost: 0, 
        status: 'pending',
        sla_status: 'within',
        equipment: '',
        bandwidth: ''
      });
    } catch (error) {
      setToast({ message: 'Erro ao cadastrar ponto.', type: 'error' });
    }
  };

  const handleTogglePayment = async (pointId: string, currentStatus: string) => {
    try {
      const pointRef = doc(db, 'points', pointId);
      await updateDoc(pointRef, {
        payment_status: currentStatus === 'paid' ? 'pending' : 'paid'
      });
      setToast({ message: 'Status de pagamento atualizado!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Erro ao atualizar pagamento.', type: 'error' });
    }
  };

  const deletePartner = async (id: string) => {
    const partnerPoints = points.filter(p => p.partner_id === id);
    const hasPoints = partnerPoints.length > 0;
    
    try {
      // 1. Se houver pontos, exclui todos primeiro (Cascade Delete)
      if (hasPoints) {
        const deletePromises = partnerPoints.map(p => deleteDoc(doc(db, 'points', p.id)));
        await Promise.all(deletePromises);
      }

      // 2. Exclui o parceiro
      await deleteDoc(doc(db, 'partners', id));
      
      setToast({ 
        message: hasPoints 
          ? `Sucesso! Parceiro e ${partnerPoints.length} pontos removidos.` 
          : 'Parceiro removido com sucesso!', 
        type: 'success' 
      });
    } catch (error: any) {
      console.error("Erro detalhado ao excluir:", error);
      if (error.code === 'permission-denied') {
        setToast({ message: 'Erro: Permissão negada no Firebase. Verifique as "Rules" no console.', type: 'error' });
      } else {
        setToast({ message: 'Erro ao excluir. Verifique sua conexão.', type: 'error' });
      }
    }
  };

  const handleDeletePoint = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir permanentemente este ponto?')) return;
    try {
      await deleteDoc(doc(db, 'points', id));
      setToast({ message: 'Ponto removido com sucesso!', type: 'success' });
    } catch (error: any) {
      console.error("Erro ao excluir ponto:", error);
      setToast({ message: 'Erro ao excluir ponto. Verifique as permissões.', type: 'error' });
    }
  };

  const handleCancelPoint = async (id: string) => {
    if (!confirm('Deseja realmente cancelar este contrato/ponto?')) return;
    try {
      await updateDoc(doc(db, 'points', id), { status: 'cancelled' });
      setToast({ message: 'Contrato cancelado!', type: 'success' });
      setPointFilter('cancelled');
    } catch (error) {
      setToast({ message: 'Erro ao cancelar ponto.', type: 'error' });
    }
  };

  const handleCancelPartner = async (id: string) => {
    if (!confirm('Deseja realmente cancelar este parceiro?')) return;
    try {
      await updateDoc(doc(db, 'partners', id), { status: 'cancelled' });
      setToast({ message: 'Parceiro cancelado!', type: 'success' });
      setPartnerFilter('cancelled');
    } catch (error) {
      setToast({ message: 'Erro ao cancelar parceiro.', type: 'error' });
    }
  };

  const handleReactivatePartner = async (id: string) => {
    try {
      await updateDoc(doc(db, 'partners', id), { status: 'active' });
      setToast({ message: 'Parceiro reativado!', type: 'success' });
      setPartnerFilter('active');
    } catch (error) {
      setToast({ message: 'Erro ao reativar parceiro.', type: 'error' });
    }
  };

  const handleReactivatePoint = async (id: string) => {
    try {
      await updateDoc(doc(db, 'points', id), { status: 'pending' });
      setToast({ message: 'Contrato reativado!', type: 'success' });
      setPointFilter('active');
    } catch (error) {
      setToast({ message: 'Erro ao reativar ponto.', type: 'error' });
    }
  };

  const handleApplyReduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReductionModal) return;
    try {
      const newCost = showReductionModal.currentCost - reductionValue;
      await updateDoc(doc(db, 'points', showReductionModal.id), { cost: newCost });
      setToast({ message: 'Redução aplicada com sucesso!', type: 'success' });
      setShowReductionModal(null);
      setReductionValue(0);
    } catch (error) {
      setToast({ message: 'Erro ao aplicar redução.', type: 'error' });
    }
  };

  const filteredPartners = useMemo(() => {
    return partners
      .filter(p => partnerFilter === 'active' ? p.status !== 'cancelled' : p.status === 'cancelled')
      .filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.cities || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.contact?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [partners, partnerFilter, searchTerm]);

  const filteredPoints = useMemo(() => {
    let result = points
      .filter(p => pointFilter === 'active' ? p.status !== 'cancelled' : p.status === 'cancelled');

    if (dateRange.start) {
      result = result.filter(p => {
        const date = p.created_at?.toDate ? p.created_at.toDate() : new Date();
        return date >= new Date(dateRange.start);
      });
    }
    if (dateRange.end) {
      result = result.filter(p => {
        const date = p.created_at?.toDate ? p.created_at.toDate() : new Date();
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        return date <= endDate;
      });
    }

    return result.filter(p => 
      p.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.partner_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [points, pointFilter, searchTerm, dateRange]);

  const filteredFinancePoints = useMemo(() => {
    return filteredPoints.filter(p => p.status === 'completed');
  }, [filteredPoints]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899'];

  const exportToCSV = () => {
    const headers = ['Cliente', 'Endereco', 'Cidade', 'Estado', 'Parceiro', 'Custo', 'Status'];
    const rows = filteredPoints.map(p => [
      p.customer_name,
      p.address,
      p.city,
      p.state,
      p.partner_name,
      p.cost,
      p.status
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_pontos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
      <div className="relative">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Network size={24} className="text-indigo-500" />
        </div>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Side - Visual & Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 relative items-center justify-center p-20 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 opacity-90"></div>
          
          <div className="relative z-10 text-white max-w-lg">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mb-10 border border-white/20 shadow-2xl">
                <Network size={56} className="text-white" />
              </div>
              <h1 className="text-6xl font-black tracking-tighter mb-6 leading-none">
                SINTESE <br />
                <span className="text-indigo-200">CORE</span>
              </h1>
              <p className="text-2xl font-medium text-indigo-100/80 leading-relaxed mb-10">
                Simplificando a gestão dos seus parceiros e orquestrando sua inteligência de rede.
              </p>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <p className="text-4xl font-black">100%</p>
                  <p className="text-sm font-bold uppercase tracking-widest text-indigo-200/60">Visibilidade</p>
                </div>
                <div className="space-y-2">
                  <p className="text-4xl font-black">Real-time</p>
                  <p className="text-sm font-bold uppercase tracking-widest text-indigo-200/60">Monitoramento</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"></div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-950 relative">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md relative z-10"
          >
            <div className="lg:hidden flex flex-col items-center mb-12">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl mb-4">
                <Network size={32} />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Sintese <span className="text-indigo-500">Core</span></h1>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl">
              <div className="mb-10">
                <h2 className="text-2xl font-black text-white mb-2">Entrar na sua conta</h2>
                <p className="text-slate-500 text-sm font-medium">Acesse o painel administrativo</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2 ml-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">E-mail Corporativo</label>
                    <User size={14} className="text-slate-600" />
                  </div>
                  <input 
                    type="email"
                    required
                    className="w-full px-6 py-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                    placeholder="admin@sintese.com"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2 ml-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha de Acesso</label>
                    <Lock size={14} className="text-slate-600" />
                  </div>
                  <input 
                    type="password"
                    required
                    className="w-full px-6 py-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                  />
                </div>
                
                {loginError && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-rose-400 text-xs font-bold bg-rose-400/10 p-4 rounded-2xl border border-rose-400/20 flex items-center gap-3"
                  >
                    <AlertCircle size={16} />
                    {loginError}
                  </motion.p>
                )}

                <button 
                  type="submit"
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/20 active:scale-[0.98] mt-4"
                >
                  Acessar Painel
                </button>
              </form>

              <div className="mt-10 pt-8 border-t border-slate-800/50 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-slate-600">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Conexão Segura via Firebase</span>
                </div>
                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                  &copy; {new Date().getFullYear()} Todos os direitos reservado Miqueias Dev
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30 relative">
      {/* Global Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Network size={24} />
          </div>
          <h1 className="text-lg font-black tracking-tighter text-white uppercase">Sintese <span className="text-indigo-500">Core</span></h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-slate-950/80 backdrop-blur-2xl border-r border-white/5 p-8 flex flex-col z-[70] transition-transform duration-500 lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: -20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -20, x: '-50%' }}
              className={cn(
                "fixed top-8 left-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm backdrop-blur-md border w-[90%] max-w-sm",
                toast.type === 'success' ? "bg-emerald-500/90 text-white border-emerald-400/20" : "bg-rose-500/90 text-white border-rose-400/20"
              )}
            >
              {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-4 mb-12 px-2 relative">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 rotate-3 border border-white/10 relative z-10">
            <Network size={28} />
          </div>
          <div className="relative z-10">
            <h1 className="text-xl font-black tracking-tighter text-white uppercase leading-none">Sintese <span className="text-indigo-500">Core</span></h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Inteligência de Rede</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} 
          />
          <SidebarItem 
            icon={Globe} 
            label="Parceiros" 
            active={activeTab === 'partners'} 
            onClick={() => { setActiveTab('partners'); setIsSidebarOpen(false); }} 
          />
          <SidebarItem 
            icon={Layers} 
            label="Pontos / Clientes" 
            active={activeTab === 'points'} 
            onClick={() => { setActiveTab('points'); setIsSidebarOpen(false); }} 
          />
          <SidebarItem 
            icon={BarChart3} 
            label="Relatórios" 
            active={activeTab === 'reports'} 
            onClick={() => { setActiveTab('reports'); setIsSidebarOpen(false); }} 
          />
          <SidebarItem 
            icon={Wallet} 
            label="Financeiro" 
            active={activeTab === 'finance'} 
            onClick={() => { setActiveTab('finance'); setIsSidebarOpen(false); }} 
          />
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-800/50 space-y-4">
          <div className="px-4 py-3 bg-slate-800/30 rounded-2xl border border-slate-800/50 flex items-center gap-3">
            <div className="relative">
              <Activity size={16} className="text-emerald-500" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status do Sistema</p>
              <p className="text-[10px] font-bold text-emerald-500 uppercase">Operacional</p>
            </div>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex items-center justify-between group">
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Operador</p>
              <p className="text-sm font-bold text-white truncate">{user?.email?.split('@')[0]}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-10 relative">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>

        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
              <Activity size={12} className="animate-pulse" />
              <span>Monitoramento de Rede Ativo</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-white capitalize tracking-tighter">
              {activeTab === 'reports' ? 'Relatórios de Rede' : 
               activeTab === 'finance' ? 'Fluxo Financeiro' : 
               activeTab === 'dashboard' ? 'Painel de Controle' : 
               activeTab === 'partners' ? 'Gestão de Parceiros' :
               activeTab === 'points' ? 'Pontos & Clientes' : activeTab}
            </h2>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 border border-slate-800 rounded-lg">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dados em Tempo Real</span>
            </div>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mr-1">Última Sinc: {new Date().toLocaleTimeString()}</p>
          </div>

            <div className="flex flex-wrap gap-4 w-full md:w-auto">
              {(dateRange.start || dateRange.end) && (
                <button 
                  onClick={() => setDateRange({ start: '', end: '' })}
                  className="px-4 py-2 text-xs font-black text-rose-400 hover:text-rose-300 transition-colors uppercase tracking-widest border border-rose-400/20 rounded-xl bg-rose-400/5"
                >
                  Limpar Datas
                </button>
              )}
              {activeTab !== 'dashboard' && activeTab !== 'reports' && (
              <>
                <div className="relative group flex-1 md:flex-none">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input 
                    type="text"
                    placeholder="Pesquisar..."
                    className="pl-12 pr-6 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64 lg:w-80 transition-all text-sm placeholder:text-slate-600"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => activeTab === 'partners' ? setShowPartnerModal(true) : setShowPointModal(true)}
                  className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/20 active:scale-95 flex-1 md:flex-none"
                >
                  <Plus size={20} />
                  <span className="hidden sm:inline">Novo {activeTab === 'partners' ? 'Parceiro' : 'Ponto'}</span>
                  <span className="sm:hidden">Novo</span>
                </button>
                {activeTab === 'points' && (
                  <button 
                    onClick={exportToCSV}
                    className="flex items-center justify-center gap-2 bg-slate-800 text-slate-200 px-6 py-3 rounded-2xl font-bold hover:bg-slate-700 transition-all border border-slate-700 flex-1 md:flex-none"
                  >
                    <ArrowDownCircle size={20} className="rotate-180" />
                    <span className="hidden sm:inline">Exportar CSV</span>
                  </button>
                )}
              </>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10 relative z-10"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
                <StatCard 
                  label="Parceiros" 
                  value={stats.totalPartners} 
                  icon={Globe} 
                  trend="+4%" 
                  color="bg-indigo-500" 
                />
                <StatCard 
                  label="Terminais Ativos" 
                  value={stats.totalPoints} 
                  icon={Layers} 
                  trend="+18%" 
                  color="bg-emerald-500" 
                />
                <StatCard 
                  label="Custo Operacional" 
                  value={`R$ ${stats.totalCost.toLocaleString('pt-BR')}`} 
                  icon={DollarSign} 
                  trend="-2.4%" 
                  color="bg-amber-500" 
                />
                <StatCard 
                  label="Liquidação Pendente" 
                  value={`R$ ${points.filter(p => p.status === 'completed' && p.payment_status !== 'paid').reduce((acc, curr) => acc + curr.cost, 0).toLocaleString('pt-BR')}`} 
                  icon={Wallet} 
                  color="bg-rose-500" 
                />
                <StatCard 
                  label="SLA Violado" 
                  value={points.filter(p => p.sla_status === 'breached').length} 
                  icon={AlertTriangle} 
                  color="bg-rose-600" 
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                <NetworkTopology />
                <BrazilMap />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                <div className="bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden transition-all duration-500 hover:border-white/20">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                      <MapIcon size={20} />
                    </div>
                    Distribuição Regional de Nós
                  </h3>
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.pointsByState}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                        <XAxis dataKey="state" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                        <Tooltip 
                          cursor={{ fill: '#1e293b', opacity: 0.4 }}
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden transition-all duration-500 hover:border-white/20">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                      <Globe size={20} />
                    </div>
                    Alocação de Recursos por Parceiro
                  </h3>
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={partners.map(p => ({
                        name: p.name.split(' ')[0],
                        valor: points.filter(pt => pt.partner_id === p.id && pt.status !== 'cancelled').reduce((acc, curr) => acc + curr.cost, 0)
                      })).sort((a, b) => b.valor - a.valor).slice(0, 6)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                          itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="valor" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Partner Ranking & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden transition-all duration-500 hover:border-white/20">
                  <div className="p-6 sm:p-8 border-b border-white/10">
                    <h3 className="text-xl font-bold text-white">Top Parceiros</h3>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Por volume de pontos</p>
                  </div>
                  <div className="p-5 sm:p-6 space-y-6">
                    {partners
                      .map(p => ({
                        ...p,
                        pointCount: points.filter(pt => pt.partner_id === p.id && pt.status !== 'cancelled').length
                      }))
                      .sort((a, b) => b.pointCount - a.pointCount)
                      .slice(0, 5)
                      .map((p, idx) => (
                        <div key={p.id} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-black text-slate-600 w-4 flex-shrink-0">{idx + 1}</span>
                            <PartnerLogo name={p.name} url={p.logo_url} size="sm" />
                            <span className="text-sm font-bold text-slate-200 truncate">{p.name}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="hidden xs:block h-1.5 w-12 sm:w-16 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500" 
                                style={{ width: `${(p.pointCount / (stats.totalPoints || 1)) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-black text-white">{p.pointCount}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden transition-all duration-500 hover:border-white/20">
                  <div className="p-6 sm:p-8 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Atividade Recente</h3>
                    <button onClick={() => setActiveTab('points')} className="text-indigo-400 text-sm font-bold hover:text-indigo-300 transition-colors">Ver todos</button>
                  </div>
                  <div className="divide-y divide-white/5">
                    {points.slice(0, 5).map((point) => (
                      <div key={point.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-white/5 transition-all group gap-3">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 shadow-inner",
                            point.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 
                            point.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 
                            point.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'
                          )}>
                            {point.status === 'completed' ? <CheckCircle2 size={20} /> : 
                             point.status === 'pending' ? <Clock size={20} /> : 
                             point.status === 'cancelled' ? <XCircle size={20} /> : <AlertCircle size={20} />}
                          </div>
                          <div>
                            <p className="font-bold text-white text-base">{point.customer_name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <PartnerLogo name={partners.find(p => p.id === point.partner_id)?.name || ''} url={partners.find(p => p.id === point.partner_id)?.logo_url} size="sm" />
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{point.partner_name}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-left sm:text-right pl-14 sm:pl-0">
                          <p className="font-black text-white">R$ {point.cost.toLocaleString('pt-BR')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div 
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10 relative z-10"
            >
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-[2rem] border border-slate-800 p-6 sm:p-8 shadow-xl">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">Filtros de Relatório</h3>
                    <p className="text-slate-500 text-sm mt-1">Refine os dados por período para análise precisa.</p>
                  </div>
                  <div className="flex flex-wrap items-end gap-4 w-full lg:w-auto">
                    <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Início</label>
                      <input 
                        type="date" 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        value={dateRange.start}
                        onChange={e => setDateRange({...dateRange, start: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fim</label>
                      <input 
                        type="date" 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        value={dateRange.end}
                        onChange={e => setDateRange({...dateRange, end: e.target.value})}
                      />
                    </div>
                    <button 
                      onClick={() => setDateRange({ start: '', end: '' })}
                      className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors h-[38px]"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-900/50 backdrop-blur-sm p-8 rounded-[2rem] border border-slate-800 shadow-xl">
                  <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                      <Calendar size={20} />
                    </div>
                    Crescimento de Pontos
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyStats}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-sm p-8 rounded-[2rem] border border-slate-800 shadow-xl">
                  <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                      <DollarSign size={20} />
                    </div>
                    Evolução de Custos (R$)
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="total_cost" stroke="#f59e0b" strokeWidth={4} dot={{ r: 6, fill: '#f59e0b', strokeWidth: 2, stroke: '#0f172a' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-sm rounded-[2rem] border border-slate-800 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-800">
                  <h3 className="text-xl font-bold text-white">Análise Financeira por Parceiro</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Parceiro</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Qtd Pontos</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Custo Acumulado</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Participação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {partners
                        .map(p => {
                          const pPoints = points.filter(pt => pt.partner_id === p.id && pt.status !== 'cancelled');
                          const pCost = pPoints.reduce((acc, curr) => acc + curr.cost, 0);
                          return { name: p.name, count: pPoints.length, cost: pCost };
                        })
                        .sort((a, b) => b.cost - a.cost)
                        .map((item) => {
                          const partnerObj = partners.find(p => p.name === item.name);
                          return (
                            <tr key={item.name} className="hover:bg-slate-800/30 transition-colors">
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 text-[10px] font-black overflow-hidden">
                                    {partnerObj?.logo_url ? (
                                      <img src={partnerObj.logo_url} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      item.name.charAt(0)
                                    )}
                                  </div>
                                  <span className="font-bold text-white">{item.name}</span>
                                </div>
                              </td>
                              <td className="px-8 py-6 text-slate-400 font-medium">{item.count}</td>
                            <td className="px-8 py-6 font-black text-emerald-400">R$ {item.cost.toLocaleString('pt-BR')}</td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-emerald-500" 
                                    style={{ width: `${(item.cost / (stats.totalCost || 1)) * 100}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-black text-slate-500">
                                  {((item.cost / (stats.totalCost || 1)) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-sm rounded-[2rem] border border-slate-800 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-800">
                  <h3 className="text-xl font-bold text-white">Consolidado Mensal</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Mês Referência</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Novos Pontos</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Custo Total</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Ticket Médio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {monthlyStats.map((item) => (
                        <tr key={item.month} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-8 py-6 font-bold text-white">{item.month}</td>
                          <td className="px-8 py-6 text-slate-400 font-medium">{item.count}</td>
                          <td className="px-8 py-6 font-black text-white">R$ {item.total_cost.toLocaleString('pt-BR')}</td>
                          <td className="px-8 py-6 text-indigo-400 font-bold">R$ {(item.total_cost / (item.count || 1)).toLocaleString('pt-BR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'finance' && (
            <motion.div 
              key="finance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10 relative z-10"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group transition-all duration-500">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 relative z-10">Total Pendente</p>
                  <p className="text-3xl font-black text-amber-400 relative z-10">
                    R$ {points.filter(p => p.status === 'completed' && p.payment_status !== 'paid').reduce((acc, curr) => acc + curr.cost, 0).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group transition-all duration-500">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 relative z-10">Total Pago</p>
                  <p className="text-3xl font-black text-emerald-400 relative z-10">
                    R$ {points.filter(p => p.payment_status === 'paid').reduce((acc, curr) => acc + curr.cost, 0).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group transition-all duration-500">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-slate-500/10 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 relative z-10">Aguardando Conclusão</p>
                  <p className="text-3xl font-black text-slate-400 relative z-10">
                    R$ {points.filter(p => p.status === 'pending').reduce((acc, curr) => acc + curr.cost, 0).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-sm rounded-[2rem] border border-slate-800 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Conciliação de Pagamentos</h3>
                    <p className="text-sm text-slate-500 mt-1">Gerencie o status financeiro de cada entrega concluída.</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Entrega / Cliente</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Parceiro</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Valor</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status Pagto</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredFinancePoints.length > 0 ? (
                        filteredFinancePoints.map((point) => (
                          <tr key={point.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-8 py-6">
                              <p className="font-bold text-white">{point.customer_name}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{point.city}, {point.state}</p>
                            </td>
                            <td className="px-8 py-6 text-slate-400 font-medium">{point.partner_name}</td>
                            <td className="px-8 py-6 font-black text-white">R$ {point.cost.toLocaleString('pt-BR')}</td>
                            <td className="px-8 py-6">
                              <span className={cn(
                                "px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest",
                                point.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                              )}>
                                {point.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <button 
                                onClick={() => handleTogglePayment(point.id, point.payment_status || 'pending')}
                                className={cn(
                                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                  point.payment_status === 'paid' 
                                    ? "bg-slate-800 text-slate-400 hover:bg-slate-700" 
                                    : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20"
                                )}
                              >
                                {point.payment_status === 'paid' ? 'Estornar' : 'Marcar Pago'}
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-8 py-20 text-center text-slate-500 font-bold italic">
                            Nenhum registro financeiro encontrado para os filtros aplicados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'partners' && (
            <motion.div 
              key="partners"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 relative z-10"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-3 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 w-fit">
                  <button 
                    onClick={() => setPartnerFilter('active')}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                      partnerFilter === 'active' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    Ativos
                  </button>
                  <button 
                    onClick={() => setPartnerFilter('cancelled')}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                      partnerFilter === 'cancelled' ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    Cancelados
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImportCSV}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700"
                  >
                    <Upload size={16} />
                    Importar CSV
                  </button>
                  <button 
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700"
                  >
                    <Download size={16} />
                    Modelo
                  </button>
                </div>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-[2rem] border border-slate-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800/50 border-b border-slate-800">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Empresa</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Contato</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Localização</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Incidentes SLA</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredPartners.length > 0 ? (
                      filteredPartners.map((partner) => (
                        <tr key={partner.id} className={cn("hover:bg-slate-800/30 transition-all", partner.status === 'cancelled' && "opacity-50")}>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <PartnerLogo name={partner.name} url={partner.logo_url} />
                              <span className="font-bold text-white text-lg">{partner.name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-slate-400 font-medium">{partner.contact}</td>
                          <td className="px-8 py-6 text-slate-400 font-medium">
                            <div className="flex flex-col">
                              <span className="text-white font-bold">{partner.state}</span>
                              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider truncate max-w-[200px]" title={partner.cities}>
                                {partner.cities}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "px-3 py-1 rounded-lg text-xs font-black",
                                (partner.sla_incidents || 0) > 0 ? "bg-rose-500/10 text-rose-400" : "bg-slate-800 text-slate-500"
                              )}>
                                {partner.sla_incidents || 0}
                              </div>
                              <button 
                                onClick={() => handleReportIncident(partner.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
                                title="Reportar Incidente SLA"
                              >
                                <AlertTriangle size={14} />
                              </button>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest",
                              partner.status === 'active' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                            )}>
                              {partner.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-3">
                              <button 
                                onClick={() => setShowEditPartnerModal(partner)}
                                className="p-2.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-xl transition-all"
                                title="Editar Parceiro"
                              >
                                <MoreVertical size={20} />
                              </button>
                              {partner.status === 'active' ? (
                                <button 
                                  onClick={() => handleCancelPartner(partner.id)}
                                  className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all"
                                  title="Cancelar Parceiro"
                                >
                                  <XCircle size={20} />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleReactivatePartner(partner.id)}
                                  className="p-2.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all"
                                  title="Reativar Parceiro"
                                >
                                  <CheckCircle2 size={20} />
                                </button>
                              )}
                              <button 
                                onClick={() => {
                                  const pPoints = points.filter(pt => pt.partner_id === partner.id);
                                  const msg = pPoints.length > 0 
                                    ? `Este parceiro possui ${pPoints.length} pontos. Excluir o parceiro apagará TODOS os pontos vinculados. Confirma?`
                                    : 'Tem certeza que deseja excluir este parceiro?';
                                  
                                  if (window.confirm(msg)) {
                                    deletePartner(partner.id);
                                  }
                                }}
                                className="p-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-600/10 rounded-xl transition-all"
                                title="Excluir Permanentemente"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center text-slate-500 font-bold italic">
                          Nenhum parceiro encontrado para os filtros aplicados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

          {activeTab === 'points' && (
            <motion.div 
              key="points"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 relative z-10"
            >
              <div className="flex gap-3 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 w-fit">
                <button 
                  onClick={() => setPointFilter('active')}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    pointFilter === 'active' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  Ativos
                </button>
                <button 
                  onClick={() => setPointFilter('cancelled')}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    pointFilter === 'cancelled' ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  Cancelados
                </button>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-[2rem] border border-slate-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800/50 border-b border-slate-800">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Cliente Final</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Endereço</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Parceiro</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Custo</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">SLA</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredPoints.length > 0 ? (
                      filteredPoints.map((point) => (
                        <tr key={point.id} className={cn("hover:bg-slate-800/30 transition-all", point.status === 'cancelled' && "opacity-50")}>
                          <td className="px-8 py-6 font-bold text-white text-lg">{point.customer_name}</td>
                          <td className="px-8 py-6">
                            <p className="text-sm text-white font-medium">{point.address}</p>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{point.city}, {point.state}</p>
                          </td>
                          <td className="px-8 py-6 text-indigo-400 font-bold">{point.partner_name || 'N/A'}</td>
                          <td className="px-8 py-6 font-black text-white text-lg">R$ {point.cost.toLocaleString('pt-BR')}</td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-2 h-2 rounded-full animate-pulse",
                                point.sla_status === 'within' ? 'bg-emerald-500' : 
                                point.sla_status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
                              )} />
                              <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest",
                                point.sla_status === 'within' ? 'text-emerald-400' : 
                                point.sla_status === 'warning' ? 'text-amber-400' : 'text-rose-400'
                              )}>
                                {point.sla_status === 'within' ? 'Dentro' : 
                                 point.sla_status === 'warning' ? 'Alerta' : 'Violado'}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest",
                              point.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 
                              point.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 
                              point.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'
                            )}>
                              {point.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-2">
                              {point.status !== 'cancelled' ? (
                                <>
                                  <button 
                                    onClick={() => setShowReductionModal({id: point.id, currentCost: point.cost})}
                                    className="p-2.5 text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-xl transition-all"
                                    title="Reduzir Valor"
                                  >
                                    <ArrowDownCircle size={20} />
                                  </button>
                                  <button 
                                    onClick={() => handleCancelPoint(point.id)}
                                    className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all"
                                    title="Cancelar Contrato"
                                  >
                                    <XCircle size={20} />
                                  </button>
                                </>
                              ) : (
                                <button 
                                  onClick={() => handleReactivatePoint(point.id)}
                                  className="p-2.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all"
                                  title="Reativar Contrato"
                                >
                                  <CheckCircle2 size={20} />
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeletePoint(point.id)}
                                className="p-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-600/10 rounded-xl transition-all"
                                title="Excluir Permanentemente"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-8 py-20 text-center text-slate-500 font-bold italic">
                          Nenhum ponto de entrega encontrado para os filtros aplicados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
        <footer className="mt-20 py-10 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center text-indigo-400">
              <Network size={16} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest">Sintese Core | Inteligência Last-Mile</p>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">
            © {new Date().getFullYear()} Todos os direitos reservado Miqueias Dev
          </p>
        </footer>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {(showPartnerModal || showEditPartnerModal || showPointModal || showReductionModal) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-10 w-full max-w-lg shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header Glow */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>

              {showPartnerModal && (
                <>
                  <h3 className="text-2xl font-black text-white mb-8">Cadastrar Novo Parceiro</h3>
                  <form onSubmit={handleAddPartner} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Nome da Empresa</label>
                      <input 
                        required
                        className="w-full px-5 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={newPartner.name}
                        onChange={e => setNewPartner({...newPartner, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Contato Direto</label>
                      <input 
                        required
                        className="w-full px-5 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={newPartner.contact}
                        onChange={e => setNewPartner({...newPartner, contact: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">UF</label>
                        <input 
                          required
                          maxLength={2}
                          className="w-full px-5 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none uppercase transition-all"
                          value={newPartner.state}
                          onChange={e => setNewPartner({...newPartner, state: e.target.value.toUpperCase()})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Cidades de Atuação</label>
                        <input 
                          required
                          placeholder="Ex: São Paulo, Campinas, Santos"
                          className="w-full px-5 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          value={newPartner.cities}
                          onChange={e => setNewPartner({...newPartner, cities: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">URL da Logo (Opcional)</label>
                      <input 
                        className="w-full px-5 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="https://exemplo.com/logo.png"
                        value={newPartner.logo_url}
                        onChange={e => setNewPartner({...newPartner, logo_url: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-4 pt-6">
                      <button 
                        type="button"
                        onClick={() => setShowPartnerModal(false)}
                        className="flex-1 px-6 py-4 rounded-2xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-800 transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-500 shadow-xl shadow-indigo-900/20 transition-all"
                      >
                        Salvar Parceiro
                      </button>
                    </div>
                  </form>
                </>
              )}

              {showEditPartnerModal && (
                <>
                  <h3 className="text-2xl font-black text-white mb-8">Editar Parceiro</h3>
                  <form onSubmit={handleUpdatePartner} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Nome da Empresa</label>
                      <input 
                        required
                        className="w-full px-5 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={showEditPartnerModal.name}
                        onChange={e => setShowEditPartnerModal({...showEditPartnerModal, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Contato Direto</label>
                      <input 
                        required
                        className="w-full px-5 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={showEditPartnerModal.contact}
                        onChange={e => setShowEditPartnerModal({...showEditPartnerModal, contact: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">UF</label>
                        <input 
                          required
                          maxLength={2}
                          className="w-full px-5 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none uppercase transition-all"
                          value={showEditPartnerModal.state}
                          onChange={e => setShowEditPartnerModal({...showEditPartnerModal, state: e.target.value.toUpperCase()})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Cidades de Atuação</label>
                        <input 
                          required
                          placeholder="Ex: São Paulo, Campinas, Santos"
                          className="w-full px-5 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          value={showEditPartnerModal.cities}
                          onChange={e => setShowEditPartnerModal({...showEditPartnerModal, cities: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">URL da Logo (Opcional)</label>
                      <input 
                        className="w-full px-5 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="https://exemplo.com/logo.png"
                        value={showEditPartnerModal.logo_url || ''}
                        onChange={e => setShowEditPartnerModal({...showEditPartnerModal, logo_url: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-4 pt-6">
                      <button 
                        type="button"
                        onClick={() => setShowEditPartnerModal(null)}
                        className="flex-1 px-6 py-4 rounded-2xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-800 transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-500 shadow-xl shadow-indigo-900/20 transition-all"
                      >
                        Atualizar Dados
                      </button>
                    </div>
                  </form>
                </>
              )}

              {showPointModal && (
                <>
                  <h3 className="text-2xl font-black text-white mb-8">Novo Ponto Operacional</h3>
                  <form onSubmit={handleAddPoint} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Nome do Cliente Final</label>
                      <input 
                        required
                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={newPoint.customer_name}
                        onChange={e => setNewPoint({...newPoint, customer_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Endereço Completo</label>
                      <input 
                        required
                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={newPoint.address}
                        onChange={e => setNewPoint({...newPoint, address: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">UF</label>
                        <input 
                          required
                          maxLength={2}
                          className="w-full px-5 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none uppercase transition-all"
                          value={newPoint.state}
                          onChange={e => setNewPoint({...newPoint, state: e.target.value.toUpperCase()})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Cidade</label>
                        <input 
                          required
                          className="w-full px-5 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          value={newPoint.city}
                          onChange={e => setNewPoint({...newPoint, city: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Parceiro Responsável</label>
                      <select 
                        required
                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                        value={newPoint.partner_id}
                        onChange={e => setNewPoint({...newPoint, partner_id: e.target.value})}
                      >
                        <option value="">Selecione um parceiro</option>
                        {partners.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.state})</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Equipamento (ONT/Router)</label>
                        <input 
                          className="w-full px-5 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          placeholder="Ex: Huawei HG8245H"
                          value={newPoint.equipment || ''}
                          onChange={e => setNewPoint({...newPoint, equipment: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Banda Contratada</label>
                        <input 
                          className="w-full px-5 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          placeholder="Ex: 500Mbps"
                          value={newPoint.bandwidth || ''}
                          onChange={e => setNewPoint({...newPoint, bandwidth: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Custo da Operação (R$)</label>
                        <input 
                          required
                          type="number"
                          step="0.01"
                          className="w-full px-5 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          value={newPoint.cost}
                          onChange={e => setNewPoint({...newPoint, cost: Number(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Status SLA</label>
                        <select 
                          className="w-full px-5 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                          value={newPoint.sla_status}
                          onChange={e => setNewPoint({...newPoint, sla_status: e.target.value as any})}
                        >
                          <option value="within">Dentro do SLA</option>
                          <option value="warning">Alerta de Prazo</option>
                          <option value="breached">SLA Violado</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button 
                        type="button"
                        onClick={() => setShowPointModal(false)}
                        className="flex-1 px-6 py-4 rounded-2xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-800 transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-500 shadow-xl shadow-indigo-900/20 transition-all"
                      >
                        Salvar Ponto
                      </button>
                    </div>
                  </form>
                </>
              )}

              {showReductionModal && (
                <>
                  <h3 className="text-2xl font-black text-white mb-2">Redução de Valor</h3>
                  <p className="text-slate-500 text-sm mb-8 font-medium uppercase tracking-widest">Custo Atual: <span className="text-white font-black">R$ {showReductionModal.currentCost.toLocaleString('pt-BR')}</span></p>
                  <form onSubmit={handleApplyReduction} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Valor do Desconto (R$)</label>
                      <input 
                        required
                        type="number"
                        step="0.01"
                        autoFocus
                        className="w-full px-5 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                        value={reductionValue}
                        onChange={e => setReductionValue(Number(e.target.value))}
                      />
                      <p className="text-[10px] font-black text-indigo-400 mt-3 uppercase tracking-widest">Novo custo operacional: R$ {(showReductionModal.currentCost - reductionValue).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="flex gap-4 pt-6">
                      <button 
                        type="button"
                        onClick={() => setShowReductionModal(null)}
                        className="flex-1 px-6 py-4 rounded-2xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-800 transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 px-6 py-4 rounded-2xl bg-amber-500 text-white font-black hover:bg-amber-400 shadow-xl shadow-amber-900/20 transition-all"
                      >
                        Aplicar Redução
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
