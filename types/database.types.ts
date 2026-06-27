// ════════════════════════════════════════════════════════════
// Tipos de la base de datos Ludimente.
// Escritos a mano según supabase/migrations/*. Cuando exista un
// proyecto Supabase, regenerar con: npm run db:types
// ════════════════════════════════════════════════════════════

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Rol = "admin" | "psicologo" | "recepcionista";

export type EstatusPaciente =
  | "lista_espera"
  | "activo"
  | "en_evaluacion"
  | "en_intervencion"
  | "seguimiento"
  | "alta"
  | "inactivo";

export type TipoCita =
  | "evaluacion_inicial"
  | "sesion_intervencion"
  | "devolucion_resultados"
  | "seguimiento"
  | "entrevista_padres"
  | "taller"
  | "otro";

export type ModalidadCita = "presencial" | "videollamada";

export type EstatusCita =
  | "programada"
  | "confirmada"
  | "completada"
  | "cancelada"
  | "no_asistio"
  | "reagendada";

export type AreaTrabajo =
  | "lectura"
  | "escritura"
  | "matematicas"
  | "atencion"
  | "memoria"
  | "lenguaje"
  | "socio_emocional"
  | "motor"
  | "otro";

export type HumorPaciente = "muy_bien" | "bien" | "regular" | "mal" | "muy_mal";

export type TipoPrueba =
  | "WISC-V"
  | "WPPSI-IV"
  | "BENDER-II"
  | "PROLEC-R"
  | "PROESC"
  | "TALE"
  | "ENFEN"
  | "CONNERS-3"
  | "BASC-3"
  | "VINELAND-3"
  | "BAYLEY-4"
  | "BEERY-VMI"
  | "STROOP"
  | "TOUR"
  | "OTRO";

export type EstatusEvaluacion =
  | "pendiente"
  | "en_proceso"
  | "calificada"
  | "entregada"
  | "archivada";

export type TipoDocumento =
  | "reporte_evaluacion"
  | "nota_sesion"
  | "consentimiento_informado"
  | "carta_referencia"
  | "estudio_medico"
  | "credencial"
  | "otro";

export type MetodoPago =
  | "efectivo"
  | "transferencia"
  | "tarjeta_debito"
  | "tarjeta_credito"
  | "otro";

