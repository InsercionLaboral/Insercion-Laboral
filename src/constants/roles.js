// Roles del sistema (coinciden con el check constraint de usuarios.rol en el schema SQL)
export const ROLES = {
  JOVEN: 'joven',
  EMPRESARIO: 'empresario',
  LIDER: 'lider',
  ADMIN: 'admin',
}

// Ruta de inicio por rol tras iniciar sesión
export const HOME_POR_ROL = {
  [ROLES.JOVEN]: '/joven',
  [ROLES.EMPRESARIO]: '/empresario',
  [ROLES.LIDER]: '/lider',
  [ROLES.ADMIN]: '/admin',
}

// El onboarding guiado solo aplica a los roles de usuario final; el personal
// del Comité (líder/admin) entra directo a su panel.
export const ROLES_CON_ONBOARDING = [ROLES.JOVEN, ROLES.EMPRESARIO]
