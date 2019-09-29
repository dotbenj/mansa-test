import '../lib/env';
import { Account } from '../interfaces/account.interface';
import { Transaction } from '../interfaces/transaction.interface';
import axios, { AxiosError, AxiosResponse, AxiosInstance } from 'axios';

export class GetMansaService {
  axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.BASE_URL,
    });
  }

  async getAccounts (): Promise<Account[]> {
    try {
      const { data } = await this.axiosInstance.get('accounts');
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getOldestTransaction(account: Account): Promise<Transaction> {
    try {
      const { data } = await this.axiosInstance
      .get(`accounts/${account.account_id}/transactions`);
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getHistoryForAccountDated (
    account: Account,
    startDate: string,
    endDate: string): Promise<Transaction[]> {
    try {
      const url = `accounts/${account.account_id}/transactions?from=${startDate}&to=${endDate}`;
      const { data } = await this.axiosInstance.get(encodeURI(url));
      return data;
    } catch (error) {
      throw error;
    }
  }
}
