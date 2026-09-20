import { MenuPermissionsMatrix } from './features/menu-permissions/components/MenuPermissionsMatrix.jsx';

// Inside your main render switch or route handler:
{activeTab === 'menu-permissions' && isSuperAdmin && (
  <MenuPermissionsMatrix />
)}