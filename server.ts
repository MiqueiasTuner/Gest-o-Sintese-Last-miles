import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'gestao-sintese-last-miles-secret-key-2026';

// Extend Request type to include user information
interface AuthRequest extends Request {
  user?: any;
}

// Lazy initialization to prevent crash on startup if keys are missing
let supabase: SupabaseClient | null = null;
const getSupabase = (): SupabaseClient | null => {
  if (!supabase) {
    if (!supabaseUrl || !supabaseKey) {
      console.error('ERRO: SUPABASE_URL ou SUPABASE_KEY não configurados nas variáveis de ambiente!');
      return null;
    }
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
};

// Middleware de Autenticação
const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Token de acesso não fornecido." });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Token inválido ou expirado." });
    }
    req.user = user;
    next();
  });
};

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API Routes
  app.get("/api/health", (req, res) => {
    const client = getSupabase();
    res.json({ 
      status: "ok", 
      database: !!client,
      env: process.env.NODE_ENV
    });
  });

  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    
    // Validação básica de entrada
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "E-mail e senha são obrigatórios." });
    }

    const client = getSupabase();
    if (!client) return res.status(500).json({ success: false, message: "Erro de configuração do servidor." });
    
    try {
      const { data: user, error } = await client
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        return res.status(401).json({ success: false, message: "Credenciais inválidas." });
      }

      // SEGURANÇA: Usa APENAS Bcrypt para comparar senhas
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Credenciais inválidas." });
      }

      // Geração de Token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const { password: _, ...userWithoutPassword } = user;
      res.json({ success: true, user: userWithoutPassword, token });
    } catch (err) {
      console.error("Erro no login:", err);
      res.status(500).json({ success: false, message: "Erro interno ao processar o login." });
    }
  });

  // Rotas Protegidas
  app.use("/api/partners", authenticateToken);
  app.use("/api/points", authenticateToken);
  app.use("/api/stats", authenticateToken);

  app.get("/api/stats", async (req, res) => {
    const client = getSupabase();
    if (!client) return res.status(500).json({ error: "Servidor não configurado" });
    
    try {
      // PERFORMANCE: Paraleliza queries independentes
      const [
        { count: totalPartners },
        { count: totalPoints },
        { data: pointsData }
      ] = await Promise.all([
        client.from('partners').select('*', { count: 'exact', head: true }).neq('status', 'cancelled'),
        client.from('points').select('*', { count: 'exact', head: true }).neq('status', 'cancelled'),
        client.from('points').select('cost, state, created_at').neq('status', 'cancelled')
      ]);

      const totalCost = pointsData?.reduce((acc: number, curr: any) => acc + (Number(curr.cost) || 0), 0) || 0;
      
      const stateCounts: Record<string, number> = {};
      pointsData?.forEach(p => {
        stateCounts[p.state] = (stateCounts[p.state] || 0) + 1;
      });
      
      const pointsByState = Object.entries(stateCounts).map(([state, count]) => ({ state, count }));

      // Trends Logic
      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const curMonthPoints = pointsData?.filter(p => new Date(p.created_at) >= startOfCurrentMonth).length || 0;
      const lastMonthPoints = pointsData?.filter(p => {
        const d = new Date(p.created_at);
        return d >= startOfLastMonth && d < startOfCurrentMonth;
      }).length || 0;

      const curMonthCost = pointsData?.filter(p => new Date(p.created_at) >= startOfCurrentMonth)
        .reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0) || 0;
      const lastMonthCost = pointsData?.filter(p => {
        const d = new Date(p.created_at);
        return d >= startOfLastMonth && d < startOfCurrentMonth;
      }).reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0) || 0;

      const calcTrend = (cur: number, last: number) => {
        if (last === 0) return cur > 0 ? "+100%" : "0%";
        const diff = ((cur - last) / last) * 100;
        return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
      };

      const trends = {
        points: calcTrend(curMonthPoints, lastMonthPoints),
        cost: calcTrend(curMonthCost, lastMonthCost)
      };
      
      res.json({ totalPartners, totalPoints, totalCost, pointsByState, trends });
    } catch (err) {
      console.error("Erro stats:", err);
      res.status(500).json({ error: "Erro ao buscar estatísticas" });
    }
  });

  app.get("/api/stats/monthly", async (req, res) => {
    const client = getSupabase();
    if (!client) return res.status(500).json({ error: "Servidor não configurado" });
    try {
      const { data: points } = await client
        .from('points')
        .select('created_at, cost')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      const monthlyMap: Record<string, { count: number, total_cost: number }> = {};
      
      points?.forEach(p => {
        const date = new Date(p.created_at);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyMap[month]) {
          monthlyMap[month] = { count: 0, total_cost: 0 };
        }
        monthlyMap[month].count += 1;
        monthlyMap[month].total_cost += Number(p.cost) || 0;
      });

      const monthlyStats = Object.entries(monthlyMap)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => b.month.localeCompare(a.month))
        .slice(0, 12);

      res.json(monthlyStats);
    } catch (err) {
      res.status(500).json({ error: "Erro ao buscar estatísticas mensais" });
    }
  });

  app.get("/api/partners", async (req, res) => {
    const client = getSupabase();
    if (!client) return res.status(500).json({ error: "Servidor não configurado" });
    const { data, error } = await client.from('partners').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error("Supabase Error:", error);
      return res.status(500).json({ error: "Erro ao listar parceiros." });
    }
    res.json(data);
  });

  app.post("/api/partners", async (req, res) => {
    const { name, contact, state, city } = req.body;
    if (!name || !contact) return res.status(400).json({ error: "Nome e contato são obrigatórios." });
    
    const client = getSupabase();
    const { data, error } = await client!.from('partners').insert([{ name, contact, state, city }]).select();
    if (error) return res.status(500).json({ error: "Erro ao criar parceiro." });
    res.json(data[0]);
  });

  app.patch("/api/partners/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const client = getSupabase();
    const { error } = await client!.from('partners').update({ status }).eq('id', id);
    if (error) return res.status(500).json({ error: "Erro ao atualizar parceiro." });
    res.json({ success: true });
  });

  app.delete("/api/partners/:id", async (req, res) => {
    const { id } = req.params;
    const client = getSupabase();
    const { error } = await client!.from('partners').delete().eq('id', id);
    if (error) return res.status(500).json({ error: "Erro ao remover parceiro." });
    res.json({ success: true });
  });

  app.get("/api/points", async (req, res) => {
    const client = getSupabase();
    const { data, error } = await client!
      .from('points')
      .select('*, partners(name)')
      .order('created_at', { ascending: false });
    
    if (error) return res.status(500).json({ error: "Erro ao listar pontos." });
    
    const formattedData = data.map(p => ({
      ...p,
      partner_name: p.partners?.name
    }));
    
    res.json(formattedData);
  });

  app.post("/api/points", async (req, res) => {
    const { customer_name, address, city, state, partner_id, cost, status } = req.body;
    if (!customer_name || !address) return res.status(400).json({ error: "Nome e endereço são obrigatórios." });

    const client = getSupabase();
    const { data, error } = await client!
      .from('points')
      .insert([{ customer_name, address, city, state, partner_id: partner_id || null, cost, status }])
      .select();
    
    if (error) return res.status(500).json({ error: "Erro ao cadastrar ponto." });
    res.json(data[0]);
  });

  app.patch("/api/points/:id", async (req, res) => {
    const { id } = req.params;
    const { cost, status } = req.body;
    const client = getSupabase();
    
    const updates: any = {};
    if (cost !== undefined) updates.cost = cost;
    if (status !== undefined) updates.status = status;
    
    const { error } = await client!.from('points').update(updates).eq('id', id);
    if (error) return res.status(500).json({ error: "Erro ao atualizar ponto." });
    res.json({ success: true });
  });

  app.delete("/api/points/:id", async (req, res) => {
    const { id } = req.params;
    const client = getSupabase();
    const { error } = await client!.from('points').delete().eq('id', id);
    if (error) return res.status(500).json({ error: "Erro ao remover ponto." });
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
