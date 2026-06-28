"use client";

import { useEffect, useState } from "react";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { useAuditoria } from "@/hooks/use-auditoria";
import {
  useCatalogoPaquetes,
  useCrearPaquete,
  useEliminarPaquete,
} from "@/hooks/use-paquetes";
import { createClient } from "@/lib/supabase/client";
import { descargarCSV } from "@/lib/csv";

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
          <Campo label="Precio sesión">
            <Input type="number" step="0.01" name="precio_sesion_default" defaultValue={config.precio_sesion_default ?? 0} />
          </Campo>
        </div>
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

  async function refrescar() {
    setUsuarios(await listarUsuarios());
    setCargando(false);
  }
  useEffect(() => {
    refrescar();
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
    await cambiarActivoUsuario(u.id, !u.activo);
    await refrescar();
    toast.success(u.activo ? "Usuario desactivado" : "Usuario activado");
  }

  async function cambiarRol(u: UsuarioEquipo, role: Rol) {
    await cambiarRolUsuario(u.id, role);
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
            </div>
            <Select
              value={u.role}
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
            <Button size="sm" variant="outline" onClick={() => toggleActivo(u)}>
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
        {eventos.map((ev) => (
          <LudaCard key={ev.id} className="flex flex-wrap items-center gap-3 p-3">
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
            <span className="ml-auto text-xs text-luda-gris-light">
              {format(new Date(ev.created_at), "d 'de' MMM yyyy, HH:mm", {
                locale: es,
              })}
            </span>
          </LudaCard>
        ))}
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
        {paquetes.map((p) => (
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
        ))}
      </div>
    </div>
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
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="paquetes">Paquetes</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoría</TabsTrigger>
          <TabsTrigger value="respaldo">Respaldo</TabsTrigger>
        </TabsList>
        <TabsContent value="consultorio">
          <ConsultorioTab />
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
