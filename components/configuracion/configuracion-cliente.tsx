"use client";

import { useEffect, useState } from "react";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, Pencil, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { useAuditoria } from "@/hooks/use-auditoria";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  useActualizarPaquete,
  useCatalogoPaquetes,
  useCrearPaquete,
  useEliminarPaquete,
} from "@/hooks/use-paquetes";
import { useGuardarPrecioCita, usePreciosCitas } from "@/hooks/use-precios-citas";
import { createClient } from "@/lib/supabase/client";
import { descargarCSV } from "@/lib/csv";
import { TIPO_CITA_OPCIONES } from "@/lib/catalogos";
import type { TipoCita } from "@/types/database.types";

import {
  cambiarActivoUsuario,
  cambiarRolUsuario,
  crearUsuario,
  listarUsuarios,
  type UsuarioEquipo,
} from "@/app/(sistema)/configuracion/usuarios-actions";
import { Campo } from "@/components/pacientes/form-nuevo-paciente/campo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LudaCard } from "@/components/ui/luda-card";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useConfiguracion,
  useGuardarConfiguracion,
} from "@/hooks/use-configuracion";
import { ROL_LABEL } from "@/types/app.types";
import type { Rol } from "@/types/database.types";

const ROLES: Rol[] = ["admin", "psicologo", "recepcionista"];

function ConsultorioTab() {
  const { data: config, isLoading } = useConfiguracion();
  const guardar = useGuardarConfiguracion();

  if (isLoading) return <p className="text-sm text-luda-gris-light">Cargando…</p>;
  if (!config)
    return (
      <p className="text-sm text-luda-gris-light">
        No se encontró la configuración del consultorio.
      </p>
    );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const cambios = {
      nombre_consultorio: String(fd.get("nombre_consultorio") ?? ""),
      slogan: String(fd.get("slogan") ?? ""),
      direccion: String(fd.get("direccion") ?? ""),
      telefono: String(fd.get("telefono") ?? ""),
      email: String(fd.get("email") ?? ""),
      sitio_web: String(fd.get("sitio_web") ?? ""),
      horario_inicio: String(fd.get("horario_inicio") ?? ""),
      horario_fin: String(fd.get("horario_fin") ?? ""),
      duracion_sesion_mins: Number(fd.get("duracion_sesion_mins") ?? 50),
      precio_sesion_default: Number(fd.get("precio_sesion_default") ?? 0),
    };
    try {
      await guardar.mutateAsync({ id: config!.id, cambios });
      toast.success("Configuración guardada");
    } catch {
      toast.error("No se pudo guardar");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <LudaCard className="space-y-4 p-5">
        <h3 className="font-bold text-luda-gris">Datos del consultorio</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Nombre">
            <Input name="nombre_consultorio" defaultValue={config.nombre_consultorio ?? ""} />
          </Campo>
          <Campo label="Slogan">
            <Input name="slogan" defaultValue={config.slogan ?? ""} />
          </Campo>
          <Campo label="Dirección" className="sm:col-span-2">
            <Input name="direccion" defaultValue={config.direccion ?? ""} />
          </Campo>
          <Campo label="Teléfono">
            <Input name="telefono" defaultValue={config.telefono ?? ""} />
          </Campo>
          <Campo label="Correo">
            <Input name="email" defaultValue={config.email ?? ""} />
          </Campo>
          <Campo label="Sitio web">
            <Input name="sitio_web" defaultValue={config.sitio_web ?? ""} />
          </Campo>
        </div>
      </LudaCard>

      <LudaCard className="space-y-4 p-5">
        <h3 className="font-bold text-luda-gris">Agenda y tarifas</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Campo label="Horario inicio">
            <Input type="time" name="horario_inicio" defaultValue={config.horario_inicio ?? "09:00"} />
          </Campo>
          <Campo label="Horario fin">
            <Input type="time" name="horario_fin" defaultValue={config.horario_fin ?? "18:00"} />
          </Campo>
          <Campo label="Duración sesión (min)">
            <Input type="number" name="duracion_sesion_mins" defaultValue={config.duracion_sesion_mins ?? 50} />
          </Campo>
          <Campo label="Precio general (respaldo)">
            <Input type="number" step="0.01" name="precio_sesion_default" defaultValue={config.precio_sesion_default ?? 0} />
          </Campo>
        </div>
        <p className="text-xs text-luda-gris-light">
          Cada tipo de cita tiene su propia tarifa en la pestaña{" "}
          <span className="font-semibold">Tarifas</span>. Este precio general solo
          se usa como respaldo si un tipo no tiene tarifa configurada.
        </p>
      </LudaCard>

      <Button type="submit" disabled={guardar.isPending}>
        {guardar.isPending ? (
          <>
            <Loader2 className="animate-spin" /> Guardando…
          </>
        ) : (
          "Guardar cambios"
        )}
      </Button>
    </form>
  );
}

