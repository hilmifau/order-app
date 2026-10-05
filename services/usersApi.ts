import axiosInstance from './axiosInstance';
import { getFriendlyErrorMessage } from '@/utils/apiError';
import { UserRole, normalizeRole } from '@/utils/roles';

export interface ApiUser {
  id: number | string;
  name: string;
  email: string;
  kd_cus?: string | null;
  role: UserRole;
  created_at?: string;
}

export const listUsersApi = async (): Promise<ApiUser[]> => {
  const response = await axiosInstance.get('/users');
  const data = response.data?.data;
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    name: item.name || '',
    email: item.email || '',
    kd_cus: item.kd_cus || '',
    role: normalizeRole(item.role),
    created_at: item.created_at,
  }));
};

export const updateUserRoleApi = async (id: number | string, role: UserRole): Promise<ApiUser> => {
  const response = await axiosInstance.put(`/users/${id}`, { role });
  const item = response.data?.data || {};

  return {
    id: item.id ?? id,
    name: item.name || '',
    email: item.email || '',
    kd_cus: item.kd_cus || '',
    role: normalizeRole(item.role || role),
    created_at: item.created_at,
  };
};

export const updateUserRoleSafe = async (
  id: number | string,
  role: UserRole
): Promise<{ success: boolean; user?: ApiUser; message?: string }> => {
  try {
    const user = await updateUserRoleApi(id, role);
    return { success: true, user };
  } catch (error: any) {
    return {
      success: false,
      message: getFriendlyErrorMessage(error, { fallback: 'Gagal mengubah role. Silakan coba lagi.' }),
    };
  }
};
