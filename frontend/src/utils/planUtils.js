export const PLAN_RANK = {
  STARTER: 1,
  PRO: 2,
  MAX: 3,
};

export const getStoredPlan = () => {
  const plan = localStorage.getItem('user_plan');
  if (plan && PLAN_RANK[plan.toUpperCase()]) {
    return plan.toUpperCase();
  }
  return 'STARTER';
};

export const setStoredPlan = (plan) => {
  const normalized = plan?.toUpperCase?.();
  if (normalized && PLAN_RANK[normalized]) {
    localStorage.setItem('user_plan', normalized);
    return normalized;
  }
  localStorage.setItem('user_plan', 'STARTER');
  return 'STARTER';
};

export const isPlanAtLeast = (plan, targetPlan) => {
  if (!plan || !targetPlan) return false;
  const current = PLAN_RANK[plan.toUpperCase()];
  const required = PLAN_RANK[targetPlan.toUpperCase()];
  return typeof current === 'number' && typeof required === 'number' && current >= required;
};

export const fetchAndStoreUserPlan = async (api) => {
  try {
    const response = await api.get('/subscriptions');
    const subscriptions = Array.isArray(response.data) ? response.data : [];
    const latestPlan = subscriptions[0]?.plan?.toUpperCase?.();
    return setStoredPlan(latestPlan);
  } catch (err) {
    return setStoredPlan('STARTER');
  }
};
