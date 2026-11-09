# Glosario de alemán

Vale para `src/i18n/de.ts` y todo `src/data/i18n/de/`. Si falta un término, se agrega acá. Reglas generales en la guía de traducción.

## Convenciones
- Alemán estándar de Alemania, con ortografía reformada y `ß` (*Weiß*, *Spieß*). Nada específico de Austria o Suiza.
- Trato directo con *du*, también en los bots formales (Don Ramiro, Maestro Ivo). *Du*, *dein* van con minúscula. Sin exclamaciones.
- *Weiß* y *Schwarz* con mayúscula como bando (*Weiß am Zug*, *du spielst Schwarz*). Con minúscula como color de una pieza o casilla (*ein weißer Bauer*, *ein dunkles Feld*).
- Para el rival, *der Gegner* (es el término del ajedrez). Al lector siempre *du*; nunca *Spieler/in* con barra ni asteriscos. Si se puede, se evita el sustantivo con una forma verbal (*du hast gewonnen*).
- Títulos: mayúscula solo en la primera palabra y los sustantivos, como pide el alemán (*Offene Linien und aktive Türme*). Los compuestos se escriben juntos o con guion, nunca separados (*Läuferpaar*, *London-System*).
- Miles con punto: `50.000`. Horas: `{hour}:00 Uhr`.
- Comillas en pantalla: „ “.
- Un número variable delante de un sustantivo plural falla con 1: se escribe como etiqueta (*Serientage: {n}*).

## Notación
Letras: K D T L S (König, Dame, Turm, Läufer, Springer). El peón no lleva letra. Enroque `O-O` y `O-O-O`. Captura `x`, jaque `+`, mate `#`, coronación `e8=D`. Primera jugada: `1.e4`, respuesta de negras: `1...e5`. Las casillas no se traducen.

## Piezas
| Español | Alemán |
|---|---|
| rey | König |
| dama | Dame (nunca *Königin*) |
| torre | Turm |
| alfil | Läufer |
| caballo | Springer (nunca *Pferd*) |
| peón | Bauer |
| pieza | Figur (*Figuren und Bauern* si hay que distinguir) |
| pieza menor | Leichtfigur |
| pieza mayor | Schwerfigur |
| pareja de alfiles | Läuferpaar |

## Jugadas y reglas
| Español | Alemán |
|---|---|
| jugada | Zug |
| capturar, comer | schlagen |
| cambio, cambiar piezas | Abtausch, Figuren tauschen |
| jaque | Schach |
| jaque mate, mate | Schachmatt, Matt |
| dar mate | mattsetzen |
| rey ahogado, ahogar | Patt, patt setzen |
| tablas | Remis |
| tablas de mutuo acuerdo | Remis durch Einigung |
| triple repetición | dreifache Stellungswiederholung |
| regla de las 50 jugadas | 50-Züge-Regel |
| material insuficiente | ungenügendes Material |
| enroque, enrocar | Rochade, rochieren |
| enroque corto / largo | kurze Rochade / lange Rochade |
| captura al paso | en passant, Schlagen en passant |
| coronación, coronar | Bauernumwandlung (o Umwandlung), umwandeln |
| subpromoción | Unterverwandlung |
| jaque perpetuo | Dauerschach |
| rendirse | aufgeben |
| abandonar la partida | die Partie verlassen (no *abbrechen*, que es el botón Cancelar) |
| partida | Partie |
| jaques (como lista de opciones) | Schachgebote |
| capturas (como lista de opciones) | Schlagzüge |
| recapturar | zurückschlagen |
| interponer, tapar un jaque | dazwischenziehen |
| avance de dos casillas del peón | Doppelschritt |
| tocar (en la pantalla) | tippen |
| rival | Gegner |
| turno, «juegan las blancas» | am Zug, *Weiß am Zug* |

## Tablero
| Español | Alemán |
|---|---|
| casilla | Feld |
| fila | Reihe |
| columna | Linie |
| columna abierta | offene Linie |
| diagonal | Diagonale |
| flanco de rey / de dama | Königsflügel / Damenflügel |
| última fila | Grundreihe |
| coordenadas | Koordinaten |

Cuidado: en alemán *Linie* es solo la columna. La «línea» de una apertura es *Variante*.

