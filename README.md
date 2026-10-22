# ¿Me da para vivir? · Motor de cálculo

Motor de cálculo y datos de referencia para el simulador guiado **"¿Me da para vivir?"**: el alumnado de FP recibe su primera oferta de trabajo y tiene que leer la nómina, elegir dónde vivir, cuadrar un presupuesto y aguantar un año con imprevistos.

Este repositorio está pensado para conectarlo a **Gemini (Personalizar → Conectores → GitHub)**. Así, cuando Gemini genera el simulador en Canvas, usa estas funciones y estos datos en lugar de inventar las cifras.

## Contenido

| Archivo | Qué es |
|---|---|
| `src/nomina.js` | Funciones puras: `calcularNomina`, `tasaEsfuerzo`, `evaluarPresupuesto`, `simularAnio` |
| `data/parametros-2026.json` | SMI, tipos de cotización del trabajador, escala de retenciones, imprevistos |
| `data/escenarios.json` | Ofertas de ejemplo de FP, alquileres por ciudad y gastos base |
| `tests/nomina.test.js` | Pruebas: `node tests/nomina.test.js` |

## Reglas para quien genere el simulador

1. Copia las funciones de `src/nomina.js` dentro del HTML **sin cambiar las fórmulas**.
2. Lee los importes de `data/`; no los escribas a mano.
3. Muestra en la ficha docente las simplificaciones que figuran en la cabecera de `src/nomina.js`.
4. Los niveles se validan con estas funciones (por ejemplo, el nivel 1 se supera si el neto que calcula el alumno difiere menos de 20 € de `netoMensualEquivalente`).

## Simplificaciones

- Cotizaciones del trabajador en Régimen General (contingencias comunes 4,70 %, desempleo 1,55 % indefinido o 1,60 % temporal, formación profesional 0,10 %, MEI 0,15 %).
- IRPF: aproximación didáctica del procedimiento de retenciones para una persona soltera sin hijos, con la deducción para rentas cercanas al SMI. Para la cifra exacta, usa el simulador de retenciones de la AEAT.
- Alquileres de habitación de Madrid, Barcelona, Málaga y Jaén según idealista (1T 2026). El resto de importes son orientativos y el docente puede editarlos.

Material de EdTrainer TV · Edvolution. Uso educativo.
