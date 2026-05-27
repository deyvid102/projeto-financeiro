import { LayoutDashboard, ReceiptText, TrendingUp, WalletMinimal, Target, Network } from 'lucide-react';

export const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', minPlan: 'STARTER' },
  { icon: ReceiptText, label: 'Transações', path: '/transactions', minPlan: 'STARTER' },
  { icon: WalletMinimal, label: 'Despesas', path: '/expenses', minPlan: 'STARTER' },
  { icon: TrendingUp, label: 'Investimentos', path: '/investments', minPlan: 'PRO' },
  { icon: Network, label: 'Estratégia', path: '/strategy', minPlan: 'PRO' },
  { icon: Target, label: 'Caixinhas', path: '/goals', minPlan: 'STARTER' },
];
