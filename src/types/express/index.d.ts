declare namespace Express {
  export interface Request {
    user?: {
      user_id: string;
      role: string;
      email?: string;
      full_name?: string;
    };
  }
}
