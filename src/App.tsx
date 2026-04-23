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
  Lock,
  Maximize2,
  Minimize2,
  Edit2
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
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarComponent } from "./components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { Switch } from "./components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Dialog, DialogContent } from "./components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "./components/ui/select";

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

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
  writeBatch,
  getDocFromServer,
  serverTimestamp
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

// --- Types ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
  customer_id?: string;
  customer_name: string;
  address: string;
  city: string;
  state: string;
  partner_id: string;
  partner_name?: string;
  revenue: number;
  expense: number;
  status: 'pending' | 'completed' | 'cancelled';
  payment_status?: 'pending' | 'paid';
  validation_status?: 'pending' | 'approved' | 'rejected';
  sla_status?: 'within' | 'warning' | 'breached';
  equipment?: string;
  bandwidth?: string;
  lat?: number;
  lng?: number;
  created_at: any;
}

interface Customer {
  id: string;
  name: string;
  cnpj?: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  color?: string;
  created_at: any;
}

interface MonthlyStat {
  month: string;
  count: number;
  total_revenue: number;
  total_expense: number;
  profit: number;
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
      <div className={cn("rounded-xl overflow-hidden border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center shrink-0 shadow-sm", sizes[size])}>
        <img src={url} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-neutral-border dark:border-neutral-800 bg-neutral-bg dark:bg-neutral-900 flex flex-col items-center justify-center text-neutral-text font-black relative overflow-hidden group shrink-0 shadow-sm", sizes[size])}>
      <div className="absolute inset-0 bg-brand-accent/5 opacity-50" />
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="relative">
          <Network size={size === "sm" ? 14 : size === "md" ? 20 : 28} className="text-brand-accent/40" />
          <Activity size={size === "sm" ? 10 : size === "md" ? 14 : 20} className="absolute -bottom-1 -right-1 text-brand-accent animate-pulse" />
        </div>
      </div>
    </div>
  );
};

// --- CNL Mapping from Anatel Resolution 424/2005 ---
const CNL_MAPPING: Record<string, { city: string; state: string }> = {
  "PSX": { city: "Posse", state: "GO" },
  "CNL": { city: "Conselheiro Lafaiete", state: "MG" },
  "SPO": { city: "São Paulo", state: "SP" },
  "RJO": { city: "Rio de Janeiro", state: "RJ" },
  "SNE": { city: "Santo André", state: "SP" },
  "SBO": { city: "São Bernardo do Campo", state: "SP" },
  "SCN": { city: "São Caetano do Sul", state: "SP" },
  "BRE": { city: "Barueri", state: "SP" },
  "GRS": { city: "Guarulhos", state: "SP" },
  "OCO": { city: "Osasco", state: "SP" },
  "MIA": { city: "Marília", state: "SP" },
  "SJC": { city: "São José dos Campos", state: "SP" },
  "STS": { city: "Santos", state: "SP" },
  "CTA": { city: "Curitiba", state: "PR" },
  "PNG": { city: "Paranaguá", state: "PR" },
  "BRU": { city: "Bauru", state: "SP" },
  "CAS": { city: "Campinas", state: "SP" },
  "JAI": { city: "Jundiaí", state: "SP" },
  "PAE": { city: "Porto Alegre", state: "RS" },
  "VTA": { city: "Vitória", state: "ES" },
  "BSA": { city: "Brasília", state: "DF" },
  "ANS": { city: "Anápolis", state: "GO" },
  "GNA": { city: "Goiânia", state: "GO" },
  "CIM": { city: "Cachoeiro de Itapemirim", state: "ES" },
  "BHE": { city: "Belo Horizonte", state: "MG" },
  "UDI": { city: "Uberlândia", state: "MG" },
  "URA": { city: "Uberaba", state: "MG" },
  "RPO": { city: "Ribeirão Preto", state: "SP" },
};

const extractSigla = (text: string) => {
  // Matches patterns like -PSX- or -PSX inside strings like "UNE TRANSIT-PSX-053"
  const match = text.match(/-([A-Z]{3,4})-(\d+)?/) || text.match(/-([A-Z]{3,4})/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
};

// Component to handle map resizing and fit bounds
const MapResizer = ({ points, refreshTrigger }: { points: Point[], refreshTrigger?: any }) => {
  const map = useMap();
  
  useEffect(() => {
    // Force a resize after a short delay to allow the container to settle
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (points.length > 0) {
        const validPoints = points.filter(p => p.lat && p.lng);
        if (validPoints.length > 0) {
          const bounds = L.latLngBounds(validPoints.map(p => [p.lat!, p.lng!]));
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }, 350); // Increased delay to ensure modal transitions are complete
    return () => clearTimeout(timer);
  }, [map, points, refreshTrigger]);
  
  return null;
};

const MAP_COLORS = [
  { name: 'Azul', value: '#2563eb' },
  { name: 'Esmeralda', value: '#10b981' },
  { name: 'Âmbar', value: '#f59e0b' },
  { name: 'Rosa', value: '#f43f5e' },
  { name: 'Índigo', value: '#6366f1' },
  { name: 'Violeta', value: '#8b5cf6' },
  { name: 'Laranja', value: '#f97316' },
  { name: 'Ciano', value: '#06b6d4' },
  { name: 'Fúcsia', value: '#d946ef' },
];

const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

const MapComponent = ({ points, height = "400px", onExpand, onEditPoint, refreshTrigger, customers = [] }: { 
  points: Point[], 
  height?: string, 
  onExpand?: () => void, 
  onEditPoint?: (p: Point) => void, 
  refreshTrigger?: any,
  customers?: Customer[] 
}) => {
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const center: [number, number] = [-15.7801, -47.9292]; // Brasília center

  const streetsUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  const satelliteUrl = "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";

  return (
    <div style={{ height }} className={cn(
      "saas-card overflow-hidden relative z-0 group rounded-3xl",
      height === '100%' && "rounded-none shadow-none border-none saas-card-none"
    )}>
      <div className="absolute top-4 left-4 z-[1000] flex gap-2">
        <button 
          onClick={() => setMapStyle('streets')}
          className={cn(
            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg border",
            mapStyle === 'streets' 
              ? "bg-brand-accent text-white border-brand-accent/50" 
              : "bg-white dark:bg-neutral-900 text-neutral-muted border-neutral-border dark:border-neutral-800"
          )}
        >
          Ruas
        </button>
        <button 
          onClick={() => setMapStyle('satellite')}
          className={cn(
            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg border",
            mapStyle === 'satellite' 
              ? "bg-brand-accent text-white border-brand-accent/50" 
              : "bg-white dark:bg-neutral-900 text-neutral-muted border-neutral-border dark:border-neutral-800"
          )}
        >
          Satélite
        </button>
      </div>

      {onExpand && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          className="absolute top-4 right-4 z-[1000] p-3 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-border dark:border-neutral-800 text-neutral-muted hover:text-brand-accent transition-all hover:scale-110 active:scale-95"
          title="Expandir Mapa"
        >
          <Maximize2 size={20} />
        </button>
      )}

      <MapContainer center={center} zoom={4} scrollWheelZoom={true} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={mapStyle === 'streets' ? streetsUrl : satelliteUrl}
        />
        <MapResizer points={points} refreshTrigger={refreshTrigger || height} />
        {points.map((point) => {
          const customer = customers.find(c => c.id === point.customer_id);
          const iconColor = customer?.color || '#2563eb';
          const markerIcon = createCustomIcon(iconColor);

          return point.lat && point.lng ? (
            <Marker 
              key={point.id} 
              position={[point.lat, point.lng]}
              icon={markerIcon}
              eventHandlers={{
                click: () => {
                  if (onEditPoint) {
                    onEditPoint(point);
                  }
                },
              }}
            >
              <Popup className="custom-popup">
                <div className="p-3 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                      <MapPin size={16} />
                    </div>
                    <h4 className="font-black text-sm uppercase tracking-tight text-neutral-text dark:text-white">{point.customer_name}</h4>
                  </div>
                  
                  <div className="space-y-1.5 border-t border-neutral-border dark:border-white/5 pt-2">
                    <p className="text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Endereço:</p>
                    <p className="text-xs font-semibold leading-tight">{point.address}</p>
                    <p className="text-[10px] font-bold text-neutral-muted uppercase tracking-widest mt-2">Localização:</p>
                    <p className="text-xs font-semibold">{point.city}, {point.state}</p>
                    <p className="text-[11px] font-black text-brand-accent uppercase tracking-widest mt-3">Parceiro: {point.partner_name || 'Aguardando'}</p>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className={cn(
                      "px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest inline-block border",
                      point.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                      point.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    )}>
                      {point.status === 'completed' ? 'Concluído' : point.status === 'pending' ? 'Pendente' : 'Cancelado'}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ) : null
        })}
      </MapContainer>
    </div>
  );
};

const DatePicker = ({ value, onChange, label }: { value: string, onChange: (val: string) => void, label: string }) => {
  const date = value ? new Date(value) : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[10px] font-bold text-neutral-muted uppercase tracking-wider ml-1">{label}</Label>
      <Popover>
        <PopoverTrigger className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-border dark:border-neutral-800 text-sm font-medium transition-all hover:border-brand-accent/50",
          !value && "text-neutral-muted"
        )}>
          <Calendar size={16} className="text-brand-accent" />
          {value ? format(date!, "PPP", { locale: ptBR }) : "Selecionar data"}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl overflow-hidden" align="start">
          <CalendarComponent
            mode="single"
            selected={date}
            onSelect={(d) => d && onChange(d.toISOString())}
            initialFocus
            className="bg-white dark:bg-neutral-950"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

const BrazilMap = () => {
  return (
    <div className="saas-card p-8 h-[400px] relative overflow-hidden group">
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Globe size={120} className="text-neutral-muted" />
      </div>
      <h3 className="text-xl font-bold text-neutral-text mb-8 flex items-center gap-3 relative z-10">
        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600 border border-emerald-500/20">
          <MapIcon size={20} />
        </div>
        Cobertura de Rede Nacional
      </h3>
      <div className="relative h-full flex items-center justify-center">
        <svg viewBox="0 0 500 500" className="w-full h-full opacity-10 dark:opacity-20 text-neutral-muted fill-current">
          <path d="M250,50 L300,70 L350,100 L380,150 L400,200 L420,250 L400,300 L350,350 L300,400 L250,450 L200,400 L150,350 L100,300 L80,250 L100,200 L120,150 L150,100 L200,70 Z" />
          <circle cx="250" cy="150" r="4" className="fill-brand-accent animate-pulse" />
          <circle cx="350" cy="250" r="4" className="fill-brand-accent animate-pulse" />
          <circle cx="200" cy="350" r="4" className="fill-brand-accent animate-pulse" />
          <circle cx="150" cy="200" r="4" className="fill-brand-accent animate-pulse" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-4xl font-black text-neutral-text/5 uppercase tracking-[0.3em]">Brasil</p>
          <p className="text-[10px] font-black text-emerald-600/40 uppercase tracking-[0.2em] mt-2">Nós de Rede Ativos em 26 Estados</p>
        </div>
      </div>
    </div>
  );
};

