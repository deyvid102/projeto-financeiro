import mongoose from 'mongoose';
import ModelRecurrence from '../models/ModelRecurrence.js';
import Transaction from '../models/ModelTransaction.js';
import Goal from '../models/ModelGoal.js';

export const processDailyRecurrences = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const today = new Date();
    const currentDayOfMonth = today.getDate();

    // 1. Busca recorrências ativas para hoje
    const recurrences = await ModelRecurrence.find({
      isActive: true,
      dayOfMonth: currentDayOfMonth,
    }).session(session);

    for (const rec of recurrences) {
      // 2. Cria a Transação Financeira
      const newTransaction = new Transaction({
        user: rec.user,
        title: rec.title,
        amount: rec.amount,
        type: rec.type,
        category: rec.category,
        date: today,
        goal: rec.goalId,
        isRecurring: true,
        recurrenceId: rec._id,
        // Garante que o número da parcela seja salvo corretamente
        installmentNumber: rec.isInstallment ? rec.currentInstallment : null
      });

      await newTransaction.save({ session });

      // 3. Se for vinculado a uma Meta (Caixinha), atualiza SALDO e PROGRESSO
      if (rec.goalId) {
        const goal = await Goal.findById(rec.goalId).session(session);
        
        if (goal) {
          // Atualiza o saldo (considerando entradas e saídas)
          const adjustment = rec.type === 'entrada' ? rec.amount : -rec.amount;
          goal.currentAmount += adjustment;

          // RECALCULO DO PROGRESSO (Evita erro 500 por divisão por zero)
          if (goal.targetAmount > 0) {
            goal.progress = Math.round((goal.currentAmount / goal.targetAmount) * 100);
          } else {
            goal.progress = 0;
          }

          await goal.save({ session });
        }
      }

      // 4. Atualiza a Recorrência (Parcelas e Status)
      if (rec.isInstallment) {
        // Se já era a última parcela, desativa
        if (rec.currentInstallment >= rec.totalInstallments) {
          rec.isActive = false;
        } else {
          // Incrementa para a próxima execução
          rec.currentInstallment += 1;
        }
      }
      
      await rec.save({ session });
    }

    await session.commitTransaction();
    console.log(`[CRON] ${recurrences.length} recorrências processadas.`);
  } catch (error) {
    await session.abortTransaction();
    console.error('[CRON ERROR] Falha Crítica:', error);
    throw error; // Lança para o log do servidor capturar o stack trace real
  } finally {
    session.endSession();
  }
};