function UsuariosTab() {
  const [usuarios, setUsuarios] = useState<UsuarioEquipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [creando, setCreando] = useState(false);
  const [propioId, setPropioId] = useState<string | null>(null);
  const confirmar = useConfirm();

  async function refrescar() {
    setUsuarios(await listarUsuarios());
    setCargando(false);
  }
  useEffect(() => {
    refrescar();
    createClient()
      .auth.getUser()
      .then(({ data }) => setPropioId(data.user?.id ?? null));
  }, []);

  async function onCrear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setCreando(true);
    const res = await crearUsuario({
      usuario: String(fd.get("usuario") ?? ""),
      full_name: String(fd.get("full_name") ?? ""),
      role: String(fd.get("role") ?? "psicologo") as Rol,
      password: String(fd.get("password") ?? ""),
      especialidad: String(fd.get("especialidad") ?? "") || undefined,
    });
    setCreando(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Usuario creado");
    form.reset();
    await refrescar();
  }

  async function toggleActivo(u: UsuarioEquipo) {
    const ok = await confirmar({
      titulo: u.activo ? "Desactivar usuario" : "Activar usuario",
      mensaje: u.activo
        ? `${u.full_name} perderá acceso al sistema de inmediato.`
        : `${u.full_name} podrá volver a iniciar sesión.`,
      confirmar: u.activo ? "Desactivar" : "Activar",
      peligro: u.activo,
    });
    if (!ok) return;
    const res = await cambiarActivoUsuario(u.id, !u.activo);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    await refrescar();
    toast.success(u.activo ? "Usuario desactivado" : "Usuario activado");
  }

  async function cambiarRol(u: UsuarioEquipo, role: Rol) {
    const ok = await confirmar({
      titulo: "Cambiar rol",
      mensaje: `${u.full_name} pasará de ${ROL_LABEL[u.role]} a ${ROL_LABEL[role]}.`,
      confirmar: "Cambiar rol",
    });
    if (!ok) return;
    const res = await cambiarRolUsuario(u.id, role);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    await refrescar();
    toast.success("Rol actualizado");
  }

  return (
    <div className="space-y-6">
      <LudaCard className="space-y-4 p-5">
        <h3 className="flex items-center gap-2 font-bold text-luda-gris">
          <UserPlus className="h-4 w-4" /> Nuevo usuario
        </h3>
        <form onSubmit={onCrear} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Nombre completo" requerido>
            <Input name="full_name" required />
          </Campo>
          <Campo label="Usuario (ID de acceso)" requerido>
            <Input name="usuario" required autoCapitalize="none" />
          </Campo>
          <Campo label="Rol" requerido>
            <Select name="role" defaultValue="psicologo">
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROL_LABEL[r]}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo label="Especialidad">
            <Input name="especialidad" />
          </Campo>
          <Campo label="Contraseña temporal" requerido>
            <Input name="password" type="text" required minLength={8} />
          </Campo>
          <div className="flex items-end">
            <Button type="submit" disabled={creando}>
              {creando ? (
                <>
                  <Loader2 className="animate-spin" /> Creando…
                </>
              ) : (
                "Crear usuario"
              )}
            </Button>
          </div>
        </form>
      </LudaCard>

      <div className="space-y-2">
        {cargando && <p className="text-sm text-luda-gris-light">Cargando…</p>}
        {usuarios.map((u) => (
          <LudaCard key={u.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="flex-1">
              <p className="text-sm font-bold text-luda-gris">
                {u.full_name}{" "}
                <span className="font-normal text-luda-gris-light">· {u.usuario}</span>
              </p>
              {u.especialidad && (
                <p className="text-xs text-luda-gris-light">{u.especialidad}</p>
              )}
              {u.id === propioId && (
                <p className="text-xs text-luda-gris-light">
                  Esta es tu cuenta — no puedes cambiar tu propio rol ni desactivarte.
                </p>
              )}
            </div>
            <Select
              value={u.role}
              disabled={u.id === propioId}
              onChange={(e) => cambiarRol(u, e.target.value as Rol)}
              className="h-9 w-auto text-xs"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROL_LABEL[r]}
                </option>
              ))}
            </Select>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                u.activo ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
              }`}
            >
              {u.activo ? "Activo" : "Inactivo"}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={u.id === propioId}
              onClick={() => toggleActivo(u)}
            >
              {u.activo ? "Desactivar" : "Activar"}
            </Button>
          </LudaCard>
        ))}
      </div>
    </div>
  );
}

const TABLA_LABEL: Record<string, string> = {
  pacientes: "Pacientes",
  sesiones: "Sesiones",
  citas: "Citas",
  pagos: "Pagos",
  evaluaciones: "Evaluaciones",
  documentos: "Documentos",
  profiles: "Usuarios del equipo",
  paquetes: "Paquetes (catálogo)",
  paquetes_paciente: "Paquetes asignados",
  abonos: "Abonos",
  configuracion: "Configuración",
  precios_citas: "Tarifas por tipo de cita",
  planes_intervencion: "Planes de intervención",
  objetivos_intervencion: "Objetivos de intervención",
  objetivo_seguimientos: "Avances de objetivos",
  reportes_progreso: "Reportes de progreso",
  consentimientos: "Consentimientos",
  gastos: "Gastos",
  inventario_items: "Inventario",
  recursos: "Biblioteca de recursos",
  planeaciones: "Planeación semanal",
  tamizajes: "Tamizaje",
  formatos_llenados: "Formatos",
};
const ACCION_LABEL: Record<string, string> = {
  INSERT: "Creó",
  UPDATE: "Editó",
  DELETE: "Eliminó",
  VIEW: "Consultó",
};
const ACCION_CLASE: Record<string, string> = {
  INSERT: "bg-green-50 text-green-700",
  UPDATE: "bg-blue-50 text-blue-700",
  DELETE: "bg-red-50 text-red-600",
  VIEW: "bg-gray-50 text-gray-600",
};

const CAMPOS_IGNORADOS = new Set(["updated_at", "created_at"]);

function camposCambiados(
  antes: Record<string, unknown> | null,
  despues: Record<string, unknown> | null,
) {
  const llaves = new Set([
    ...Object.keys(antes ?? {}),
    ...Object.keys(despues ?? {}),
  ]);
  const cambios: { campo: string; antes: unknown; despues: unknown }[] = [];
  for (const llave of llaves) {
    if (CAMPOS_IGNORADOS.has(llave)) continue;
    const a = antes?.[llave];
    const d = despues?.[llave];
    if (JSON.stringify(a) !== JSON.stringify(d)) {
      cambios.push({ campo: llave, antes: a, despues: d });
    }
  }
  return cambios;
}

function valorCorto(v: unknown): string {
  if (v === null || v === undefined) return "—";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > 60 ? `${s.slice(0, 60)}…` : s;
}

function AuditoriaTab() {
  const [tabla, setTabla] = useState("");
  const { data: eventos = [], isLoading } = useAuditoria({
    tabla: tabla || undefined,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select
          value={tabla}
          onChange={(e) => setTabla(e.target.value)}
          className="h-9 w-auto text-xs"
        >
          <option value="">Todos los módulos</option>
          {Object.entries(TABLA_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
        <span className="text-sm text-luda-gris-light">
          Últimos {eventos.length} eventos
        </span>
      </div>

      {isLoading && <p className="text-sm text-luda-gris-light">Cargando…</p>}
      {!isLoading && eventos.length === 0 && (
        <LudaCard className="p-6">
          <p className="text-sm text-luda-gris-light">Sin eventos registrados.</p>
        </LudaCard>
      )}

      <div className="space-y-2">
        {eventos.map((ev) => {
          const cambios =
            ev.accion === "UPDATE"
              ? camposCambiados(ev.datos_antes, ev.datos_despues)
              : [];
          return (
            <LudaCard key={ev.id} className="p-3">
              <details>
                <summary className="flex flex-wrap items-center gap-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      ACCION_CLASE[ev.accion] ?? "bg-gray-50 text-gray-600"
                    }`}
                  >
                    {ACCION_LABEL[ev.accion] ?? ev.accion}
                  </span>
                  <span className="text-sm font-semibold text-luda-gris">
                    {TABLA_LABEL[ev.tabla] ?? ev.tabla}
                  </span>
                  <span className="text-sm text-luda-gris-light">
                    por {ev.usuario_nombre}
                  </span>
                  {cambios.length > 0 && (
                    <span className="text-xs text-luda-lila-dark">
                      {cambios.length} campo(s) cambiado(s)
                    </span>
                  )}
                  <span className="ml-auto text-xs text-luda-gris-light">
                    {format(new Date(ev.created_at), "d 'de' MMM yyyy, HH:mm", {
                      locale: es,
                    })}
                  </span>
                </summary>

                {ev.accion === "UPDATE" && (
                  <div className="mt-3 space-y-1.5 border-t border-luda-lila/10 pt-3">
                    {cambios.length === 0 ? (
                      <p className="text-xs text-luda-gris-light">
                        Sin cambios visibles en los datos.
                      </p>
                    ) : (
                      cambios.map((c) => (
                        <div key={c.campo} className="text-xs text-luda-gris">
                          <span className="font-semibold">{c.campo}: </span>
                          <span className="text-red-600 line-through">
                            {valorCorto(c.antes)}
                          </span>{" "}
                          → <span className="text-green-700">{valorCorto(c.despues)}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {ev.accion === "INSERT" && ev.datos_despues && (
                  <div className="mt-3 border-t border-luda-lila/10 pt-3">
                    <p className="text-xs text-luda-gris-light">
                      Registro creado con {Object.keys(ev.datos_despues).length} campos.
                    </p>
                  </div>
                )}
                {ev.accion === "DELETE" && ev.datos_antes && (
                  <div className="mt-3 border-t border-luda-lila/10 pt-3">
                    <p className="text-xs text-luda-gris-light">
                      Registro eliminado (id {ev.registro_id}).
                    </p>
                  </div>
                )}
              </details>
            </LudaCard>
          );
        })}
      </div>
    </div>
  );
}

