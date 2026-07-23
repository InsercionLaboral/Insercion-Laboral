// ============================================================================
// Tipos TypeScript generados desde el esquema de Supabase.
// NO editar a mano. Regenerar tras cambios en la BD con el MCP de Supabase
// (generate_typescript_types) o la CLI: supabase gen types typescript.
// Sirven de referencia del modelo de datos aunque la app esté en JSX.
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      contrataciones: {
        Row: {
          activo: boolean
          created_at: string
          fecha_inicio: string
          fecha_ultimo_seguimiento: string | null
          id: string
          postulacion_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          fecha_inicio: string
          fecha_ultimo_seguimiento?: string | null
          id?: string
          postulacion_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          fecha_inicio?: string
          fecha_ultimo_seguimiento?: string | null
          id?: string
          postulacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contrataciones_postulacion_id_fkey"
            columns: ["postulacion_id"]
            isOneToOne: true
            referencedRelation: "postulaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          created_at: string
          id: string
          municipio_id: string | null
          nit: string | null
          nombre_empresa: string
          sector: string | null
          usuario_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          municipio_id?: string | null
          nit?: string | null
          nombre_empresa: string
          sector?: string | null
          usuario_id: string
        }
        Update: {
          created_at?: string
          id?: string
          municipio_id?: string | null
          nit?: string | null
          nombre_empresa?: string
          sector?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresas_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      habilidades: {
        Row: {
          categoria: string | null
          id: string
          nombre: string
        }
        Insert: {
          categoria?: string | null
          id?: string
          nombre: string
        }
        Update: {
          categoria?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      inscripciones: {
        Row: {
          fecha: string
          id: string
          joven_id: string
          recurso_id: string
        }
        Insert: {
          fecha?: string
          id?: string
          joven_id: string
          recurso_id: string
        }
        Update: {
          fecha?: string
          id?: string
          joven_id?: string
          recurso_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscripciones_joven_id_fkey"
            columns: ["joven_id"]
            isOneToOne: false
            referencedRelation: "perfiles_joven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_recurso_id_fkey"
            columns: ["recurso_id"]
            isOneToOne: false
            referencedRelation: "recursos"
            referencedColumns: ["id"]
          },
        ]
      }
      joven_habilidades: {
        Row: {
          habilidad_id: string
          joven_id: string
        }
        Insert: {
          habilidad_id: string
          joven_id: string
        }
        Update: {
          habilidad_id?: string
          joven_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "joven_habilidades_habilidad_id_fkey"
            columns: ["habilidad_id"]
            isOneToOne: false
            referencedRelation: "habilidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "joven_habilidades_joven_id_fkey"
            columns: ["joven_id"]
            isOneToOne: false
            referencedRelation: "perfiles_joven"
            referencedColumns: ["id"]
          },
        ]
      }
      municipios: {
        Row: {
          id: string
          nombre: string
        }
        Insert: {
          id?: string
          nombre: string
        }
        Update: {
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      perfiles_joven: {
        Row: {
          created_at: string
          estado_revision: string
          fecha_revision: string | null
          formacion: string | null
          foto_url: string | null
          id: string
          presentacion: string | null
          revisado_por: string | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          estado_revision?: string
          fecha_revision?: string | null
          formacion?: string | null
          foto_url?: string | null
          id?: string
          presentacion?: string | null
          revisado_por?: string | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          estado_revision?: string
          fecha_revision?: string | null
          formacion?: string | null
          foto_url?: string | null
          id?: string
          presentacion?: string | null
          revisado_por?: string | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_joven_revisado_por_fkey"
            columns: ["revisado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfiles_joven_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      popup_habilidades: {
        Row: {
          habilidad_id: string
          popup_id: string
        }
        Insert: {
          habilidad_id: string
          popup_id: string
        }
        Update: {
          habilidad_id?: string
          popup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "popup_habilidades_habilidad_id_fkey"
            columns: ["habilidad_id"]
            isOneToOne: false
            referencedRelation: "habilidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "popup_habilidades_popup_id_fkey"
            columns: ["popup_id"]
            isOneToOne: false
            referencedRelation: "popups"
            referencedColumns: ["id"]
          },
        ]
      }
      popups: {
        Row: {
          created_at: string
          descripcion: string
          empresa_id: string
          estado: string
          fecha_cierre: string | null
          fecha_publicacion: string | null
          id: string
          revisado_por: string | null
          titulo: string
        }
        Insert: {
          created_at?: string
          descripcion: string
          empresa_id: string
          estado?: string
          fecha_cierre?: string | null
          fecha_publicacion?: string | null
          id?: string
          revisado_por?: string | null
          titulo: string
        }
        Update: {
          created_at?: string
          descripcion?: string
          empresa_id?: string
          estado?: string
          fecha_cierre?: string | null
          fecha_publicacion?: string | null
          id?: string
          revisado_por?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "popups_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "popups_revisado_por_fkey"
            columns: ["revisado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      postulaciones: {
        Row: {
          created_at: string
          estado: string
          id: string
          joven_id: string
          popup_id: string
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          joven_id: string
          popup_id: string
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          joven_id?: string
          popup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "postulaciones_joven_id_fkey"
            columns: ["joven_id"]
            isOneToOne: false
            referencedRelation: "perfiles_joven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postulaciones_popup_id_fkey"
            columns: ["popup_id"]
            isOneToOne: false
            referencedRelation: "popups"
            referencedColumns: ["id"]
          },
        ]
      }
      recursos: {
        Row: {
          creado_por: string | null
          created_at: string
          descripcion: string | null
          fecha_publicacion: string | null
          id: string
          tipo: string
          titulo: string
          url_recurso: string | null
        }
        Insert: {
          creado_por?: string | null
          created_at?: string
          descripcion?: string | null
          fecha_publicacion?: string | null
          id?: string
          tipo: string
          titulo: string
          url_recurso?: string | null
        }
        Update: {
          creado_por?: string | null
          created_at?: string
          descripcion?: string | null
          fecha_publicacion?: string | null
          id?: string
          tipo?: string
          titulo?: string
          url_recurso?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recursos_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          auth_id: string
          autorizacion_acudiente: boolean
          autorizacion_datos: boolean
          created_at: string
          email: string
          es_menor_edad: boolean
          estado: string
          fecha_autorizacion_acudiente: string | null
          fecha_autorizacion_datos: string | null
          id: string
          municipio_id: string | null
          nombre: string
          onboarding_completo: boolean
          rol: string
        }
        Insert: {
          auth_id: string
          autorizacion_acudiente?: boolean
          autorizacion_datos?: boolean
          created_at?: string
          email: string
          es_menor_edad?: boolean
          estado?: string
          fecha_autorizacion_acudiente?: string | null
          fecha_autorizacion_datos?: string | null
          id?: string
          municipio_id?: string | null
          nombre: string
          onboarding_completo?: boolean
          rol: string
        }
        Update: {
          auth_id?: string
          autorizacion_acudiente?: boolean
          autorizacion_datos?: boolean
          created_at?: string
          email?: string
          es_menor_edad?: boolean
          estado?: string
          fecha_autorizacion_acudiente?: string | null
          fecha_autorizacion_datos?: string | null
          id?: string
          municipio_id?: string | null
          nombre?: string
          onboarding_completo?: boolean
          rol?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vista_kpi_municipio: {
        Row: {
          contrataciones_activas: number | null
          empresarios_registrados: number | null
          jovenes_activos: number | null
          municipio: string | null
          popups_publicados: number | null
          postulaciones_totales: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      auth_rol: { Args: never; Returns: string }
      auth_usuario_id: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
