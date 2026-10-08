"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { API, errorText } from "@/lib/api";

const NIVELES = ["principiante", "intermedio", "avanzado"];
const OBJETIVOS = [
  ["masa", "masa"],
  ["fuerza", "fuerza"],
  ["perder_grasa", "perder grasa"],
  ["condicion_general", "condición general"],
  ["mantenerme_activo", "mantenerme activo"],
];
const EQUIPAMIENTOS = ["gimnasio", "mancuernas", "casa"];

type Form = {
  name: string;
  age: string;
  weight_kg: string;
  height_cm: string;
  sex: string;
  level: string;
  goal: string;
  equipment: string;
  limitations: string;
  accept_legal_notice: boolean;
};

const VACIO: Form = {
  name: "",
  age: "",
  weight_kg: "",
  height_cm: "",
  sex: "",
  level: "",
  goal: "",
  equipment: "",
  limitations: "",
  accept_legal_notice: false,
};

export default function PerfilPage() {
  const router = useRouter();
  const [form, setForm] = useState<Form>(VACIO);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/profile`)
      .then(async (res) => {
        if (res.status === 404) return; // todavía no hay perfil: formulario vacío
        if (!res.ok) throw new Error("No se pudo cargar el perfil");
        const p = await res.json();
        setForm({
          name: p.name,
          age: String(p.age),
          weight_kg: String(p.weight_kg),
          height_cm: String(p.height_cm),
          sex: p.sex ?? "",
          level: p.level,
          goal: p.goal,
          equipment: p.equipment,
          limitations: p.limitations ?? "",
          accept_legal_notice: p.legal_notice_accepted,
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  function cambiar<K extends keyof Form>(campo: K, valor: Form[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch(`${API}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        age: form.age === "" ? null : Number(form.age),
        weight_kg: form.weight_kg === "" ? null : form.weight_kg,
        height_cm: form.height_cm === "" ? null : Number(form.height_cm),
        sex: form.sex || null,
        level: form.level || null,
        goal: form.goal || null,
        equipment: form.equipment || null,
        limitations: form.limitations || null,
        accept_legal_notice: form.accept_legal_notice,
      }),
    });
    if (res.ok) {
      router.push("/");
    } else {
      setError(errorText((await res.json()).detail));
    }
  }

  if (cargando) return <main>Cargando...</main>;

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <h1>Tus datos</h1>
      <form onSubmit={guardar}>
        <p>
          <label>
            Nombre
            <br />
            <input
              value={form.name}
              onChange={(e) => cambiar("name", e.target.value)}
            />
          </label>
        </p>
        <p>
          <label>
            Edad
            <br />
            <input
              type="number"
              value={form.age}
              onChange={(e) => cambiar("age", e.target.value)}
            />
          </label>
        </p>
        <p>
          <label>
            Peso (kg)
            <br />
            <input
              type="number"
              step="0.1"
              value={form.weight_kg}
              onChange={(e) => cambiar("weight_kg", e.target.value)}
            />
          </label>
        </p>
        <p>
          <label>
            Altura (cm)
            <br />
            <input
              type="number"
              value={form.height_cm}
              onChange={(e) => cambiar("height_cm", e.target.value)}
            />
          </label>
        </p>
        <p>
          <label>
            Sexo (opcional)
            <br />
            <select
              value={form.sex}
              onChange={(e) => cambiar("sex", e.target.value)}
            >
              <option value="">sin indicar</option>
              <option value="masculino">masculino</option>
              <option value="femenino">femenino</option>
              <option value="otro">otro</option>
            </select>
          </label>
        </p>
        <Opciones
          titulo="Nivel"
          nombre="level"
          valor={form.level}
          opciones={NIVELES.map((n) => [n, n])}
          onChange={(v) => cambiar("level", v)}
        />
        <Opciones
          titulo="Objetivo"
          nombre="goal"
          valor={form.goal}
          opciones={OBJETIVOS}
          onChange={(v) => cambiar("goal", v)}
        />
        <Opciones
          titulo="Equipamiento"
          nombre="equipment"
          valor={form.equipment}
          opciones={EQUIPAMIENTOS.map((n) => [n, n])}
          onChange={(v) => cambiar("equipment", v)}
        />
        <p>
          <label>
            Lesiones o limitaciones (opcional)
            <br />
            <textarea
              rows={3}
              value={form.limitations}
              onChange={(e) => cambiar("limitations", e.target.value)}
            />
          </label>
        </p>
        <p>
          <label>
            <input
              type="checkbox"
              checked={form.accept_legal_notice}
              onChange={(e) => cambiar("accept_legal_notice", e.target.checked)}
            />{" "}
            Entiendo que la app no da consejo médico
          </label>
        </p>
        <button type="submit">Guardar</button>{" "}
        <Link href="/">
          <button type="button">Volver</button>
        </Link>
      </form>
      {error && <pre style={{ color: "crimson" }}>{error}</pre>}
    </main>
  );
}

function Opciones({
  titulo,
  nombre,
  valor,
  opciones,
  onChange,
}: {
  titulo: string;
  nombre: string;
  valor: string;
  opciones: string[][];
  onChange: (v: string) => void;
}) {
  return (
    <fieldset style={{ marginBottom: "1rem" }}>
      <legend>{titulo}</legend>
      {opciones.map(([v, etiqueta]) => (
        <label key={v} style={{ marginRight: "1rem" }}>
          <input
            type="radio"
            name={nombre}
            checked={valor === v}
            onChange={() => onChange(v)}
          />{" "}
          {etiqueta}
        </label>
      ))}
    </fieldset>
  );
}
