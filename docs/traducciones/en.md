# Glosario de inglés

Vale para `src/i18n/en.ts` y todo `src/data/i18n/en/`. Si falta un término, se agrega acá. Reglas generales en la guía de traducción.

## Convenciones
- Inglés de Estados Unidos: *defense*, *center*, *color*, *practice*, *gray*.
- Trato directo con *you*. Se permiten contracciones (*you're*, *don't*); sin exclamaciones.
- *White* y *Black* con mayúscula cuando nombran al jugador o al bando (*White to move*, *you play White*). Con minúscula como color de una pieza o casilla (*a white pawn*, *a dark square*).
- *he/she* solo para un bot; al lector siempre *you*. Para una persona indefinida, *player* o *opponent*, nunca *he*.
- Títulos en mayúscula solo en la primera palabra y nombres propios (*Open files and active rooks*). Las aperturas, con mayúsculas según el nombre oficial.
- Miles con coma: `50,000`. Horas tal como vienen: `{hour}:00` (reloj de 24 horas, igual que en español).
- Comillas en pantalla: “ ”.

## Notación
Letras: K Q R B N. El peón no lleva letra. Enroque `O-O` y `O-O-O`. Captura `x`, jaque `+`, mate `#`, coronación `e8=Q`. Primera jugada: `1.e4`, respuesta de negras: `1...e5`. Las casillas no se traducen.

## Piezas
| Español | Inglés |
|---|---|
| rey | king |
| dama | queen (nunca «lady») |
| torre | rook |
| alfil | bishop |
| caballo | knight |
| peón | pawn |
| pieza | piece |
| pieza menor | minor piece |
| pieza mayor | major piece |
| pareja de alfiles | bishop pair |

## Jugadas y reglas
| Español | Inglés |
|---|---|
| jugada | move |
| capturar, comer | capture |
| cambio, cambiar piezas | trade, trade pieces |
| jaque | check |
| jaque mate, mate | checkmate, mate |
| dar mate | checkmate, deliver mate |
| rey ahogado, ahogar | stalemate |
| tablas | draw |
| tablas de mutuo acuerdo | draw by agreement |
| triple repetición | threefold repetition |
| regla de las 50 jugadas | 50-move rule |
| material insuficiente | insufficient material |
| enroque, enrocar | castling, castle |
| enroque corto / largo | kingside castling / queenside castling |
| captura al paso | en passant |
| coronación, coronar | promotion, promote |
| subpromoción | underpromotion |
| jaque perpetuo | perpetual check |
| rendirse | resign |
| abandonar la partida | abandon the game |
| partida | game |
| rival | opponent |
| turno, «juegan las blancas» | turn, «White to move» |

## Tablero
| Español | Inglés |
|---|---|
| casilla | square |
| fila | rank |
| columna | file |
| columna abierta | open file |
| diagonal | diagonal |
| flanco de rey / de dama | kingside / queenside |
| última fila | back rank |
| coordenadas | coordinates |

## Táctica
| Español | Inglés |
|---|---|
| horquilla | fork |
| clavada | pin |
| clavada absoluta / relativa | absolute pin / relative pin |
| pieza sobrecargada | overloaded piece |
| enfilada | skewer |
| ataque a la descubierta | discovered attack |
| jaque doble | double check |
| ataque doble | double attack |
| eliminar al defensor | remove the defender |
| desviación | deflection |
| atracción | attraction |
| despeje | clearance |
| interferencia | interference |
| jugada intermedia | intermezzo |
| rayos X | X-ray attack |
| pieza colgada, suelta | hanging piece, loose piece |
| pieza sin protección | unprotected piece |
| pieza atrapada | trapped piece |
| sacrificio | sacrifice |
| sacrificio de calidad | exchange sacrifice |
| calidad | the exchange |
| combinación | combination |
| amenaza | threat |
| trampa | trap |
| mate del pasillo | back-rank mate |
| mate del pastor | Scholar's Mate |
| mate de la coz | smothered mate |
| mate del gancho | hook mate |
| mate árabe | Arabian mate |
| mate de Anastasia | Anastasia's mate |
| mate de Boden | Boden's mate |
| mate de los dos alfiles | double bishop mate |
| mate de la cola de golondrina | dovetail mate |

## Estrategia y finales
| Español | Inglés |
|---|---|
| apertura | opening |
| medio juego | middlegame |
| final | endgame |
| desarrollo, desarrollar | development, develop |
| centro | center |
| fianchetto | fianchetto |
| iniciativa | initiative |
| ventaja | advantage |
| ventaja decisiva | decisive advantage |
| estructura de peones | pawn structure |
| casilla débil | weak square |
| puesto avanzado | outpost |
| peón pasado | passed pawn |
| peón aislado | isolated pawn |
| peón doblado | doubled pawn |
| oposición | opposition |
| regla del cuadrado | rule of the square |
| posición de Lucena | Lucena position |
| zugzwang | zugzwang |
| triangulación | triangulation |
| profilaxis | prophylaxis |
| línea (de apertura) | line |
| línea principal | main line |
| libro (de aperturas) | book |
| «sin libro» | «no book» |
| motor | engine |
| profundidad | depth |
| evaluación | evaluation |

