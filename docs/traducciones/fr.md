# Glosario de francés

Vale para `src/i18n/fr.ts` y todo `src/data/i18n/fr/`. Si falta un término, se agrega acá. Reglas generales en la guía de traducción.

## Convenciones
- Francés estándar de Francia. Sin regionalismos.
- Trato directo con *tu*, también en los bots formales (Don Ramiro, Maestro Ivo). Sin exclamaciones.
- *les Blancs* y *les Noirs* con mayúscula como bando (*Les Blancs jouent*, *tu joues les Noirs*). Con minúscula como color de una pieza o casilla (*un pion blanc*, *une case sombre*).
- Para el rival, *l'adversaire*. Género neutro al dirigirse al lector: se evitan participios y adjetivos que concuerdan con «tu» (*prêt*, *tombé*, *content*); se prefieren formas con *as* y complemento (*tu as gagné*, *tu as évité le piège*) o el sustantivo. Nunca barras (*prêt/e*) ni el punto medio.
- Un bot habla de sí con su propio género: Pipo *content*, *battu*; Lola *prudente*; Sofía y Ada *battue*.
- Títulos: mayúscula solo en la primera palabra y nombres propios (*Colonnes ouvertes et tours actives*). Las aperturas, igual (*Partie italienne*).
- Botones en infinitivo, como es normal en una interfaz francesa (*Continuer*, *Réessayer*, *Jouer*, *Quitter*). Consejos y frases con imperativo de *tu* (*Termine*, *Choisis*, *Réessaie*).
- *puzzle* y *bot* son masculinos con plural en -s: *un puzzle, des puzzles, les bots*.
- Miles con espacio duro: `50 000`. Horas: `{hour} h` (*à 20 h*).
- Tipografía: espacio duro (U+00A0) antes de `:`, `?`, `;`, entre « » y el texto, antes de `h` y dentro de los miles. Siempre el mismo carácter, sin el espacio fino. Sin `!`.
- Comillas en pantalla: « ».
- Apóstrofo recto `'`. En `fr.ts`, esas cadenas van entre comillas dobles, como en `it.ts`.
- Un número variable delante de un sustantivo plural falla con 0 y 1 (en francés los dos son singular): se escribe como etiqueta (*Jours de série : {n}*, *Jetons : {n}*, *Victoires : {wins} sur {played}*).
- `{name}` delante de vocal rompe *de* y *le*: una frase con nombre variable se arma sin preposición ni artículo (*{name} se prépare…*, *Entraînons-nous : {name}.*).

## Notación
Letras: R D T F C (Roi, Dame, Tour, Fou, Cavalier). El peón no lleva letra. Enroque `O-O` y `O-O-O`. Captura `x`, jaque `+`, mate `#`, coronación `e8=D`. Primera jugada: `1.e4`, respuesta de negras: `1...e5`. Las casillas no se traducen. Ojo con el alfil: `F`, nunca `B` ni `A`.

## Piezas
| Español | Francés |
|---|---|
| rey | roi |
| dama | dame (nunca *reine*) |
| torre | tour (femenino: *la tour*) |
| alfil | fou |
| caballo | cavalier |
| peón | pion |
| pieza | pièce |
| pieza menor | pièce mineure |
| pieza mayor | pièce majeure |
| pareja de alfiles | paire de fous |

## Jugadas y reglas
| Español | Francés |
|---|---|
| jugada | coup |
| capturar, comer | prendre (*capturer* solo si hace falta variar) |
| cambio, cambiar piezas | échange, échanger des pièces |
| jaque | échec |
| jaque mate, mate | échec et mat, mat |
| dar mate | mater, donner mat |
| rey ahogado, ahogar | pat, mettre pat |
| tablas | nulle (*la partie est nulle*, *proposer nulle*) |
| tablas de mutuo acuerdo | nulle par accord mutuel |
| triple repetición | triple répétition |
| regla de las 50 jugadas | règle des 50 coups |
| material insuficiente | matériel insuffisant |
| enroque, enrocar | roque, roquer |
| enroque corto / largo | petit roque / grand roque |
| captura al paso | prise en passant |
| coronación, coronar | promotion, promouvoir |
| subpromoción | sous-promotion |
| jaque perpetuo | échec perpétuel |
| rendirse | abandonner |
| abandonar la partida | quitter la partie (*abandonner* es rendirse) |
| partida | partie |
| recapturar | reprendre |
| interponer, tapar un jaque | interposer une pièce |
| avance de dos casillas del peón | double pas |
| tocar (en la pantalla) | toucher |
| rival | adversaire |
| turno, «juegan las blancas» | trait, *Les Blancs jouent* (*trait* solo si se explica) |

