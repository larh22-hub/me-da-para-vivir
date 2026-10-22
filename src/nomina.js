/**
 * Motor de cálculo de "¿Me da para vivir?"
 * Simulador didáctico de emancipación con el primer sueldo (FP · FOL).
 *
 * Funciones puras y sin dependencias: se pueden copiar tal cual dentro de un
 * HTML de Gemini Canvas o importar en Node para validarlas.
 *
 * SIMPLIFICACIONES (deben figurar en la ficha docente):
 *  - Cotizaciones: solo las del trabajador en Régimen General (sin horas extra,
 *    sin cotización de solidaridad). Se calculan sobre el bruto anual prorrateado.
 *  - IRPF: aproximación didáctica del procedimiento de retenciones (soltero/a,
 *    sin hijos, sin discapacidad, menor de 65 años, contrato de más de un año).
 *    Incluye la deducción para rentas cercanas al SMI (590,89 €, decreciente
 *    hasta 20.048,45 €) aplicada directamente sobre la retención.
 *    La cifra exacta la da el simulador de retenciones de la AEAT.
 *  - "Neto mensual equivalente" = neto anual / 12, para comparar con gastos
 *    mensuales aunque se cobre en 14 pagas.
 */

const P = require('../data/parametros-2026.json');

const redondear = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

/** Cuota de la escala de retenciones para una base dada. */
function cuotaEscala(base, escala = P.irpf.escala) {
  let cuota = 0;
  let desde = 0;
  for (const tramo of escala) {
    const hasta = tramo.hasta ?? Infinity;
    if (base <= desde) break;
    const parte = Math.min(base, hasta) - desde;
    cuota += parte * tramo.tipo;
    desde = hasta;
  }
  return cuota;
}

/** Reducción por obtención de rendimientos del trabajo (art. 20 LIRPF). */
function reduccionTrabajo(rendimientoNeto, r = P.irpf.reduccionTrabajo) {
  if (rendimientoNeto <= r.umbralInferior) return r.maxima;
  if (rendimientoNeto <= r.umbralSuperior) {
    return Math.max(0, r.maxima - r.pendiente * (rendimientoNeto - r.umbralInferior));
  }
  return 0;
}

/** Deducción SMI: importe máximo hasta el SMI anual y decreciente hasta anularse. */
function deduccionSMI(brutoAnual, d = P.irpf.deduccionSMI) {
  if (brutoAnual <= P.smi.anual) return d.maxima;
  if (brutoAnual >= d.limiteSuperior) return 0;
  return d.maxima * (d.limiteSuperior - brutoAnual) / (d.limiteSuperior - P.smi.anual);
}

/**
 * Calcula la nómina a partir del bruto anual.
 * @param {number} brutoAnual  euros/año
 * @param {object} opciones    { pagas: 12|14, contrato: 'indefinido'|'temporal' }
 */
function calcularNomina(brutoAnual, { pagas = 14, contrato = 'indefinido' } = {}) {
  if (!(brutoAnual > 0)) throw new Error('El bruto anual debe ser un número positivo');
  if (![12, 14].includes(pagas)) throw new Error('Pagas: 12 o 14');

  const c = P.cotizacionTrabajador;
  const tipoDesempleo = contrato === 'temporal' ? c.desempleoTemporal : c.desempleoIndefinido;
  const baseMensual = Math.min(Math.max(brutoAnual / 12, P.bases.minimaMensual), P.bases.maximaMensual);
  const baseAnual = baseMensual * 12;

  const ss = {
    contingenciasComunes: baseAnual * c.contingenciasComunes,
    desempleo: baseAnual * tipoDesempleo,
    formacionProfesional: baseAnual * c.formacionProfesional,
    mei: baseAnual * c.mei,
  };
  const ssTotal = Object.values(ss).reduce((a, b) => a + b, 0);

  let irpfAnual = 0;
  {
    const rn = brutoAnual - ssTotal - P.irpf.otrosGastosDeducibles;
    const base = Math.max(0, rn - reduccionTrabajo(rn));
    irpfAnual = Math.max(0, cuotaEscala(base) - cuotaEscala(P.irpf.minimoPersonal));
    // Límite de la retención cerca del umbral exento (la cuota no supera el 43 % del exceso)
    irpfAnual = Math.min(irpfAnual, Math.max(0, P.irpf.limiteExceso * (brutoAnual - P.irpf.limiteExentoRetencion)));
    // Deducción para rentas del trabajo cercanas al SMI (D.A. 61.ª LIRPF, RDL 5/2026)
    irpfAnual = Math.max(0, irpfAnual - deduccionSMI(brutoAnual));
  }
  const tipoIrpf = redondear((irpfAnual / brutoAnual) * 100, 2);
  irpfAnual = brutoAnual * (tipoIrpf / 100);

  const netoAnual = brutoAnual - ssTotal - irpfAnual;
  return {
    brutoAnual: redondear(brutoAnual),
    pagas,
    brutoPorPaga: redondear(brutoAnual / pagas),
    seguridadSocial: Object.fromEntries(Object.entries(ss).map(([k, v]) => [k, redondear(v)])),
    seguridadSocialAnual: redondear(ssTotal),
    tipoIrpf,
    irpfAnual: redondear(irpfAnual),
    netoAnual: redondear(netoAnual),
    netoMensualEquivalente: redondear(netoAnual / 12),
  };
}

