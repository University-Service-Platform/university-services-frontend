import {
  GraduationCap,
  LayoutDashboard,
  User,
  Users,
  UserCheck,
  Shield,
  Building2,
  Layers,
  CalendarDays,
  Ticket,
  Megaphone,
  Bell,
  MessageSquareText,
  BarChart3,
  CalendarCheck,
  CalendarPlus,
  ClipboardCheck,
  Settings,
} from 'lucide-react';

/** The icon for a navigation entry's iconName; used by the sidebar and the dashboard cards. */
export const renderNavIcon = (iconName?: string, size = 18) => {
  switch (iconName) {
    case 'LayoutDashboard':
      return <LayoutDashboard size={size} aria-hidden="true" />;
    case 'User':
      return <User size={size} aria-hidden="true" />;
    case 'Users':
      return <Users size={size} aria-hidden="true" />;
    case 'UserCheck':
      return <UserCheck size={size} aria-hidden="true" />;
    case 'Shield':
      return <Shield size={size} aria-hidden="true" />;
    case 'GraduationCap':
      return <GraduationCap size={size} aria-hidden="true" />;
    case 'Building2':
      return <Building2 size={size} aria-hidden="true" />;
    case 'Layers':
      return <Layers size={size} aria-hidden="true" />;
    case 'CalendarDays':
      return <CalendarDays size={size} aria-hidden="true" />;
    case 'Ticket':
      return <Ticket size={size} aria-hidden="true" />;
    case 'Megaphone':
      return <Megaphone size={size} aria-hidden="true" />;
    case 'Bell':
      return <Bell size={size} aria-hidden="true" />;
    case 'MessageSquareText':
      return <MessageSquareText size={size} aria-hidden="true" />;
    case 'BarChart3':
      return <BarChart3 size={size} aria-hidden="true" />;
    case 'CalendarCheck':
      return <CalendarCheck size={size} aria-hidden="true" />;
    case 'CalendarPlus':
      return <CalendarPlus size={size} aria-hidden="true" />;
    case 'ClipboardCheck':
      return <ClipboardCheck size={size} aria-hidden="true" />;
    case 'Settings':
      return <Settings size={size} aria-hidden="true" />;
    default:
      return <GraduationCap size={size} aria-hidden="true" />;
  }
};