## Tablero
| Español | Francés |
|---|---|
| tablero | échiquier |
| casilla | case |
| fila | rangée |
| columna | colonne |
| columna abierta | colonne ouverte |
| diagonal | diagonale |
| flanco de rey / de dama | aile roi / aile dame |
| última fila | dernière rangée |
| coordenadas | coordonnées |

## Táctica
| Español | Francés |
|---|---|
| horquilla | fourchette |
| clavada | clouage |
| clavar | clouer |
| clavada absoluta / relativa | clouage absolu / clouage relatif |
| pieza sobrecargada | pièce surchargée |
| enfilada, ensartada | enfilade |
| ataque a la descubierta | attaque à la découverte |
| descubrir (una pieza) | découvrir |
| jaque a la descubierta | échec à la découverte |
| jaque doble | échec double |
| ataque doble | double attaque |
| eliminar al defensor | éliminer le défenseur |
| desviación | déviation |
| atracción | attraction |
| despeje | dégagement |
| interferencia | interception |
| jugada intermedia | coup intermédiaire |
| rayos X | rayons X |
| pieza colgada, suelta | pièce en prise, pièce sans défense |
| pieza sin protección | pièce non protégée |
| proteger, defender (una pieza) | protéger, défendre |
| pieza atrapada | pièce piégée |
| sacrificio | sacrifice |
| sacrificio de calidad | sacrifice de qualité |
| calidad | qualité |
| entregar la calidad | sacrifier la qualité |
| perder la calidad | perdre la qualité |
| combinación | combinaison |
| amenaza | menace |
| trampa | piège |
| mate del pasillo | mat du couloir |
| mate del pastor | mat du berger |
| mate de la coz | mat à l'étouffée |
| mate del gancho | mat en crochet |
| mate árabe | mat arabe |
| mate de Anastasia | mat d'Anastasie |
| mate de Boden | mat de Boden |
| mate de los dos alfiles | mat des deux fous |
| mate de la cola de golondrina | mat en queue d'aronde |

## Estrategia y finales
| Español | Francés |
|---|---|
| apertura | ouverture |
| medio juego | milieu de partie |
| final | finale (femenino: *la finale*, *en finale*) |
| desarrollo, desarrollar | développement, développer |
| centro | centre |
| fianchetto | fianchetto |
| iniciativa | initiative |
| ventaja | avantage |
| ventaja decisiva | avantage décisif |
| estructura de peones | structure de pions |
| casilla débil | case faible |
| puesto avanzado | avant-poste |
| peón pasado | pion passé |
| peón aislado | pion isolé |
| peón doblado | pion doublé |
| oposición | opposition |
| regla del cuadrado | règle du carré |
| cuadrado (de la regla del cuadrado) | carré (no choca con *case*) |
| posición de Lucena | position de Lucena |
| posición de Philidor | position de Philidor |
| fila de coronación | rangée de promotion |
| casilla de escape | case de fuite |
| carrera de peones | course de pions |
| doblar torres | doubler les tours |
| zugzwang | zugzwang |
| triangulación | triangulation |
| jugada de espera | coup d'attente |
| jugada tranquila | coup tranquille |
| ruptura (de peones) | percée |
| cortar al rey | couper le roi |
| cajón (del rey) | boîte |
| salto de caballo (distancia) | saut de cavalier |
| peón trabado | pion bloqué |
| construir el puente | construire le pont |
| reyes enfrentados | rois face à face |
| peón de c / de a | pion c / pion a |
| profilaxis | prophylaxie |
| línea (de apertura) | ligne |
| línea principal | ligne principale |
| columna semiabierta | colonne semi-ouverte |
| alfil de casillas oscuras / claras | fou de cases sombres / fou de cases claires |
| alfil «dragón» | fou du Dragon |
| ventaja de desarrollo | avance de développement |
| abrir líneas | ouvrir des lignes |
| liberar (una pieza o un peón) | libérer |
| evitar (que el rival haga algo) | empêcher (*éviter* solo para lo que uno mismo esquiva) |
| libro (de aperturas) | livre |
| «sin libro» | *sans livre* |
| motor | moteur |
| profundidad | profondeur |
| evaluación | évaluation |