const mxn = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

function PaquetesCatalogoTab() {
  const { data: paquetes = [], isLoading } = useCatalogoPaquetes(false);
  const crear = useCrearPaquete();
  const eliminar = useEliminarPaquete();
  const actualizar = useActualizarPaquete();
  const [editando, setEditando] = useState<string | null>(null);

  async function onCrear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      await crear.mutateAsync({
        nombre: String(fd.get("nombre") ?? ""),
        num_sesiones: Number(fd.get("num_sesiones") ?? 0),
        precio: Number(fd.get("precio") ?? 0),
      });
      form.reset();
      toast.success("Paquete creado");
    } catch {
      toast.error("No se pudo crear el paquete");
    }
  }

  return (
    <div className="space-y-6">
      <LudaCard className="space-y-4 p-5">
        <h3 className="font-bold text-luda-gris">Nuevo paquete</h3>
        <form onSubmit={onCrear} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Campo label="Nombre" requerido className="sm:col-span-2">
            <Input name="nombre" required placeholder="Ej. Paquete 10 sesiones" />
          </Campo>
          <Campo label="N° sesiones" requerido>
            <Input name="num_sesiones" type="number" min={1} required />
          </Campo>
          <Campo label="Precio" requerido>
            <Input name="precio" type="number" step="0.01" min={0} required />
          </Campo>
          <div className="flex items-end">
            <Button type="submit" disabled={crear.isPending}>
              {crear.isPending ? (
                <>
                  <Loader2 className="animate-spin" /> Creando…
                </>
              ) : (
                "Crear paquete"
              )}
            </Button>
          </div>
        </form>
      </LudaCard>

      {isLoading && <p className="text-sm text-luda-gris-light">Cargando…</p>}
      <div className="space-y-2">
        {paquetes.map((p) =>
          editando === p.id ? (
            <LudaCard key={p.id} className="p-4">
              <form
                className="grid grid-cols-1 gap-3 sm:grid-cols-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  try {
                    await actualizar.mutateAsync({
                      id: p.id,
                      nombre: String(fd.get("nombre") ?? p.nombre),
                      num_sesiones: Number(fd.get("num_sesiones") ?? p.num_sesiones),
                      precio: Number(fd.get("precio") ?? p.precio),
                    });
                    toast.success("Paquete actualizado");
                    setEditando(null);
                  } catch {
                    toast.error("No se pudo actualizar el paquete");
                  }
                }}
              >
                <Campo label="Nombre" className="sm:col-span-2">
                  <Input name="nombre" defaultValue={p.nombre} required />
                </Campo>
                <Campo label="N° sesiones">
                  <Input
                    name="num_sesiones"
                    type="number"
                    min={1}
                    defaultValue={p.num_sesiones}
                    required
                  />
                </Campo>
                <Campo label="Precio">
                  <Input
                    name="precio"
                    type="number"
                    step="0.01"
                    min={0}
                    defaultValue={p.precio}
                    required
                  />
                </Campo>
                <div className="flex items-end gap-2 sm:col-span-4">
                  <Button type="submit" size="sm" disabled={actualizar.isPending}>
                    {actualizar.isPending ? "Guardando…" : "Guardar"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditando(null)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </LudaCard>
          ) : (
            <LudaCard key={p.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="flex-1">
                <p className="text-sm font-bold text-luda-gris">
                  {p.nombre}{" "}
                  {!p.activo && (
                    <span className="text-xs font-normal text-luda-gris-light">
                      (inactivo)
                    </span>
                  )}
                </p>
                <p className="text-xs text-luda-gris-light">
                  {p.num_sesiones} sesiones · {mxn(Number(p.precio))}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditando(p.id)}
              >
                <Pencil className="h-4 w-4" /> Editar precio
              </Button>
              {p.activo && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => eliminar.mutate(p.id)}
                >
                  Desactivar
                </Button>
              )}
            </LudaCard>
          ),
        )}
      </div>
    </div>
  );
}

