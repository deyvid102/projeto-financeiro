import React from 'react';
import { Target, TrendingUp, Repeat, ShoppingBag, CreditCard, X } from 'lucide-react';

const CardChildFunction = ({ linkedFunction, onRemove }) => {
  if (!linkedFunction) return null;

  const { type, item } = linkedFunction;
  const typeConfig = {
    goal: { icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Caixinha' },
    investment: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Investimento' },
    recurrence: { icon: Repeat, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Recorrência' },
    shoppingcart: { icon: ShoppingBag, color: 'text-pink-500', bg: 'bg-pink-500/10', label: 'Lista de Desejos' },
    card: { icon: CreditCard, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Cartão' },
  };

  const config = typeConfig[type] || typeConfig.goal;
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
        const goalProgress = (item.currentAmount / item.targetAmount) * 100;
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
              R$ {item.currentAmount.toFixed(2)} / R$ {item.targetAmount.toFixed(2)}
            </p>
          </div>
        );

      case 'investment':
        return (
          <div className="w-full space-y-1.5">
            <p className="text-[9px] font-bold uppercase text-text-secondary">{item.name}</p>
            <div className="flex items-center justify-between">
              <span className="text-[8px] text-text-secondary">{item.type}</span>
              <span className="text-[10px] font-bold text-text-primary">
                R$ {item.amountInvested.toFixed(2)}
              </span>
            </div>
            {item.ticker && (
              <p className="text-[8px] font-bold text-brand">{item.ticker}</p>
            )}
          </div>
        );

      case 'recurrence':
        const freqLabel = item.frequency === 'monthly' ? 'Mês' : item.frequency === 'weekly' ? 'Semana' : 'Ano';
        const nextDay = item.dayOfMonth?.[0] || new Date().getDate();
        return (
          <div className="w-full space-y-1.5">
            <p className="text-[9px] font-bold uppercase text-text-secondary truncate">{item.title}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-text-primary">
                R$ {item.amount.toFixed(2)}
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

      case 'shoppingcart':
        return (
          <div className="w-full space-y-1.5">
            <p className="text-[9px] font-bold uppercase text-text-secondary truncate">{item.itemName}</p>
            <div className="flex items-center justify-between">
              <span className="text-[8px] text-text-secondary">{item.category}</span>
              <span className="text-[10px] font-bold text-text-primary">
                R$ {item.estimatedPrice.toFixed(2)}
              </span>
            </div>
            {item.notes && (
              <p className="text-[8px] text-text-secondary truncate italic">{item.notes}</p>
            )}
          </div>
        );

      case 'card':
        if (item.type === 'credito') {
          const creditUsage = (item.usedLimit / item.creditLimit) * 100;
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
                R$ {item.usedLimit.toFixed(2)} / R$ {item.creditLimit.toFixed(2)}
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
                R$ {item.vaBalance.toFixed(2)}
              </span>
            </div>
            <p className="text-[8px] text-text-secondary">
              Recarga: R$ {item.vaRechargeAmount.toFixed(2)} • Dia {item.vaRechargeDay}
            </p>
          </div>
        );

      default:
        return null;
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
