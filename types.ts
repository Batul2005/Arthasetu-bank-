
export type Language = 'en' | 'kn' | 'hi';

export interface User {
  id: string;
  name: string;
  mobile: string;
  email: string;
  pin: string;
  language: Language;
  balance: number;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  date: string;
  description: string;
  category: string;
}

export enum AppScreen {
  PROJECT_SPECS = 'PROJECT_SPECS',
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  LANGUAGE_SELECT = 'LANGUAGE_SELECT',
  SIGNUP = 'SIGNUP',
  SIGNUP_SUCCESS = 'SIGNUP_SUCCESS',
  DASHBOARD = 'DASHBOARD',
  SEND_MONEY = 'SEND_MONEY',
  RECEIVE_MONEY = 'RECEIVE_MONEY',
  TRANSACTIONS = 'TRANSACTIONS',
  ANALYSIS = 'ANALYSIS',
  BILL_PAY = 'BILL_PAY',
  LOANS = 'LOANS',
  PIN_CHANGE = 'PIN_CHANGE',
  PROFILE = 'PROFILE',
  SUCCESS = 'SUCCESS'
}
