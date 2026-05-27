export const PLANS = {
  STARTER: {
    key: 'STARTER',
    name: 'Starter',
    price: 0.0,
    features: [
      'Dashboard simplificado',
      'Até 50 transações/mês',
      '3 caixinhas',
    ],
  },
  PRO: {
    key: 'PRO',
    name: 'Pro',
    price: 29.9,
    features: [
      'Tudo do Starter',
      'Transações ilimitadas',
      'Gráficos de gastos',
      'Alocação de ativos',
      'Relatório IA (5 min)',
      'Cotações em tempo real',
      'Gestão de patrimônio',
      'UML Strategy',
    ],
  },
  MAX: {
    key: 'MAX',
    name: 'Max',
    price: 59.9,
    features: [
      'Tudo do Pro',
      'Auditor IA (Chat)',
      'IA Instantânea',
      'Relatórios avançados',
      'Consultor dedicado',
      'Acesso antecipado a features',
    ],
  },
};

const PLAN_RANK = {
  STARTER: 0,
  PRO: 1,
  MAX: 2,
};

export function getPlan(key) {
  return PLANS[key] || null;
}

export function getPlanRank(key) {
  return PLAN_RANK[key?.toUpperCase?.()] ?? -1;
}

export function isPlanAtLeast(plan, targetPlan) {
  return getPlanRank(plan) >= getPlanRank(targetPlan);
}

export function listPlans() {
  return Object.values(PLANS);
}