## Términos de la ruta
| Español | Francés |
|---|---|
| Aprender | Apprendre |
| Aperturas | Ouvertures |
| Puzzles | Puzzles |
| Bots | Bots |
| Análisis | Analyse |
| Perfil | Profil |
| Ajustes | Réglages |
| ruta (de Aprender) | parcours |
| pestaña | onglet |
| unidad | unité |
| lección | leçon |
| paso | étape |
| ejercicio | exercice |
| repaso, repasar | révision, réviser (*Revoir les erreurs* en el botón) |
| error | erreur |
| pista | indice |
| racha | série |
| días de racha | jours de série |
| recuperar la racha | récupérer sa série |
| moneda | jeton (nunca *pièce*: choca con las piezas de ajedrez, y una misma pantalla tiene las dos) |
| premio del día | bonus du jour |
| puzzle del día | puzzle du jour |
| recordatorio | rappel |
| práctica, practicar | entraînement, s'entraîner |
| set de piezas | set de pièces |
| tema (de tablero, de puzzle) | thème |
| acción (mantener la racha) | activité |
| profesor | professeur |
| bloqueada | verrouillée |
| nivel | niveau |
| Unidades: Lo básico / Reglas especiales / Táctica básica / Apertura y estrategia / Finales / Conceptos avanzados | Les bases / Règles spéciales / Tactique de base / Ouverture et stratégie / Finales / Concepts avancés |

## Aperturas
Nombre francés habitual de cada curso. Varios no se parecen al español: *Ruy López* es **Partie espagnole**; *India de Rey* es **est-indienne**; *Gambito de dama* es **Gambit dame**, sin *de*; *Alapin* se escribe **Alapine**. En una frase, «la Italiana» es *l'Italienne*, «la Ruy López» *l'Espagnole*, «la Siciliana» *la Sicilienne*, «la India de Rey» *l'Est-Indienne*, «la Nimzoindia» *la Nimzo-Indienne*, «la Francesa» *la Française*, «la Caro-Kann» *la Caro-Kann*.

| id | Español | Francés |
|---|---|---|
| london | Sistema Londres | Système de Londres |
| italian | Partida Italiana | Partie italienne |
| vienna | Partida Vienesa | Partie viennoise |
| scandinavian | Defensa Escandinava | Défense scandinave |
| sicilian | Defensa Siciliana (Najdorf) | Défense sicilienne (Najdorf) |
| dragon | Dragón Siciliano | Sicilienne Dragon |
| kia | Ataque Indio de Rey | Attaque est-indienne |
| kings-indian | Defensa India de Rey | Défense est-indienne |
| modern | Defensa Moderna | Défense moderne |
| pirc | Defensa Pirc | Défense Pirc |
| scotch | Partida Escocesa | Partie écossaise |
| evans | Gambito Evans | Gambit Evans |
| bdg | Gambito Blackmar-Diemer | Gambit Blackmar-Diemer |
| caro-kann | Defensa Caro-Kann | Défense Caro-Kann |
| ruy-lopez | Ruy López | Partie espagnole |
| rossolimo | Variante Rossolimo | Variante Rossolimo |
| alapin | Variante Alapin | Variante Alapine |
| queens-gambit | Gambito de dama | Gambit dame |
| kings-gambit | Gambito de rey | Gambit roi |
| albin | Contragambito Albin | Contre-gambit Albin |
| catalan | Apertura Catalana | Ouverture catalane |
| english | Apertura Inglesa | Ouverture anglaise |
| danish | Gambito Danés | Gambit danois |
| french | Defensa Francesa | Défense française |
| nimzo-indian | Defensa Nimzoindia | Défense nimzo-indienne |
| petrov | Defensa Petrov | Défense Petrov (también *Défense russe*) |
| queens-gambit-declined | Gambito de dama declinado | Gambit dame refusé |
| queens-gambit-accepted | Gambito de dama aceptado | Gambit dame accepté |