## Táctica
| Español | Alemán |
|---|---|
| horquilla | Gabel |
| clavada | Fesselung |
| clavar | fesseln |
| clavada absoluta / relativa | absolute Fesselung / relative Fesselung |
| pieza sobrecargada | überlastete Figur |
| enfilada, ensartada | Spieß |
| ataque a la descubierta | Abzug, Abzugsangriff |
| descubrir (una pieza) | abziehen, freilegen |
| jaque a la descubierta | Abzugsschach |
| jaque doble | Doppelschach |
| ataque doble | Doppelangriff |
| eliminar al defensor | den Verteidiger beseitigen |
| desviación | Ablenkung |
| atracción | Hinlenkung |
| despeje | Räumung |
| interferencia | Unterbrechung |
| jugada intermedia | Zwischenzug |
| rayos X | Röntgenangriff |
| pieza colgada, suelta | hängende Figur |
| pieza sin protección | ungedeckte Figur |
| proteger, defender (una pieza) | decken |
| pieza atrapada | gefangene Figur |
| sacrificio | Opfer |
| sacrificio de calidad | Qualitätsopfer |
| calidad | Qualität |
| combinación | Kombination |
| amenaza | Drohung |
| trampa | Falle |
| mate del pasillo | Grundreihenmatt |
| mate del pastor | Schäfermatt |
| mate de la coz | ersticktes Matt |
| mate del gancho | Hakenmatt |
| mate árabe | Arabisches Matt |
| mate de Anastasia | Anastasia-Matt |
| mate de Boden | Boden-Matt |
| mate de los dos alfiles | Matt mit zwei Läufern |
| mate de la cola de golondrina | Schwalbenschwanzmatt |

## Estrategia y finales
| Español | Alemán |
|---|---|
| apertura | Eröffnung |
| medio juego | Mittelspiel |
| final | Endspiel |
| desarrollo, desarrollar | Entwicklung, entwickeln |
| centro | Zentrum |
| fianchetto | Fianchetto |
| iniciativa | Initiative |
| ventaja | Vorteil |
| ventaja decisiva | entscheidender Vorteil |
| estructura de peones | Bauernstruktur |
| casilla débil | schwaches Feld |
| puesto avanzado | Vorposten |
| peón pasado | Freibauer |
| peón aislado | isolierter Bauer |
| peón doblado | Doppelbauer |
| oposición | Opposition |
| regla del cuadrado | Quadratregel |
| cuadrado (de la regla del cuadrado) | Quadrat (no choca con *Feld*) |
| posición de Lucena | Lucena-Stellung |
| posición de Philidor | Philidor-Stellung |
| fila de coronación | Umwandlungsreihe |
| casilla de escape | Fluchtfeld |
| carrera de peones | Bauernrennen |
| doblar torres | Türme verdoppeln |
| zugzwang | Zugzwang |
| triangulación | Dreiecksmanöver |
| jugada de espera | Wartezug |
| jugada tranquila | stiller Zug |
| ruptura (de peones) | Durchbruch |
| cortar al rey | den König abschneiden |
| cajón (del rey) | Kasten |
| construir el puente | die Brücke bauen |
| reyes enfrentados | die Könige stehen sich gegenüber |
| peón de c / de a | c-Bauer / a-Bauer |
| profilaxis | Prophylaxe |
| línea (de apertura) | Variante (nunca *Linie*) |
| línea principal | Hauptvariante |
| columna semiabierta | halboffene Linie |
| alfil de casillas oscuras / claras | dunkelfeldriger / hellfeldriger Läufer |
| alfil «dragón» | Drachenläufer |
| ventaja de desarrollo | Entwicklungsvorsprung |
| abrir líneas (en general) | Wege öffnen (*Linie* solo si es una columna) |
| liberar (una pieza o un peón) | befreien, *öffnet dem c1-Läufer den Weg* |
| evitar (que el rival haga algo) | verhindern |
| libro (de aperturas) | Buch, Eröffnungsbuch |
| «sin libro» | «ohne Buch» |
| motor | Engine (die) |
| profundidad | Tiefe |
| evaluación | Bewertung |