function TarifasCitasTab() {
  const { data: precios = [], isLoading } = usePreciosCitas();
  const guardar = useGuardarPrecioCita();
  const [valores, setValores] = useState<Record<string, number>>({});

  const precioDe = (tipo: string) => {
    if (valores[tipo] !== undefined) return valores[tipo];
    const encontrado = precios.find((p) => p.tipo === tipo);
    return encontrado ? Number(encontrado.precio) : 0;
  };

  async function guardarTodo(e: React.FormEvent) {
    e.preventDefault();
    try {
      await Promise.all(
        TIPO_CITA_OPCIONES.map((t) =>
          guardar.mutateAsync({
            tipo: t.value as TipoCita,
            precio: precioDe(t.value),
          }),
        ),
      );
      toast.success("Tarifas actualizadas");
      setValores({});
    } catch {
      toast.error("No se pudieron guardar todas las tarifas");
    }
  }

  return (
    <form onSubmit={guardarTodo} className="space-y-4">
      <LudaCard className="space-y-1 p-5">
        <h3 className="font-bold text-luda-gris">Tarifa por tipo de cita</h3>
        <p className="text-sm text-luda-gris-light">
          Pon en $0 los tipos que no se cobran (por ejemplo, las entrevistas).
        </p>
      </LudaCard>

      {isLoading && <p className="text-sm text-luda-gris-light">Cargando…</p>}

      <div className="space-y-2">
        {TIPO_CITA_OPCIONES.map((t) => (
          <LudaCard
            key={t.value}
            className="flex flex-wrap items-center justify-between gap-3 p-3"
          >
            <span className="text-sm font-semibold text-luda-gris">{t.label}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-luda-gris-light">$</span>
              <Input
                type="number"
                step="0.01"
                min={0}
                className="h-9 w-28"
                value={precioDe(t.value)}
                onChange={(e) =>
                  setValores((prev) => ({
                    ...prev,
                    [t.value]: Number(e.target.value),
                  }))
                }
              />
            </div>
          </LudaCard>
        ))}
      </div>

      <Button type="submit" disabled={guardar.isPending}>
        {guardar.isPending ? (
          <>
            <Loader2 className="animate-spin" /> Guardando…
          </>
        ) : (
          "Guardar tarifas"
        )}
      </Button>
    </form>
  );
}

