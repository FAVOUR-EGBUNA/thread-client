export type AuthUser = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type MeResponse = {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
  };
};