## Términos de la ruta
| Español | Alemán |
|---|---|
| Aprender | Lernen |
| Aperturas (pestaña) | Eröffnung (singular, por el ancho; el título de la pantalla es *Eröffnungen*) |
| Puzzles | Puzzles (das Puzzle) |
| Bots | Bots (der Bot) |
| Análisis | Analyse |
| Perfil | Profil |
| Ajustes | Einstellungen |
| unidad | Einheit |
| lección | Lektion |
| paso | Schritt |
| ejercicio | Übung |
| repaso, repasar | Wiederholung, wiederholen |
| error | Fehler |
| pista | Tipp |
| racha | Serie |
| días de racha | Serientage |
| recuperar la racha | die Serie zurückholen |
| moneda | Münze |
| premio del día | Tagesbonus |
| puzzle del día | Puzzle des Tages |
| recordatorio | Erinnerung |
| set de piezas | Figurenset |
| tema de tablero | Brettdesign |
| tema de puzzle | Thema |
| acción (mantener la racha) | Aktivität |
| profesor | Lehrer |
| bloqueada | gesperrt |
| nivel | Stufe |
| Unidades: Lo básico / Reglas especiales / Táctica básica / Apertura y estrategia / Finales / Conceptos avanzados | Die Grundlagen / Sonderregeln / Taktik-Grundlagen / Eröffnung und Strategie / Endspiele / Fortgeschrittene Konzepte |

## Aperturas
Nombre alemán habitual de cada curso. Varios no se parecen al español: *Ruy López* es **Spanische Partie**, *Gambito Danés* es **Nordisches Gambit**, *Petrov* es **Russische Verteidigung** (también se dice *Petrow-Verteidigung*). En una frase, con artículo y declinado: *die Italienische Partie*, *in der Spanischen Partie*, *das Damengambit*; «la Siciliana» es *der Sizilianer* o *Sizilianisch*, «la Francesa» *Französisch*, «la Caro-Kann» *Caro-Kann*, «la India de Rey» *Königsindisch*, «la Nimzoindia» *Nimzowitsch-Indisch*, «la Catalana» *Katalanisch*, «la Inglesa» *Englisch*.

| id | Español | Alemán |
|---|---|---|
| london | Sistema Londres | London-System |
| italian | Partida Italiana | Italienische Partie |
| vienna | Partida Vienesa | Wiener Partie |
| scandinavian | Defensa Escandinava | Skandinavische Verteidigung |
| sicilian | Defensa Siciliana (Najdorf) | Sizilianische Verteidigung (Najdorf) |
| dragon | Dragón Siciliano | Drachenvariante |
| kia | Ataque Indio de Rey | Königsindischer Angriff |
| kings-indian | Defensa India de Rey | Königsindische Verteidigung |
| modern | Defensa Moderna | Moderne Verteidigung |
| pirc | Defensa Pirc | Pirc-Verteidigung |
| scotch | Partida Escocesa | Schottische Partie |
| evans | Gambito Evans | Evans-Gambit |
| bdg | Gambito Blackmar-Diemer | Blackmar-Diemer-Gambit |
| caro-kann | Defensa Caro-Kann | Caro-Kann-Verteidigung |
| ruy-lopez | Ruy López | Spanische Partie |
| rossolimo | Variante Rossolimo | Rossolimo-Variante |
| alapin | Variante Alapin | Alapin-Variante |
| queens-gambit | Gambito de dama | Damengambit |
| kings-gambit | Gambito de rey | Königsgambit |
| albin | Contragambito Albin | Albin-Gegengambit |
| catalan | Apertura Catalana | Katalanische Eröffnung |
| english | Apertura Inglesa | Englische Eröffnung |
| danish | Gambito Danés | Nordisches Gambit |
| french | Defensa Francesa | Französische Verteidigung |
| nimzo-indian | Defensa Nimzoindia | Nimzowitsch-Indische Verteidigung |
| petrov | Defensa Petrov | Russische Verteidigung |
| queens-gambit-declined | Gambito de dama declinado | Abgelehntes Damengambit |
| queens-gambit-accepted | Gambito de dama aceptado | Angenommenes Damengambit |

