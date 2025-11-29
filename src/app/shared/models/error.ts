export interface ErrorDetails {
  code: string | number;
  message: string;
  details?: any;
  timestamp: Date;
  url?: string;
}
