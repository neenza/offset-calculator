import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  BarChart3, 
  User, 
  Settings, 
  FileText, 
  Calculator,
  Sun,
  Moon,
  Ruler,
  LogOut
} from 'lucide-react';
import { 
  Center, 
  Tooltip, 
  UnstyledButton, 
  Stack,
  Box,
  Paper
} from '@mantine/core';
import { useTheme } from 'next-themes';
import { useSettingsStore } from '@/utils/settingsStore';
import { useAuth } from '@/utils/AuthContext';
import styles from './AppNavbar.module.css';

interface NavbarLinkProps {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  label: string;
  path: string;
  active?: boolean;
  onClick?(): void;
}

function NavbarLink({ icon: Icon, label, active, onClick }: NavbarLinkProps) {
  return (
    <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
      <UnstyledButton
        className={styles.link}
        data-active={active || undefined}
        onClick={onClick}
      >
        <Icon size={20} />
      </UnstyledButton>
    </Tooltip>
  );
}

const navData = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Calculator, label: 'Calculator', path: '/' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: FileText, label: 'Reports', path: '/reports' },
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

interface AppNavbarProps {
  opened?: boolean;
}

export function AppNavbar({ opened: _opened }: AppNavbarProps) {
  const [active, setActive] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { measurementUnit, setMeasurementUnit } = useSettingsStore();
  const { user, logout } = useAuth();

  // Update active state based on current path
  const currentIndex = navData.findIndex(item => item.path === location.pathname);
  if (currentIndex !== -1 && currentIndex !== active) {
    setActive(currentIndex);
  }

  const handleNavigate = (index: number, path: string) => {
    setActive(index);
    navigate(path);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleMeasurementUnit = () => {
    const newUnit = measurementUnit === 'mm' ? 'inch' : 'mm';
    setMeasurementUnit(newUnit);
  };

  const links = navData.map((link, index) => (
    <NavbarLink
      {...link}
      key={link.label}
      active={index === active}
      onClick={() => handleNavigate(index, link.path)}
    />
  ));

  return (
    <nav className={styles.navbar}>
      {/* Logo */}
      <Center>
        <Calculator size={26} />
      </Center>
      
      {/* Main Navigation */}
      <div className={styles.navbarMain}>
        <Stack justify="center" gap={0}>
          {links}
        </Stack>
      </div>
      
      {/* Bottom Controls - User Info, Measurement Unit & Theme Toggle */}
      <Stack justify="center" gap={0}>
        {/* User Info */}
        <Tooltip
          label={user ? `Logged in as: ${user.username}` : 'User'}
          position="right"
          transitionProps={{ duration: 0 }}
        >
          <UnstyledButton
            className={styles.link}
            onClick={() => navigate('/profile')}
          >
            <User size={20} />
          </UnstyledButton>
        </Tooltip>

        {/* Logout */}
        <Tooltip
          label="Logout"
          position="right"
          transitionProps={{ duration: 0 }}
        >
          <UnstyledButton
            className={styles.link}
            onClick={logout}
          >
            <LogOut size={20} />
          </UnstyledButton>
        </Tooltip>
        
        <Tooltip
          label={`Switch to ${measurementUnit === 'mm' ? 'inches' : 'millimeters'}`}
          position="right"
          transitionProps={{ duration: 0 }}
        >
          <UnstyledButton
            className={styles.link}
            onClick={toggleMeasurementUnit}
          >
            <Ruler size={20} />
          </UnstyledButton>
        </Tooltip>
        
        <Tooltip
          label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          position="right"
          transitionProps={{ duration: 0 }}
        >
          <UnstyledButton
            className={styles.link}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </UnstyledButton>
        </Tooltip>
      </Stack>
    </nav>
  );
}