Otros nombres: trampa / mate de Légal *piège de Légal* / *mat de Légal*; ataque inglés *attaque anglaise*; ataque yugoslavo *attaque yougoslave*; ataque austriaco *attaque autrichienne*; Gambito Vienés *Gambit viennois*; variante Mieses *variante Mieses*; variante clásica *variante classique*; variante cerrada *variante fermée*; cadena de peones *chaîne de pions*; esquema *schéma*; enroques opuestos *roques opposés*; «sin ayudas» *sans aide*; trampa del Arca de Noé *piège de l'Arche de Noé*; Siciliana invertida *Sicilienne inversée*; Siciliana abierta *Sicilienne ouverte*; Catalana abierta *Catalane ouverte*; Inglesa con cuatro caballos *Anglaise à quatre cavaliers*; Danés aceptado *Gambit danois accepté*; variantes Kieseritzky, Rubinstein y Tartakower *variantes Kieseritzky, Rubinstein et Tartakover*; «preguntar al alfil» *questionner le fou*; «con tempo» *avec gain de temps*; «el alfil de c4», «el peón de e5» (dónde está) *le fou en c4*, *le pion e5*; «el peón de c» (su columna) *le pion c*; presionar (una casilla, una pieza) *faire pression sur*; fianchetear *mettre en fianchetto*; hipermoderna *hypermoderne*; contragambito *contre-gambit*; gambito doble *double gambit*; peón de flanco *pion de l'aile*; compensación *compensation*; alfil malo *mauvais fou*; «salir del jaque» *parer l'échec*; caballo de rey *cavalier du roi*; diagonal larga *grande diagonale*; expulsar (una pieza) *chasser*; Gambito declinado / aceptado, forma corta *Gambit refusé / accepté*; cambio de damas *échange des dames*.

Títulos fijos de cada curso: «La idea de…» *L'idée de la / du / de l'…* (según la apertura: *L'idée de la Partie italienne*, *L'idée du Gambit dame*); «Línea principal» *Ligne principale*; «Trampas y errores típicos» *Pièges et erreurs typiques*; «Claves y errores típicos» *Idées clés et erreurs typiques*; «Repaso» *Révision*.

## Tono
Cercano, claro y breve, para quien empieza. Frases cortas y palabras comunes; un término técnico nuevo se explica como en el español. Un error nunca se reprocha: se dice qué pasó y qué probar. Sin exclamaciones. Botones y etiquetas, tan cortos como en español.

Como `{name}` puede ser cualquier apertura y el artículo cambia (*la, le, l'*), una frase con una apertura variable no lleva artículo: *Entraînons-nous : {name}.*

## Voz de cada bot
Los nombres y su ortografía no cambian (Tomás, Sofía, Don Ramiro, Maestro Ivo). Ninguno reta. Los epítetos van con artículo y mayúscula.

| Bot | Epíteto | Voz |
|---|---|---|
| Pipo | Le Curieux | Tierno y entusiasta: frases simples, aprende a la par tuya, se alegra de verte (*Salut*, *ensemble*, *chouette*). |
| Lola | La Prudente | Suave y tranquila: *du calme*, *doucement*, *rien ne presse*; nunca apura. |
| Tomás | Le Rusé | Pícaro y cómplice: *astuce*, *piège*, *méfie-toi*; juega a que guarda un secreto. *Rusé* evita el tono de *tricheur*, que es un insulto. |
| Valentina | L'Attaquante | Directa y con energía: frases muy cortas, verbos de acción (*En avant*, *Au travail*, *On y va*), sin vueltas. |
| Don Ramiro | Le Professeur | Formal y amable, de maestro de antes, aunque tutea: *Bonjour*, *Ainsi s'achève notre cours*; frases completas. |
| Camila | La Stratège | Serena y reflexiva: habla de sumar de a poco y de pensar a largo plazo (*peu à peu*, *sereinement*). |
| Bruno | Le Mur | Firme y de pocas palabras: imágenes de construcción (*mur*, *bases*, *solide*, *reste debout*). |
| Sofía | La Tacticienne | Aguda y atenta: *yeux bien ouverts*, *tête froide*, *deux fois*; precisa sin ser fría. |
| Maestro Ivo | L'Expert des finales | Sabio y medido: *détail*, *précision*, *patience*; frases cuidadas, casi sentencias. *Finaliste* en francés es quien llega a una final. |
| Ada | La Machine | Mínima y exacta: frases cortísimas, sin adornos, pero amable. |

En los avisos: `risk` empieza por *Jours de série : {n}.* para leerse bien con cualquier número y después nombra *ta série* en vez de un pronombre (*jours* es plural y masculino, no hay antecedente); `recovery` nombra *une leçon, un puzzle et une partie contre un bot* y dice que es hoy (*aujourd'hui*); `general` no da datos de ajedrez.