export type EstatusPago = "pendiente" | "pagado" | "cancelado" | "reembolsado";

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          usuario: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: Rol;
          especialidad: string | null;
          cedula_prof: string | null;
          color_agenda: string;
          activo: boolean;
        } & Timestamps;
        Insert: {
          id: string;
          usuario: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role: Rol;
          especialidad?: string | null;
          cedula_prof?: string | null;
          color_agenda?: string;
          activo?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      pacientes: {
        Row: {
          id: string;
          numero_expediente: string;
          nombre: string;
          apellido_paterno: string;
          apellido_materno: string | null;
          fecha_nacimiento: string;
          sexo: "masculino" | "femenino" | "otro" | null;
          foto_url: string | null;
          escuela: string | null;
          grado_escolar: string | null;
          turno_escolar: "matutino" | "vespertino" | "otro" | null;
          motivo_consulta: string;
          diagnostico_principal: string | null;
          diagnosticos_secundarios: string[] | null;
          psicologo_asignado_id: string | null;
          estatus: EstatusPaciente;
          fecha_ingreso: string;
          fecha_alta: string | null;
          notas_generales: string | null;
          alergias: string | null;
          medicamentos: string | null;
          informacion_medica: string | null;
          created_by: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          numero_expediente?: string;
          nombre: string;
          apellido_paterno: string;
          apellido_materno?: string | null;
          fecha_nacimiento: string;
          sexo?: "masculino" | "femenino" | "otro" | null;
          foto_url?: string | null;
          escuela?: string | null;
          grado_escolar?: string | null;
          turno_escolar?: "matutino" | "vespertino" | "otro" | null;
          motivo_consulta: string;
          diagnostico_principal?: string | null;
          diagnosticos_secundarios?: string[] | null;
          psicologo_asignado_id?: string | null;
          estatus?: EstatusPaciente;
          fecha_ingreso?: string;
          fecha_alta?: string | null;
          notas_generales?: string | null;
          alergias?: string | null;
          medicamentos?: string | null;
          informacion_medica?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["pacientes"]["Insert"]>;
        Relationships: [];
      };
      tutores: {
        Row: {
          id: string;
          paciente_id: string;
          nombre_completo: string;
          parentesco: string;
          telefono_principal: string;
          telefono_alternativo: string | null;
          email: string | null;
          ocupacion: string | null;
          nivel_estudios: string | null;
          es_contacto_principal: boolean;
          vive_con_paciente: boolean;
          notas: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          paciente_id: string;
          nombre_completo: string;
          parentesco: string;
          telefono_principal: string;
          telefono_alternativo?: string | null;
          email?: string | null;
          ocupacion?: string | null;
          nivel_estudios?: string | null;
          es_contacto_principal?: boolean;
          vive_con_paciente?: boolean;
          notas?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["tutores"]["Insert"]>;
        Relationships: [];
      };
      citas: {
        Row: {
          id: string;
          paciente_id: string;
          psicologo_id: string;
          fecha_inicio: string;
          fecha_fin: string;
          tipo: TipoCita;
          modalidad: ModalidadCita;
          estatus: EstatusCita;
          motivo_cancelacion: string | null;
          notas_previas: string | null;
          recordatorio_whatsapp_generado: boolean;
          recordatorio_whatsapp_enviado: boolean;
          fecha_recordatorio_enviado: string | null;
          recordatorio_enviado_por: string | null;
          cita_original_id: string | null;
          created_by: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          paciente_id: string;
          psicologo_id: string;
          fecha_inicio: string;
          fecha_fin: string;
          tipo: TipoCita;
          modalidad?: ModalidadCita;
          estatus?: EstatusCita;
          motivo_cancelacion?: string | null;
          notas_previas?: string | null;
          recordatorio_whatsapp_generado?: boolean;
          recordatorio_whatsapp_enviado?: boolean;
          fecha_recordatorio_enviado?: string | null;
          recordatorio_enviado_por?: string | null;
          cita_original_id?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["citas"]["Insert"]>;
        Relationships: [];
      };
      sesiones: {
        Row: {
          id: string;
          cita_id: string | null;
          paciente_id: string;
          psicologo_id: string;
          fecha_sesion: string;
          numero_sesion: number;
          area_trabajo: AreaTrabajo | null;
          objetivos_sesion: string;
          desarrollo_sesion: string;
          tecnicas_utilizadas: string[] | null;
          materiales_usados: string[] | null;
          observaciones_conducta: string | null;
          logros_sesion: string | null;
          dificultades_encontradas: string | null;
          humor_paciente: HumorPaciente | null;
          nivel_participacion: number | null;
          plan_siguiente_sesion: string | null;
          recomendaciones_casa: string | null;
          borrador: boolean;
          auto_guardado_at: string | null;
          finalizada_at: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          cita_id?: string | null;
          paciente_id: string;
          psicologo_id: string;
          fecha_sesion: string;
          numero_sesion?: number;
          area_trabajo?: AreaTrabajo | null;
          objetivos_sesion: string;
          desarrollo_sesion: string;
          tecnicas_utilizadas?: string[] | null;
          materiales_usados?: string[] | null;
          observaciones_conducta?: string | null;
          logros_sesion?: string | null;
          dificultades_encontradas?: string | null;
          humor_paciente?: HumorPaciente | null;
          nivel_participacion?: number | null;
          plan_siguiente_sesion?: string | null;
          recomendaciones_casa?: string | null;
          borrador?: boolean;
          auto_guardado_at?: string | null;
          finalizada_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["sesiones"]["Insert"]>;
        Relationships: [];
      };
      evaluaciones: {
        Row: {
          id: string;
          paciente_id: string;
          psicologo_id: string;
          tipo_prueba: TipoPrueba;
          nombre_personalizado: string | null;
          fecha_aplicacion: string;
          fecha_calificacion: string | null;
          fecha_entrega: string | null;
          resultados_raw: Json | null;
          resultados_escalares: Json | null;
          resultados_indices: Json | null;
          ci_total: number | null;
          interpretacion_cualitativa: string | null;
          fortalezas: string[] | null;
          areas_oportunidad: string[] | null;
          recomendaciones: string | null;
          estatus: EstatusEvaluacion;
        } & Timestamps;
        Insert: {
          id?: string;
          paciente_id: string;
          psicologo_id: string;
          tipo_prueba: TipoPrueba;
          nombre_personalizado?: string | null;
          fecha_aplicacion: string;
          fecha_calificacion?: string | null;
          fecha_entrega?: string | null;
          resultados_raw?: Json | null;
          resultados_escalares?: Json | null;
          resultados_indices?: Json | null;
          ci_total?: number | null;
          interpretacion_cualitativa?: string | null;
          fortalezas?: string[] | null;
          areas_oportunidad?: string[] | null;
          recomendaciones?: string | null;
          estatus?: EstatusEvaluacion;
        };
        Update: Partial<Database["public"]["Tables"]["evaluaciones"]["Insert"]>;
        Relationships: [];
      };
      evaluacion_subpruebas: {
        Row: {
          id: string;
          evaluacion_id: string;
          nombre_subprueba: string;
          puntuacion_directa: number | null;
          puntuacion_escalar: number | null;
          percentil: number | null;
          categoria: string | null;
          notas: string | null;
        };
        Insert: {
          id?: string;
          evaluacion_id: string;
          nombre_subprueba: string;
          puntuacion_directa?: number | null;
          puntuacion_escalar?: number | null;
          percentil?: number | null;
          categoria?: string | null;
          notas?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["evaluacion_subpruebas"]["Insert"]
        >;
        Relationships: [];
      };
      documentos: {
        Row: {
          id: string;
          paciente_id: string;
          evaluacion_id: string | null;
          sesion_id: string | null;
          nombre_display: string;
          nombre_archivo: string;
          tipo: TipoDocumento;
          storage_path: string;
          mime_type: string | null;
          tamanio_bytes: number | null;
          version: number;
          visible_portal_padres: boolean;
          subido_por: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          paciente_id: string;
          evaluacion_id?: string | null;
          sesion_id?: string | null;
          nombre_display: string;
          nombre_archivo: string;
          tipo: TipoDocumento;
          storage_path: string;
          mime_type?: string | null;
          tamanio_bytes?: number | null;
          version?: number;
          visible_portal_padres?: boolean;
          subido_por?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["documentos"]["Insert"]>;
        Relationships: [];
      };
      pagos: {
        Row: {
          id: string;
          paciente_id: string;
          cita_id: string | null;
          concepto: string;
          monto: number;
          descuento: number;
          monto_final: number;
          metodo_pago: MetodoPago;
          estatus: EstatusPago;
          fecha_pago: string | null;
          referencia: string | null;
          notas: string | null;
          created_by: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          paciente_id: string;
          cita_id?: string | null;
          concepto: string;
          monto: number;
          descuento?: number;
          metodo_pago: MetodoPago;
          estatus?: EstatusPago;
          fecha_pago?: string | null;
          referencia?: string | null;
          notas?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["pagos"]["Insert"]>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          tabla: string;
          registro_id: string;
          accion: "INSERT" | "UPDATE" | "DELETE" | "VIEW";
          usuario_id: string | null;
          datos_antes: Json | null;
          datos_despues: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tabla: string;
          registro_id: string;
          accion: "INSERT" | "UPDATE" | "DELETE" | "VIEW";
          usuario_id?: string | null;
          datos_antes?: Json | null;
          datos_despues?: Json | null;
          ip_address?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Insert"]>;
        Relationships: [];
      };
      portal_accesos: {
        Row: {
          id: string;
          tutor_id: string;
          paciente_id: string;
          codigo_acceso: string;
          pin_hash: string | null;
          activo: boolean;
          ultimo_acceso: string | null;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          tutor_id: string;
          paciente_id: string;
          codigo_acceso: string;
          pin_hash?: string | null;
          activo?: boolean;
          ultimo_acceso?: string | null;
          expires_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["portal_accesos"]["Insert"]
        >;
        Relationships: [];
      };
      configuracion: {
        Row: {
          id: string;
          nombre_consultorio: string;
          slogan: string;
          logo_url: string | null;
          direccion: string | null;
          telefono: string | null;
          email: string | null;
          sitio_web: string | null;
          horario_inicio: string;
          horario_fin: string;
          dias_laborales: string[];
          duracion_sesion_mins: number;
          precio_sesion_default: number;
          moneda: string;
          plantilla_recordatorio: string;
          plantilla_confirmacion: string;
          plantilla_bienvenida: string;
        } & Timestamps;
        Insert: Partial<Database["public"]["Tables"]["configuracion"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["configuracion"]["Row"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      generar_numero_expediente: {
        Args: Record<string, never>;
        Returns: string;
      };
      crear_paciente_con_tutores: {
        Args: { p_paciente: Json; p_tutores: Json };
        Returns: string;
      };
      auth_role: { Args: Record<string, never>; Returns: string };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_clinico: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

// ── Helpers de conveniencia ──
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
