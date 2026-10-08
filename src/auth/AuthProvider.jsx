import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

/**
 * Provee la sesión de Supabase y la fila de `usuarios` (con el rol) al árbol.
 * - session: sesión de auth de Supabase (o null).
 * - usuario: fila de public.usuarios del usuario autenticado (incluye `rol`).
 * - loading: true mientras se resuelve la sesión inicial.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)
  // true mientras se resuelve la fila de `usuarios` de la sesión actual.
  // Evita redirecciones erróneas justo tras iniciar sesión, cuando ya hay
  // sesión pero todavía no se cargó el usuario.
  const [cargandoUsuario, setCargandoUsuario] = useState(true)

  const cargarUsuario = useCallback(async (authUser) => {
    if (!authUser) {
      setUsuario(null)
      setCargandoUsuario(false)
      return
    }
    setCargandoUsuario(true)
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_id', authUser.id)
      .maybeSingle()
    if (error) {
      console.error('Error cargando la fila de usuario:', error.message)
      setUsuario(null)
    } else if (data && data.estado === 'inactivo') {
      // Cuenta desactivada por el equipo: se cierra la sesión y el login lo explica.
      try {
        sessionStorage.setItem('cuenta_inactiva', '1')
      } catch {
        /* sin almacenamiento: se ignora */
      }
      // No se espera aquí: cerrar sesión dentro del evento de autenticación de
      // Supabase puede quedarse bloqueado. Se programa justo después.
      setTimeout(() => supabase.auth.signOut(), 0)
      setUsuario(null)
    } else {
      setUsuario(data)
    }
    setCargandoUsuario(false)
  }, [])

  useEffect(() => {
    let activo = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!activo) return
      setSession(session)
      await cargarUsuario(session?.user ?? null)
      if (activo) setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!activo) return
      setSession(session)
      await cargarUsuario(session?.user ?? null)
    })

    return () => {
      activo = false
      subscription.unsubscribe()
    }
  }, [cargarUsuario])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUsuario(null)
  }, [])

  const value = {
    session,
    usuario,
    rol: usuario?.rol ?? null,
    loading,
    cargandoUsuario,
    // listo: hay una respuesta definitiva de sesión + usuario.
    listo: !loading && !cargandoUsuario,
    signOut,
    refrescarUsuario: () => cargarUsuario(session?.user ?? null),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === null) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return ctx
}