Otros nombres: trampa / mate de Légal *Légal-Falle* / *Seekadettenmatt*; ataque inglés *Englischer Angriff*; ataque yugoslavo *Jugoslawischer Angriff*; ataque austriaco *Österreichischer Angriff*; Gambito Vienés *Wiener Gambit*; variante Mieses *Mieses-Variante*; variante clásica *klassische Variante*; cadena de peones *Bauernkette*; esquema *Aufbau*; enroques opuestos *entgegengesetzte Rochaden*; «sin ayudas» *ohne Hilfe*; trampa del Arca de Noé *Arche-Noah-Falle*; Siciliana invertida *umgekehrter Sizilianer*; Siciliana abierta *Offener Sizilianer*; Catalana abierta *Offenes Katalanisch*; Inglesa con cuatro caballos *Vierspringerspiel im Englischen*; Danés aceptado *angenommenes Nordisches Gambit*; variante cerrada *geschlossene Variante*; variantes Kieseritzky, Rubinstein y Tartakower *Kieseritzky-, Rubinstein- und Tartakower-Variante*; «preguntar al alfil» *den Läufer zur Rede stellen*; «con tempo» *mit Tempogewinn*; contragambito *Gegengambit*; gambito doble *doppeltes Gambit*; peón de flanco *Flügelbauer*; expansión *Ausdehnung*; compensación *Kompensation* (no *Ausgleich*, que significa igualdad); alfil malo *schlechter Läufer*; «salir del jaque» *Schach abwehren*; caballo de rey *Königsspringer*. Gambito aceptado y declinado se declinan como nombre: *des Angenommenen / Abgelehnten Damengambits*.

Títulos fijos de cada curso: «La idea de…» *Die Idee der/des…* (declinado: *Die Idee des Damengambits*, *Die Idee der Spanischen Partie*); «Línea principal» *Hauptvariante*; «Trampas y errores típicos» *Fallen und typische Fehler*; «Claves y errores típicos» *Kernideen und typische Fehler*; «Repaso» *Wiederholung*.

## Tono
Cercano, claro y breve, para quien empieza. Frases cortas y palabras comunes; un término técnico nuevo se explica como en el español. Un error nunca se reprocha: se dice qué pasó y qué probar. Sin exclamaciones. Botones y etiquetas, tan cortos como en español: el alemán se alarga, así que se prefieren palabras simples a compuestos largos (*Zurück* y no *Rückgängig*, *Neustart* y no *Zurücksetzen*).

Como `{name}` puede ser cualquier apertura y el artículo cambia (*die, das, der*), una frase con una apertura variable no lleva artículo: *Üben wir: {name}.*

## Voz de cada bot
Los nombres y su ortografía no cambian (Tomás, Sofía, Don Ramiro, Maestro Ivo). Ninguno reta. Los epítetos van con artículo y mayúscula.

| Bot | Epíteto | Voz |
|---|---|---|
| Pipo | Der Neugierige | Tierno y entusiasta: frases simples, aprende a la par tuya, se alegra de verte (*Ich freue mich*, *zusammen*). |
| Lola | Die Vorsichtige | Suave y tranquila: *in Ruhe*, *vorsichtig*, *keine Eile*; nunca apura. |
| Tomás | Der Trickser | Pícaro y cómplice: *Trick*, *versteckt*; juega a que guarda un secreto. |
| Valentina | Die Angreiferin | Directa y con energía: frases muy cortas, verbos de acción (*Los*, *Auf geht's*), sin vueltas. |
| Don Ramiro | Der Professor | Formal y amable, de maestro de antes, aunque tutea: *Guten Tag*, *Damit endet unser Unterricht*; frases completas. |
| Camila | Die Strategin | Serena y reflexiva: habla de sumar de a poco y de pensar a largo plazo (*Schritt für Schritt*). |
| Bruno | Die Mauer | Firme y de pocas palabras: imágenes de construcción (*Mauer*, *Fundament*, *steht*). |
| Sofía | Die Taktikerin | Aguda y atenta: *wacher Blick*, *kühler Kopf*, *zweimal hinsehen*; precisa sin ser fría. |
| Maestro Ivo | Der Endspielkenner | Sabio y medido: *Detail*, *Präzision*, *Geduld*; frases cuidadas, casi sentencias. |
| Ada | Die Maschine | Mínima y exacta: frases cortísimas, sin adornos, pero amable. |

En los avisos: `risk` empieza por *Serientage: {n}.* para leerse bien con cualquier número y después nombra *deine Serie* en vez de *sie* (*Serientage* es plural y no hay sustantivo singular al que refiera); `recovery` nombra *eine Lektion, ein Puzzle und eine Partie gegen einen Bot* y dice que es hoy (*heute*); `general` no da datos de ajedrez.

## Agregados el 9-11-2026 (lecciones del bloque A)
| Español | Deutsch |
|---|---|
| mate en escalera | Leitermatt |
| gambito Englund | Englund-Gambit |
| trampa Blackburne-Shilling | Blackburne-Shilling-Falle |
| carnada | Köder |
