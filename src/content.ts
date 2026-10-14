import type { Companion, Effort, Mission, Size } from './types';

export const CONTENT_VERSION = 1;
export const SIZES: Size[] = ['light', 'medium', 'large', 'ultra'];
export const EFFORTS: Effort[] = ['low', 'medium', 'high'];
export const companions: Companion[] = [
  { id: 'light', name: 'Chiqui', label: 'Ligero', description: 'Datos claros. Respuestas directas.', base: 3, color: '#baf769', quote: 'Pequeño por fuera. ¡Capitán por dentro!' },
  { id: 'medium', name: 'Medianito', label: 'Medio', description: 'Ideas, palabras y conexiones.', base: 6, color: '#7ae4ed', quote: 'Tengo un plan. Y una canción sobre el plan.' },
  { id: 'large', name: 'Grandulón', label: 'Grande', description: 'Fuentes, condiciones y precisión.', base: 10, color: '#c8afff', quote: 'Analizaré el chiste después de la misión.' },
  { id: 'ultra', name: 'Gigantón', label: 'Ultra', description: 'Retos excepcionalmente complejos.', base: 15, color: '#f6c878', quote: 'El universo cabe en un pequeño abrazo.' },
];
export const effortInfo: Record<Effort, { label: string; description: string; multiplier: number; symbol: string }> = {
  low: { label: 'Bajo', description: 'Responder directamente', multiplier: 1, symbol: 'I' },
  medium: { label: 'Medio', description: 'Relacionar y comprobar', multiplier: 1.5, symbol: 'II' },
  high: { label: 'Alto', description: 'Examinar a fondo', multiplier: 2, symbol: 'III' },
};
export const missions: Mission[] = [
  {
    id: 'MIS-01', title: 'Leviatán de los Mil Archivos', system: 'Archivo estelar', principle: 'extraer_datos',
    variants: [
      { brief: 'Un archivo inmenso bloquea la estación. Extrae las tres fechas de su registro y conserva sus etiquetas.', context: ['Registro 7A · Tras 600 páginas de bitácoras repetidas, aparecen tres entradas verificadas:', 'Despegue: 12 de marzo. Acoplamiento: 14 de marzo. Regreso: 20 de marzo.', 'El resto del archivo describe mantenimiento rutinario; no modifica estas fechas.'], criteria: ['Extraer las tres fechas explícitas.', 'Conservar la etiqueta de cada fecha, sin añadir información.'] },
      { brief: 'El catálogo de una biblioteca lunar ocupa miles de líneas. Recupera las tres fechas de la exposición con sus etiquetas.', context: ['Entre las reseñas del catálogo figuran estos datos:', 'Apertura: 3 de julio. Visita guiada: 9 de julio. Cierre: 18 de julio.', 'Las descripciones de las obras no cambian el calendario.'], criteria: ['Localizar las tres fechas indicadas.', 'Mantener las etiquetas apertura, visita guiada y cierre.'] },
    ], sizes: [...SIZES], efforts: [...EFFORTS], reference: { size: 'light', effort: 'low' },
    lesson: 'La longitud del documento no vuelve compleja una extracción de datos explícitos.', work: 'Para localizar fechas o pasar datos a un formato, empieza por identificar si están escritos directamente.',
    sizeFailure: '', effortFailure: '', solution: ['Despegue: 12 de marzo · Acoplamiento: 14 de marzo · Regreso: 20 de marzo.', 'Apertura: 3 de julio · Visita guiada: 9 de julio · Cierre: 18 de julio.'],
  },
  {
    id: 'MIS-02', title: 'Sirena de las Frecuencias', system: 'Canal de bienvenida', principle: 'redactar',
    variants: [
      { brief: 'La Sirena ha silenciado las comunicaciones. Redacta una bienvenida cálida, clara y fiel a estos tres datos.', context: ['Destino: Órbita Cero.', 'La visita comienza a las 09:00.', 'Cada visitante debe traer su pase azul.'], criteria: ['Incluir destino, hora y pase.', 'Usar un tono cálido y claro sin inventar detalles.'] },
      { brief: 'Da la bienvenida a las nuevas cadetes del observatorio. Usa los tres datos disponibles y un tono amable.', context: ['Destino: Observatorio Lumen.', 'La sesión empieza a las 16:00.', 'Cada cadete debe traer su cuaderno de estrellas.'], criteria: ['Incluir destino, hora y material.', 'Escribir con calidez, sin prometer actividades no indicadas.'] },
    ], sizes: ['medium', 'large', 'ultra'], efforts: [...EFFORTS], reference: { size: 'medium', effort: 'low' },
    lesson: 'La redacción necesita cierta capacidad; una bienvenida clara no requiere deliberación profunda.', work: 'Un mensaje cotidiano con datos completos puede necesitar capacidad de redacción y poco esfuerzo de análisis.',
    sizeFailure: 'Faltó capacidad de redacción para integrar los tres datos en una bienvenida cálida.', effortFailure: '', solution: ['¡Bienvenidos a Órbita Cero! Los esperamos a las 09:00. Recuerden traer su pase azul.', '¡Bienvenidas al Observatorio Lumen! La sesión empieza a las 16:00. Traigan su cuaderno de estrellas.'],
  },
  {
    id: 'MIS-03', title: 'Mercader de las Mareas', system: 'Red de suministros', principle: 'relacionar_datos',
    variants: [
      { brief: 'El Mercader dice que menos pedidos significa menos ingresos. Cruza las dos tablas y explica la excepción.', context: ['Tabla A · Pedidos: semana 1 = 10; semana 2 = 8.', 'Tabla B · Ingresos: semana 1 = 100; semana 2 = 120.'], criteria: ['Relacionar la bajada de pedidos con la subida de ingresos.', 'Calcular el ingreso medio por pedido sin inventar causas.'] },
      { brief: 'La nave realizó menos viajes, pero transportó más carga. Relaciona las tablas para explicar lo ocurrido.', context: ['Tabla A · Viajes: semana 1 = 12; semana 2 = 9.', 'Tabla B · Peso total: semana 1 = 120; semana 2 = 135.'], criteria: ['Relacionar la caída de viajes con el aumento de carga.', 'Comparar el peso medio por viaje sin inventar causas.'] },
    ], sizes: ['medium', 'large', 'ultra'], efforts: ['medium', 'high'], reference: { size: 'medium', effort: 'medium' },
    lesson: 'Relacionar dos fuentes y comprobar una proporción exige más que extraer cifras.', work: 'Al comparar tablas, dedica análisis a la relación entre los datos y evita inventar explicaciones causales.',
    sizeFailure: 'Faltó capacidad para relacionar ambas tablas.', effortFailure: 'La extracción directa no basta: hay que calcular y comprobar la relación.', solution: ['El ingreso medio por pedido subió de 10 a 15. Por eso hubo más ingresos con menos pedidos; las tablas no dicen cuál fue la causa.', 'El peso medio por viaje subió de 10 a 15. Se transportó más con menos viajes; no sabemos por qué cambió la carga.'],
  },
  {
    id: 'MIS-04', title: 'Espejo de las Flotas', system: 'Centro de inteligencia', principle: 'cruzar_fuentes',
    variants: [
      { brief: 'Tres informes discrepan sobre una ruta. Detecta la contradicción y justifica una conclusión sin ocultar la incertidumbre.', context: ['Informe A · 08:00: el corredor norte está abierto.', 'Informe B · 08:10: el corredor norte está cerrado por escombros.', 'Informe C · 08:20: una inspección confirma los escombros del corredor norte.'], criteria: ['Identificar la contradicción entre A y B.', 'Usar fechas y corroboración de C para priorizar el cierre actual.'] },
      { brief: 'Tres registros describen la reserva de un puerto lunar. Decide qué información es más fiable y explica el conflicto.', context: ['Registro A · 11:00: hay 40 celdas de energía.', 'Registro B · 11:00: quedan 12 celdas después del abastecimiento.', 'Registro C · 11:15: el inventario físico confirma 12 celdas.'], criteria: ['Identificar la contradicción entre A y B, ambos de las 11:00.', 'Priorizar las 12 celdas corroboradas por el inventario más reciente.'] },
    ], sizes: ['large', 'ultra'], efforts: ['high'], reference: { size: 'large', effort: 'high' },
    lesson: 'Cruzar fuentes contradictorias exige capacidad y una comprobación profunda.', work: 'En informes que discrepan, compara fecha, evidencia y corroboración antes de justificar una conclusión.',
    sizeFailure: 'Faltó capacidad para contrastar las tres fuentes y sus contradicciones.', effortFailure: 'Faltó análisis profundo para comprobar qué conclusión está respaldada.', solution: ['A contradice a B. B es posterior y C confirma el bloqueo: trata el corredor como cerrado hasta recibir nueva evidencia.', 'A y B se contradicen a la misma hora. B y el inventario físico posterior C respaldan una reserva de 12 celdas; el dato de 40 no está corroborado.'],
  },
  {
    id: 'MIS-05', title: 'Puerta del Dato Perdido', system: 'Puerta de tránsito', principle: 'pedir_informacion',
    variants: [
      { brief: 'Elige una ruta que salga después de tu llegada y alcance la estación antes de las 18:00. Falta un dato indispensable.', context: ['Ruta A · Salida 14:00; llegada 17:00.', 'Ruta B · Salida 16:00; llegada 17:30.', 'Hora de llegada al punto de partida: sin confirmar.'], criteria: ['Salir después de tu llegada al punto de partida.', 'Llegar a la estación antes de las 18:00.'], missing: 'La nave llega al punto de partida a las 15:00. La ruta A ya habrá salido.' },
      { brief: 'Reserva un transporte al laboratorio que salga después de tu llegada y termine antes de las 12:00. Necesitas confirmar tu horario.', context: ['Transporte A · Salida 08:00; llegada 10:00.', 'Transporte B · Salida 09:30; llegada 11:00.', 'Hora de llegada al muelle: pendiente de confirmar.'], criteria: ['Elegir una salida posterior a la llegada al muelle.', 'Llegar al laboratorio antes de las 12:00.'], missing: 'Llegas al muelle a las 09:00. El transporte A ya habrá salido.' },
    ], sizes: ['medium', 'large', 'ultra'], efforts: ['medium', 'high'], reference: { size: 'medium', effort: 'medium' },
    lesson: 'Más capacidad o esfuerzo no aporta una hora que nadie ha proporcionado.', work: 'Si falta una condición indispensable, pide esa información antes de analizar o recomendar.',
    sizeFailure: 'Faltó capacidad para combinar las dos condiciones de horario.', effortFailure: 'Faltó comprobar la salida y la llegada contra ambas condiciones.', solution: ['La ruta B sale a las 16:00, después de tu llegada a las 15:00, y alcanza la estación a las 17:30.', 'El transporte B sale a las 09:30, después de tu llegada a las 09:00, y llega al laboratorio a las 11:00.'],
  },
  {
    id: 'MIS-06', title: 'Guardián de las Órbitas', system: 'Núcleo del bloqueo', principle: 'coordinar_dependencias',
    variants: [
      { brief: 'Coordina el lanzamiento final: una tarea breve con rutas, horarios y combustible que dependen entre sí.', context: ['La nave tiene 8 celdas. Debe recoger una llave en Lumen antes de activar el portal de Órbita Cero.', 'Ruta directa al portal: 3 celdas, pero no pasa por Lumen.', 'Ruta Lumen: sale 10:00, llega 10:20, cuesta 4 celdas. La llave se entrega 10:25.', 'Lumen → portal: sale 10:30, llega 10:50, cuesta 3 celdas. El portal abre de 10:45 a 11:00.', 'Ruta alternativa por Helix: recoge la llave, pero cuesta 9 celdas en total.'], criteria: ['Recoger la llave antes de ir al portal.', 'Cumplir cada conexión y la ventana de apertura.', 'No superar las 8 celdas disponibles.'] },
      { brief: 'Sincroniza el rescate final: consigue un permiso, enlaza dos rutas y llega con combustible suficiente.', context: ['Dispones de 10 celdas. El permiso se recoge en Vega; el refugio exige presentarlo al llegar.', 'Ruta directa al refugio: 4 celdas, sin permiso.', 'Base → Vega: sale 13:00, llega 13:20, cuesta 5 celdas. Permiso listo a las 13:25.', 'Vega → refugio: sale 13:30, llega 13:50, cuesta 4 celdas. Acceso abierto de 13:45 a 14:00.', 'La alternativa por Iris obtiene el permiso pero consume 11 celdas.'], criteria: ['Obtener el permiso antes de entrar.', 'Verificar conexiones y ventana de acceso.', 'Mantener el gasto dentro de las 10 celdas.'] },
    ], sizes: ['ultra'], efforts: ['high'], reference: { size: 'ultra', effort: 'high' },
    lesson: 'La complejidad está en las dependencias, no en la longitud del texto. Aquí Ultra y Alto están justificados.', work: 'En una coordinación excepcional, comprueba conjuntamente requisitos previos, horarios, alternativas y recursos.',
    sizeFailure: 'Faltó capacidad para coordinar todas las dependencias del lanzamiento.', effortFailure: 'Faltó análisis profundo para verificar conexiones, ventana y combustible.', solution: ['Pasa por Lumen, recoge la llave a las 10:25 y enlaza la salida de las 10:30. Llegas 10:50 dentro de la ventana y gastas 7 de 8 celdas.', 'Pasa por Vega, recoge el permiso a las 13:25 y toma la salida de las 13:30. Llegas 13:50 dentro de la ventana y gastas 9 de 10 celdas.'],
  },
];
export const getMission = (id: string): Mission => {
  const mission = missions.find(m => m.id === id);
  if (!mission) throw new Error('Misión desconocida');
  return mission;
};
export const getCompanion = (id: Size) => companions.find(c => c.id === id)!;
export const rewards = [
  { id: 'portal', name: 'Fragmento del portal', description: 'Una coordenada hacia la Tierra. ¿Quién dejó tu nombre en ella?', icon: '◈' },
  { id: 'smile', name: 'Sonrisa de Chiqui', description: 'Ahora tu dron tiene una expresión especial en la nave.', icon: '☻' },
  { id: 'aurora', name: 'Aurora de cabina', description: 'Un resplandor violeta acompaña tus viajes.', icon: '✧' },
  { id: 'foil', name: 'Cartas estelares', description: 'Tu tripulación estrena bordes de luz dorada.', icon: '▱' },
  { id: 'comet', name: 'Cometa compañero', description: 'Una nueva estela cruza la órbita de tu nave.', icon: '☄' },
  { id: 'captain', name: 'Insignia de capitán', description: 'Seis expediciones. Un criterio propio. Toda una galaxia.', icon: '✦' },
];
