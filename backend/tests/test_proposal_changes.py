"""Antes y después en la propuesta de semana nueva (#49)."""

from datetime import date

from sqlalchemy import select

from app.ai.routine import DayProposal, RoutineProposal
from app.enums import Goal, Level, ProposalKind, ProposalStatus
from app.models import PlanProposal, Routine, User
from tests.test_weeks import api, cardio, crear_semana, fuerza, plancha, rutina  # noqa: F401


def guardar_propuesta(api, propuesta: RoutineProposal, con_base=True, email=None) -> int:
    """Una propuesta pendiente como la que deja "Generar" (sin llamar a la IA)."""
    with api.session() as db:
        consulta = select(Routine)
        if email:
            consulta = consulta.join(User).where(User.email == email)
        routine = db.scalar(consulta)
        fila = PlanProposal(
            user_id=routine.user_id,
            kind=ProposalKind.WEEK_CLOSE if con_base else ProposalKind.GENERATE,
            status=ProposalStatus.PENDING,
            proposed_changes={
                "routine": propuesta.model_dump(mode="json"),
                "goal": Goal.FUERZA.value,
                "level": Level.INTERMEDIO.value,
                "routine_id": routine.id if con_base else None,
                "warnings": [],
                "days": len(propuesta.days),
            },
        )
        db.add(fila)
        db.commit()
        return fila.id


def cambios(api, propuesta_id):
    respuesta = api.get(f"/proposals/{propuesta_id}/changes")
    assert respuesta.status_code == 200
    return respuesta.json()


def por_nombre(cuerpo):
    return {e["name"]: e for e in cuerpo["exercises"]}


def semana_base(api):
    """La semana anterior: Día 1 press de banca (4 series, 50 a 65 kg, 120 s) y plancha;
    Día 2 sentadilla y cinta."""
    crear_semana(api, date(2026, 9, 1))


def test_la_misma_semana_no_tiene_cambios(api):
    semana_base(api)

    cuerpo = cambios(api, guardar_propuesta(api, rutina()))

    assert cuerpo["has_base"] is True
    assert cuerpo["base_week_number"] == 1
    assert {e["status"] for e in cuerpo["exercises"]} == {"igual"}
    assert cuerpo["removed"] == []


def test_sube_la_carga_cambian_las_series_y_el_descanso(api):
    semana_base(api)
    press = fuerza("Press de banca", rest=90)  # mismo esquema, descanso de 120 a 90 s
    for serie in press.sets:
        serie.target_weight_kg += 2.5  # la mayor pasa de 65 a 67,5 kg
    sentadilla = fuerza("Sentadilla", sets=3)  # de 4 series a 3
    propuesta = RoutineProposal(days=[
        DayProposal(title="Torso A", exercises=[press, plancha()]),
        DayProposal(title="Pierna A", exercises=[sentadilla, cardio()]),
    ])

    ejercicios = por_nombre(cambios(api, guardar_propuesta(api, propuesta)))

    assert ejercicios["Press de banca"]["status"] == "cambia"
    assert ejercicios["Press de banca"]["load"] == "sube"
    assert ejercicios["Press de banca"]["sets_changed"] is False
    assert (ejercicios["Press de banca"]["rest_before"], ejercicios["Press de banca"]["rest_after"]) == (120, 90)
    assert ejercicios["Press de banca"]["rest_changed"] is True
    assert ejercicios["Sentadilla"]["sets_changed"] is True
    assert len(ejercicios["Sentadilla"]["sets_before"]) == 4
    assert len(ejercicios["Sentadilla"]["sets_after"]) == 3
    assert ejercicios["Plancha"]["status"] == "igual"


def test_un_ejercicio_que_entra_y_otro_que_sale(api):
    semana_base(api)
    propuesta = RoutineProposal(days=[
        DayProposal(title="Torso A", exercises=[fuerza("Press de banca"), fuerza("Remo con barra")]),
        DayProposal(title="Pierna A", exercises=[fuerza("Sentadilla"), cardio()]),
    ])

    cuerpo = cambios(api, guardar_propuesta(api, propuesta))
    ejercicios = por_nombre(cuerpo)

    assert ejercicios["Remo con barra"]["status"] == "nuevo"
    assert ejercicios["Remo con barra"]["day_index"] == 1
    assert ejercicios["Remo con barra"]["sets_before"] == []
    assert cuerpo["removed"] == ["Plancha"]


def test_se_compara_por_nombre_sin_importar_el_dia_ni_las_mayusculas(api):
    semana_base(api)
    propuesta = RoutineProposal(days=[
        DayProposal(title="Pierna", exercises=[fuerza("SENTADILLA"), cardio()]),
        DayProposal(title="Torso", exercises=[fuerza("press de banca"), plancha()]),
    ])

    ejercicios = por_nombre(cambios(api, guardar_propuesta(api, propuesta)))

    assert ejercicios["SENTADILLA"]["status"] == "igual"
    assert ejercicios["press de banca"]["day_index"] == 2


def test_la_primera_rutina_no_tiene_semana_anterior(api):
    semana_base(api)  # aunque exista una semana, una propuesta sin rutina no compara

    assert cambios(api, guardar_propuesta(api, rutina(), con_base=False)) == {
        "has_base": False,
        "base_week_number": None,
        "exercises": [],
        "removed": [],
    }


def test_la_propuesta_de_otro_usuario_da_404(api):
    crear_semana(api, date(2026, 9, 1), email="otro@spotter.local")
    ajena = guardar_propuesta(api, rutina(), email="otro@spotter.local")

    assert api.get(f"/proposals/{ajena}/changes").status_code == 404
