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
