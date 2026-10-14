"""El cargador del catálogo (decisión 58): lectura, búsqueda por nombre o alias y texto embebido."""

from app.ai.catalog import (
    CatalogExercise,
    embedding_text,
    find,
    load_catalog,
    text_hash,
)
from app.enums import Muscle


def test_carga_todo_el_catalogo_validado():
    catalogo = load_catalog()
    assert len(catalogo) >= 100
    assert all(isinstance(e, CatalogExercise) for e in catalogo)
    assert len({e.id for e in catalogo}) == len(catalogo)


def test_find_por_nombre_sin_importar_tildes_ni_mayusculas():
    assert find("Press de banca con barra").id == "press_banca_barra"
    assert find("  press DE banca con BARRA ").id == "press_banca_barra"
    assert find("Extensión de tríceps en polea con cuerda").id == "extension_triceps_polea_cuerda"
    assert find("extension de triceps en polea con cuerda").id == "extension_triceps_polea_cuerda"


def test_find_por_alias():
    assert find("lagartijas").id == "flexiones_pecho"
    assert find("Squat").id == "sentadilla_barra"
    assert find("Balanceo con pesa rusa").id == "kettlebell_swing"


def test_find_devuelve_none_si_no_esta():
    assert find("Ejercicio inventado por la IA") is None
    assert find("") is None


def test_el_cardio_se_distingue_por_su_etiqueta():
    cinta = find("Trote en cinta")
    assert cinta.primary_muscle == Muscle.FULL_BODY


def test_el_texto_embebido_incluye_nombre_descripcion_y_musculos():
    texto = embedding_text(find("Press de banca con barra"))
    assert "Press de banca con barra" in texto
    assert "pecho" in texto  # músculo principal
    assert "tríceps" in texto  # secundario
    assert "barra" in texto  # equipamiento
    assert "intermedio" not in texto  # el nivel se filtra por código, no va al vector


def test_el_hash_es_estable_y_distinto_entre_ejercicios():
    a, b = find("Plancha abdominal"), find("Dominadas")
    assert text_hash(a) == text_hash(a)
    assert text_hash(a) != text_hash(b)
    assert len(text_hash(a)) == 64
