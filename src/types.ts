export interface Partner {
  id: string;
  name: string;
  contact: string;
  state: string;
  cities: string;
  logo_url?: string;
  status: string;
  created_at: any;
}

export interface Point {
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
  status: string;
  created_at: any;
}

export interface Stats {
  totalPartners: number;
  totalPoints: number;
  totalCost: number;
  pointsByState: { state: string; count: number }[];
  trends?: {
    points: string;
    cost: string;
  };
}
