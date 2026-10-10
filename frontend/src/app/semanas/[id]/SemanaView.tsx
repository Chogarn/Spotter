"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

import { BackButton } from "@/components/BackButton";
import { API, readError, type WeekDetail } from "@/lib/api";
import { dayStateText, statusText } from "@/lib/format";

export default function SemanaView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [semana, setSemana] = useState<WeekDetail | null>(null);
  const [error, setError] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  // Comentario opcional que se manda al cerrar y que la IA lee al armar la semana siguiente.
  const [comentario, setComentario] = useState("");

  useEffect(() => {
    fetch(`${API}/weeks/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        setSemana(await res.json());
      })
      .catch((e) => setError(e.message));
  }, [id]);

  async function cerrar() {
    setError("");
    setCerrando(true);
    try {
      const res = await fetch(`${API}/weeks/${id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: comentario.trim() || null }),
      });
      if (!res.ok) throw new Error(await readError(res));
      setSemana((s) =>
        s ? { ...s, status: "closed", closing_note: comentario.trim() || null } : s,
      );
      setConfirmando(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo conectar con el servidor");
    }
    setCerrando(false);
  }

  const pendientes = semana ? semana.days.filter((d) => d.state !== "completed") : [];

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <BackButton href={semana ? `/rutinas/${semana.routine_id}` : "/rutinas"}>
        ← {semana ? semana.routine_name : "Mis rutinas"}
      </BackButton>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!semana && !error && <p>Cargando...</p>}
      {semana && (
        <>
          <h1>
            Semana {semana.number} · {statusText[semana.status]}
          </h1>
          <ul>
            {semana.days.map((d) => (
              <li key={d.day_index}>
                <Link href={`/semanas/${semana.id}/dia/${d.day_index}`}>
                  Día {d.day_index} · {d.title}
                </Link>{" "}
                <small>
                  ~{d.minutes} min · {d.exercise_count} ejercicios
                  {d.state !== "pending" && <> · {dayStateText[d.state]}</>}
                </small>
              </li>
            ))}
          </ul>

          {semana.status === "active" && !confirmando && (
            <button type="button" onClick={() => setConfirmando(true)}>
              Cerrar semana
            </button>
          )}
          {semana.status === "active" && confirmando && (
            <div role="alertdialog" style={{ border: "1px solid #888", padding: "1rem" }}>
              <p>
                {pendientes.length > 0
                  ? `Te faltan por completar: ${pendientes.map((d) => `Día ${d.day_index}`).join(", ")}. Esos días se cuentan como no hechos.`
                  : "Completaste todos los días."}{" "}
                ¿Cerrar la semana? No se puede deshacer.
              </p>
              <p>
                <label>
                  ¿Cómo te sentiste esta semana? (opcional)
                  <br />
                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={comentario}
                    disabled={cerrando}
                    onChange={(e) => setComentario(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </label>
                <small>La IA lo tiene en cuenta al armar la semana siguiente.</small>
              </p>
              <button type="button" onClick={cerrar} disabled={cerrando}>
                {cerrando ? "Cerrando..." : "Cerrar semana"}
              </button>{" "}
              <button type="button" onClick={() => setConfirmando(false)} disabled={cerrando}>
                Cancelar
              </button>
            </div>
          )}
          {semana.status === "closed" && (
            <>
              {semana.closing_note && (
                <>
                  <h2>Cómo te sentiste esta semana</h2>
                  <p style={{ whiteSpace: "pre-wrap" }}>{semana.closing_note}</p>
                </>
              )}
              <p>
                Semana cerrada. <Link href="/">Ir a la portada</Link> para generar la siguiente.
              </p>
            </>
          )}
        </>
      )}
    </main>
  );
}
