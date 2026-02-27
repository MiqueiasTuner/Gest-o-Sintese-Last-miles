export interface Partner {
  id: number;
  name: string;
  contact: string;
  state: string;
  city: string;
  status: string;
  created_at: string;
}

export interface Point {
  id: number;
  customer_name: string;
  address: string;
  city: string;
  state: string;
  partner_id: number;
  partner_name?: string;
  cost: number;
  status: string;
  created_at: string;
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
