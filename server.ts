import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

// Lazy initialization to prevent crash on startup if keys are missing
let supabase: any = null;
const getSupabase = () => {
  if (!supabase) {
    if (!supabaseUrl || !supabaseKey) {
      console.error('ERRO: SUPABASE_URL ou SUPABASE_KEY não configurados nas variáveis de ambiente!');
      return null;
    }
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
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
    const client = getSupabase();
    if (!client) return res.status(500).json({ success: false, message: "Configuração do banco de dados (URL/KEY) não encontrada nas variáveis de ambiente." });
    
    try {
      const { data: user, error } = await client
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        return res.status(401).json({ success: false, message: "E-mail não cadastrado no sistema." });
      }

      // 1. Tenta comparação direta (texto puro)
      if (password === user.password) {
        const { password: _, ...userWithoutPassword } = user;
        return res.json({ success: true, user: userWithoutPassword });
      }

      // 2. Tenta comparação via Bcrypt (caso a senha esteja hasheada)
      try {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          const { password: _, ...userWithoutPassword } = user;
          return res.json({ success: true, user: userWithoutPassword });
        }
      } catch (bcryptErr) {
        // Se cair aqui, é porque a senha no banco não é um hash válido, 
        // mas já testamos o texto puro acima.
      }

      res.status(401).json({ success: false, message: "Senha incorreta." });
    } catch (err) {
      console.error("Erro no login:", err);
      res.status(500).json({ success: false, message: "Erro interno ao processar o login." });
    }
  });

  app.get("/api/stats", async (req, res) => {
    const client = getSupabase();
    if (!client) return res.status(500).json({ error: "Banco de dados não configurado" });
    try {
      const { count: totalPartners } = await client.from('partners').select('*', { count: 'exact', head: true }).neq('status', 'cancelled');
      const { count: totalPoints } = await client.from('points').select('*', { count: 'exact', head: true }).neq('status', 'cancelled');
      
      const { data: pointsData } = await client.from('points').select('cost, state').neq('status', 'cancelled');
      const totalCost = pointsData?.reduce((acc: number, curr: any) => acc + (Number(curr.cost) || 0), 0) || 0;
      
      const stateCounts: Record<string, number> = {};
      pointsData?.forEach(p => {
        stateCounts[p.state] = (stateCounts[p.state] || 0) + 1;
      });
      
      const pointsByState = Object.entries(stateCounts).map(([state, count]) => ({ state, count }));

      // Trends
      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

      const { count: curMonthPoints } = await client.from('points').select('*', { count: 'exact', head: true }).gte('created_at', startOfCurrentMonth).neq('status', 'cancelled');
      const { count: lastMonthPoints } = await client.from('points').select('*', { count: 'exact', head: true }).gte('created_at', startOfLastMonth).lt('created_at', startOfCurrentMonth).neq('status', 'cancelled');
      
      const { data: curMonthCostData } = await client.from('points').select('cost').gte('created_at', startOfCurrentMonth).neq('status', 'cancelled');
      const { data: lastMonthCostData } = await client.from('points').select('cost').gte('created_at', startOfLastMonth).lt('created_at', startOfCurrentMonth).neq('status', 'cancelled');
      
      const curMonthCost = curMonthCostData?.reduce((acc: number, curr: any) => acc + (Number(curr.cost) || 0), 0) || 0;
      const lastMonthCost = lastMonthCostData?.reduce((acc: number, curr: any) => acc + (Number(curr.cost) || 0), 0) || 0;

      const calcTrend = (cur: number, last: number) => {
        if (last === 0) return cur > 0 ? "+100%" : "0%";
        const diff = ((cur - last) / last) * 100;
        return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
      };

      const trends = {
        points: calcTrend(curMonthPoints || 0, lastMonthPoints || 0),
        cost: calcTrend(curMonthCost, lastMonthCost)
      };
      
      res.json({ totalPartners, totalPoints, totalCost, pointsByState, trends });
    } catch (err) {
      res.status(500).json({ error: "Erro ao buscar estatísticas" });
    }
  });

  app.patch("/api/partners/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const client = getSupabase();
    if (!client) return res.status(500).json({ error: "Banco de dados não configurado" });
    const { error } = await client.from('partners').update({ status }).eq('id', id);
    if (error) return res.status(500).json(error);
    res.json({ success: true });
  });

  app.get("/api/stats/monthly", async (req, res) => {
    const client = getSupabase();
    if (!client) return res.status(500).json({ error: "Banco de dados não configurado" });
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
    if (!client) return res.status(500).json({ error: "Banco de dados não configurado" });
    const { data, error } = await client.from('partners').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json(error);
    res.json(data);
  });

  app.delete("/api/partners/:id", async (req, res) => {
    const { id } = req.params;
    const client = getSupabase();
    if (!client) return res.status(500).json({ error: "Banco de dados não configurado" });
    const { error } = await client.from('partners').delete().eq('id', id);
    if (error) return res.status(500).json(error);
    res.json({ success: true });
  });

  app.post("/api/partners", async (req, res) => {
    const { name, contact, state, city } = req.body;
    const client = getSupabase();
    if (!client) return res.status(500).json({ error: "Banco de dados não configurado" });
    const { data, error } = await client.from('partners').insert([{ name, contact, state, city }]).select();
    if (error) return res.status(500).json(error);
    res.json(data[0]);
  });

  app.get("/api/points", async (req, res) => {
    const client = getSupabase();
    if (!client) return res.status(500).json({ error: "Banco de dados não configurado" });
    const { data, error } = await client
      .from('points')
      .select('*, partners(name)')
      .order('created_at', { ascending: false });
    
    if (error) return res.status(500).json(error);
    
    const formattedData = data.map(p => ({
      ...p,
      partner_name: p.partners?.name
    }));
    
    res.json(formattedData);
  });

  app.patch("/api/points/:id", async (req, res) => {
    const { id } = req.params;
    const { cost, status } = req.body;
    const client = getSupabase();
    if (!client) return res.status(500).json({ error: "Banco de dados não configurado" });
    
    const updates: any = {};
    if (cost !== undefined) updates.cost = cost;
    if (status !== undefined) updates.status = status;
    
    const { error } = await client.from('points').update(updates).eq('id', id);
    if (error) return res.status(500).json(error);
    res.json({ success: true });
  });

  app.delete("/api/points/:id", async (req, res) => {
    const { id } = req.params;
    const client = getSupabase();
    if (!client) return res.status(500).json({ error: "Banco de dados não configurado" });
    const { error } = await client.from('points').delete().eq('id', id);
    if (error) return res.status(500).json(error);
    res.json({ success: true });
  });

  app.post("/api/points", async (req, res) => {
    const { customer_name, address, city, state, partner_id, cost, status } = req.body;
    const client = getSupabase();
    if (!client) return res.status(500).json({ error: "Banco de dados não configurado" });
    const { data, error } = await client
      .from('points')
      .insert([{ customer_name, address, city, state, partner_id: partner_id || null, cost, status }])
      .select();
    
    if (error) return res.status(500).json(error);
    res.json(data[0]);
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
