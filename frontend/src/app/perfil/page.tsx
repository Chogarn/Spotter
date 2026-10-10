"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { API, errorText } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ErrorMessage } from "@/components/ErrorMessage";

type Form = {
  name: string;
  age: string;
  weight_kg: string;
  height_cm: string;
  sex: string;
  limitations: string;
  accept_legal_notice: boolean;
};

const VACIO: Form = {
  name: "",
  age: "",
  weight_kg: "",
  height_cm: "",
  sex: "",
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
        <div className="mb-3 grid gap-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => cambiar("name", e.target.value)}
          />
        </div>
        <div className="mb-3 grid gap-1.5">
          <Label htmlFor="age">Edad</Label>
          <Input
            id="age"
            type="number"
            value={form.age}
            onChange={(e) => cambiar("age", e.target.value)}
          />
        </div>
        <div className="mb-3 grid gap-1.5">
          <Label htmlFor="weight_kg">Peso (kg)</Label>
          <Input
            id="weight_kg"
            type="number"
            step="0.1"
            value={form.weight_kg}
            onChange={(e) => cambiar("weight_kg", e.target.value)}
          />
        </div>
        <div className="mb-3 grid gap-1.5">
          <Label htmlFor="height_cm">Altura (cm)</Label>
          <Input
            id="height_cm"
            type="number"
            value={form.height_cm}
            onChange={(e) => cambiar("height_cm", e.target.value)}
          />
        </div>
        <div className="mb-3 grid gap-1.5">
          <Label htmlFor="sex">Sexo (opcional)</Label>
          <NativeSelect
            id="sex"
            value={form.sex}
            onChange={(e) => cambiar("sex", e.target.value)}
          >
            <NativeSelectOption value="">sin indicar</NativeSelectOption>
            <NativeSelectOption value="masculino">masculino</NativeSelectOption>
            <NativeSelectOption value="femenino">femenino</NativeSelectOption>
            <NativeSelectOption value="otro">otro</NativeSelectOption>
          </NativeSelect>
        </div>
        <div className="mb-3 grid gap-1.5">
          <Label htmlFor="limitations">Lesiones o limitaciones (opcional)</Label>
          <Textarea
            id="limitations"
            rows={3}
            value={form.limitations}
            onChange={(e) => cambiar("limitations", e.target.value)}
          />
        </div>
        <div className="mb-4 flex items-center gap-2">
          <Checkbox
            id="accept_legal_notice"
            checked={form.accept_legal_notice}
            onCheckedChange={(marcado) => cambiar("accept_legal_notice", marcado)}
          />
          <Label htmlFor="accept_legal_notice">Entiendo que la app no da consejo médico</Label>
        </div>
        <Button type="submit">Guardar</Button>{" "}
        <Button nativeButton={false} render={<Link href="/" />}>Volver</Button>
      </form>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </main>
  );
}