## Términos de la ruta
| Español | Inglés |
|---|---|
| Aprender | Learn |
| Aperturas | Openings |
| Puzzles | Puzzles |
| Bots | Bots |
| Análisis | Analysis |
| Perfil | Profile |
| Ajustes | Settings |
| unidad | unit |
| lección | lesson |
| paso | step |
| ejercicio | exercise |
| repaso, repasar | review |
| error | mistake (*error* solo si es de principios o del motor) |
| pista | hint |
| racha | streak |
| racha de 7 días | 7-day streak |
| recuperar la racha | recover your streak |
| moneda | coin |
| premio del día | daily bonus |
| puzzle del día | daily puzzle |
| recordatorio | reminder |
| set de piezas | piece set |
| tema (de tablero, de puzzle) | theme |
| acción (mantener la racha) | activity |
| profesor | teacher |
| bloqueada | locked |
| Unidades: Lo básico / Reglas especiales / Táctica básica / Apertura y estrategia / Finales / Conceptos avanzados | The basics / Special rules / Basic tactics / Opening and strategy / Endgames / Advanced concepts |

## Aperturas
Nombre oficial inglés de cada curso. Dentro de una frase, «la Italiana» se dice *the Italian*, y así con todos.

| id | Español | Inglés |
|---|---|---|
| london | Sistema Londres | London System |
| italian | Partida Italiana | Italian Game |
| vienna | Partida Vienesa | Vienna Game |
| scandinavian | Defensa Escandinava | Scandinavian Defense |
| sicilian | Defensa Siciliana (Najdorf) | Sicilian Defense (Najdorf) |
| dragon | Dragón Siciliano | Sicilian Dragon |
| kia | Ataque Indio de Rey | King's Indian Attack |
| kings-indian | Defensa India de Rey | King's Indian Defense |
| modern | Defensa Moderna | Modern Defense |
| pirc | Defensa Pirc | Pirc Defense |
| scotch | Partida Escocesa | Scotch Game |
| evans | Gambito Evans | Evans Gambit |
| bdg | Gambito Blackmar-Diemer | Blackmar-Diemer Gambit |
| caro-kann | Defensa Caro-Kann | Caro-Kann Defense |
| ruy-lopez | Ruy López | Ruy Lopez |
| rossolimo | Variante Rossolimo | Rossolimo Variation |
| alapin | Variante Alapin | Alapin Variation |
| queens-gambit | Gambito de dama | Queen's Gambit |
| kings-gambit | Gambito de rey | King's Gambit |
| albin | Contragambito Albin | Albin Countergambit |
| catalan | Apertura Catalana | Catalan Opening |
| english | Apertura Inglesa | English Opening |
| danish | Gambito Danés | Danish Gambit |
| french | Defensa Francesa | French Defense |
| nimzo-indian | Defensa Nimzoindia | Nimzo-Indian Defense |
| petrov | Defensa Petrov | Petrov Defense |
| queens-gambit-declined | Gambito de dama declinado | Queen's Gambit Declined |
| queens-gambit-accepted | Gambito de dama aceptado | Queen's Gambit Accepted |

Títulos fijos de cada curso: «La idea de…» *The idea of the…*; «Línea principal» *Main line*; «Trampas y errores típicos» *Traps and common mistakes*; «Claves y errores típicos» *Key ideas and common mistakes*; «Repaso» *Review*.

## Tono
Cercano, claro y breve, para quien empieza. Frases cortas y palabras comunes; un término técnico nuevo se explica como en el español. Un error nunca se reprocha: se dice qué pasó y qué probar. Sin exclamaciones. Botones y etiquetas, tan cortos como en español.

## Voz de cada bot
Los nombres y su ortografía no cambian (Tomás, Sofía, Don Ramiro, Maestro Ivo). Ninguno reta. Los epítetos van con mayúscula inicial.

| Bot | Epíteto | Voz |
|---|---|---|
| Pipo | The Curious One | Tierno y entusiasta: frases simples, aprende a la par tuya, se alegra de verte. |
| Lola | The Careful One | Suave y tranquila: *calm*, *careful*, *no rush*; nunca apura. |
| Tomás | The Trickster | Pícaro y cómplice: *trick*, *hidden*; juega a que guarda un secreto. |
| Valentina | The Attacker | Directa y con energía: frases muy cortas, verbos de acción, sin vueltas. |
| Don Ramiro | The Professor | Formal y amable, de maestro de antes: *Hello*, *That concludes our class*; pocas contracciones. |
| Camila | The Strategist | Serena y reflexiva: habla de sumar de a poco y de pensar a largo plazo. |
| Bruno | The Wall | Firme y de pocas palabras: imágenes de construcción (*wall*, *base*, *stands firm*). |
| Sofía | The Tactician | Aguda y atenta: *sharp eyes*, *cool head*, *look twice*; precisa sin ser fría. |
| Maestro Ivo | The Endgame Expert | Sabio y medido: *detail*, *precision*, *patience*; frases cuidadas, casi sentencias. |
| Ada | The Machine | Mínima y exacta: frases cortísimas, sin adornos ni contracciones en las sentencias, pero amable. |

En los avisos: `risk` empieza por *Streak days: {n}.* para leerse bien con cualquier número; `recovery` nombra *a lesson, a puzzle and a game against a bot* y dice que es hoy (*today*); `general` no da datos de ajedrez.