function RespaldoTab() {
  const [trabajando, setTrabajando] = useState(false);

  async function exportarPacientes() {
    setTrabajando(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("pacientes")
      .select("numero_expediente, nombre, apellido_paterno, apellido_materno, fecha_nacimiento, estatus, fecha_ingreso");
    setTrabajando(false);
    descargarCSV(
      `pacientes-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Expediente", "Nombre", "Ap. paterno", "Ap. materno", "Nacimiento", "Estatus", "Ingreso"],
      (data ?? []).map((p) => [
        p.numero_expediente,
        p.nombre,
        p.apellido_paterno,
        p.apellido_materno ?? "",
        p.fecha_nacimiento,
        p.estatus,
        p.fecha_ingreso ?? "",
      ]),
    );
    toast.success("Pacientes exportados");
  }

  async function exportarPagos() {
    setTrabajando(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("pagos")
      .select("concepto, monto_final, estatus, metodo_pago, fecha_pago, created_at");
    setTrabajando(false);
    descargarCSV(
      `pagos-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Concepto", "Monto", "Estatus", "Método", "Fecha"],
      (data ?? []).map((p) => [
        p.concepto,
        Number(p.monto_final ?? 0),
        p.estatus,
        p.metodo_pago,
        (p.fecha_pago ?? p.created_at)?.slice(0, 10) ?? "",
      ]),
    );
    toast.success("Pagos exportados");
  }

  async function exportarJSON() {
    setTrabajando(true);
    const supabase = createClient();
    const [pac, pagos] = await Promise.all([
      supabase.from("pacientes").select("*"),
      supabase.from("pagos").select("*"),
    ]);
    setTrabajando(false);
    const blob = new Blob(
      [JSON.stringify({ pacientes: pac.data ?? [], pagos: pagos.data ?? [] }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `respaldo-ludimente-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Respaldo JSON generado");
  }

  return (
    <LudaCard className="space-y-4 p-5">
      <h3 className="font-bold text-luda-gris">Exportar datos</h3>
      <p className="text-sm text-luda-gris-light">
        Descarga respaldos de la información del consultorio.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={trabajando} onClick={exportarPacientes}>
          Pacientes (CSV)
        </Button>
        <Button variant="outline" disabled={trabajando} onClick={exportarPagos}>
          Pagos (CSV)
        </Button>
        <Button variant="outline" disabled={trabajando} onClick={exportarJSON}>
          Respaldo completo (JSON)
        </Button>
      </div>
    </LudaCard>
  );
}

export function ConfiguracionCliente() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-fredoka text-3xl text-luda-gris">Configuración</h1>
      <Tabs defaultValue="consultorio">
        <TabsList>
          <TabsTrigger value="consultorio">Consultorio</TabsTrigger>
          <TabsTrigger value="tarifas">Tarifas</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="paquetes">Paquetes</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoría</TabsTrigger>
          <TabsTrigger value="respaldo">Respaldo</TabsTrigger>
        </TabsList>
        <TabsContent value="consultorio">
          <ConsultorioTab />
        </TabsContent>
        <TabsContent value="tarifas">
          <TarifasCitasTab />
        </TabsContent>
        <TabsContent value="usuarios">
          <UsuariosTab />
        </TabsContent>
        <TabsContent value="paquetes">
          <PaquetesCatalogoTab />
        </TabsContent>
        <TabsContent value="auditoria">
          <AuditoriaTab />
        </TabsContent>
        <TabsContent value="respaldo">
          <RespaldoTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
