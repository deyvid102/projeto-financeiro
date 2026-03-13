import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Plus, Loader2 } from 'lucide-react';
import api from '../../../services/api';

const DashPanel = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ balance: 0, income: 0, expense: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/transactions');
        const data = response.data;
        setTransactions(data);
        calculateSummary(data);
      } catch (err) {
        console.error("Erro ao carregar painel:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const calculateSummary = (items) => {
    const income = items
      .filter(t => t.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    const expense = items
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);

    setSummary({
      income,
      expense,
      balance: income - expense
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-brand">
        <Loader2 className="animate-spin mb-2" size={40} />
        <p className="text-sm font-medium text-text-secondary">Sincronizando dados...</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Saldo Total - Com Gradiente das imagens */}
        <div className="bg-gradient-to-br from-brand to-blue-600 p-6 rounded-3xl text-white shadow-xl shadow-brand/20">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm opacity-90 font-medium tracking-wide uppercase">Saldo Total</span>
            <div className="bg-white/20 p-2 rounded-lg">
              <Wallet size={20} />
            </div>
          </div>
          <h2 className="text-3xl font-bold">
            {summary.balance.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
          </h2>
        </div>

        {/* Receitas */}
        <div className="bg-bg-card border border-border-ui p-6 rounded-3xl shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm text-text-secondary font-medium tracking-wide uppercase">Receitas</span>
            <div className="bg-green-500/10 p-2 rounded-lg">
              <ArrowUpCircle className="text-green-500" size={20} />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-text-primary">
            {summary.income.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
          </h2>
        </div>

        {/* Despesas */}
        <div className="bg-bg-card border border-border-ui p-6 rounded-3xl shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm text-text-secondary font-medium tracking-wide uppercase">Despesas</span>
            <div className="bg-red-500/10 p-2 rounded-lg">
              <ArrowDownCircle className="text-red-500" size={20} />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-text-primary">
            {summary.expense.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
          </h2>
        </div>
      </div>

      {/* Listagem de Transações Recentes */}
      <div className="bg-bg-card border border-border-ui rounded-3xl p-8 shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h3 className="text-xl font-bold text-text-primary">Transações Recentes</h3>
            <p className="text-sm text-text-secondary">Seu histórico de movimentações</p>
          </div>
          <button className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-brand/20 cursor-pointer">
            <Plus size={18} />
            Nova Transação
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-border-ui rounded-2xl">
            <p className="text-text-secondary italic">Nenhuma movimentação registrada ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-text-secondary text-xs uppercase tracking-widest border-b border-border-ui">
                  <th className="pb-4 font-bold">Descrição</th>
                  <th className="pb-4 font-bold">Categoria</th>
                  <th className="pb-4 font-bold">Data</th>
                  <th className="pb-4 font-bold text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-ui">
                {transactions.slice(0, 5).map((t) => (
                  <tr key={t._id} className="text-sm text-text-primary hover:bg-bg-main/50 transition-colors">
                    <td className="py-4 font-medium">{t.description}</td>
                    <td className="py-4 text-text-secondary">{t.category}</td>
                    <td className="py-4 text-text-secondary">
                      {new Date(t.date).toLocaleDateString('pt-br')}
                    </td>
                    <td className={`py-4 text-right font-bold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+ ' : '- '}
                      {t.amount.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-6 pt-6 border-t border-border-ui">
               <p className="text-xs text-text-secondary">Exibindo as últimas transações.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashPanel;