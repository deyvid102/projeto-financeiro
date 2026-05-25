import React from 'react';
import { Target, TrendingUp, Repeat, CreditCard, X } from 'lucide-react';

const CardChildFunction = ({ linkedFunction, onRemove }) => {
  if (!linkedFunction) return null;

  const { type, item } = linkedFunction;
  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0);
  const typeConfig = {
    goal: { icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Caixinha' },
    investment: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Investimento' },
    recurrence: { icon: Repeat, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Recorrência' },
    card: { icon: CreditCard, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Cartão' },
  };

  const config = typeConfig[type] || { icon: Target, color: 'text-gray-500', bg: 'bg-gray-500/10', label: 'Função' };
  const Icon = config.icon;

  const renderContent = () => {
    if (!item) {
      return (
        <div className="space-y-1">
          <p className="text-[9px] font-bold uppercase text-text-secondary">Função vinculada</p>
          <p className="text-[10px] font-bold text-text-primary">{config.label || type}</p>
          {linkedFunction.referenceId && (
            <p className="text-[8px] text-text-secondary break-words">ID: {linkedFunction.referenceId}</p>
          )}
        </div>
      );
    }

    switch (type) {
      case 'goal':
        const current = Number(item.currentAmount) || 0;
        const target = Number(item.targetAmount) || 0;
        const goalProgress = target > 0 ? (current / target) * 100 : 0;
        return (
          <div className="w-full space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase text-text-secondary">{item.name}</span>
              <span className="text-[8px] font-bold text-text-secondary">{Math.round(goalProgress)}%</span>
            </div>
            <div className="w-full bg-bg-main rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(goalProgress, 100)}%` }}
              />
            </div>
            <p className="text-[8px] text-text-secondary">
              {formatCurrency(current)} / {formatCurrency(target)}
            </p>
          </div>
        );

      case 'investment':
        const invested = Number(item.amountInvested || item.investedAmount || item.currentTotalValue) || 0;
        return (
          <div className="w-full space-y-1.5">
            <p className="text-[9px] font-bold uppercase text-text-secondary">{item.name}</p>
            <div className="flex items-center justify-between">
              <span className="text-[8px] text-text-secondary">{item.type}</span>
              <span className="text-[10px] font-bold text-text-primary">
                {formatCurrency(invested)}
              </span>
            </div>
            {item.ticker && (
              <p className="text-[8px] font-bold text-brand">{item.ticker}</p>
            )}
          </div>
        );

      case 'recurrence':
        const freqLabel = item.frequency === 'monthly' ? 'Mês' : item.frequency === 'weekly' ? 'Semana' : 'Ano';
        const nextDay = Array.isArray(item.dayOfMonth) ? item.dayOfMonth[0] : item.dayOfMonth || new Date().getDate();
        const amountRec = Number(item.amount) || 0;
        return (
          <div className="w-full space-y-1.5">
            <p className="text-[9px] font-bold uppercase text-text-secondary truncate">{item.title}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-text-primary">
                {formatCurrency(amountRec)}
              </span>
              <span className="text-[8px] text-text-secondary">
                {freqLabel} • Dia {nextDay}
              </span>
            </div>
            {item.isInstallment && (
              <p className="text-[8px] text-orange-500 font-bold">
                {item.currentInstallment}/{item.totalInstallments}x
              </p>
            )}
          </div>
        );

      case 'card':
        if (item.type === 'credito') {
          const used = Number(item.usedLimit) || 0;
          const limit = Number(item.creditLimit) || 0;
          const creditUsage = limit > 0 ? (used / limit) * 100 : 0;
          return (
            <div className="w-full space-y-1.5">
              <p className="text-[9px] font-bold uppercase text-text-secondary">{item.name}</p>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] text-text-secondary">Crédito</span>
                <span className="text-[8px] font-bold text-text-secondary">{Math.round(creditUsage)}%</span>
              </div>
              <div className="w-full bg-bg-main rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    creditUsage > 80 ? 'bg-red-500' : creditUsage > 50 ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(creditUsage, 100)}%` }}
                />
              </div>
              <p className="text-[8px] text-text-secondary">
                {formatCurrency(used)} / {formatCurrency(limit)}
              </p>
            </div>
          );
        }

        return (
          <div className="w-full space-y-1.5">
            <p className="text-[9px] font-bold uppercase text-text-secondary">{item.name}</p>
            <div className="flex items-center justify-between">
              <span className="text-[8px] text-text-secondary">Vale Alimentação</span>
              <span className="text-[10px] font-bold text-text-primary">
                {formatCurrency(Number(item.vaBalance) || 0)}
              </span>
            </div>
            <p className="text-[8px] text-text-secondary">
              Recarga: {formatCurrency(Number(item.vaRechargeAmount) || 0)} • Dia {item.vaRechargeDay}
            </p>
          </div>
        );

      default:
        return (
          <div className="w-full space-y-1.5">
            <p className="text-[9px] font-bold uppercase text-text-secondary">Função vinculada</p>
            <p className="text-[10px] font-bold text-text-primary">{config.label || type}</p>
            {item?.name && <p className="text-[8px] text-text-secondary truncate">{item.name}</p>}
          </div>
        );
    }
  };

  return (
    <div className={`w-full p-3 rounded-xl border border-border-ui ${config.bg} space-y-2`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} className={config.color} />
          <span className="text-[8px] font-bold uppercase text-text-secondary opacity-70">
            {config.label || (type === 'shoppingcart' ? 'Lista' : type === 'card' ? 'Cartão' : type)}
          </span>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-text-secondary hover:text-red-500 transition-colors p-1"
            title="Remover função"
          >
            <X size={12} />
          </button>
        )}
      </div>
      {renderContent()}
    </div>
  );
};

export default CardChildFunction;
