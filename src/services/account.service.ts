import '../lib/env';

import * as moment from 'moment';
import { flatten, last, filter, reduce } from 'lodash';

import { GetMansaService } from './getmansa.service';
import { Account } from '../interfaces/account.interface';
import { Transaction } from '../interfaces/transaction.interface';

export class AccountService {

  constructor(private mansaService: GetMansaService) {}

  async getHystoryForAccount(account: Account): Promise<Transaction[]> {
    return new Promise(async (resolve, reject) => {
      const oldestTransaction = await this.mansaService.getOldestTransaction(account);
      const promiseArrayHystory = [];
      const firstYear = moment(oldestTransaction.timestamp).year();
      for (let year = firstYear; year <= moment().year(); year += 1) {
        promiseArrayHystory.push(this.mansaService.getHistoryForAccountDated(
          account,
          moment().year(year).startOf('year').format('YYYY-MM-DD hh:mm:ss'),
          moment().year(year).endOf('year').format('YYYY-MM-DD hh:mm:ss')));
      }
      Promise.all(promiseArrayHystory)
        .then((result) => {
          resolve(flatten(result));
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  getMinAndMaxForHistory(history: Transaction[]) {
    let min = 0;
    let max = 0;
    let current = 0;
    history.forEach((transaction: Transaction) => {
      current += transaction.amount;
      if (current < min) min = current;
      if (current > max) max = current;
    });
    return {
      min,
      max,
    };
  }

  async getNewestTransaction(account, year = null) {
    let newestTransaction: Transaction;
    if (!year) {
      newestTransaction = last(await this.mansaService.getHistoryForAccountDated(
        account,
        moment().startOf('year').format('YYYY-MM-DD hh:mm:ss'),
        moment().format('YYYY-MM-DD hh:mm:ss')));
    } else {
      newestTransaction = last(await this.mansaService.getHistoryForAccountDated(
        account,
        moment().year(year).startOf('year').format('YYYY-MM-DD hh:mm:ss'),
        moment().year(year).endOf('year').format('YYYY-MM-DD hh:mm:ss')));
    }
    if (!newestTransaction) {
      await this.getNewestTransaction(account, year ? year - 1 : moment().year() - 1);
    } else {
      return newestTransaction;
    }
  }

  async isThreeYearsOfHistory(account: Account): Promise<boolean> {
    const oldestTransaction = await this.mansaService.getOldestTransaction(account);
    if (!oldestTransaction) {
      return false;
    }
    const newestTransaction = await this.getNewestTransaction(account);
    return moment(newestTransaction.timestamp).year() - moment(oldestTransaction.timestamp).year() > 3;
  }

  averageSixMounthHistory(history: Transaction[]) {
    const incomes = [];
    let mounth = 0;
    history.forEach((transaction: Transaction, index) => {
      if (index === 0) {
        incomes.push(transaction.amount);
      } else {
        if (moment(transaction.timestamp).month() === moment(history[index - 1].timestamp).month()) {
          incomes[mounth] += transaction.amount;
        } else {
          mounth += 1;
          incomes[mounth] = transaction.amount;
        }
      }
    });
    return Math.trunc(Math.round(reduce(incomes, (sum, income) => sum + income) * 100 / 6)) / 100;
  }

  async averageIncomesLastSixMonth(account: Account): Promise<number> {
    const newestTransaction = await this.getNewestTransaction(account);
    const startDate = moment(newestTransaction.timestamp)
      .subtract(6, 'months').format('YYYY-MM-DD hh:mm:ss');
    const sixMonthHistory =  await this.mansaService
      .getHistoryForAccountDated(account, startDate, newestTransaction.timestamp);
    return this.averageSixMounthHistory(
      filter(
        sixMonthHistory,
        (trans: Transaction) => trans.transaction_type === 'CREDIT',
      ));
  }
}