/** Tasa de esfuerzo: % del neto mensual que se va en vivienda (alquiler + suministros). */
function tasaEsfuerzo(netoMensual, alquiler, suministros = 0) {
  return redondear(((alquiler + suministros) / netoMensual) * 100, 1);
}

/**
 * Evalúa un presupuesto mensual con la regla orientativa 50/30/20.
 * @param {number} neto
 * @param {object} gastos  { vivienda, suministros, comida, transporte, movil, ocio, ropa, ahorro, otros }
 */
function evaluarPresupuesto(neto, gastos) {
  const g = { vivienda: 0, suministros: 0, comida: 0, transporte: 0, movil: 0, ocio: 0, ropa: 0, ahorro: 0, otros: 0, ...gastos };
  const necesidades = g.vivienda + g.suministros + g.comida + g.transporte + g.movil;
  const deseos = g.ocio + g.ropa + g.otros;
  const total = necesidades + deseos + g.ahorro;
  const saldo = neto - total;
  const pct = (x) => redondear((x / neto) * 100, 1);
  return {
    necesidades, deseos, ahorro: g.ahorro, total, saldo: redondear(saldo),
    pctNecesidades: pct(necesidades), pctDeseos: pct(deseos), pctAhorro: pct(g.ahorro),
    tasaEsfuerzo: tasaEsfuerzo(neto, g.vivienda, g.suministros),
    cuadra: saldo >= 0,
    cumple503020: pct(necesidades) <= 55 && pct(g.ahorro) >= 10 && saldo >= 0,
  };
}

/** Generador pseudoaleatorio con semilla (mulberry32) para que el año sea reproducible. */
function rng(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Simula 12 meses con imprevistos.
 * @param {object} p { nomina, gastoMensual, colchonInicial, semilla, eventos }
 *   nomina: resultado de calcularNomina (usa pagas para las extras de junio y diciembre)
 *   gastoMensual: total de gastos fijos + variables SIN el ahorro
 * @returns {{meses: Array, saldoFinal: number, mesesEnNegativo: number, colchonMeses: number}}
 */
function simularAnio({ nomina, gastoMensual, colchonInicial = 0, semilla = 2026, eventos = P.imprevistos }) {
  const azar = rng(semilla);
  const netoPaga = nomina.netoAnual / nomina.pagas;
  let saldo = colchonInicial;
  const meses = [];
  for (let m = 1; m <= 12; m++) {
    let ingreso = netoPaga;
    if (nomina.pagas === 14 && (m === 6 || m === 12)) ingreso += netoPaga;
    const ocurridos = eventos.filter((e) => azar() < e.probabilidadMensual);
    const coste = ocurridos.reduce((a, e) => a + e.coste, 0);
    saldo = saldo + ingreso - gastoMensual - coste;
    meses.push({ mes: m, ingreso: redondear(ingreso), gasto: gastoMensual, imprevistos: ocurridos.map((e) => e.nombre), costeImprevistos: coste, saldo: redondear(saldo) });
  }
  return {
    meses,
    saldoFinal: redondear(saldo),
    mesesEnNegativo: meses.filter((x) => x.saldo < 0).length,
    colchonMeses: redondear(saldo / gastoMensual, 1),
  };
}

module.exports = { calcularNomina, deduccionSMI, tasaEsfuerzo, evaluarPresupuesto, simularAnio, cuotaEscala, reduccionTrabajo, rng };
