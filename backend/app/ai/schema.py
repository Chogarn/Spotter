"""Convierte un esquema JSON de Pydantic a uno que acepte la IA (Gemini o Cloudflare).

Pydantic genera `$ref`/`$defs`, `anyOf` con `null`, `default` y `title`, y la API de Gemini
rechaza el pedido (400) con ese formato. Acá se aplana: las referencias se reemplazan por su
contenido y los opcionales pasan a `nullable`.
"""

from typing import Any

# Palabras del esquema que no aportan a Gemini o que rechaza. Los límites (largo, rango, cantidad)
# se quitan porque con ellos el esquema completo da error 400 (probado: sin límites funciona).
# No se pierde nada: Pydantic los vuelve a comprobar al validar la respuesta.
_DROP = {
    "title", "default", "additionalProperties", "$defs", "description",
    "minLength", "maxLength", "minimum", "maximum", "minItems", "maxItems",
}


def gemini_schema(schema: dict[str, Any]) -> dict[str, Any]:
    defs = schema.get("$defs", {})

    def walk(node: Any) -> Any:
        if isinstance(node, list):
            return [walk(item) for item in node]
        if not isinstance(node, dict):
            return node
        if "$ref" in node:
            return walk(defs[node["$ref"].rsplit("/", 1)[-1]])
        if "anyOf" in node:
            options = node["anyOf"]
            real = [o for o in options if o.get("type") != "null"]
            if len(real) == 1 and len(real) != len(options):
                merged = dict(walk(real[0]))
                merged["nullable"] = True
                return merged
        result = {}
        for key, value in node.items():
            if key in _DROP:
                continue
            if key == "properties":
                # Acá las claves son NOMBRES DE CAMPOS (p. ej. "title"), no palabras del esquema.
                result[key] = {name: walk(sub) for name, sub in value.items()}
            else:
                result[key] = walk(value)
        return result

    return walk(schema)


def strict_schema(schema: dict[str, Any]) -> dict[str, Any]:
    """Esquema JSON estándar sin `$ref`, para Cloudflare (formato de OpenAI, no el de Gemini).

    Todos los campos pasan a obligatorios, como el modo estricto de OpenAI: en la prueba del
    2026-11-12 los modelos de Cloudflare salteaban los opcionales (por ejemplo `rest_seconds`, que el
    validador exige según el tipo de ejercicio). Un opcional sigue aceptando `null` por su `anyOf`,
    pero el modelo tiene que escribirlo. Se dejan los límites: Pydantic los comprueba igual.
    """
    defs = schema.get("$defs", {})

    def walk(node: Any) -> Any:
        if isinstance(node, list):
            return [walk(item) for item in node]
        if not isinstance(node, dict):
            return node
        if "$ref" in node:
            return walk(defs[node["$ref"].rsplit("/", 1)[-1]])
        out = {}
        for key, value in node.items():
            if key in ("$defs", "title", "default"):
                continue
            if key == "properties":
                out[key] = {name: walk(sub) for name, sub in value.items()}
            else:
                out[key] = walk(value)
        if "properties" in out:
            out["required"] = list(out["properties"])
        return out

    return walk(schema)
