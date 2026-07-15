import { generateText } from "ai";

export async function redactarProfesionalmente(
  texto: string,
  contexto?: string,
): Promise<string> {
  const { text } = await generateText({
    model: "anthropic/claude-sonnet-5",
    prompt: `Eres un asistente que ayuda al personal de un centro de terapia infantil (Ludimente) a redactar notas clínicas y administrativas de forma profesional, clara y objetiva.
Reescribe el siguiente texto en tono profesional, sin inventar información nueva ni cambiar su significado. Corrige ortografía y gramática. Sé conciso y mantén el idioma español.
${contexto ? `Contexto del campo: ${contexto}` : ""}

Texto original:
"""${texto}"""

Devuelve únicamente el texto redactado, sin comillas ni explicaciones adicionales.`,
  });

  return text.trim();
}
