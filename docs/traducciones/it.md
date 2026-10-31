# Glosario de italiano

Vale para `src/i18n/it.ts` y todo `src/data/i18n/it/`. Si falta un término, se agrega acá. Reglas generales en la guía de traducción.

## Convenciones
- Italiano estándar de Italia. Sin regionalismos.
- Trato directo con *tu*, también en los bots formales (Don Ramiro, Maestro Ivo). Sin exclamaciones.
- *il Bianco* y *il Nero* con mayúscula como bando (*Muove il Bianco*, *giochi col Bianco*). Con minúscula como color de una pieza o casilla (*un pedone bianco*, *una casella scura*).
- Para el rival, *l'avversario*. Género neutro al dirigirse al lector: se evitan participios y adjetivos concordados con «tu» (*sei arrivato*, *pronto*, *bravo*); se prefieren formas con *hai* (*hai vinto*, *hai giocato*), el sustantivo (*Difesa davvero ottima*) o el impersonal (*si gioca*). Nunca barras (*bravo/a*) ni asteriscos.
- Un bot habla de sí con su propio género: Pipo *contento*, *battuto*; Lola *attenta*; Sofía y Ada *battuta*.
- Títulos: mayúscula solo en la primera palabra y nombres propios (*Colonne aperte e torri attive*). Las aperturas, con mayúsculas como en la tabla.
- *puzzle* y *bot* son invariables: *un puzzle, due puzzle, i bot*.
- Miles con punto: `50.000`. Horas: `ore {hour}:00` (así no hace falta elegir entre *alle* y *all'*).
- Comillas en pantalla: « ».
- Apóstrofo recto `'`. En `it.ts`, esas cadenas van entre comillas dobles, como en `en.ts`.
- Un número variable delante de un sustantivo plural falla con 1: se escribe como etiqueta (*Giorni di serie: {n}*, *Vinte: {wins}*). *{n} puzzle* no tiene ese problema.

## Notación
Letras: R D T A C (Re, Donna, Torre, Alfiere, Cavallo). El peón no lleva letra. Enroque `O-O` y `O-O-O`. Captura `x`, jaque `+`, mate `#`, coronación `e8=D`. Primera jugada: `1.e4`, respuesta de negras: `1...e5`. Las casillas no se traducen.

## Piezas
| Español | Italiano |
|---|---|
| rey | re |
| dama | donna (nunca *regina*) |
| torre | torre |
| alfil | alfiere |
| caballo | cavallo |
| peón | pedone |
| pieza | pezzo |
| pieza menor | pezzo leggero |
| pieza mayor | pezzo pesante |
| pareja de alfiles | coppia degli alfieri |

## Jugadas y reglas
| Español | Italiano |
|---|---|
| jugada | mossa |
| capturar, comer | catturare, prendere |
| cambio, cambiar piezas | cambio, cambiare i pezzi |
| jaque | scacco |
| jaque mate, mate | scacco matto, matto |
| dar mate | dare matto |
| rey ahogado, ahogar | stallo, mettere in stallo |
| tablas | patta (*la partita finisce patta*) |
| tablas de mutuo acuerdo | patta d'accordo |
| triple repetición | triplice ripetizione |
| regla de las 50 jugadas | regola delle 50 mosse |
| material insuficiente | materiale insufficiente |
| enroque, enrocar | arrocco, arroccare |
| enroque corto / largo | arrocco corto / arrocco lungo |
| captura al paso | presa en passant |
| coronación, coronar | promozione, promuovere |
| subpromoción | sottopromozione |
| jaque perpetuo | scacco perpetuo |
| rendirse | abbandonare |
| abandonar la partida | lasciare la partita (*abbandonare* es rendirse) |
| partida | partita |
| recapturar | riprendere |
| interponer, tapar un jaque | interporre un pezzo |
| avance de dos casillas del peón | doppio passo |
| tocar (en la pantalla) | toccare |
| rival | avversario |
| turno, «juegan las blancas» | tratto, *Muove il Bianco* |

## Tablero
| Español | Italiano |
|---|---|
| tablero | scacchiera |
| casilla | casella (no *casa*, para no alternar) |
| fila | traversa |
| columna | colonna |
| columna abierta | colonna aperta |
| diagonal | diagonale |
| flanco de rey / de dama | ala di re / ala di donna |
| última fila | ultima traversa |
| coordenadas | coordinate |

## Táctica
| Español | Italiano |
|---|---|
| horquilla | forchetta |
| clavada | inchiodatura |
| clavar | inchiodare |
| clavada absoluta / relativa | inchiodatura assoluta / relativa |
| pieza sobrecargada | pezzo sovraccarico |
| enfilada, ensartada | infilata |
| ataque a la descubierta | attacco di scoperta |
| descubrir (una pieza) | scoprire |
| jaque a la descubierta | scacco di scoperta |
| jaque doble | scacco doppio |
| ataque doble | attacco doppio |
| eliminar al defensor | eliminare il difensore |
| desviación | deviazione |
| atracción | adescamento |
| despeje | sgombero |
| interferencia | interferenza |
| jugada intermedia | mossa intermedia |
| rayos X | raggi X |
| pieza colgada, suelta | pezzo in presa, pezzo indifeso |
| pieza sin protección | pezzo non protetto |
| proteger, defender (una pieza) | proteggere, difendere |
| pieza atrapada | pezzo intrappolato |
| sacrificio | sacrificio |
| sacrificio de calidad | sacrificio di qualità |
| calidad | qualità |
| entregar la calidad | cedere la qualità |
| perder la calidad | perdere la qualità |
| combinación | combinazione |
| amenaza | minaccia |
| trampa | trappola |
| mate del pasillo | matto sull'ultima traversa |
| mate del pastor | matto del barbiere |
| mate de la coz | matto soffocato |
| mate del gancho | matto a gancio |
| mate árabe | matto arabo |
| mate de Anastasia | matto di Anastasia |
| mate de Boden | matto di Boden |
| mate de los dos alfiles | matto dei due alfieri |
| mate de la cola de golondrina | matto a coda di rondine |

## Estrategia y finales
| Español | Italiano |
|---|---|
| apertura | apertura |
| medio juego | mediogioco |
| final | finale (el *finale*) |
| desarrollo, desarrollar | sviluppo, sviluppare |
| centro | centro |
| fianchetto | fianchetto |
| iniciativa | iniziativa |
| ventaja | vantaggio |
| ventaja decisiva | vantaggio decisivo |
| estructura de peones | struttura pedonale |
| casilla débil | casella debole |
| puesto avanzado | avamposto |
| peón pasado | pedone passato |
| peón aislado | pedone isolato |
| peón doblado | pedone doppiato |
| oposición | opposizione |
| regla del cuadrado | regola del quadrato |
| cuadrado (de la regla del cuadrado) | quadrato (no choca con *casella*) |
| posición de Lucena | posizione di Lucena |
| posición de Philidor | posizione di Philidor |
| fila de coronación | traversa di promozione |
| casilla de escape | casella di fuga |
| carrera de peones | corsa dei pedoni |
| doblar torres | raddoppiare le torri |
| zugzwang | zugzwang |
| triangulación | triangolazione |
| jugada de espera | mossa d'attesa |
| jugada tranquila | mossa tranquilla |
| ruptura (de peones) | sfondamento |
| cortar al rey | tagliare fuori il re |
| cajón (del rey) | recinto |
| salto de caballo (distancia) | salto di cavallo |
| peón trabado | pedone bloccato |
| construir el puente | costruire il ponte |
| reyes enfrentados | re faccia a faccia |
| peón de c / de a | pedone c / pedone a |
| profilaxis | profilassi |
| línea (de apertura) | linea |
| línea principal | linea principale |
| columna semiabierta | colonna semiaperta |
| alfil de casillas oscuras / claras | alfiere delle caselle scure / chiare |
| alfil «dragón» | alfiere del Dragone |
| ventaja de desarrollo | vantaggio di sviluppo |
| abrir líneas | aprire linee |
| liberar (una pieza o un peón) | liberare |
| evitar (que el rival haga algo) | impedire (*evitare* solo para lo que uno mismo esquiva) |
| libro (de aperturas) | libro |
| «sin libro» | *senza libro* |
| motor | motore |
| profundidad | profondità |
| evaluación | valutazione |

## Términos de la ruta
| Español | Italiano |
|---|---|
| Aprender | Impara |
| Aperturas | Aperture |
| Puzzles | Puzzle |
| Bots | Bot |
| Análisis | Analisi |
| Perfil | Profilo |
| Ajustes | Impostazioni |
| ruta (de Aprender) | percorso |
| pestaña | scheda |
| unidad | unità |
| lección | lezione |
| paso | passo |
| ejercicio | esercizio |
| repaso, repasar | ripasso, ripassare |
| error | errore |
| pista | indizio (corto para el botón) |
| racha | serie |
| días de racha | giorni di serie |
| recuperar la racha | recuperare la serie |
| moneda | moneta |
| premio del día | premio del giorno |
| puzzle del día | puzzle del giorno |
| recordatorio | promemoria |
| práctica, practicar | allenamento, allenarsi |
| set de piezas | set di pezzi |
| tema (de tablero, de puzzle) | tema |
| acción (mantener la racha) | attività |
| profesor | insegnante (*Il Professore* solo como epíteto de Don Ramiro) |
| bloqueada | bloccata |
| nivel | livello |
| Unidades: Lo básico / Reglas especiales / Táctica básica / Apertura y estrategia / Finales / Conceptos avanzados | Le basi / Regole speciali / Tattica di base / Apertura e strategia / Finali / Concetti avanzati |

## Aperturas
Nombre italiano habitual de cada curso. Varios no se parecen al español: *Ruy López* es **Apertura Spagnola**; *India de Rey* es **Est-Indiana**; *Gambito* es **Gambetto**. En una frase, «la Italiana» es *l'Italiana*, «la Ruy López» *la Spagnola*, «la Siciliana» *la Siciliana*, «la India de Rey» *l'Est-Indiana*, «la Nimzoindia» *la Nimzo-Indiana*, «la Francesa» *la Francese*.

| id | Español | Italiano |
|---|---|---|
| london | Sistema Londres | Sistema London |
| italian | Partida Italiana | Partita Italiana |
| vienna | Partida Vienesa | Partita Viennese |
| scandinavian | Defensa Escandinava | Difesa Scandinava |
| sicilian | Defensa Siciliana (Najdorf) | Difesa Siciliana (Najdorf) |
| dragon | Dragón Siciliano | Siciliana Dragone |
| kia | Ataque Indio de Rey | Attacco Est-Indiano |
| kings-indian | Defensa India de Rey | Difesa Est-Indiana |
| modern | Defensa Moderna | Difesa Moderna |
| pirc | Defensa Pirc | Difesa Pirc |
| scotch | Partida Escocesa | Partita Scozzese |
| evans | Gambito Evans | Gambetto Evans |
| bdg | Gambito Blackmar-Diemer | Gambetto Blackmar-Diemer |
| caro-kann | Defensa Caro-Kann | Difesa Caro-Kann |
| ruy-lopez | Ruy López | Apertura Spagnola |
| rossolimo | Variante Rossolimo | Variante Rossolimo |
| alapin | Variante Alapin | Variante Alapin |
| queens-gambit | Gambito de dama | Gambetto di Donna |
| kings-gambit | Gambito de rey | Gambetto di Re |
| albin | Contragambito Albin | Controgambetto Albin |
| catalan | Apertura Catalana | Apertura Catalana |
| english | Apertura Inglesa | Apertura Inglese |
| danish | Gambito Danés | Gambetto Danese |
| french | Defensa Francesa | Difesa Francese |
| nimzo-indian | Defensa Nimzoindia | Difesa Nimzo-Indiana |
| petrov | Defensa Petrov | Difesa Petrov (también *Difesa Russa*) |
| queens-gambit-declined | Gambito de dama declinado | Gambetto di Donna Rifiutato |
| queens-gambit-accepted | Gambito de dama aceptado | Gambetto di Donna Accettato |

Otros nombres: trampa / mate de Légal *trappola di Légal* / *matto di Légal*; ataque inglés *attacco inglese*; ataque yugoslavo *attacco jugoslavo*; ataque austriaco *attacco austriaco*; Gambito Vienés *Gambetto Viennese*; variante Mieses *variante Mieses*; variante clásica *variante classica*; variante cerrada *variante chiusa*; cadena de peones *catena di pedoni*; esquema *schema*; enroques opuestos *arrocchi opposti*; «sin ayudas» *senza aiuti*; trampa del Arca de Noé *trappola dell'Arca di Noè*; Siciliana invertida *Siciliana invertita*; Siciliana abierta *Siciliana aperta*; Catalana abierta *Catalana aperta*; Inglesa con cuatro caballos *Inglese dei quattro cavalli*; Danés aceptado *Gambetto Danese Accettato*; variantes Kieseritzky, Rubinstein y Tartakower *varianti Kieseritzky, Rubinstein e Tartakower*; «preguntar al alfil» *interrogare l'alfiere*; «con tempo» *guadagnando un tempo*; «el alfil de c4», «el peón de e5» (dónde está) *l'alfiere in c4*, *il pedone in e5*; «el peón de c» (su columna) *il pedone c*; presionar (una casilla, una pieza) *premere su*; fianchetear *mettere in fianchetto*; hipermoderna *ipermoderna*; contragambito *controgambetto*; gambito doble *doppio gambetto*; peón de flanco *pedone laterale*; compensación *compenso*; alfil malo *alfiere cattivo*; «salir del jaque» *parare lo scacco*; caballo de rey *cavallo di re*.

Títulos fijos de cada curso: «La idea de…» *L'idea della / del / dell'…* (según la apertura: *L'idea della Partita Italiana*, *L'idea del Gambetto di Donna*); «Línea principal» *Linea principale*; «Trampas y errores típicos» *Trappole ed errori tipici*; «Claves y errores típicos» *Idee chiave ed errori tipici*; «Repaso» *Ripasso*.

## Tono
Cercano, claro y breve, para quien empieza. Frases cortas y palabras comunes; un término técnico nuevo se explica como en el español. Un error nunca se reprocha: se dice qué pasó y qué probar. Sin exclamaciones. Botones y etiquetas, tan cortos como en español; imperativo con *tu* (*Continua*, *Riprova*, *Gioca*).

Como `{name}` puede ser cualquier apertura y el artículo cambia (*la, il, l'*), una frase con una apertura variable no lleva artículo: *Alleniamoci: {name}.*

## Voz de cada bot
Los nombres y su ortografía no cambian (Tomás, Sofía, Don Ramiro, Maestro Ivo). Ninguno reta. Los epítetos van con artículo y mayúscula.

| Bot | Epíteto | Voz |
|---|---|---|
| Pipo | Il Curioso | Tierno y entusiasta: frases simples, aprende a la par tuya, se alegra de verte (*Che bello*, *insieme*). |
| Lola | La Prudente | Suave y tranquila: *con calma*, *piano*, *senza fretta*; nunca apura. |
| Tomás | Il Furbo | Pícaro y cómplice: *trucco*, *nascosto*, *occhio*; juega a que guarda un secreto. *Furbo* evita el tono de *imbroglione*, que suena a insulto. |
| Valentina | L'Attaccante | Directa y con energía: frases muy cortas, verbos de acción (*Avanti*, *Via*, *Al lavoro*), sin vueltas. |
| Don Ramiro | Il Professore | Formal y amable, de maestro de antes, aunque tutea: *Buongiorno*, *Con questo concludiamo la lezione*; frases completas. |
| Camila | La Stratega | Serena y reflexiva: habla de sumar de a poco y de pensar a largo plazo (*poco a poco*). |
| Bruno | Il Muro | Firme y de pocas palabras: imágenes de construcción (*muro*, *basi*, *resta in piedi*, *solido*). |
| Sofía | La Tattica | Aguda y atenta: *occhi svegli*, *mente fredda*, *due volte*; precisa sin ser fría. |
| Maestro Ivo | L'Esperto di Finali | Sabio y medido: *dettaglio*, *precisione*, *pazienza*; frases cuidadas, casi sentencias. *Finalista* en italiano es quien llega a una final. |
| Ada | La Macchina | Mínima y exacta: frases cortísimas, sin adornos, pero amable. |

En los avisos: `risk` empieza por *Giorni di serie: {n}.* para leerse bien con cualquier número; el pronombre o el verbo que sigue se refiere a *la serie* (*per continuarla*, *resta al sicuro*); `recovery` nombra *una lezione, un puzzle e una partita contro un bot* y dice que es hoy (*oggi*); `general` no da datos de ajedrez.