const NetworkTopology = () => {
  return (
    <div className="saas-card p-8 h-[400px] relative overflow-hidden group">
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-brand-accent/5 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Network size={120} className="text-neutral-muted" />
      </div>
      <h3 className="text-xl font-bold text-neutral-text mb-8 flex items-center gap-3 relative z-10">
        <div className="p-2 bg-brand-accent/10 rounded-lg text-brand-accent border border-brand-accent/20">
          <Activity size={20} />
        </div>
        Topologia de Rede Ativa
      </h3>
      <div className="relative h-full flex items-center justify-center">
         <svg viewBox="0 0 800 400" className="w-full h-full opacity-20">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <g className="text-brand-accent/20">
              <line x1="400" y1="200" x2="150" y2="80" stroke="currentColor" strokeWidth="1" />
              <line x1="400" y1="200" x2="650" y2="120" stroke="currentColor" strokeWidth="1" />
              <line x1="400" y1="200" x2="250" y2="320" stroke="currentColor" strokeWidth="1" />
              <line x1="400" y1="200" x2="550" y2="280" stroke="currentColor" strokeWidth="1" />
              <line x1="150" y1="80" x2="250" y2="320" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4" />
              <line x1="650" y1="120" x2="550" y2="280" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4" />
            </g>
            
            <circle cx="400" cy="200" r="10" className="fill-brand-accent" filter="url(#glow)" />
            <circle cx="150" cy="80" r="5" className="fill-neutral-muted/40" />
            <circle cx="650" cy="120" r="5" className="fill-neutral-muted/40" />
            <circle cx="250" cy="320" r="5" className="fill-neutral-muted/40" />
            <circle cx="550" cy="280" r="5" className="fill-neutral-muted/40" />
            
            <circle cx="400" cy="200" r="20" className="stroke-brand-accent/20 fill-none animate-ping" />
         </svg>
         <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-5xl font-black text-neutral-text/5 uppercase tracking-[0.4em]">Sintese Core</p>
            <p className="text-[10px] font-black text-brand-accent/30 uppercase tracking-[0.3em] mt-4">Infraestrutura de Rede Nacional</p>
         </div>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center w-full gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
      active 
        ? "bg-white/40 backdrop-blur-md text-brand-accent border border-white/50 shadow-sm" 
        : "text-neutral-muted hover:bg-white/20 hover:text-neutral-text border border-transparent"
    )}
  >
    <div className="relative z-10 flex items-center gap-3">
      <Icon size={18} className={cn("transition-all duration-300", active ? "scale-110 text-brand-accent" : "group-hover:scale-110 group-hover:text-neutral-text")} />
      <span className="font-semibold text-xs tracking-tight">{label}</span>
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
      whileHover={{ y: -4 }}
      className="saas-card saas-card-hover p-6 relative overflow-hidden group liquid-glass"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 dark:from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={cn("p-3 rounded-xl bg-white/50 dark:bg-neutral-800/50 backdrop-blur-md border border-white/40 dark:border-neutral-700/40 text-brand-accent shadow-sm")}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className={cn(
            "text-[10px] font-bold px-2.5 py-1 rounded-full tracking-tight uppercase border",
            isPositive ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50" : 
            isNegative ? "text-rose-600 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/50" : 
            "text-neutral-muted bg-neutral-bg dark:bg-neutral-900 border-neutral-border dark:border-neutral-800"
          )}>
            {trend}
          </span>
        )}
      </div>
      <div className="relative z-10">
        <h3 className="text-neutral-muted text-[10px] font-bold uppercase tracking-wider mb-1">{label}</h3>
        <p className="text-2xl font-bold text-neutral-text tracking-tight">{value}</p>
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

  const [activeTab, setActiveTab] = useState<'dashboard' | 'partners' | 'points' | 'clients' | 'reports' | 'finance' | 'feasibility'>('dashboard');
  
  const [partners, setPartners] = useState<Partner[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [feasibilitySearch, setFeasibilitySearch] = useState({ city: '', state: '' });
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [expandedMapPoints, setExpandedMapPoints] = useState<Point[]>([]);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Form states
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showEditPartnerModal, setShowEditPartnerModal] = useState<Partner | null>(null);
  const [showPointModal, setShowPointModal] = useState(false);
  const [showEditPointModal, setShowEditPointModal] = useState<Point | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState<Customer | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [showReductionModal, setShowReductionModal] = useState<{id: string, currentCost: number} | null>(null);
  const [reductionValue, setReductionValue] = useState(0);
  
  const [newPartner, setNewPartner] = useState({ name: '', contact: '', state: '', cities: '', logo_url: '' });
  const [newCustomer, setNewCustomer] = useState({ 
    name: '', 
    cnpj: '', 
    contact: '', 
    phone: '', 
    email: '', 
    address: '', 
    city: '', 
    state: '',
    color: '#2563eb'
  });
  const [newPoint, setNewPoint] = useState({ 
    customer_id: '',
    customer_name: '', 
    address: '', 
    city: '', 
    state: '', 
    partner_id: '', 
    revenue: 0,
    expense: 0,
    status: 'pending' as const,
    sla_status: 'within' as 'within' | 'warning' | 'breached',
    equipment: '',
    bandwidth: ''
  });

  // --- Currency Helpers ---
  const formatCurrency = (value: number | string) => {
    const amount = typeof value === 'number' ? value : parseFloat(value.replace(/[^\d]/g, '')) / 100;
    if (isNaN(amount)) return 'R$ 0,00';
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleCurrencyInput = (value: string, setter: (val: number) => void) => {
    // Se o valor contiver uma vírgula ou ponto no final, ignoramos para permitir a digitação decimal
    // Mas a lógica padrão de máscara de moeda funciona multiplicando/dividindo por 100
    const digits = value.replace(/\D/g, '');
    const amount = parseInt(digits || '0') / 100;
    
    // Inteligência adicional: se o usuário colar um valor grande sem formatação (ex: 25000), 
    // a máscara padrão transformaria em 250,00. 
    // Porém, em máscaras de entrada em tempo real, o comportamento esperado é o preenchimento da direita para a esquerda.
    setter(amount);
  };
  const [partnerFilter, setPartnerFilter] = useState<'active' | 'cancelled'>('active');
  const [pointFilter, setPointFilter] = useState<'active' | 'cancelled'>('active');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeCustomerFilter, setActiveCustomerFilter] = useState<string | null>(null);

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

    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
          setToast({ message: 'Erro de conexão com o Firebase. Verifique a configuração.', type: 'error' });
        }
      }
    };
    testConnection();

    const qPartners = query(collection(db, 'partners'), orderBy('name'));
    const unsubscribePartners = onSnapshot(qPartners, (snapshot) => {
      const partnersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Partner[];
      setPartners(partnersList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'partners');
    });

    const qPoints = query(collection(db, 'points'), orderBy('created_at', 'desc'));
    const unsubscribePoints = onSnapshot(qPoints, (snapshot) => {
      const pointsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Point[];
      setPoints(pointsList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'points');
    });

    const qCustomers = query(collection(db, 'customers'), orderBy('name'));
    const unsubscribeCustomers = onSnapshot(qCustomers, (snapshot) => {
      const customersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      setCustomers(customersList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'customers');
    });

    return () => {
      unsubscribePartners();
      unsubscribePoints();
      unsubscribeCustomers();
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
  const [financeValidationFilter, setFinanceValidationFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [financeMonth, setFinanceMonth] = useState(new Date().toISOString().substring(0, 7));
  
  const financeMonths = useMemo(() => {
    const months = [];
    const now = new Date();
    // Gera os últimos 12 meses dinamicamente
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        value: d.toISOString().substring(0, 7),
        label: d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
      });
    }
    return months;
  }, []);
  const [reportingIncidentPartnerId, setReportingIncidentPartnerId] = useState<string | null>(null);
  const [incidentDescription, setIncidentDescription] = useState('');
  const [activePointsSubTab, setActivePointsSubTab] = useState<'list' | 'groups'>('list');

  const clients = useMemo(() => {
    const clientMap = new Map<string, { 
      name: string; 
      pointsCount: number; 
      partnersCount: number; 
      partners: Set<string>;
      states: Set<string>;
      points: Point[];
    }>();

    points.forEach(point => {
      const name = point.customer_name;
      if (!clientMap.has(name)) {
        clientMap.set(name, { 
          name, 
          pointsCount: 0, 
          partnersCount: 0, 
          partners: new Set(),
          states: new Set(),
          points: []
        });
      }
      const client = clientMap.get(name)!;
      client.pointsCount++;
      client.partners.add(point.partner_id);
      client.states.add(point.state);
      client.points.push(point);
    });

    return Array.from(clientMap.values()).map(client => ({
      ...client,
      partnersCount: client.partners.size,
      states: Array.from(client.states)
    }));
  }, [points]);

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
    const totalRevenue = filteredPoints.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
    const totalExpense = filteredPoints.reduce((acc, curr) => acc + (Number(curr.expense) || 0), 0);
    const totalProfit = totalRevenue - totalExpense;
    
    const pointsByStateMap: Record<string, number> = {};
    filteredPoints.forEach(p => {
      pointsByStateMap[p.state] = (pointsByStateMap[p.state] || 0) + 1;
    });
    
    const pointsByState = Object.entries(pointsByStateMap).map(([state, count]) => ({ state, count }));

    return {
      totalPartners: activePartners.length,
      totalPoints: filteredPoints.length,
      totalRevenue,
      totalExpense,
      totalProfit,
      pointsByState
    };
  }, [partners, points, dateRange]);

  const monthlyStats = useMemo(() => {
    const statsMap: Record<string, { count: number, total_revenue: number, total_expense: number, sortKey: number }> = {};
    
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
      const monthDisplay = date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
      const sortKey = date.getFullYear() * 100 + date.getMonth();
      
      if (!statsMap[monthDisplay]) {
        statsMap[monthDisplay] = { count: 0, total_revenue: 0, total_expense: 0, sortKey };
      }
      statsMap[monthDisplay].count += 1;
      statsMap[monthDisplay].total_revenue += (Number(p.revenue) || 0);
      statsMap[monthDisplay].total_expense += (Number(p.expense) || 0);
    });

    return Object.entries(statsMap).map(([month, data]) => ({
      month,
      count: data.count,
      total_revenue: data.total_revenue,
      total_expense: data.total_expense,
      profit: data.total_revenue - data.total_expense,
      sortKey: data.sortKey
    })).sort((a, b) => a.sortKey - b.sortKey);
  }, [points, dateRange]);

  const handleReportIncident = (id: string) => {
    setReportingIncidentPartnerId(id);
    setIncidentDescription('');
  };

  const submitIncidentReport = async () => {
    if (!reportingIncidentPartnerId || !incidentDescription) return;
    
    try {
      const partner = partners.find(p => p.id === reportingIncidentPartnerId);
      if (partner) {
        const newIncidents = (partner.sla_incidents || 0) + 1;
        await updateDoc(doc(db, 'partners', reportingIncidentPartnerId), {
          sla_incidents: newIncidents
        });
        
        await addDoc(collection(db, 'events'), {
          type: 'sla_incident',
          partner_id: reportingIncidentPartnerId,
          partner_name: partner.name,
          description: incidentDescription,
          created_at: serverTimestamp()
        });

        setToast({ message: 'Incidente registrado!', type: 'success' });
      }
      setReportingIncidentPartnerId(null);
      setIncidentDescription('');
    } catch (error) {
      setToast({ message: 'Erro ao registrar incidente', type: 'error' });
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
        case 'auth/operation-not-allowed':
          setLoginError("O login por e-mail/senha não está ativado no Firebase Console.");
          break;
        case 'auth/unauthorized-domain':
          setLoginError("Este domínio não está autorizado no Firebase Console.");
          break;
        default:
          setLoginError(`Erro ao acessar o painel (${error.code}). Verifique suas credenciais ou a configuração do Firebase.`);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Google Auth Error:", error.code, error.message);
      if (error.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        setLoginError((
          <div className="flex flex-col gap-4 text-left p-4 bg-rose-50 rounded-2xl border border-rose-100 mt-2">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle size={20} />
              <p className="text-sm font-bold">Domínio não autorizado</p>
            </div>
            <p className="text-xs text-neutral-muted leading-relaxed">
              O acesso a partir deste endereço ({domain}) não está autorizado no Firebase. 
              Copie o domínio e adicione-o às configurações de autenticação.
            </p>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(domain);
                setToast({ message: 'Domínio copiado!', type: 'success' });
              }}
              className="w-full py-2 bg-rose-600 text-[10px] text-white rounded-xl hover:bg-rose-700 transition-all font-bold uppercase tracking-widest shadow-sm"
            >
              Copiar Domínio
            </button>
          </div>
        ) as any);
      } else if (error.code === 'auth/popup-closed-by-user') {
        // Silently ignore
      } else if (error.code === 'auth/invalid-credential') {
        setLoginError("Configuração de credenciais inválida. Verifique se o login com Google está ativado no Firebase Console.");
      } else {
        setLoginError(`Erro ao entrar com Google (${error.code})`);
      }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const kmlInputRef = useRef<HTMLInputElement>(null);

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

  const handleImportKML = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const kmlText = event.target?.result as string;
      const parser = new DOMParser();
      let kmlDoc;
      try {
        kmlDoc = parser.parseFromString(kmlText, "text/xml");
      } catch (err) {
        setToast({ message: 'Erro ao processar formato do arquivo KML.', type: 'error' });
        return;
      }

      const placemarks = kmlDoc.getElementsByTagName("Placemark");
      
      if (placemarks.length === 0) {
        setToast({ message: 'Nenhum ponto encontrado no arquivo KML.', type: 'error' });
        return;
      }

      setToast({ message: `Iniciando processamento de ${placemarks.length} pontos...`, type: 'success' });

      try {
        let importedCount = 0;
        let batch = writeBatch(db);
        let batchSize = 0;

        const customer = customers.find(c => c.id === selectedCustomerId);
        const finalCustomerName = customer?.name || 'Localização Importada';

        // Helper to wait to avoid rate limits
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

        for (let i = 0; i < placemarks.length; i++) {
          const pm = placemarks[i];
          const name = pm.getElementsByTagName("name")[0]?.textContent || `Ponto Importado ${i+1}`;
          const coordsStr = pm.getElementsByTagName("coordinates")[0]?.textContent?.trim();
          
          let address = pm.getElementsByTagName("address")[0]?.textContent || name;
          let city = 'Localização Importada';
          let state = 'UF';

          const sigla = extractSigla(name);
          if (sigla && CNL_MAPPING[sigla]) {
            city = CNL_MAPPING[sigla].city;
            state = CNL_MAPPING[sigla].state;
          }

          if (coordsStr) {
            const multiCoords = coordsStr.split(/\s+/);
            const firstCoord = multiCoords[0];
            const parts = firstCoord.split(',');
            
            if (parts.length >= 2) {
              const lng = parseFloat(parts[0]);
              const lat = parseFloat(parts[1]);
              
              if (!isNaN(lat) && !isNaN(lng)) {
                // Reverse geocoding limited to standard behavior to avoid extreme delay
                // Only geocode first 10 or skip if too many to keep it usable
                if (placemarks.length <= 15 || i < 5) {
                   try {
                     // Adding a small delay to avoid Nominatim blacklisting
                     if (i > 0) await delay(1000); 
                     
                     const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
                       headers: { 'Accept-Language': 'pt-BR' }
                     });
                     const geo = await res.json();
                     if (geo && geo.address) {
                       address = geo.display_name || address;
                       city = geo.address.city || geo.address.town || geo.address.suburb || city;
                       state = geo.address.state_district || geo.address.state || state;
                     }
                   } catch (err) {
                     console.warn("Reverse geocode failed for point", i);
                   }
                }

                // Tenta encontrar um parceiro compatível automaticamente (Estado e Cidade coincidem)
                const matchingPartner = partners.find(p => {
                  if (!p.state || !p.cities) return false;
                  const pState = p.state.toUpperCase();
                  const pCities = p.cities.split(',').map(c => c.trim().toLowerCase());
                  return pState === state.toUpperCase() && pCities.includes(city.toLowerCase());
                });

                const pointRef = doc(collection(db, 'points'));
                batch.set(pointRef, {
                  customer_id: selectedCustomerId || 'pending',
                  customer_name: finalCustomerName,
                  address,
                  city,
                  state,
                  partner_id: matchingPartner?.id || 'pending',
                  partner_name: matchingPartner?.name || 'Aguardando Vínculo',
                  revenue: 0,
                  expense: 0,
                  status: 'pending',
                  lat,
                  lng,
                  created_at: Timestamp.now()
                });
                
                importedCount++;
                batchSize++;

                // Commit batch every 400 items (Firestore limit is 500)
                if (batchSize >= 400) {
                  await batch.commit();
                  batch = writeBatch(db);
                  batchSize = 0;
                }
              }
            }
          }
          
          // Small visual feedback for large imports
          if (i > 0 && i % 20 === 0) {
            setToast({ message: `Importando... ${i}/${placemarks.length} concluídos`, type: 'success' });
          }
        }

        if (batchSize > 0) {
          await batch.commit();
        }

        if (importedCount > 0) {
          setToast({ message: `${importedCount} pontos importados com sucesso!`, type: 'success' });
          if (kmlInputRef.current) kmlInputRef.current.value = '';
        } else {
          setToast({ message: 'Nenhum ponto válido com coordenadas foi encontrado.', type: 'error' });
        }
      } catch (error) {
        console.error("Erro importando KML:", error);
        setToast({ message: 'Erro crítico ao processar importação.', type: 'error' });
      }
    };
    reader.readAsText(file);
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
      handleFirestoreError(error, OperationType.CREATE, 'partners');
      setToast({ message: 'Erro ao cadastrar parceiro.', type: 'error' });
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'customers'), {
        ...newCustomer,
        created_at: Timestamp.now()
      });
      setToast({ message: 'Cliente cadastrado com sucesso!', type: 'success' });
      setShowCustomerModal(false);
      setNewCustomer({ 
        name: '', 
        cnpj: '', 
        contact: '', 
        phone: '', 
        email: '', 
        address: '', 
        city: '', 
        state: '',
        color: '#2563eb'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'customers');
      setToast({ message: 'Erro ao cadastrar cliente.', type: 'error' });
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditCustomerModal) return;
    try {
      const { id, ...data } = showEditCustomerModal;
      await updateDoc(doc(db, 'customers', id), data);
      setToast({ message: 'Cliente atualizado com sucesso!', type: 'success' });
      setShowEditCustomerModal(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'customers');
      setToast({ message: 'Erro ao atualizar cliente.', type: 'error' });
    }
  };

  const handleUpdatePoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditPointModal) return;
    try {
      const partner = partners.find(p => p.id === showEditPointModal.partner_id);
      const customer = customers.find(c => c.id === showEditPointModal.customer_id);
      
      await updateDoc(doc(db, 'points', showEditPointModal.id), {
        ...showEditPointModal,
        customer_name: customer?.name || showEditPointModal.customer_name || 'N/A',
        partner_name: partner?.name || 'Aguardando Vínculo'
      });
      setToast({ message: 'Ponto atualizado com sucesso!', type: 'success' });
      setShowEditPointModal(null);
    } catch (error) {
      setToast({ message: 'Erro ao atualizar ponto.', type: 'error' });
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!confirm('Deseja excluir permanentemente este cliente? Os pontos vinculados permanecerão como "Avulsos".')) return;
    try {
      await deleteDoc(doc(db, 'customers', id));
      setToast({ message: 'Cliente excluído com sucesso!', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `customers/${id}`);
      setToast({ message: 'Erro ao excluir cliente.', type: 'error' });
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
      const customer = customers.find(c => c.id === newPoint.customer_id);
      
      await addDoc(collection(db, 'points'), {
        ...newPoint,
        customer_name: customer?.name || newPoint.customer_name || 'N/A',
        partner_name: partner?.name || 'Aguardando Vínculo',
        payment_status: 'pending',
        created_at: Timestamp.now()
      });
      setToast({ message: 'Ponto cadastrado com sucesso!', type: 'success' });
      setShowPointModal(false);
      setNewPoint({ 
        customer_id: '',
        customer_name: '', 
        address: '', 
        city: '', 
        state: '', 
        partner_id: '', 
        revenue: 0,
        expense: 0,
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
    const point = points.find(p => p.id === pointId);
    
    if (currentStatus !== 'paid' && point?.validation_status !== 'approved') {
      const confirmMsg = point?.validation_status === 'rejected' 
        ? 'ATENÇÃO: Este pagamento foi REJEITADO na validação. Tem certeza que deseja pagar?'
        : 'Este pagamento ainda está pendente de VALIDAÇÃO. Deseja prosseguir com o pagamento?';
      
      if (!confirm(confirmMsg)) return;
    }

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

  const handleToggleValidation = async (pointId: string, currentValidation: string) => {
    try {
      const pointRef = doc(db, 'points', pointId);
      let nextStatus: 'pending' | 'approved' | 'rejected' = 'approved';
      
      if (currentValidation === 'approved') nextStatus = 'rejected';
      else if (currentValidation === 'rejected') nextStatus = 'pending';
      
      await updateDoc(pointRef, {
        validation_status: nextStatus
      });
      setToast({ message: `Status de validação alterado para ${nextStatus}!`, type: 'success' });
    } catch (error) {
      setToast({ message: 'Erro ao atualizar validação.', type: 'error' });
    }
  };

  const handleResetPoints = async () => {
    if (!window.confirm('ALERTA: Isso apagará TODOS os pontos cadastrados permanentemente. Deseja continuar?')) return;
    
    try {
      const batch = writeBatch(db);
      points.forEach((p) => {
        batch.delete(doc(db, 'points', p.id));
      });
      await batch.commit();
      setToast({ message: 'Base de pontos reiniciada com sucesso!', type: 'success' });
    } catch (error) {
      console.error("Erro ao resetar pontos:", error);
      setToast({ message: 'Erro ao limpar base de pontos.', type: 'error' });
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
      const newExpense = showReductionModal.currentCost - reductionValue;
      await updateDoc(doc(db, 'points', showReductionModal.id), { expense: newExpense });
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

  const filteredPartnersForFeasibility = useMemo(() => {
    return partners.filter(p => {
      const matchesState = !feasibilitySearch.state || p.state.toLowerCase().includes(feasibilitySearch.state.toLowerCase());
      const matchesCity = !feasibilitySearch.city || (p.cities || '').toLowerCase().includes(feasibilitySearch.city.toLowerCase());
      return matchesState && matchesCity;
    });
  }, [partners, feasibilitySearch]);

  const filteredFinancePoints = useMemo(() => {
    return filteredPoints.filter(p => {
      const isCompleted = p.status === 'completed';
      const matchesValidation = financeValidationFilter === 'all' || 
                                (financeValidationFilter === 'pending' && (!p.validation_status || p.validation_status === 'pending')) ||
                                p.validation_status === financeValidationFilter;
      
      const pointDate = p.created_at?.toDate ? p.created_at.toDate() : new Date();
      const pointMonth = pointDate.toISOString().substring(0, 7);
      const matchesMonth = pointMonth === financeMonth;

      return isCompleted && matchesValidation && matchesMonth;
    });
  }, [filteredPoints, financeValidationFilter, financeMonth]);

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

  const exportToKML = () => {
    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>LastMile - Rede de Atendimento</name>
    <description>Rede de Atendimento Georreferenciada - Exportado em ${new Date().toLocaleDateString('pt-BR')}</description>
    
    <Style id="pointIcon">
      <IconStyle>
        <scale>1.0</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/paddle/red-circle.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>0.7</scale>
      </LabelStyle>
    </Style>

    ${partners.map(partner => {
      const partnerPoints = points.filter(p => p.partner_id === partner.id && p.lat && p.lng);
      if (partnerPoints.length === 0) return '';
      
      return `
    <Folder>
      <name>Parceiro: ${partner.name}</name>
      <visibility>1</visibility>
      ${partnerPoints.map(p => `
      <Placemark>
        <name>${p.customer_name}</name>
        <description><![CDATA[
          <div style="font-family: sans-serif; min-width: 200px;">
            <h3 style="color: #2563eb; margin: 0 0 10px 0;">${p.customer_name}</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr><td style="padding: 4px 0; color: #64748b;">Endereço:</td><td><b>${p.address}</b></td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Cidade:</td><td><b>${p.city} - ${p.state}</b></td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Parceiro ID:</td><td><b>${p.partner_id}</b></td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Equipamento:</td><td><b>${p.equipment || '-'}</b></td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Banda:</td><td><b>${p.bandwidth || '-'}</b></td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Status:</td><td><b>${p.status.toUpperCase()}</b></td></tr>
            </table>
          </div>
        ]]></description>
        <styleUrl>#pointIcon</styleUrl>
        <Point>
          <coordinates>${p.lng},${p.lat},0</coordinates>
        </Point>
      </Placemark>`).join('')}
    </Folder>`;
    }).join('')}
  </Document>
</kml>`;

    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LastMile_Grid_${new Date().toISOString().split('T')[0]}.kml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setToast({ message: 'Rede exportada para Google Earth com sucesso!', type: 'success' });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-neutral-bg relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-50"></div>
      <div className="relative">
        <div className="w-16 h-16 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Network size={24} className="text-brand-accent" />
        </div>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-bg flex flex-col lg:flex-row overflow-hidden relative font-sans">
        {/* Left Side - Visual & Branding (Hero Gradient) */}
        <div className="hidden lg:flex lg:w-1/2 bg-hero-gradient relative items-center justify-center p-20 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
          
          <div className="relative z-10 text-white max-w-lg">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-10 border border-white/20 shadow-2xl">
                <Network size={48} className="text-white" />
              </div>
              <h1 className="text-6xl font-extrabold tracking-tight mb-6 leading-[1.1] font-display">
                Sintese <br />
                <span className="text-white/60 font-medium">Core</span>
              </h1>
              <p className="text-xl font-medium text-white/70 leading-relaxed mb-10">
                Simplificando a gestão dos seus parceiros e orquestrando sua inteligência de rede.
              </p>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-3xl font-bold">100%</p>
                  <p className="text-xs font-medium uppercase tracking-widest text-white/40">Visibilidade</p>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold">Real-time</p>
                  <p className="text-xs font-medium uppercase tracking-widest text-white/40">Monitoramento</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-neutral-950 relative">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] opacity-50"></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md relative z-10"
          >
            <div className="lg:hidden flex flex-col items-center mb-12">
              <div className="w-14 h-14 bg-brand-accent rounded-2xl flex items-center justify-center text-white shadow-xl mb-4">
                <Network size={28} />
              </div>
              <h1 className="text-2xl font-bold text-neutral-text tracking-tight font-display">Sintese Core</h1>
            </div>

            <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] border border-white/50 dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.05)] liquid-glass">
              <div className="mb-10">
                <h2 className="text-3xl font-extrabold text-neutral-text mb-2 font-display tracking-tight">Entrar na sua conta</h2>
                <p className="text-neutral-muted text-sm font-medium">Acesse o painel administrativo Sintese Core</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-muted uppercase tracking-wider mb-2 ml-1">E-mail Corporativo</label>
                  <div className="relative group">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-muted group-focus-within:text-brand-accent transition-colors" />
                    <input 
                      type="email"
                      required
                      className="w-full pl-12 pr-6 py-3.5 rounded-xl bg-neutral-bg border border-neutral-border text-neutral-text focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all placeholder:text-neutral-muted/50 text-sm"
                      placeholder="admin@sintese.com"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-muted uppercase tracking-wider mb-2 ml-1">Senha de Acesso</label>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-muted group-focus-within:text-brand-accent transition-colors" />
                    <input 
                      type="password"
                      required
                      className="w-full pl-12 pr-6 py-3.5 rounded-xl bg-neutral-bg border border-neutral-border text-neutral-text focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all placeholder:text-neutral-muted/50 text-sm"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                    />
                  </div>
                </div>
                
                {loginError && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-rose-600 dark:text-rose-400 text-xs font-semibold bg-rose-50 dark:bg-rose-900/20 p-4 rounded-xl border border-rose-100 dark:border-rose-800/50 flex items-center gap-3"
                  >
                    <AlertCircle size={16} />
                    {loginError}
                  </motion.p>
                )}

                <button 
                  type="submit"
                  className="w-full py-4 bg-brand-accent text-white rounded-full font-bold text-base hover:bg-brand-hover transition-all shadow-lg shadow-brand-accent/20 active:scale-[0.98] mt-4"
                >
                  Acessar Painel
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-border"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                  <span className="bg-white dark:bg-neutral-900 px-4 text-neutral-muted">Ou entrar com</span>
                </div>
              </div>

              <button 
                onClick={handleGoogleLogin}
                className="w-full py-4 bg-white dark:bg-neutral-900 border border-neutral-border dark:border-neutral-800 text-neutral-text dark:text-neutral-100 rounded-full font-bold text-sm hover:bg-neutral-bg dark:hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Entrar com Google
              </button>

              <div className="mt-10 pt-8 border-t border-neutral-border flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-neutral-muted">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Conexão Segura via Firebase</span>
                </div>
                <p className="text-[10px] font-bold text-neutral-muted/60 uppercase tracking-widest">
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
    <div className="min-h-screen bg-neutral-bg text-neutral-text overflow-x-hidden font-sans selection:bg-brand-accent/30 relative">
      {/* Floating Capsule Navbar */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-4xl px-4">
        <div className="glass-capsule px-6 py-3 flex items-center justify-between liquid-glass">
          <div className="flex items-center gap-3 active:scale-95 transition-transform cursor-pointer group">
            <div className="relative group/logo">
              <div className="w-11 h-11 bg-white dark:bg-slate-900 rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-brand-accent/10 border border-neutral-border dark:border-white/5 transition-all duration-700 group-hover/logo:rotate-[15deg]">
                <div className="w-8 h-8 bg-brand-accent rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-accent/30 transition-transform duration-500 group-hover/logo:scale-110">
                  <Network size={18} strokeWidth={3} />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-lg animate-pulse"></div>
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-brand-accent/40 rounded-full blur-[2px] animate-bounce"></div>
            </div>
            <div className="flex flex-col -space-y-1">
              <h1 className="text-[16px] font-black tracking-tighter text-neutral-text dark:text-white uppercase font-display leading-tight">
                SINTESE <span className="text-brand-accent italic">CORE</span>
              </h1>
              <div className="flex items-center gap-1.5 opacity-60">
                <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse"></div>
                <span className="text-[8px] font-black text-neutral-muted uppercase tracking-[0.3em]">Network Intelligence</span>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={cn("px-4 py-1.5 rounded-full text-xs font-semibold transition-all", activeTab === 'dashboard' ? "bg-brand-accent text-white" : "text-neutral-muted hover:text-neutral-text hover:bg-neutral-bg")}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('partners')}
              className={cn("px-4 py-1.5 rounded-full text-xs font-semibold transition-all", activeTab === 'partners' ? "bg-brand-accent text-white" : "text-neutral-muted hover:text-neutral-text hover:bg-neutral-bg")}
            >
              Parceiros
            </button>
            <button 
              onClick={() => setActiveTab('clients')}
              className={cn("px-4 py-1.5 rounded-full text-xs font-semibold transition-all", activeTab === 'clients' ? "bg-brand-accent text-white" : "text-neutral-muted hover:text-neutral-text hover:bg-neutral-bg")}
            >
              Clientes
            </button>
            <button 
              onClick={() => setActiveTab('points')}
              className={cn("px-4 py-1.5 rounded-full text-xs font-semibold transition-all", activeTab === 'points' ? "bg-brand-accent text-white" : "text-neutral-muted hover:text-neutral-text hover:bg-neutral-bg")}
            >
              Pontos
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={cn("px-4 py-1.5 rounded-full text-xs font-semibold transition-all", activeTab === 'reports' ? "bg-brand-accent text-white" : "text-neutral-muted hover:text-neutral-text hover:bg-neutral-bg")}
            >
              Relatórios
            </button>
            <button 
              onClick={() => setActiveTab('finance')}
              className={cn("px-4 py-1.5 rounded-full text-xs font-semibold transition-all", activeTab === 'finance' ? "bg-brand-accent text-white" : "text-neutral-muted hover:text-neutral-text hover:bg-neutral-bg")}
            >
              Financeiro
            </button>
            <button 
              onClick={() => setActiveTab('feasibility')}
              className={cn("px-4 py-1.5 rounded-full text-xs font-semibold transition-all", activeTab === 'feasibility' ? "bg-brand-accent text-white" : "text-neutral-muted hover:text-neutral-text hover:bg-neutral-bg")}
            >
              Viabilidade
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-neutral-bg border border-neutral-border rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-neutral-muted uppercase tracking-wider">Live</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-neutral-muted hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all"
            >
              <LogOut size={18} />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 text-neutral-muted hover:text-neutral-text"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[90] bg-white pt-24 px-6 md:hidden"
          >
            <div className="space-y-4">
              {['dashboard', 'partners', 'clients', 'points', 'reports', 'finance', 'feasibility'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab as any); setIsSidebarOpen(false); }}
                  className={cn(
                    "w-full text-left px-6 py-4 rounded-2xl text-lg font-bold capitalize transition-all",
                    activeTab === tab ? "bg-brand-accent text-white shadow-xl shadow-brand-accent/20" : "text-neutral-text hover:bg-neutral-bg"
                  )}
                >
                  {tab === 'points' ? 'Pontos de Acesso' : 
                   tab === 'clients' ? 'Clientes Corporativos' :
                   tab === 'feasibility' ? 'Viabilidade' : 
                   tab === 'partners' ? 'Parceiros' :
                   tab === 'reports' ? 'Relatórios' :
                   tab === 'finance' ? 'Financeiro' : tab}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="min-h-screen pt-24 pb-20">
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 50, x: '-50%' }}
              className={cn(
                "fixed bottom-10 left-1/2 z-[200] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold text-sm",
                toast.type === 'success' ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
              )}
            >
              {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === 'dashboard' && (
          <div className="absolute top-0 left-0 w-full h-[400px] bg-hero-gradient -z-10">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-neutral-bg to-transparent"></div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className={cn(
            "flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 pt-10",
            activeTab === 'dashboard' ? "text-white" : "text-neutral-text"
          )}>
            <div>
              <div className={cn(
                "flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-2",
                activeTab === 'dashboard' ? "text-white/60" : "text-brand-accent"
              )}>
                <Activity size={12} className="animate-pulse" />
                <span>Monitoramento de Rede Ativo</span>
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight capitalize font-display">
                {activeTab === 'reports' ? 'Relatórios de Rede' : 
                 activeTab === 'finance' ? 'Fluxo Financeiro' : 
                 activeTab === 'dashboard' ? 'Painel de Controle' : 
                 activeTab === 'partners' ? 'Gestão de Parceiros' :
                 activeTab === 'points' ? 'Pontos & Clientes' : activeTab}
              </h2>
            </div>

            <div className="flex flex-wrap gap-4 w-full md:w-auto items-end">
              <DatePicker 
                label="Início" 
                value={dateRange.start} 
                onChange={(val) => setDateRange(prev => ({ ...prev, start: val }))} 
              />
              <DatePicker 
                label="Fim" 
                value={dateRange.end} 
                onChange={(val) => setDateRange(prev => ({ ...prev, end: val }))} 
              />
              
              {(dateRange.start || dateRange.end) && (
                <button 
                  onClick={() => setDateRange({ start: '', end: '' })}
                  className="btn-pill bg-rose-50 dark:bg-rose-500/10 text-rose-600 border border-rose-100 dark:border-rose-500/20 text-xs h-[42px]"
                >
                  Limpar
                </button>
              )}
              {activeTab !== 'dashboard' && activeTab !== 'reports' && activeTab !== 'clients' && (
                <>
                  <div className="relative group flex-1 md:flex-none">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-muted group-focus-within:text-brand-accent transition-colors" size={18} />
                    <input 
                      type="text"
                      placeholder="Pesquisar..."
                      className="pl-12 pr-6 py-3 bg-white dark:bg-neutral-900 border border-neutral-border dark:border-neutral-800 rounded-full outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent w-full md:w-64 lg:w-80 transition-all text-sm placeholder:text-neutral-muted/50 text-neutral-text"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => activeTab === 'partners' ? setShowPartnerModal(true) : setShowPointModal(true)}
                    className="btn-pill btn-primary flex items-center justify-center gap-2"
                  >
                    <Plus size={20} />
                    <span>Novo {activeTab === 'partners' ? 'Parceiro' : 'Ponto'}</span>
                  </button>
                  {activeTab === 'points' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={exportToCSV}
                        className="btn-pill bg-white dark:bg-neutral-900 text-neutral-text border border-neutral-border dark:border-neutral-800 hover:bg-neutral-bg flex items-center justify-center gap-2 transition-all"
                        title="Exportar CSV"
                      >
                        <Download size={20} />
                        <span className="hidden lg:inline">CSV</span>
                      </button>
                      <button 
                        onClick={exportToKML}
                        className="btn-pill bg-brand-accent/10 text-brand-accent border border-brand-accent/20 hover:bg-brand-accent/20 flex items-center justify-center gap-2 transition-all"
                        title="Exportar para Google Earth"
                      >
                        <Globe size={20} />
                        <span className="hidden lg:inline">Exp. Google Earth</span>
                      </button>
                      
                      <button 
                        onClick={() => setShowImportModal(true)}
                        className="btn-pill bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 flex items-center justify-center gap-2 transition-all"
                        title="Importar do Google Earth"
                      >
                        <Upload size={20} />
                        <span className="hidden lg:inline">Imp. Google Earth</span>
                      </button>
                    </div>
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
              className="space-y-10"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
                <StatCard 
                  label="Parceiros" 
                  value={stats.totalPartners} 
                  icon={Globe} 
                  trend="+4%" 
                  color="bg-brand-accent" 
                />
                <StatCard 
                  label="Terminais Ativos" 
                  value={stats.totalPoints} 
                  icon={Layers} 
                  trend="+18%" 
                  color="bg-emerald-500" 
                />
                <StatCard 
                  label="Receita Bruta" 
                  value={`R$ ${stats.totalRevenue.toLocaleString('pt-BR')}`} 
                  icon={TrendingUp} 
                  trend="+12.4%" 
                  color="bg-emerald-600" 
                />
                <StatCard 
                  label="Despesa Operacional" 
                  value={`R$ ${stats.totalExpense.toLocaleString('pt-BR')}`} 
                  icon={ArrowDownCircle} 
                  trend="-2.4%" 
                  color="bg-rose-500" 
                />
                <StatCard 
                  label="Lucro Líquido" 
                  value={`R$ ${stats.totalProfit.toLocaleString('pt-BR')}`} 
                  icon={DollarSign} 
                  trend="+8.2%" 
                  color="bg-brand-accent" 
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-6">
                  <NetworkTopology />
                  <div className="saas-card p-6 sm:p-8 liquid-glass">
                    <h3 className="text-xl font-bold text-neutral-text mb-8 flex items-center gap-3">
                      <div className="p-2 bg-brand-accent/10 rounded-lg text-brand-accent border border-brand-accent/20">
                        <MapIcon size={20} />
                      </div>
                      Mapa de Cobertura Last-Mile
                    </h3>
                    <div className="h-[400px]">
                      <MapComponent 
                        points={points} 
                        customers={customers}
                        onExpand={() => { setExpandedMapPoints([]); setIsMapExpanded(true); }} 
                        onEditPoint={(p) => setShowEditPointModal(p)}
                      />
                    </div>
                  </div>
                </div>
                <BrazilMap />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                <div className="saas-card p-6 sm:p-8 liquid-glass">
                  <h3 className="text-xl font-bold text-neutral-text mb-8 flex items-center gap-3">
                    <div className="p-2 bg-brand-accent/10 rounded-lg text-brand-accent border border-brand-accent/20">
                      <MapIcon size={20} />
                    </div>
                    Distribuição Regional de Nós
                  </h3>
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.pointsByState}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={'#f1f5f9'} />
                        <XAxis dataKey="state" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc', opacity: 0.4 }}
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            borderRadius: '12px', 
                            border: '1px solid #e2e8f0', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            color: '#111827'
                          }}
                          itemStyle={{ color: '#111827' }}
                        />
                        <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="saas-card p-6 sm:p-8 liquid-glass">
                  <h3 className="text-xl font-bold text-neutral-text mb-8 flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-500/20">
                      <Globe size={20} />
                    </div>
                    Alocação de Recursos por Parceiro
                  </h3>
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={partners.map(p => {
                        const pPoints = points.filter(pt => pt.partner_id === p.id && pt.status !== 'cancelled');
                        const pExpense = pPoints.reduce((acc, curr) => acc + (curr.expense || 0), 0);
                        const pRevenue = pPoints.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
                        return {
                          name: p.name.split(' ')[0],
                          expense: pExpense,
                          revenue: pRevenue
                        };
                      }).sort((a, b) => b.expense - a.expense).slice(0, 6)}>
                        <CartesianGrid strokeDasharray="3 3" stroke={'#f1f5f9'} vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            borderRadius: '12px', 
                            border: '1px solid #e2e8f0', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            color: '#111827'
                          }}
                          itemStyle={{ color: '#111827' }}
                        />
                        <Bar dataKey="revenue" name="Receita" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
                        <Bar dataKey="expense" name="Despesa" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Partner Ranking & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 saas-card overflow-hidden">
                  <div className="p-6 sm:p-8 border-b border-neutral-border">
                    <h3 className="text-xl font-bold text-neutral-text">Top Parceiros</h3>
                    <p className="text-xs text-neutral-muted mt-1 uppercase tracking-widest font-bold">Por volume de pontos</p>
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
                            <span className="text-xs font-bold text-neutral-muted w-4 flex-shrink-0">{idx + 1}</span>
                            <PartnerLogo name={p.name} url={p.logo_url} size="sm" />
                            <span className="text-sm font-bold text-neutral-text truncate">{p.name}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="hidden xs:block h-1.5 w-12 sm:w-16 bg-neutral-bg rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-brand-accent" 
                                style={{ width: `${(p.pointCount / (stats.totalPoints || 1)) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-neutral-text">{p.pointCount}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="lg:col-span-2 saas-card overflow-hidden">
                  <div className="p-6 sm:p-8 border-b border-neutral-border flex justify-between items-center">
                    <h3 className="text-xl font-bold text-neutral-text">Atividade Recente</h3>
                    <button onClick={() => setActiveTab('points')} className="text-brand-accent text-sm font-bold hover:underline transition-all">Ver todos</button>
                  </div>
                  <div className="divide-y divide-neutral-border">
                    {points.slice(0, 5).map((point) => (
                      <div key={point.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-neutral-bg/50 transition-all group gap-3">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center border border-neutral-border shadow-sm",
                            point.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                            point.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
                            point.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-brand-accent/10 text-brand-accent'
                          )}>
                            {point.status === 'completed' ? <CheckCircle2 size={20} /> : 
                             point.status === 'pending' ? <Clock size={20} /> : 
                             point.status === 'cancelled' ? <XCircle size={20} /> : <AlertCircle size={20} />}
                          </div>
                          <div>
                            <p className="font-bold text-neutral-text text-base">{point.customer_name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <PartnerLogo name={partners.find(p => p.id === point.partner_id)?.name || ''} url={partners.find(p => p.id === point.partner_id)?.logo_url} size="sm" />
                              <p className="text-[10px] text-neutral-muted font-bold uppercase tracking-wider">{point.partner_name}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-left sm:text-right pl-14 sm:pl-0">
                          <p className="font-bold text-neutral-text">Venda: R$ {point.revenue?.toLocaleString('pt-BR') || 0}</p>
                          <p className="text-[10px] text-neutral-muted font-bold">Custo: R$ {point.expense?.toLocaleString('pt-BR') || 0}</p>
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
              className="space-y-10"
            >
              <div className="saas-card p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-neutral-text">Filtros de Relatório</h3>
                    <p className="text-neutral-muted text-sm mt-1">Os dados abaixo são filtrados pelo período selecionado no topo da página.</p>
                  </div>
                  <div className="flex flex-wrap items-end gap-4 w-full lg:w-auto">
                    <button 
                      onClick={() => setDateRange({ start: '', end: '' })}
                      className="btn-pill bg-neutral-bg dark:bg-neutral-800 text-neutral-muted hover:text-neutral-text border border-neutral-border dark:border-neutral-700 h-[38px]"
                    >
                      Limpar Filtros de Data
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="saas-card p-8">
                  <h3 className="text-xl font-bold text-neutral-text mb-8 flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                      <Calendar size={20} />
                    </div>
                    Crescimento de Pontos
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyStats}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={'#f1f5f9'} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            borderRadius: '12px', 
                            border: '1px solid #e2e8f0', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            color: '#111827'
                          }}
                          itemStyle={{ color: '#111827' }}
                        />
                        <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="saas-card p-8">
                    <h3 className="text-xl font-bold text-neutral-text mb-8 flex items-center gap-3">
                      <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                        <TrendingUp size={20} />
                      </div>
                      Evolução Financeira (R$)
                    </h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyStats}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={'#f1f5f9'} />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              borderRadius: '12px', 
                              border: '1px solid #e2e8f0', 
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                              color: '#111827'
                            }}
                            itemStyle={{ color: '#111827' }}
                          />
                          <Line type="monotone" dataKey="total_revenue" name="Receita" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
                          <Line type="monotone" dataKey="total_expense" name="Despesa" stroke="#f59e0b" strokeWidth={4} dot={{ r: 6, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} />
                          <Line type="monotone" dataKey="profit" name="Lucro" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                </div>
              </div>

              <div className="saas-card overflow-hidden">
                <div className="p-8 border-b border-neutral-border dark:border-neutral-800">
                  <h3 className="text-xl font-bold text-neutral-text">Análise Financeira por Parceiro</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-bg dark:bg-neutral-900/50">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Parceiro</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Qtd Pontos</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Receita (Venda)</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Despesa (Custo)</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Participação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-border dark:divide-neutral-800">
                      {partners
                        .filter(p => p.status !== 'cancelled')
                        .map(p => {
                          const pPoints = points.filter(pt => pt.partner_id === p.id && pt.status !== 'cancelled');
                          const pRevenue = pPoints.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
                          const pExpense = pPoints.reduce((acc, curr) => acc + (Number(curr.expense) || 0), 0);
                          return { id: p.id, name: p.name, count: pPoints.length, revenue: pRevenue, expense: pExpense };
                        })
                        .sort((a, b) => b.revenue - a.revenue)
                        .map((item, idx) => {
                          const partnerObj = partners.find(p => p.id === item.id);
                          return (
                            <tr key={`${item.id}-${idx}`} className="hover:bg-neutral-bg/50 dark:hover:bg-neutral-900/30 transition-colors">
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-3">
                                  <PartnerLogo name={item.name} url={partnerObj?.logo_url} />
                                  <span className="font-bold text-neutral-text">{item.name}</span>
                                </div>
                              </td>
                              <td className="px-8 py-6 text-neutral-muted font-medium">{item.count}</td>
                            <td className="px-8 py-6 font-bold text-emerald-600">R$ {item.revenue.toLocaleString('pt-BR')}</td>
                            <td className="px-8 py-6 font-bold text-rose-500">R$ {item.expense.toLocaleString('pt-BR')}</td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className="h-1.5 w-24 bg-neutral-bg dark:bg-neutral-800 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-brand-accent" 
                                    style={{ width: `${(item.revenue / (stats.totalRevenue || 1)) * 100}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-neutral-muted">
                                  {((item.revenue / (stats.totalRevenue || 1)) * 100).toFixed(1)}%
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

              <div className="saas-card overflow-hidden">
                <div className="p-8 border-b border-neutral-border dark:border-neutral-800">
                  <h3 className="text-xl font-bold text-neutral-text">Consolidado Mensal</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-bg dark:bg-neutral-900/50">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Mês Referência</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Novos Pontos</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Receita Total</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Despesa Total</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Lucro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-border dark:divide-neutral-800">
                      {monthlyStats.map((item, idx) => (
                        <tr key={`${item.month}-${idx}`} className="hover:bg-neutral-bg/50 dark:hover:bg-neutral-900/30 transition-colors">
                          <td className="px-8 py-6 font-bold text-neutral-text">{item.month}</td>
                          <td className="px-8 py-6 text-neutral-muted font-medium">{item.count}</td>
                          <td className="px-8 py-6 font-bold text-emerald-600">R$ {item.total_revenue.toLocaleString('pt-BR')}</td>
                          <td className="px-8 py-6 font-bold text-rose-500">R$ {item.total_expense.toLocaleString('pt-BR')}</td>
                          <td className="px-8 py-6 text-brand-accent font-bold">R$ {item.profit.toLocaleString('pt-BR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'clients' && (
            <motion.div 
              key="clients"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-10 bg-white dark:bg-slate-900 rounded-[3rem] border border-neutral-border dark:border-white/5 shadow-2xl shadow-brand-accent/5">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-brand-accent flex items-center justify-center text-white shadow-xl shadow-brand-accent/30">
                    <Users size={32} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-neutral-text dark:text-white uppercase tracking-tighter">Gestão de Clientes</h2>
                    <p className="text-xs text-neutral-muted font-bold uppercase tracking-widest mt-1 opacity-70">Monitoramento de Contratos e Performance de Pontos</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <button 
                    onClick={() => setShowCustomerModal(true)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-4 bg-brand-accent text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-brand-hover transition-all shadow-2xl shadow-brand-accent/30 active:scale-95"
                  >
                    <Plus size={20} strokeWidth={3} />
                    Novo Cliente
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
                <div className="xl:col-span-3 saas-card overflow-hidden">
                  <div className="p-8 border-b border-neutral-border dark:border-white/5 bg-neutral-bg/30 dark:bg-neutral-900/30 flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-muted">Lista de Contratos Ativos</h4>
                      {activeCustomerFilter && (
                        <button 
                          onClick={() => setActiveCustomerFilter(null)}
                          className="text-[9px] font-black text-brand-accent uppercase hover:underline text-left"
                        >
                          Remover filtro de mapa (Ver todos)
                        </button>
                      )}
                    </div>
                    <span className="px-4 py-1 bg-brand-accent/10 rounded-full text-[10px] font-black text-brand-accent uppercase tracking-widest">{customers.length} Registros</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-neutral-bg/50 dark:bg-neutral-950/20 border-b border-neutral-border dark:border-white/5">
                        <tr>
                          <th className="px-10 py-6 text-[10px] font-black text-neutral-muted uppercase tracking-[0.2em]">Cliente / CNPJ</th>
                          <th className="px-10 py-6 text-[10px] font-black text-neutral-muted uppercase tracking-[0.2em] text-center">Status Rede</th>
                          <th className="px-10 py-6 text-[10px] font-black text-neutral-muted uppercase tracking-[0.2em]">Gestores / Contato</th>
                          <th className="px-10 py-6 text-[10px] font-black text-neutral-muted uppercase tracking-[0.2em] text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-border dark:divide-neutral-800">
                        {customers.length > 0 ? customers.map((customer) => {
                          const customerPoints = points.filter(p => p.customer_id === customer.id || p.customer_name === customer.name);
                          const activePoints = customerPoints.filter(p => p.status === 'completed');
                          const isFiltered = activeCustomerFilter === customer.id;
                          return (
                            <tr 
                              key={customer.id} 
                              onClick={() => setActiveCustomerFilter(customer.id)}
                              className={cn(
                                "hover:bg-neutral-bg/30 dark:hover:bg-neutral-900/20 transition-all group cursor-pointer",
                                isFiltered && "bg-brand-accent/5 dark:bg-brand-accent/10 border-l-4 border-l-brand-accent"
                              )}
                            >
                              <td className="px-10 py-8">
                                <div className="flex items-center gap-5">
                                  <div className={cn(
                                    "w-14 h-14 rounded-2xl bg-brand-accent/5 dark:bg-brand-accent/10 border border-brand-accent/10 flex items-center justify-center text-brand-accent font-black text-2xl shadow-inner group-hover:scale-110 group-hover:bg-brand-accent group-hover:text-white transition-all duration-500",
                                    isFiltered && "bg-brand-accent text-white scale-110"
                                  )}>
                                    {customer.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-black text-neutral-text text-xl tracking-tighter uppercase leading-tight">{customer.name}</p>
                                    <p className="text-[10px] text-neutral-muted font-bold tracking-widest mt-1">DOC: {customer.cnpj || 'PENDENTE'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-10 py-8 text-center">
                                <div className="flex flex-col items-center">
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-neutral-text">{activePoints.length}</span>
                                    <span className="text-[10px] font-bold text-neutral-muted">/ {customerPoints.length}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Ativos</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-10 py-8">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-neutral-bg dark:bg-neutral-800 flex items-center justify-center text-brand-accent">
                                      <User size={12} />
                                    </div>
                                    <span className="text-xs font-black uppercase text-neutral-text">{customer.contact || 'S/N'}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-neutral-bg dark:bg-neutral-800 flex items-center justify-center text-neutral-muted">
                                      <Activity size={12} />
                                    </div>
                                    <span className="text-[10px] font-bold text-neutral-muted tracking-wide">{customer.phone || customer.email || 'Não informado'}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-10 py-8 text-right">
                                <div className="flex justify-end gap-3">
                                  <button
                                    onClick={() => setShowEditCustomerModal(customer)}
                                    className="p-4 text-neutral-muted hover:text-brand-accent hover:bg-brand-accent/5 dark:hover:bg-brand-accent/10 rounded-2xl transition-all hover:scale-110"
                                    title="Editar Cliente"
                                  >
                                    <Edit2 size={22} />
                                  </button>
                                  <button
                                    onClick={() => deleteCustomer(customer.id)}
                                    className="p-4 text-neutral-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all hover:scale-110"
                                    title="Excluir Contrato"
                                  >
                                    <Trash2 size={22} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan={4} className="px-10 py-32 text-center">
                              <div className="flex flex-col items-center opacity-30">
                                <div className="w-20 h-20 rounded-full bg-neutral-bg flex items-center justify-center text-neutral-muted mb-6">
                                  <Users size={40} />
                                </div>
                                <h5 className="text-sm font-black uppercase tracking-[0.3em] text-neutral-muted">Aguardando Registros</h5>
                                <p className="text-xs font-bold mt-2 text-neutral-muted/60">Seus clientes listados aparecerão aqui</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="saas-card p-10 bg-gradient-to-br from-slate-900 to-slate-950 text-white border-none shadow-2xl relative overflow-hidden dark:from-neutral-900 dark:to-neutral-950">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-accent/20 blur-[80px]" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-accent/10 blur-[60px]" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                          <BarChart3 size={24} className="text-brand-accent" />
                        </div>
                        <h4 className="font-black uppercase tracking-[0.2em] text-xs">Visão Geral Contratos</h4>
                      </div>
                      
                      <div className="space-y-10">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/50 mb-1">Total Clientes</p>
                            <p className="text-6xl font-black tracking-tighter">{customers.length}</p>
                          </div>
                          <TrendingUp size={48} className="text-emerald-500 opacity-80" />
                        </div>
                        
                        <div className="pt-8 border-t border-white/5 space-y-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 mb-3 ml-1">Status da Base</p>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center bg-white/5 px-5 py-4 rounded-2xl border border-white/5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Ativos</span>
                                <span className="font-black text-xl">{customers.length}</span>
                              </div>
                              <div className="flex justify-between items-center bg-white/5 px-5 py-4 rounded-2xl border border-white/5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Pontos s/ Vínculo</span>
                                <span className="font-black text-xl">{points.filter(p => !p.customer_id || p.customer_id === 'pending').length}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                    <div className="saas-card overflow-hidden h-[400px]">
                      <div className="p-6 border-b border-neutral-border dark:border-white/5 bg-neutral-bg/50 dark:bg-neutral-900/50 flex justify-between items-center">
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-muted">Mapa de Atendimento</h4>
                          {activeCustomerFilter && (
                            <p className="text-[9px] font-bold text-brand-accent uppercase mt-1">Filtrado: {customers.find(c => c.id === activeCustomerFilter)?.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="h-full">
                        <MapComponent 
                          points={activeCustomerFilter ? points.filter(p => p.customer_id === activeCustomerFilter || p.customer_name === customers.find(c => c.id === activeCustomerFilter)?.name) : points} 
                          customers={customers}
                          height="100%"
                          onEditPoint={(p) => setShowEditPointModal(p)}
                        />
                      </div>
                    </div>
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
              className="space-y-10"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col gap-1">
                  <h3 className="text-2xl font-black text-neutral-text dark:text-white uppercase tracking-tighter">Conciliação Mensal</h3>
                  <p className="text-[10px] text-neutral-muted font-bold uppercase tracking-widest leading-none">Validar e processar pagamentos de parceiros</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex flex-wrap gap-1 bg-neutral-bg p-1 rounded-2xl border border-neutral-border">
                    {financeMonths.slice(0, 6).reverse().map(m => (
                      <button 
                        key={m.value}
                        onClick={() => setFinanceMonth(m.value)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          financeMonth === m.value 
                            ? "bg-white text-brand-accent shadow-sm" 
                            : "text-neutral-muted hover:text-neutral-text"
                        )}
                      >
                        {new Date(m.value + '-02').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '')}
                      </button>
                    ))}
                  </div>
                  
                  <div className="w-px h-8 bg-neutral-border" />

                  <div className="flex gap-1 bg-neutral-bg p-1 rounded-full border border-neutral-border">
                    {['all', 'pending', 'approved', 'rejected'].map((filter) => (
                      <button 
                        key={filter}
                        onClick={() => setFinanceValidationFilter(filter as any)}
                        className={cn(
                          "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                          financeValidationFilter === filter 
                            ? (filter === 'all' ? "bg-neutral-text text-white" : 
                               filter === 'pending' ? "bg-amber-500 text-white" :
                               filter === 'approved' ? "bg-emerald-500 text-white" :
                               "bg-rose-500 text-white")
                            : "text-neutral-muted hover:text-neutral-text"
                        )}
                      >
                        {filter === 'all' ? 'Todos' : filter === 'pending' ? 'Pendentes' : filter === 'approved' ? 'Aprovados' : 'Retidos'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="saas-card p-8 group">
                  <p className="text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2">Faturamento (Venda {financeMonth})</p>
                  <p className="text-3xl font-extrabold text-brand-accent">
                    R$ {points.filter(p => {
                      const date = p.created_at?.toDate ? p.created_at.toDate() : new Date();
                      return date.toISOString().substring(0, 7) === financeMonth && p.status === 'completed';
                    }).reduce((acc, curr) => acc + (curr.revenue || 0), 0).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="saas-card p-8 group border-l-4 border-rose-500">
                  <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-2">Despesa (Pagamento Parceiros)</p>
                  <p className="text-3xl font-extrabold text-rose-500">
                    R$ {points.filter(p => {
                      const date = p.created_at?.toDate ? p.created_at.toDate() : new Date();
                      return date.toISOString().substring(0, 7) === financeMonth && p.status === 'completed';
                    }).reduce((acc, curr) => acc + (curr.expense || 0), 0).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="saas-card p-8 group border-l-4 border-emerald-500">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Lucro Bruto Projetado</p>
                  <p className="text-3xl font-extrabold text-emerald-600">
                    R$ {points.filter(p => {
                      const date = p.created_at?.toDate ? p.created_at.toDate() : new Date();
                      return date.toISOString().substring(0, 7) === financeMonth && p.status === 'completed';
                    }).reduce((acc, curr) => acc + ((curr.revenue || 0) - (curr.expense || 0)), 0).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="saas-card p-8 group bg-neutral-text text-white">
                  <p className="text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 text-white/60">Pendente de Liquidação</p>
                  <p className="text-3xl font-extrabold text-white">
                    R$ {points.filter(p => {
                      const date = p.created_at?.toDate ? p.created_at.toDate() : new Date();
                      return date.toISOString().substring(0, 7) === financeMonth && p.status === 'completed' && p.payment_status !== 'paid';
                    }).reduce((acc, curr) => acc + (curr.expense || 0), 0).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="saas-card overflow-hidden">
                <div className="p-8 border-b border-neutral-border dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-neutral-text">Conciliação de Pagamentos</h3>
                    <p className="text-sm text-neutral-muted mt-1">Gerencie o status financeiro de cada entrega concluída.</p>
                  </div>
                  <div className="flex bg-neutral-bg dark:bg-neutral-800 p-1 rounded-2xl border border-neutral-border dark:border-neutral-700">
                    <button 
                      onClick={() => setFinanceValidationFilter('all')}
                      className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", financeValidationFilter === 'all' ? "bg-white dark:bg-neutral-900 text-neutral-text shadow-sm" : "text-neutral-muted hover:text-neutral-text")}
                    >
                      Todos
                    </button>
                    <button 
                      onClick={() => setFinanceValidationFilter('pending')}
                      className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", financeValidationFilter === 'pending' ? "bg-white dark:bg-neutral-900 text-brand-accent shadow-sm" : "text-neutral-muted hover:text-neutral-text")}
                    >
                      Pendentes
                    </button>
                    <button 
                      onClick={() => setFinanceValidationFilter('approved')}
                      className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", financeValidationFilter === 'approved' ? "bg-white dark:bg-neutral-900 text-emerald-600 shadow-sm" : "text-neutral-muted hover:text-neutral-text")}
                    >
                      Aprovados
                    </button>
                    <button 
                      onClick={() => setFinanceValidationFilter('rejected')}
                      className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", financeValidationFilter === 'rejected' ? "bg-white dark:bg-neutral-900 text-rose-600 shadow-sm" : "text-neutral-muted hover:text-neutral-text")}
                    >
                      Retidos
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-bg dark:bg-neutral-900/50">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Entrega / Cliente</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Parceiro</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Venda (Rec)</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Custo (Desp)</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest text-center">Validação</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Status Pagto</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-border dark:divide-neutral-800">
                      {filteredFinancePoints.length > 0 ? (
                        filteredFinancePoints.map((point) => (
                          <tr key={point.id} className="hover:bg-neutral-bg/50 dark:hover:bg-neutral-900/30 transition-colors">
                            <td className="px-8 py-6">
                              <p className="font-bold text-neutral-text">{point.customer_name}</p>
                              <p className="text-[10px] text-neutral-muted font-bold uppercase tracking-wider">{point.city}, {point.state}</p>
                            </td>
                            <td className="px-8 py-6 text-neutral-muted font-medium">{point.partner_name}</td>
                            <td className="px-8 py-6 font-bold text-emerald-600">R$ {point.revenue?.toLocaleString('pt-BR') || 0}</td>
                            <td className="px-8 py-6 font-bold text-rose-500">R$ {point.expense?.toLocaleString('pt-BR') || 0}</td>
                            <td className="px-8 py-6">
                              <div className="flex justify-center">
                                <button 
                                  onClick={() => handleToggleValidation(point.id, point.validation_status || 'pending')}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[10px] font-black uppercase tracking-wider",
                                    point.validation_status === 'approved' 
                                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                                      : point.validation_status === 'rejected'
                                      ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                      : "bg-neutral-bg dark:bg-neutral-800 text-neutral-muted border-neutral-border dark:border-neutral-700 hover:border-brand-accent/50"
                                  )}
                                  title="Clique para validar ou reprovar pagamento"
                                >
                                  {point.validation_status === 'approved' ? <ShieldCheck size={14} /> : 
                                   point.validation_status === 'rejected' ? <XCircle size={14} /> : <Clock size={14} />}
                                  {point.validation_status === 'approved' ? 'Aprovado' : 
                                   point.validation_status === 'rejected' ? 'Retido' : 'Validar'}
                                </button>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className={cn(
                                "px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest",
                                point.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:border-emerald-900/50' : 'bg-amber-50 text-amber-600 border border-amber-100 dark:border-amber-900/50'
                              )}>
                                {point.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <button 
                                onClick={() => handleTogglePayment(point.id, point.payment_status || 'pending')}
                                className={cn(
                                  "btn-pill text-xs font-bold uppercase tracking-widest transition-all",
                                  point.payment_status === 'paid' 
                                    ? "bg-neutral-bg dark:bg-neutral-800 text-neutral-muted hover:text-neutral-text border border-neutral-border dark:border-neutral-700" 
                                    : "btn-primary"
                                )}
                              >
                                {point.payment_status === 'paid' ? 'Estornar' : 'Marcar Pago'}
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-8 py-20 text-center text-neutral-muted font-medium italic">
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

          {activeTab === 'feasibility' && (
            <motion.div 
              key="feasibility"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="saas-card p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-neutral-text">Consulta de Viabilidade</h3>
                    <p className="text-neutral-muted text-sm mt-1">Localize parceiros Last-Mile por região para novos projetos.</p>
                  </div>
                  <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Cidade / Município</label>
                      <Input 
                        placeholder="Ex: São Paulo"
                        value={feasibilitySearch.city}
                        onChange={e => setFeasibilitySearch(prev => ({ ...prev, city: e.target.value }))}
                        className="rounded-xl py-5"
                      />
                    </div>
                    <div className="w-full md:w-32">
                      <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">UF</label>
                      <Input 
                        placeholder="Ex: SP"
                        maxLength={2}
                        value={feasibilitySearch.state}
                        onChange={e => setFeasibilitySearch(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                        className="rounded-xl py-5 uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="overflow-x-auto rounded-2xl border border-neutral-border dark:border-neutral-800">
                      <table className="w-full text-left">
                        <thead className="bg-neutral-bg dark:bg-neutral-900/50 border-b border-neutral-border dark:border-neutral-800">
                          <tr>
                            <th className="px-6 py-4 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Parceiro</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Cidades Atendidas</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-neutral-muted uppercase tracking-widest text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-border dark:divide-neutral-800">
                          {filteredPartnersForFeasibility.length > 0 ? (
                            filteredPartnersForFeasibility.map(partner => (
                              <tr key={partner.id} className="hover:bg-neutral-bg/30 dark:hover:bg-neutral-900/30 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <PartnerLogo name={partner.name} url={partner.logo_url} size="sm" />
                                    <span className="font-bold text-neutral-text">{partner.name}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-xs text-neutral-muted line-clamp-1" title={partner.cities}>
                                    {partner.cities}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                    partner.status === 'active' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                                  )}>
                                    {partner.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button 
                                    onClick={() => {
                                      setActiveTab('points');
                                      setShowPointModal(true);
                                      setNewPoint(prev => ({ ...prev, partner_id: partner.id, state: partner.state }));
                                    }}
                                    className="text-brand-accent hover:underline text-xs font-bold"
                                  >
                                    Vincular Projeto
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-6 py-12 text-center text-neutral-muted italic text-sm">
                                Nenhum parceiro encontrado para esta região.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="saas-card p-6 bg-brand-accent/5 border-brand-accent/10">
                      <h4 className="font-bold text-brand-accent mb-2 flex items-center gap-2">
                        <Globe size={16} />
                        Resumo de Cobertura
                      </h4>
                      <p className="text-xs text-neutral-muted leading-relaxed">
                        Encontramos {filteredPartnersForFeasibility.length} parceiros que atendem a região de {feasibilitySearch.city || 'todo o Brasil'}.
                      </p>
                    </div>
                    <MapComponent 
                      points={points.filter(p => filteredPartnersForFeasibility.some(part => part.id === p.partner_id))} 
                      customers={customers}
                      height="300px" 
                      onExpand={() => {
                        setExpandedMapPoints(points.filter(p => filteredPartnersForFeasibility.some(part => part.id === p.partner_id)));
                        setIsMapExpanded(true);
                      }}
                    />
                  </div>
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
              className="space-y-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex gap-1 bg-neutral-bg dark:bg-neutral-900 p-1 rounded-full border border-neutral-border dark:border-neutral-800">
                  <button 
                    onClick={() => setPartnerFilter('active')}
                    className={cn(
                      "px-6 py-2 rounded-full text-xs font-bold transition-all",
                      partnerFilter === 'active' ? "bg-brand-accent text-white" : "text-neutral-muted hover:text-neutral-text"
                    )}
                  >
                    Ativos
                  </button>
                  <button 
                    onClick={() => setPartnerFilter('cancelled')}
                    className={cn(
                      "px-6 py-2 rounded-full text-xs font-bold transition-all",
                      partnerFilter === 'cancelled' ? "bg-rose-600 text-white" : "text-neutral-muted hover:text-neutral-text"
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
                    className="btn-pill bg-white dark:bg-neutral-900 text-neutral-text border border-neutral-border dark:border-neutral-800 hover:bg-neutral-bg dark:hover:bg-neutral-800 flex items-center gap-2"
                  >
                    <Upload size={16} />
                    <span>Importar CSV</span>
                  </button>
                  <button 
                    onClick={handleDownloadTemplate}
                    className="btn-pill bg-white dark:bg-neutral-900 text-neutral-text border border-neutral-border dark:border-neutral-800 hover:bg-neutral-bg dark:hover:bg-neutral-800 flex items-center gap-2"
                  >
                    <Download size={16} />
                    <span>Modelo</span>
                  </button>
                </div>
              </div>

              <div className="saas-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-bg dark:bg-neutral-900/50 border-b border-neutral-border dark:border-neutral-800">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Empresa</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Contato</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Localização</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Incidentes SLA</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Status</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-border dark:divide-neutral-800">
                      {filteredPartners.length > 0 ? (
                        filteredPartners.map((partner) => (
                          <tr key={partner.id} className={cn("hover:bg-neutral-bg/50 dark:hover:bg-neutral-900/30 transition-all", partner.status === 'cancelled' && "opacity-50")}>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <PartnerLogo name={partner.name} url={partner.logo_url} />
                                <span className="font-bold text-neutral-text text-lg">{partner.name}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-neutral-muted font-medium">{partner.contact}</td>
                            <td className="px-8 py-6 text-neutral-muted font-medium">
                              <div className="flex flex-col">
                                <span className="text-neutral-text font-bold">{partner.state}</span>
                                <span className="text-[10px] text-neutral-muted font-bold uppercase tracking-wider truncate max-w-[200px]" title={partner.cities}>
                                  {partner.cities}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "px-3 py-1 rounded-full text-xs font-bold",
                                  (partner.sla_incidents || 0) > 0 ? "bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20" : "bg-neutral-bg text-neutral-muted border border-neutral-border dark:bg-neutral-800 dark:border-neutral-700"
                                )}>
                                  {partner.sla_incidents || 0}
                                </div>
                                <button 
                                  onClick={() => handleReportIncident(partner.id)}
                                  className="p-1.5 text-neutral-muted hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all"
                                  title="Reportar Incidente SLA"
                                >
                                  <AlertTriangle size={14} />
                                </button>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className={cn(
                                "px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest",
                                partner.status === 'active' ? "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                              )}>
                                {partner.status}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => setShowEditPartnerModal(partner)}
                                  className="p-2.5 text-neutral-muted hover:text-brand-accent hover:bg-brand-accent/5 rounded-full transition-all"
                                  title="Editar Parceiro"
                                >
                                  <Edit2 size={18} />
                                </button>
                                {partner.status === 'active' ? (
                                  <button 
                                    onClick={() => handleCancelPartner(partner.id)}
                                    className="p-2.5 text-neutral-muted hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all"
                                    title="Cancelar Parceiro"
                                  >
                                    <XCircle size={20} />
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleReactivatePartner(partner.id)}
                                    className="p-2.5 text-neutral-muted hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all"
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
                                  className="p-2.5 text-neutral-muted hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all"
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
                          <td colSpan={6} className="px-8 py-20 text-center text-neutral-muted font-medium italic">
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
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex gap-1 bg-neutral-bg dark:bg-neutral-900 p-1 rounded-full border border-neutral-border dark:border-neutral-800 w-fit">
                  <button 
                    onClick={() => setPointFilter('active')}
                    className={cn(
                      "px-6 py-2 rounded-full text-xs font-bold transition-all",
                      pointFilter === 'active' ? "bg-brand-accent text-white" : "text-neutral-muted hover:text-neutral-text"
                    )}
                  >
                    Ativos
                  </button>
                  <button 
                    onClick={() => setPointFilter('cancelled')}
                    className={cn(
                      "px-6 py-2 rounded-full text-xs font-bold transition-all",
                      pointFilter === 'cancelled' ? "bg-rose-600 text-white" : "text-neutral-muted hover:text-neutral-text"
                    )}
                  >
                    Cancelados
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="w-64">
                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                        <SelectTrigger className="bg-white dark:bg-neutral-900 shadow-xl border-neutral-border dark:border-neutral-800 rounded-2xl h-12 text-[10px] uppercase font-black px-6 hover:border-brand-accent/50 transition-all">
                          <SelectValue placeholder="SELECIONE O CLIENTE DESTINO" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-neutral-950 border-neutral-border dark:border-neutral-800 shadow-2xl">
                          <SelectItem value="pending" className="font-bold text-neutral-muted italic">Nenhum (Ponto Avulso)</SelectItem>
                          {customers.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                  </div>

                  <input
                    type="file"
                    accept=".kml"
                    className="hidden"
                    ref={kmlInputRef}
                    onChange={handleImportKML}
                  />
                  <button 
                    onClick={() => {
                      if (!selectedCustomerId) {
                        setToast({ message: 'Selecione um cliente antes de importar.', type: 'error' });
                        return;
                      }
                      kmlInputRef.current?.click();
                    }}
                    className={cn(
                      "flex items-center gap-2.5 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm",
                      selectedCustomerId 
                        ? "bg-brand-accent text-white hover:bg-brand-accent/90" 
                        : "bg-neutral-bg dark:bg-slate-900/50 border border-neutral-border dark:border-white/5 text-neutral-muted cursor-not-allowed opacity-50"
                    )}
                  >
                    <Globe size={14} />
                    Importar KML
                  </button>

                  <div className="flex gap-1 bg-neutral-bg dark:bg-neutral-900 p-1 rounded-2xl border border-neutral-border dark:border-neutral-800">
                    <button 
                      onClick={() => setActivePointsSubTab('list')}
                      className={cn(
                        "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        activePointsSubTab === 'list' 
                          ? "bg-white dark:bg-slate-800 text-brand-accent shadow-sm" 
                          : "text-neutral-muted hover:text-neutral-text"
                      )}
                    >
                      Lista de Pontos
                    </button>
                    <button 
                      onClick={() => setActivePointsSubTab('groups')}
                      className={cn(
                        "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        activePointsSubTab === 'groups' 
                          ? "bg-white dark:bg-slate-800 text-brand-accent shadow-sm" 
                          : "text-neutral-muted hover:text-neutral-text"
                      )}
                    >
                      Clientes
                    </button>
                  </div>
                </div>
              </div>

              {activePointsSubTab === 'list' ? (
                <div key="list-view" className="saas-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-bg dark:bg-neutral-900/50 border-b border-neutral-border dark:border-neutral-800">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Cliente Final</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Endereço</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Parceiro</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest text-center">Finanças (R$)</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest">SLA</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest text-center">Status</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-neutral-muted uppercase tracking-widest text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-border dark:divide-neutral-800">
                      {filteredPoints.length > 0 ? (
                        filteredPoints.map((point) => (
                          <tr key={point.id} className={cn("hover:bg-neutral-bg/50 dark:hover:bg-neutral-900/30 transition-all", point.status === 'cancelled' && "opacity-50")}>
                            <td className="px-8 py-6">
                              <p className="font-extrabold text-neutral-text text-base leading-tight uppercase tracking-tighter">{point.customer_name}</p>
                              {(point.point_title || point.customer_id) && (
                                <p className="text-[10px] text-brand-accent font-black uppercase mt-1 tracking-widest">
                                  {point.point_title || (customers.find(c => c.id === point.customer_id)?.name || 'Vínculo Ativo')}
                                </p>
                              )}
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-sm text-neutral-text font-semibold">{point.address}</p>
                              <p className="text-[10px] text-neutral-muted font-bold uppercase tracking-widest mt-1">{point.city}, {point.state}</p>
                            </td>
                            <td className="px-8 py-6 text-brand-accent font-bold">{point.partner_name || 'N/A'}</td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col items-center">
                                <span className="text-[11px] font-black text-emerald-600">REC: {point.revenue?.toLocaleString('pt-BR') || 0}</span>
                                <span className="text-[11px] font-black text-rose-500">DESP: {point.expense?.toLocaleString('pt-BR') || 0}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  point.sla_status === 'within' ? 'bg-emerald-500' : 
                                  point.sla_status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
                                )} />
                                <span className={cn(
                                  "text-[10px] font-bold uppercase tracking-widest",
                                  point.sla_status === 'within' ? 'text-emerald-600' : 
                                  point.sla_status === 'warning' ? 'text-amber-600' : 'text-rose-600'
                                )}>
                                  {point.sla_status === 'within' ? 'Dentro' : 
                                   point.sla_status === 'warning' ? 'Alerta' : 'Violado'}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className={cn(
                                "px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest",
                                point.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:border-emerald-900/50' : 
                                point.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100 dark:border-amber-900/50' : 
                                point.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border border-rose-100 dark:border-rose-900/50' : 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20 dark:border-brand-accent/40'
                              )}>
                                {point.status}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex justify-end gap-1">
                                {point.status !== 'cancelled' ? (
                                  <>
                                    <button 
                                      onClick={() => setShowEditPointModal(point)}
                                      className="p-2.5 text-neutral-muted hover:text-brand-accent hover:bg-brand-accent/5 rounded-full transition-all"
                                      title="Editar Ponto"
                                    >
                                      <Edit2 size={18} />
                                    </button>
                                    <button 
                                      onClick={() => setShowReductionModal({id: point.id, currentCost: point.expense})}
                                      className="p-2.5 text-neutral-muted hover:text-amber-600 hover:bg-amber-50 rounded-full transition-all"
                                      title="Reduzir Despesa"
                                    >
                                      <ArrowDownCircle size={18} />
                                    </button>
                                    <button 
                                      onClick={() => handleCancelPoint(point.id)}
                                      className="p-2.5 text-neutral-muted hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all"
                                      title="Cancelar Contrato"
                                    >
                                      <XCircle size={18} />
                                    </button>
                                  </>
                                ) : (
                                  <button 
                                    onClick={() => handleReactivatePoint(point.id)}
                                    className="p-2.5 text-neutral-muted hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all"
                                    title="Reativar Contrato"
                                  >
                                    <CheckCircle2 size={18} />
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleDeletePoint(point.id)}
                                  className="p-2.5 text-neutral-muted hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all"
                                  title="Excluir Permanentemente"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-8 py-20 text-center text-neutral-muted font-medium italic">
                            Nenhum ponto de entrega encontrado para os filtros aplicados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              ) : (
                <div className="grid grid-cols-1 gap-8">
                  {clients.map((client, idx) => (
                    <div key={idx} className="saas-card overflow-hidden group/card shadow-lg hover:shadow-brand-accent/5 transition-all">
                      <div className="p-8 border-b border-neutral-border dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-neutral-bg/30 dark:bg-slate-900/40">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-brand-accent/10 dark:bg-brand-accent/20 rounded-[1.5rem] flex items-center justify-center text-brand-accent">
                            <Users size={28} />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-neutral-text dark:text-white uppercase tracking-tighter leading-none">{client.name}</h3>
                            <div className="flex gap-4 mt-2">
                              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-accent/5 rounded-md">
                                <MapPin size={10} className="text-brand-accent" />
                                <p className="text-[10px] text-neutral-muted font-bold uppercase tracking-widest">{client.pointsCount} Pontos</p>
                              </div>
                              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-accent/5 rounded-md">
                                <Network size={10} className="text-brand-accent" />
                                <p className="text-[10px] text-neutral-muted font-bold uppercase tracking-widest">{client.partnersCount} Parceiros</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                           {(client.states as string[]).map(s => (
                             <span key={s} className="px-3 py-1 bg-white dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-brand-accent rounded-xl border border-neutral-border dark:border-white/5 shadow-sm">
                               {s}
                             </span>
                           ))}
                        </div>
                      </div>
                      <div className="p-8 bg-white/50 dark:bg-slate-900/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {(client.points || []).map(point => (
                            <div 
                              key={point.id} 
                              onClick={() => setShowEditPointModal(point)}
                              className="p-6 rounded-[2.5rem] border border-neutral-border dark:border-white/5 bg-white dark:bg-slate-900/40 hover:border-brand-accent/50 transition-all hover:shadow-2xl hover:shadow-brand-accent/5 group/pt relative overflow-hidden active:scale-95 cursor-pointer"
                            >
                              <div className="absolute top-0 right-0 p-4">
                                <span className={cn(
                                  "text-[8px] font-black uppercase px-2.5 py-1 rounded-full tracking-tighter border shadow-sm",
                                  point.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                  point.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                  'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                )}>
                                  {point.status === 'completed' ? 'Concluído' : point.status === 'pending' ? 'Pendente' : 'Cancelado'}
                                </span>
                              </div>
                              <div className="flex flex-col h-full">
                                <p className="text-base font-bold text-neutral-text dark:text-neutral-100 mb-6 line-clamp-2 pr-16 leading-tight">{point.address}</p>
                                <div className="mt-auto space-y-3">
                                  <div className="flex items-center gap-3 text-[11px] text-neutral-muted font-bold">
                                    <div className="w-6 h-6 rounded-xl bg-neutral-bg dark:bg-slate-800 flex items-center justify-center text-neutral-muted">
                                      <MapPin size={12} />
                                    </div>
                                    <span className="truncate">{point.city}, {point.state}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] text-brand-accent font-bold">
                                    <div className="w-6 h-6 rounded-xl bg-brand-accent/10 flex items-center justify-center">
                                      <Network size={12} />
                                    </div>
                                    <span className="truncate">{point.partner_name || 'Aguardando Parceiro'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <footer className="mt-20 py-12 border-t border-neutral-border flex flex-col md:flex-row justify-between items-center gap-8 text-neutral-muted">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-accent/10 rounded-lg flex items-center justify-center text-brand-accent">
              <Network size={16} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest">Sintese Core | Inteligência Last-Mile</p>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest">
            © {new Date().getFullYear()} Todos os direitos reservado Miqueias Dev
          </p>
        </footer>
      </div>
    </main>

      {/* Modals */}
      <AnimatePresence>
        {(showPartnerModal || showEditPartnerModal || showPointModal || showReductionModal || reportingIncidentPartnerId || showCustomerModal || showEditPointModal || showImportModal) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-text/20 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-neutral-950 rounded-[2rem] p-8 lg:p-10 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto border border-neutral-border dark:border-neutral-800"
            >
              {showImportModal && (
                <>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                      <Upload size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold dark:text-white">Importar Infraestrutura</h3>
                      <p className="text-xs text-neutral-muted font-bold uppercase tracking-widest leading-none mt-1">Vincular KML a um Cliente</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-muted mb-3">Selecione o Cliente Destino</label>
                      <Select value={selectedCustomerId} onValueChange={(val) => {
                        setSelectedCustomerId(val);
                      }}>
                        <SelectTrigger className="rounded-2xl py-6 h-auto bg-white dark:bg-neutral-900 border border-neutral-border dark:border-neutral-800 relative z-[201] ring-offset-background focus:ring-2 focus:ring-brand-accent/20">
                          <SelectValue placeholder="Escolha um cliente..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-neutral-950 border border-neutral-border dark:border-neutral-800 shadow-2xl">
                          <SelectItem value="pending" className="font-bold text-neutral-muted italic">Nenhum (Ponto Avulso)</SelectItem>
                          {customers.map(c => (
                            <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-6 bg-neutral-bg dark:bg-neutral-900 rounded-3xl border border-dashed border-neutral-border dark:border-neutral-800 flex flex-col items-center gap-4">
                      <div className="p-3 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm">
                        <Globe size={24} className="text-neutral-muted" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-neutral-text">Arraste seu arquivo .KML</p>
                        <p className="text-[10px] text-neutral-muted uppercase tracking-widest mt-1">Ou clique para selecionar</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        id="kml-upload"
                        accept=".kml" 
                        onChange={(e) => {
                          handleImportKML(e);
                          setShowImportModal(false);
                        }}
                      />
                      <button 
                        onClick={() => {
                          if (!selectedCustomerId || selectedCustomerId === '') {
                            setToast({ message: 'Por favor, selecione um cliente antes de escolher o arquivo.', type: 'error' });
                            return;
                          }
                          document.getElementById('kml-upload')?.click();
                        }}
                        className="w-full px-6 py-4 rounded-2xl bg-brand-accent text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-brand-hover shadow-xl shadow-brand-accent/20 transition-all"
                      >
                        Selecionar Arquivos
                      </button>
                    </div>

                    <button 
                      onClick={() => setShowImportModal(false)}
                      className="w-full py-4 text-xs font-bold text-neutral-muted uppercase tracking-widest hover:text-neutral-text"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              )}
              {reportingIncidentPartnerId && (
                <>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold dark:text-white">Registrar Incidente</h3>
                      <p className="text-xs text-neutral-muted font-bold uppercase tracking-widest leading-none mt-1">Impacto no SLA do parceiro</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-muted mb-3">Descrição do Incidente</label>
                      <textarea
                        autoFocus
                        rows={5}
                        className="w-full bg-neutral-bg dark:bg-neutral-900 border border-neutral-border dark:border-neutral-800 rounded-2xl p-4 text-sm font-semibold focus:ring-2 focus:ring-rose-500 outline-none transition-all resize-none"
                        placeholder="Descreva o que aconteceu em detalhes..."
                        value={incidentDescription}
                        onChange={e => setIncidentDescription(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setReportingIncidentPartnerId(null)}
                        className="flex-1 px-6 py-4 rounded-xl border border-neutral-border dark:border-neutral-800 text-neutral-muted font-bold hover:bg-neutral-bg dark:hover:bg-neutral-900 transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={submitIncidentReport}
                        disabled={!incidentDescription.trim()}
                        className="flex-1 px-6 py-4 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-xl shadow-rose-600/20 transition-all disabled:opacity-50 disabled:shadow-none"
                      >
                        Confirmar Registro
                      </button>
                    </div>
                  </div>
                </>
              )}

              {showPartnerModal && (
                <>
                  <h3 className="text-2xl font-extrabold text-neutral-text mb-8 font-display">Cadastrar Novo Parceiro</h3>
                  <form onSubmit={handleAddPartner} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Nome da Empresa</label>
                      <Input 
                        required
                        className="rounded-2xl py-6"
                        value={newPartner.name}
                        onChange={e => setNewPartner({...newPartner, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Contato Direto</label>
                      <Input 
                        required
                        className="rounded-2xl py-6"
                        value={newPartner.contact}
                        onChange={e => setNewPartner({...newPartner, contact: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">UF</label>
                        <Input 
                          required
                          maxLength={2}
                          className="rounded-2xl py-6 uppercase"
                          value={newPartner.state}
                          onChange={e => setNewPartner({...newPartner, state: e.target.value.toUpperCase()})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Cidades de Atuação</label>
                        <Input 
                          required
                          placeholder="Ex: São Paulo, Campinas"
                          className="rounded-2xl py-6"
                          value={newPartner.cities}
                          onChange={e => setNewPartner({...newPartner, cities: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">URL da Logo (Opcional)</label>
                      <Input 
                        className="rounded-2xl py-6"
                        placeholder="https://exemplo.com/logo.png"
                        value={newPartner.logo_url}
                        onChange={e => setNewPartner({...newPartner, logo_url: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-4 pt-6">
                      <button 
                        type="button"
                        onClick={() => setShowPartnerModal(false)}
                        className="flex-1 px-6 py-4 rounded-2xl border border-neutral-border text-neutral-muted font-bold hover:bg-neutral-bg transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 px-6 py-4 rounded-2xl bg-brand-accent text-white font-bold hover:bg-brand-hover shadow-xl shadow-brand-accent/20 transition-all"
                      >
                        Salvar Parceiro
                      </button>
                    </div>
                  </form>
                </>
              )}

              {showEditPartnerModal && (
                <>
                  <h3 className="text-2xl font-extrabold text-neutral-text mb-8 font-display">Editar Parceiro</h3>
                  <form onSubmit={handleUpdatePartner} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Nome da Empresa</label>
                      <Input 
                        required
                        className="rounded-2xl py-6"
                        value={showEditPartnerModal.name}
                        onChange={e => setShowEditPartnerModal({...showEditPartnerModal, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Contato Direto</label>
                      <Input 
                        required
                        className="rounded-2xl py-6"
                        value={showEditPartnerModal.contact}
                        onChange={e => setShowEditPartnerModal({...showEditPartnerModal, contact: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">UF</label>
                        <Input 
                          required
                          maxLength={2}
                          className="rounded-2xl py-6 uppercase"
                          value={showEditPartnerModal.state}
                          onChange={e => setShowEditPartnerModal({...showEditPartnerModal, state: e.target.value.toUpperCase()})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Cidades de Atuação</label>
                        <Input 
                          required
                          className="rounded-2xl py-6"
                          value={showEditPartnerModal.cities}
                          onChange={e => setShowEditPartnerModal({...showEditPartnerModal, cities: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">URL da Logo (Opcional)</label>
                      <Input 
                        className="rounded-2xl py-6"
                        value={showEditPartnerModal.logo_url || ''}
                        onChange={e => setShowEditPartnerModal({...showEditPartnerModal, logo_url: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-4 pt-6">
                      <button 
                        type="button"
                        onClick={() => setShowEditPartnerModal(null)}
                        className="flex-1 px-6 py-4 rounded-2xl border border-neutral-border text-neutral-muted font-bold hover:bg-neutral-bg transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 px-6 py-4 rounded-2xl bg-brand-accent text-white font-bold hover:bg-brand-hover shadow-xl shadow-brand-accent/20 transition-all"
                      >
                        Atualizar Dados
                      </button>
                    </div>
                  </form>
                </>
              )}

              {showPointModal && (
                <>
                  <h3 className="text-2xl font-extrabold text-neutral-text mb-8 font-display">Novo Ponto Operacional</h3>
                  <form onSubmit={handleAddPoint} className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Cliente Solicitante</label>
                      <Select 
                        value={newPoint.customer_id} 
                        onValueChange={id => {
                          const c = customers.find(cust => cust.id === id);
                          setNewPoint({...newPoint, customer_id: id, customer_name: c?.name || ''});
                        }}
                      >
                        <SelectTrigger className="rounded-2xl py-6 h-auto bg-white dark:bg-neutral-900 border-neutral-border dark:border-neutral-800">
                          <SelectValue placeholder="Selecione o Cliente" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-neutral-950 border-neutral-border dark:border-neutral-800">
                          {customers.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Nome/Identificação do Ponto</label>
                      <Input 
                        required
                        className="rounded-2xl py-6"
                        value={newPoint.customer_name} // Using customer_name for Point Title if custom
                        onChange={e => setNewPoint({...newPoint, customer_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Endereço Completo</label>
                      <Input 
                        required
                        className="rounded-2xl py-6"
                        value={newPoint.address}
                        onChange={e => setNewPoint({...newPoint, address: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">UF</label>
                        <Input 
                          required
                          maxLength={2}
                          className="rounded-2xl py-6 uppercase"
                          value={newPoint.state}
                          onChange={e => setNewPoint({...newPoint, state: e.target.value.toUpperCase()})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Cidade</label>
                        <Input 
                          required
                          className="rounded-2xl py-6"
                          value={newPoint.city}
                          onChange={e => setNewPoint({...newPoint, city: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Latitude</label>
                        <Input 
                          type="number"
                          step="any"
                          className="rounded-2xl py-6"
                          value={newPoint.lat || ''}
                          onChange={e => setNewPoint({...newPoint, lat: parseFloat(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Longitude</label>
                        <Input 
                          type="number"
                          step="any"
                          className="rounded-2xl py-6"
                          value={newPoint.lng || ''}
                          onChange={e => setNewPoint({...newPoint, lng: parseFloat(e.target.value)})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Parceiro Responsável</label>
                      <Select onValueChange={(val) => setNewPoint({...newPoint, partner_id: val})}>
                        <SelectTrigger className="rounded-2xl py-6 bg-white dark:bg-neutral-900 border-neutral-border dark:border-neutral-800">
                          <SelectValue placeholder="Selecione um parceiro" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-neutral-950 border-neutral-border dark:border-neutral-800">
                          {partners.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name} ({p.state})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Equipamento (ONT/Router)</label>
                        <Input 
                          className="rounded-2xl py-6"
                          placeholder="Ex: Huawei HG8245H"
                          value={newPoint.equipment || ''}
                          onChange={e => setNewPoint({...newPoint, equipment: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Banda Contratada</label>
                        <Input 
                          className="rounded-2xl py-6"
                          placeholder="Ex: 500Mbps"
                          value={newPoint.bandwidth || ''}
                          onChange={e => setNewPoint({...newPoint, bandwidth: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Receita Mensal (Venda R$)</label>
                        <Input 
                          required
                          className="rounded-2xl py-6"
                          placeholder="R$ 0,00"
                          value={formatCurrency(newPoint.revenue)}
                          onChange={e => handleCurrencyInput(e.target.value, (val) => setNewPoint({...newPoint, revenue: val}))}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Despesa Mensal (Custo R$)</label>
                        <Input 
                          required
                          className="rounded-2xl py-6"
                          placeholder="R$ 0,00"
                          value={formatCurrency(newPoint.expense)}
                          onChange={e => handleCurrencyInput(e.target.value, (val) => setNewPoint({...newPoint, expense: val}))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Status SLA</label>
                        <Select onValueChange={(val) => setNewPoint({...newPoint, sla_status: val as any})} defaultValue={newPoint.sla_status}>
                          <SelectTrigger className="rounded-2xl py-6 bg-white dark:bg-neutral-900 border-neutral-border dark:border-neutral-800">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-neutral-950 border-neutral-border dark:border-neutral-800">
                            <SelectItem value="within">Dentro do SLA</SelectItem>
                            <SelectItem value="warning">Alerta de Prazo</SelectItem>
                            <SelectItem value="breached">SLA Violado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button 
                        type="button"
                        onClick={() => setShowPointModal(false)}
                        className="flex-1 px-6 py-4 rounded-2xl border border-neutral-border text-neutral-muted font-bold hover:bg-neutral-bg transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 px-6 py-4 rounded-2xl bg-brand-accent text-white font-bold hover:bg-brand-hover shadow-xl shadow-brand-accent/20 transition-all"
                      >
                        Salvar Ponto
                      </button>
                    </div>
                  </form>
                </>
              )}

              {showReductionModal && (
                <>
                  <h3 className="text-2xl font-extrabold text-neutral-text mb-2 font-display">Redução de Valor</h3>
                  <p className="text-neutral-muted text-sm mb-8 font-bold uppercase tracking-widest">Custo Atual: <span className="text-brand-accent font-extrabold">R$ {showReductionModal.currentCost.toLocaleString('pt-BR')}</span></p>
                  <form onSubmit={handleApplyReduction} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Valor do Desconto (R$)</label>
                      <Input 
                        required
                        autoFocus
                        className="rounded-2xl py-6"
                        placeholder="R$ 0,00"
                        value={formatCurrency(reductionValue)}
                        onChange={e => handleCurrencyInput(e.target.value, setReductionValue)}
                      />
                      <p className="text-[10px] font-bold text-brand-accent mt-3 uppercase tracking-widest">Novo custo operacional: R$ {(showReductionModal.currentCost - reductionValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="flex gap-4 pt-6">
                      <button 
                        type="button"
                        onClick={() => setShowReductionModal(null)}
                        className="flex-1 px-6 py-4 rounded-2xl border border-neutral-border text-neutral-muted font-bold hover:bg-neutral-bg transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 px-6 py-4 rounded-2xl bg-amber-500 text-white font-bold hover:bg-amber-600 shadow-xl shadow-amber-500/20 transition-all"
                      >
                        Aplicar Redução
                      </button>
                    </div>
                  </form>
                </>
              )}

              {showCustomerModal && (
                <>
                  <h3 className="text-2xl font-extrabold text-neutral-text mb-8 font-display">Cadastro Completo de Cliente</h3>
                  <form onSubmit={handleAddCustomer} className="space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Razão Social / Nome Fantasia</label>
                        <Input 
                          required
                          className="rounded-2xl py-6"
                          value={newCustomer.name}
                          onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">CNPJ</label>
                        <Input 
                          className="rounded-2xl py-6"
                          placeholder="00.000.000/0000-00"
                          value={newCustomer.cnpj || ''}
                          onChange={e => setNewCustomer({...newCustomer, cnpj: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Responsável / Contato</label>
                        <Input 
                          className="rounded-2xl py-6"
                          value={newCustomer.contact || ''}
                          onChange={e => setNewCustomer({...newCustomer, contact: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Telefone / WhatsApp</label>
                        <Input 
                          className="rounded-2xl py-6"
                          value={newCustomer.phone || ''}
                          onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">E-mail para Faturamento</label>
                        <Input 
                          type="email"
                          className="rounded-2xl py-6"
                          value={newCustomer.email || ''}
                          onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Endereço Sede</label>
                      <Input 
                        className="rounded-2xl py-6"
                        value={newCustomer.address || ''}
                        onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Cidade</label>
                        <Input 
                          className="rounded-2xl py-6"
                          value={newCustomer.city || ''}
                          onChange={e => setNewCustomer({...newCustomer, city: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">UF (Estado)</label>
                        <Input 
                          maxLength={2}
                          className="rounded-2xl py-6 uppercase"
                          value={newCustomer.state || ''}
                          onChange={e => setNewCustomer({...newCustomer, state: e.target.value.toUpperCase()})}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Cor do Identificador no Mapa</label>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {MAP_COLORS.map(c => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => setNewCustomer({...newCustomer, color: c.value})}
                            className={cn(
                              "w-8 h-8 rounded-full border-2 transition-all hover:scale-110 shadow-sm",
                              newCustomer.color === c.value ? "border-brand-accent scale-110" : "border-transparent"
                            )}
                            style={{ backgroundColor: c.value }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button 
                        type="button"
                        onClick={() => setShowCustomerModal(false)}
                        className="flex-1 px-6 py-4 rounded-2xl border border-neutral-border text-neutral-muted font-bold hover:bg-neutral-bg transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 px-6 py-4 rounded-2xl bg-brand-accent text-white font-bold hover:bg-brand-hover shadow-xl shadow-brand-accent/20 transition-all"
                      >
                        Finalizar Cadastro
                      </button>
                    </div>
                  </form>
                </>
              )}

              {showEditPointModal && (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-extrabold text-neutral-text font-display">Editar Ponto Operacional</h3>
                      <p className="text-[10px] font-bold text-neutral-muted uppercase tracking-widest mt-1">Atualize os parâmetros técnicos e comerciais</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center text-brand-accent border border-brand-accent/20">
                      <MapPin size={24} />
                    </div>
                  </div>

                  <form onSubmit={handleUpdatePoint} className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Vincular Cliente</label>
                      <Select 
                        value={showEditPointModal.customer_id} 
                        onValueChange={(id) => {
                          const c = customers.find(cust => cust.id === id);
                          setShowEditPointModal({...showEditPointModal, customer_id: id, customer_name: c?.name || showEditPointModal.customer_name})
                        }}
                      >
                        <SelectTrigger className="rounded-2xl py-6 h-auto bg-white dark:bg-neutral-900 border-neutral-border dark:border-neutral-800">
                          <SelectValue placeholder="Selecione o Cliente..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-neutral-950 border-neutral-border dark:border-neutral-800">
                          {customers.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Nome de Referência</label>
                        <Input 
                          required
                          className="rounded-2xl py-6"
                          value={showEditPointModal.customer_name}
                          onChange={e => setShowEditPointModal({...showEditPointModal, customer_name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Parceiro Responsável</label>
                        <Select 
                          value={showEditPointModal.partner_id} 
                          onValueChange={(id) => {
                            const p = partners.find(part => part.id === id);
                            setShowEditPointModal({...showEditPointModal, partner_id: id, partner_name: p?.name || 'Aguardando'})
                          }}
                        >
                          <SelectTrigger className="rounded-2xl py-6 h-auto bg-white dark:bg-neutral-900 border-neutral-border dark:border-neutral-800">
                            <SelectValue placeholder="Selecione o Parceiro..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-neutral-950 border-neutral-border dark:border-neutral-800">
                            {partners.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Endereço de Instalação</label>
                      <Input 
                        required
                        className="rounded-2xl py-6"
                        value={showEditPointModal.address}
                        onChange={e => setShowEditPointModal({...showEditPointModal, address: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-5">
                       <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Cidade</label>
                          <Input 
                            className="rounded-2xl py-6"
                            value={showEditPointModal.city}
                            onChange={e => setShowEditPointModal({...showEditPointModal, city: e.target.value})}
                          />
                       </div>
                       <div>
                          <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">UF</label>
                          <Input 
                            maxLength={2}
                            className="rounded-2xl py-6 uppercase"
                            value={showEditPointModal.state}
                            onChange={e => setShowEditPointModal({...showEditPointModal, state: e.target.value.toUpperCase()})}
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Receita (Venda R$)</label>
                        <Input 
                          className="rounded-2xl py-6"
                          placeholder="R$ 0,00"
                          value={formatCurrency(showEditPointModal.revenue)}
                          onChange={e => handleCurrencyInput(e.target.value, (val) => setShowEditPointModal({...showEditPointModal, revenue: val}))}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Despesa (Custo R$)</label>
                        <Input 
                          className="rounded-2xl py-6"
                          placeholder="R$ 0,00"
                          value={formatCurrency(showEditPointModal.expense)}
                          onChange={e => handleCurrencyInput(e.target.value, (val) => setShowEditPointModal({...showEditPointModal, expense: val}))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Status Operacional</label>
                      <Select 
                        value={showEditPointModal.status} 
                        onValueChange={(val: any) => setShowEditPointModal({...showEditPointModal, status: val})}
                      >
                        <SelectTrigger className="rounded-2xl py-6 h-auto bg-white dark:bg-neutral-900 border-neutral-border dark:border-neutral-800">
                          <SelectValue placeholder="Status..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-neutral-950 border-neutral-border dark:border-neutral-800">
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="completed">Ativo / Concluído</SelectItem>
                          <SelectItem value="cancelled">Cancelado / Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-4 pt-6">
                      <button 
                        type="button"
                        onClick={() => setShowEditPointModal(null)}
                        className="flex-1 px-6 py-4 rounded-2xl border border-neutral-border text-neutral-muted font-bold hover:bg-neutral-bg transition-all"
                      >
                        Descartar
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 px-6 py-4 rounded-2xl bg-brand-accent text-white font-bold hover:bg-brand-hover shadow-xl shadow-brand-accent/20 transition-all font-display uppercase tracking-widest text-xs"
                      >
                        Salvar Alterações
                      </button>
                    </div>
                  </form>
                </>
              )}

              {showEditCustomerModal && (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-extrabold text-neutral-text font-display">Editar Dados do Cliente</h3>
                      <p className="text-[10px] font-bold text-neutral-muted uppercase tracking-widest mt-1">Atualize as informações cadastrais</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center text-brand-accent border border-brand-accent/20">
                      <Users size={24} />
                    </div>
                  </div>

                  <form onSubmit={handleUpdateCustomer} className="space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Razão Social / Nome Fantasia</label>
                        <Input 
                          required
                          className="rounded-2xl py-6"
                          value={showEditCustomerModal.name}
                          onChange={e => setShowEditCustomerModal({...showEditCustomerModal, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">CNPJ</label>
                        <Input 
                          className="rounded-2xl py-6"
                          placeholder="00.000.000/0000-00"
                          value={showEditCustomerModal.cnpj || ''}
                          onChange={e => setShowEditCustomerModal({...showEditCustomerModal, cnpj: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Responsável / Contato</label>
                        <Input 
                          className="rounded-2xl py-6"
                          value={showEditCustomerModal.contact || ''}
                          onChange={e => setShowEditCustomerModal({...showEditCustomerModal, contact: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Telefone / WhatsApp</label>
                        <Input 
                          className="rounded-2xl py-6"
                          value={showEditCustomerModal.phone || ''}
                          onChange={e => setShowEditCustomerModal({...showEditCustomerModal, phone: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">E-mail para Faturamento</label>
                        <Input 
                          type="email"
                          className="rounded-2xl py-6"
                          value={showEditCustomerModal.email || ''}
                          onChange={e => setShowEditCustomerModal({...showEditCustomerModal, email: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Endereço Sede</label>
                      <Input 
                        className="rounded-2xl py-6"
                        value={showEditCustomerModal.address || ''}
                        onChange={e => setShowEditCustomerModal({...showEditCustomerModal, address: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Cidade</label>
                        <Input 
                          className="rounded-2xl py-6"
                          value={showEditCustomerModal.city || ''}
                          onChange={e => setShowEditCustomerModal({...showEditCustomerModal, city: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">UF (Estado)</label>
                        <Input 
                          maxLength={2}
                          className="rounded-2xl py-6 uppercase"
                          value={showEditCustomerModal.state || ''}
                          onChange={e => setShowEditCustomerModal({...showEditCustomerModal, state: e.target.value.toUpperCase()})}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-muted uppercase tracking-widest mb-2 ml-1">Cor do Identificador no Mapa</label>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {MAP_COLORS.map(c => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => setShowEditCustomerModal({...showEditCustomerModal, color: c.value})}
                            className={cn(
                              "w-8 h-8 rounded-full border-2 transition-all hover:scale-110 shadow-sm",
                              showEditCustomerModal.color === c.value ? "border-brand-accent scale-110" : "border-transparent"
                            )}
                            style={{ backgroundColor: c.value }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button 
                        type="button"
                        onClick={() => setShowEditCustomerModal(null)}
                        className="flex-1 px-6 py-4 rounded-2xl border border-neutral-border text-neutral-muted font-bold hover:bg-neutral-bg transition-all font-display uppercase tracking-widest text-xs"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 px-6 py-4 rounded-2xl bg-brand-accent text-white font-bold hover:bg-brand-hover shadow-xl shadow-brand-accent/20 transition-all font-display uppercase tracking-widest text-xs"
                      >
                        Aplicar Alterações
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
        {/* Expanded Map Modal */}
        <Dialog open={isMapExpanded} onOpenChange={setIsMapExpanded}>
          <DialogContent 
            className="!fixed !inset-0 !z-[100000] !m-0 !h-screen !w-screen !max-w-none !gap-0 !border-none !bg-white !p-0 !shadow-none !outline-none !translate-x-0 !translate-y-0 !transform-none dark:!bg-slate-950 !rounded-none !overflow-hidden !flex !flex-col !items-stretch"
            showCloseButton={false}
          >
            <div className="w-full h-full relative flex flex-col">
              <div className="absolute top-6 right-6 z-[100001] flex items-center gap-3">
                <button 
                  onClick={() => setIsMapExpanded(false)}
                  className="p-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-neutral-border dark:border-white/10 text-neutral-muted hover:text-rose-600 transition-all hover:scale-110 active:scale-95"
                >
                  <Minimize2 size={24} />
                </button>
              </div>
              
              <div className="p-8 bg-white dark:bg-slate-900 border-b border-neutral-border dark:border-white/5 flex items-center justify-between z-[100000]">
                <div>
                  <h3 className="text-2xl font-black text-neutral-text dark:text-white uppercase tracking-tighter">Visão Estratégica Regional</h3>
                  <div className="text-[11px] text-neutral-muted font-bold uppercase tracking-[0.2em] leading-none mt-1.5 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Monitoramento Geográfico em Tempo Real
                  </div>
                </div>
              </div>
              
              <div className="flex-1 w-full relative">
                {isMapExpanded && (
                  <MapComponent 
                    points={points} 
                    customers={customers}
                    height="100%" 
                    onEditPoint={(p) => setShowEditPointModal(p)}
                    refreshTrigger={isMapExpanded}
                  />
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </AnimatePresence>
    </div>
  );
}
