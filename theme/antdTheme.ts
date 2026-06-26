import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  token: {
    colorPrimary: '#6C63FF',
    colorInfo: '#6C63FF',
    colorSuccess: '#4CAF50',
    colorWarning: '#FF9800',
    colorError: '#FF6584',
    borderRadius: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 36,
      fontWeight: 500,
    },
    Card: {
      borderRadiusLG: 12,
    },
    Layout: {
      bodyBg: '#F4F6F9',
      headerBg: '#FFFFFF',
      siderBg: '#1A1A2E',
    },
    Menu: {
      darkItemBg: '#1A1A2E',
      darkItemSelectedBg: '#6C63FF',
    },
  },
};

export default theme;
