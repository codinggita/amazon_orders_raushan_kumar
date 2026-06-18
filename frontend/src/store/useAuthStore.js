import { create } from 'zustand';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  theme: 'dark',

  setSession: (user, tokens) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  },

  updateAccessToken: (accessToken) => {
    localStorage.setItem('accessToken', accessToken);
    set({ accessToken });
  },

  clearSession: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, accessToken: null, refreshToken: null });
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    document.documentElement.className = nextTheme;
    localStorage.setItem('theme', nextTheme);
    set({ theme: nextTheme });
  },

  initSession: () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');
    const storedTheme = localStorage.getItem('theme');
    
    const theme = storedTheme || 'dark';
    document.documentElement.className = theme;

    let user = null;
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }

    set({ user, accessToken, refreshToken, theme });
  },

  hasPermission: (permission) => {
    const user = get().user;
    if (!user) return false;
    if (['ADMIN', 'SUPER_ADMIN'].includes(user.role)) return true;
    return user.permissions.includes(permission);
  },

  hasRole: (roles) => {
    const user = get().user;
    if (!user) return false;
    return roles.includes(user.role);
  }
}));
