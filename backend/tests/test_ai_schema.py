import json

from app.ai.routine import RoutineProposal
from app.ai.schema import gemini_schema


def test_el_esquema_no_trae_lo_que_gemini_rechaza():
    texto = json.dumps(gemini_schema(RoutineProposal.model_json_schema()))
    prohibidos = ('"$ref"', '"$defs"', '"anyOf"', '"default"', '"additionalProperties"',
                  '"minLength"', '"maxLength"', '"minimum"', '"maximum"', '"minItems"', '"maxItems"')
    for prohibido in prohibidos:
        assert prohibido not in texto


def test_conserva_los_campos_aunque_se_llamen_como_palabras_del_esquema():
    esquema = gemini_schema(RoutineProposal.model_json_schema())
    dia = esquema["properties"]["days"]["items"]
    assert "title" in dia["properties"]  # campo del día, no el "title" del esquema
    assert "title" in dia["required"]


def test_los_opcionales_pasan_a_nullable_y_se_conservan_las_listas_cerradas():
    esquema = gemini_schema(RoutineProposal.model_json_schema())
    ejercicio = esquema["properties"]["days"]["items"]["properties"]["exercises"]["items"]
    assert ejercicio["properties"]["rest_seconds"]["nullable"] is True
    assert "chest" in ejercicio["properties"]["primary_muscle"]["enum"]
    assert "sets" in ejercicio["required"]
