# Informe de líneas de aperturas

Generado el 1-11-2026 al añadir una guía por cada línea que menciona el archivo fuente de cada apertura (`C:\dev\aperturas\*.md`, transcripciones de video; fuera del repositorio).
Cada fila es una línea de la fuente: tiene su guía (`<apertura>-lNN`) o fue descartada con el motivo. Las jugadas son las que reconstruyó el modelo y pueden diferir de la fuente cuando la transcripción era ilegible.
Ataque Indio de Rey (`kia`) no tiene video: su archivo fuente lo redactó el modelo y hay que revisarlo antes de publicar.
Resumen: 505 líneas en las fuentes, 309 con guía propia y 194 descartadas o absorbidas en otra guía.


## Sistema Londres (`london`) · 10 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| Contra ...Ad6: Ce5 en vez de Ag3, con sacrificio griego | 1.d4 d5 2.Af4 Cf6 3.e3 e6 4.Cf3 Ad6 5.Ce5 O-O 6.Ad3 c5 7.c3 Cc6 8.Cd2 Axe5 9.dxe5 Cd7 10.Cf3 Dc7 11.Axh7+ Rxh7 12.Cg5+ Rg8 13.Dh5 | `london-l05` · La fuente es un video sin PGN: las jugadas negras se reconstruyen a partir de la explicación hablada. |
| Ce5: trampa contra ...c5 (Ab5+) | 5.Ce5 c5 6.Ab5+ Ad7 7.Cxd7 Axf4 8.Cxc5+ Cc6 9.exf4 | `london-l06` · También vale 8.Cxf6+, que da jaque doble. |
| Ce5: trampa contra ...Cbd7 (Cxf7) | 5.Ce5 O-O 6.Ad3 Cbd7 7.Cxf7 Txf7 8.Axd6 cxd6 | `london-l07` eliminada tras la revisión con Stockfish (la trampa pierde material) |
| Ce5 y Cg5 contra h7 (sacrificio en g6) | sin jugadas concretas | descartada: Patrón de ataque descrito solo de palabra; no se puede reconstruir una línea fiable. |
| Contra ...Cc6 y ...e6 (peón borracho) | 1.d4 d5 2.Af4 Cc6 3.e3 Cf6 4.Cf3 e6 5.Ad3 Ad6 6.c3 O-O 7.Cbd2 Axf4 8.exf4 Te8 9.Ce5 Cxe5 10.fxe5 Cd7 11.Dh5 | `london-l08` · Jugadas negras reconstruidas. |
| Contra ...Cc6 y ...Ag4 | 4...Ag4 5.Ab5 e6 6.h3 Ah5 7.g4 Ag6 8.Ce5 Ad6 9.Cxc6 bxc6 10.Axc6+ Re7 11.Axa8 | `london-l09` · La rama 6...Axf3 7.Dxf3 se cita en el texto pero no tiene guía (sin idea concreta). |
| e3 antes de Cf3: trampa ...Db6, ...c4, ...Af5 | 3.e3 c5 4.c3 Cc6 5.Cd2 Db6 6.Db3 c4 7.Dc2 Af5 8.Dxf5 Dxb2 9.Db1 Dxc3 10.Ce2 Da5 11.Dxb7 | `london-l10` · La versión con Cf3 (8.Dxf5? Dxb2 y la torre de a1 cae) va como paso explain. |
| Cambio de alfiles y f4 (muro de piedra) | 3.e3 e6 4.Cd2 Ad6 5.Axd6 Dxd6 6.f4 c5 7.c3 Cc6 8.Cgf3 O-O 9.Ad3 b6 10.Ce5 | `london-l11` · La fuente solo da la idea; las jugadas negras son de desarrollo típico. |
| Contra ...Af5 simétrico: c4 y Df3 | 2...Af5 3.c4 dxc4 4.e3 b5 5.Df3 c6 6.Axb8 Axb1 7.Dxc6+ Dd7 8.Dxa8+ | `london-l12` · La fuente no nombra ...b5; es la única forma de "quedarse con el peón" que permite Df3 contra la torre. |
| Contra ...Af5 y ...e6: Db3 y Cb5 | 3.c4 e6 4.Db3 b6 5.Cc3 Cf6 6.e3 Ae7 7.cxd5 exd5 8.Cb5 Ca6 9.Da4 Ab4+ 10.Cc3+ Dd7 11.Ab5 | `london-l13` · Reconstruida; añadí 6.e3 Ae7 para que Ab5 sea legal. |
| Contra ...Af5: 3...dxc4 con desarrollo normal | 3...dxc4 4.e3 ... | descartada: Sin línea concreta: solo dice que recuperas el peón más tarde. |
| Contra ...g6 en la clásica: dxc5 y Cd4 | sin jugadas concretas | descartada: La transcripción es demasiado confusa para reconstruir las jugadas (clavadas y un sacrificio de dama sin casillas claras). |
| Contra la India de Rey: Cc3, e4 y e5 | 1.d4 Cf6 2.Af4 g6 3.Cc3 Ag7 4.e4 d6 5.e5 dxe5 6.dxe5 Dxd1+ 7.Txd1 Ch5 8.Cd5 Cxf4 9.Cxc7+ Rf8 10.Td8# | `london-l14` · Comprobé que 10.Td8 es mate, como dice la fuente. |
| Contra la India de Rey: Dd2 y O-O-O | 5.Dd2 ... O-O-O | descartada: Plan general sin línea concreta. |
| Contra ...c5: Cc3 y Cb5 | 1.d4 d5 2.Af4 Cf6 3.Cc3 c5 4.e3 Cc6 5.Cb5 e5 6.dxe5 Ce4 7.Dxd5 Dxd5 8.Cc7+ Rd8 9.Cxd5 | `london-l15` · Orden de jugadas reconstruido. |

## Partida Italiana (`italian`) · 10 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| Ataque Fegatello (Hígado Frito) | 1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 Cxd5 6.Cxf7 Rxf7 7.Df3+ Re6 8.Cc3 | `italian-l05` · Capítulo 1. Incluye 7...Rg8 8.Dxd5+ como paso move. Se descartan las subvariantes 7...Re8 8.Axd5 ...Ce4 y 8...Cd4 9.Axd5+ porque la transcripción es confusa y no permite reconstruir jugadas fiables. |
| Defensa Polerio 5...Ca5 | ... 5.exd5 Ca5 6.Ab5+ c6 7.dxc6 bxc6 8.Ae2 h6 9.Cf3 | `italian-l06` · Capítulo 3. La transcripción describe las ideas sin jugadas exactas; se usa la línea teórica estándar. |
| Contraataque Traxler 4...Ac5 | ... 4.Cg5 Ac5 5.Axf7+ Re7 6.Ac4 | `italian-l07` · Capítulo 6. Se sigue la retirada a c4 que defiende el presentador; la teoría más habitual es 6.Ab3 o 6.Ad5 (ver informe). 5.Cxf7 Axf2+ se muestra como advertencia en un explain. |
| 3...h6 4.d4 | 1.e4 e5 2.Cf3 Cc6 3.Ac4 h6 4.d4 exd4 5.Cxd4 Cxd4 6.Dxd4 d6 7.e5 dxe5 8.Axf7+ Re7 9.Dc4 | `italian-l08` · Capítulo 2, reconstruido de la transcripción. |
| Gambito Rousseau 3...f5 | ... 3...f5 4.d3 Cf6 5.O-O d6 6.Cc3 | `italian-l09` · Capítulo 5 (la transcripción dice "gambito ruso"). El presentador solo da d3, enroque y Cc3; las jugadas negras 4...Cf6 y 5...d6 son desarrollo natural añadido para completar la línea. |
| Defensa París 3...d6 con h3 y mate de Légal | ... 3...d6 4.Cc3 Ag4 5.h3 Ah5 6.Cxe5 Axd1 7.Axf7+ Re7 8.Cd5# | `italian-l10` · Capítulo 7. La 4.ª jugada blanca no se dice; se usa 4.Cc3, necesaria para el mate. Se incluye 5...Axf3 6.Dxf3 como quiz. Distinta de la trampa de Légal de la antigua l03 (aquí con ...Cc6 y h3). |
| 4.Cc3 Cxe4 (truco del tenedor) | ... 3...Cf6 4.Cc3 Cxe4 5.Cxe4 d5 6.Ad3 dxe4 7.Axe4 | `italian-l11` · Capítulo "El patrón táctico más común". 6.Axd5? Dxd5 7.d3 Ag4 se muestra en un explain. Se descarta "h3 ... Cd4" porque la transcripción no permite reconstruirlo. |
| 4.d3 con Ag5 y Cd5 (patrón Cxf6+ y Axh6) | ... 4.d3 Ac5 5.Cc3 d6 6.Ag5 O-O 7.Cd5 h6 8.Cxf6+ gxf6 9.Axh6 Te8 10.Ch4 | `italian-l12` · Capítulos 8 y "Patrones de ataque". El presentador describe ideas, no un orden concreto; las jugadas negras (6...O-O, 9...Te8) se eligen para llegar a la posición que describe. |
| Idea ...f5 y Axf7+ Rxf7 Dh5+ | - | descartada: Descartada: la transcripción no deja claro de qué posición parte. |
| Trampa de la caña de pescar con h4 | ... 4.d3 Ac5 5.Cc3 O-O 6.Ag5 h6 7.h4 hxg5 8.hxg5 Cg4 9.g6 | `italian-l13` eliminada tras la revisión con Stockfish (la línea favorece a las negras) |
| Plan B contra ...h6: Ae3 | ... 4.d3 Ac5 5.O-O d6 6.Cc3 h6 7.Ae3 Axe3 8.fxe3 O-O 9.De1 | `italian-l14` · Plan (De1-g3, Ch4-f5, Txf6) descrito sin jugadas exactas; se ponen las flechas del plan. La táctica Txf6/Txg6 no se reproduce por falta de una posición concreta. |
| Gambito Deutz | 1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.O-O Cf6 5.d4 exd4 6.e5 | `italian-l15` · Capítulo 9 (la transcripción lo llama también "de Albin"). La línea larga de ataque (Cg5, Te1, Dd3, sacrificio de dama, doble jaque en f7, Ah6+) no se pudo reconstruir con jugadas seguras y se descarta. |
| Giuoco Piano 3...Ac5 (c3 y d4, Gambito Evans) | 1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 | descartada: Capítulo 4: solo se nombran las líneas con c3-d4 y el Evans, sin desarrollarlas; la versión tranquila ya es la línea principal (l02). |

## Partida Vienesa (`vienna`) · 15 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| Gambito aceptado 3...exf4 4.e5 Cg8 (con 7...Ae7) | 4.e5 Cg8 5.Cf3 d6 6.d4 dxe5 7.De2 Ae7 8.Dxe5 Cc6 9.Ab5 Ad7 10.Axc6 Axc6 11.d5 Ad7 12.Axf4 | `vienna-l05` · La rama 8...Cf6 9.Axf4 c6 10.Ad3 queda descrita en el texto como secundaria. |
| Aceptado 4...De7 (trampa) | 4...De7 5.De2 Cg8 6.Cf3 d6 7.Cd5 Dd7 8.Cxc7+ Dxc7 9.exd6+ Ae6 10.dxc7 | `vienna-l06` · La fuente dice que la dama "se mueve" sin decir adónde; uso 7...Dd7. |
| Aceptado 7...Cc6 (trampa) | 7...Cc6 8.Axf4 Cxd4 9.Cxd4 Dxd4 10.Axe5 Dg4 11.Cb5 | `vienna-l07` · Trampa con continuación clara. |
| Declinado 3...Cc6 | 3...Cc6 4.fxe5 Cxe5 5.d4 Cg6 6.e5 Cg8 7.Cf3 | `vienna-l09` · Respuesta débil pero distinta; la fuente no dice adónde va el caballo de e5 y elijo ...Cg6. |
| Declinado 3...d6 | 3...d6 4.Cf3 Cc6 5.d4 exd4 6.Cxd4 Cxd4 7.Dxd4 Ae7 8.Ae3 O-O 9.O-O-O | `vienna-l08` · La captura 4...exf4 5.d4 va como quiz. |
| Principal 3...d5 5.Df3 Cxc3 6.bxc3 Cc6 | 6...Cc6 7.d4 Ae7 8.Ad3 O-O 9.Ce2 f6 10.Dh5 g6 11.Axg6 hxg6 12.Dxg6+ | `vienna-l10` · La fuente dice "Bishop B7" en vez de ...Ae7 (imposible con el peón en b7); corregido. |
| Principal 6...Ae7 7.d4 c5 8.Ad3 | 6...Ae7 7.d4 c5 8.Ad3 Cc6 9.Ce2 O-O 10.O-O | descartada: Plan idéntico al de l10 (Ad3, Ce2, enroque); sin idea nueva. |
| Principal 6...c5 | 6...c5 7.Ab5+ Cc6 8.Dg3 Ae6 9.Cf3 h6 10.O-O Db6 11.a4 | `vienna-l11` · La fuente dice "Bishop B6" pero la idea Cg5 atacando el alfil y f7 indica ...Ae6. La continuación (a6 Axc6 d4 Aa3) va en el texto para no pasar de 24 jugadas. |
| Principal 5...Cc6 (final) | 5...Cc6 6.Ab5 Cxc3 7.dxc3 Dh4+ 8.g3 De4+ 9.Dxe4 dxe4 10.Ce2 Ad7 11.Axc6 Axc6 12.Tf1 Ac5 13.Cd4 Ad7 14.Tf4 | `vienna-l12` · La guía llega hasta 12.Tf1; el resto va como play en un paso explain. |
| 5...Cc6 6.Ab5 Cxc3 7.dxc3 Ac5 | 7...Ac5 8.Dg3 / O-O 9.Ah6 | descartada: Trampa breve mencionada de pasada. |
| Bardeleben 5...f5 | 5...f5 6.d3 Cxc3 7.bxc3 d4 8.Dg3 Cc6 9.Ae2 Ae6 10.c4 Ab4+ 11.Rf2 O-O 12.Af4 | `vienna-l13` · Línea principal según la fuente. |
| Bardeleben 7...Ae6 (sin ...d4) | 7...Ae6 8.d4 Ae7 9.Ad3 O-O 10.Ce2 c5 11.Cf4 | descartada: Respuesta pasiva; mismo plan que l10. |
| Bardeleben: trampa Ah5+ tras ...dxc3 | 8...dxc3 9.Ae2 Cc6 10.Ah5+ g6 ... | descartada: La transcripción de esta trampa es confusa (orden y capturas poco claros); no se puede reconstruir con seguridad. |
| Bardeleben 10...Dd7 | 10.c4 Dd7 11.Tb1 O-O-O 12.Af3 | descartada: Sub-rama de l13 con el mismo plan. |
| Max Lange 2...Cc6 3.Ac4 Cf6 4.d3 Ac5 5.f4 d6 6.Cf3 O-O 7.f5 | 7.f5 Cd4 8.Cxd4 Axd4 9.Ag5 | `vienna-l14` · La fuente no da la 7.ª jugada negra; uso ...Cd4, que ella misma menciona. Orden adaptado. |
| Max Lange 5...exf4 6.Axf4 O-O 7.Dd2 y O-O-O | 5...exf4 6.Axf4 O-O 7.Dd2 ... 8.O-O-O | descartada: Plan sin línea concreta. |
| Max Lange 6...Ag4 7.Ca4 | 6...Ag4 7.Ca4 Cd4 8.Cxc5 dxc5 9.c3 Cxf3+ 10.gxf3 Ah3 11.Tg1 | `vienna-l15` · La fuente dice que las blancas están "completamente ganando"; el texto lo suaviza. Las ramas 7...Ab6 y 9...Axf3 no tienen guía. |
| Max Lange 4...Ab4 5.Cge2 | 4...Ab4 5.Cge2 d5 6.exd5 Cxd5 7.O-O Cxc3 8.bxc3 Ad6 9.Cg3 O-O 10.Ce4 Ae7 11.Dh5 | `vienna-l16` · La fuente no dice la jugada intermedia; deduzco Cg3-e4 de "llevar el caballo al centro y atacar el alfil". |
| Copycat 3...Ac5 4.Dg4 g6 | 4...g6 5.Df3 Cf6 6.Cge2 / 5...Df6 6.Cd5 | descartada: Declinación débil; ideas tácticas sueltas sin una línea principal clara. |
| Meitner-Mieses 7...Dd4 8.d3 d6 (trampa) | 4.Dg4 Df6 5.Cd5 Dxf2+ 6.Rd1 Rf8 7.Ch3 Dd4 8.d3 d6 9.Dg3 Axh3 10.Tf1 | `vienna-l17` · Trampa con continuación clara. |
| Meitner-Mieses 5...Dxf2+ 6.Rd1 g6 / Cd4 | 6...g6 7.Dxg7; 6...Cd4 7.Cge2 | descartada: Errores negros que la fuente trata de pasada. |
| Meitner-Mieses 7...h5 | 7...h5 8.Dg5 Dd4 9.d3 Ae7 10.Cxe7 Cgxe7 11.Tf1 Cd8 12.c3 | `vienna-l18` · La fuente valora la posición como claramente mejor para blancas; el texto se limita a decir que la actividad compensa el peón. |
| Meitner-Mieses 8...f6 9.Dg6 / 9...Th6 10.Cdf4 | 8...f6 9.Dg6; 9...Th6 10.Cdf4 | descartada: Sub-trampas de la misma línea. |
| Anderssen 2...Ac5 3.f4 | 3...exf4 4.Cf3 d6 5.d4 Ab6 6.Axf4 Ag4 7.Dd2 Cc6 8.Ab5 Cge7 9.d5 a6 10.Aa4 | `vienna-l19` · La fuente dice "si enrocan corto" sin que sea posible en esa posición; sigo la secuencia de jugadas. |
| Anderssen 3...d6 / 4...Cf6 | 3...d6 4.Cf3 (transpone a la Max Lange); 4...Cf6 5.e5 | descartada: Transposición o error simple. |

## Defensa Escandinava (`scandinavian`) · 8 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| 2.Cc3 d4 (retirada 3.Cce2 y salto 3.Cd5) | 1.e4 d5 2.Cc3 d4 3.Cd5 e5 4.Cf3 c6 | `scandinavian-l05` · El presentador la desarrolla con la idea de atrapar el caballo. La fuente da 3...e5 y luego ...c6; la 4.ª jugada blanca (Cf3) no la da el video: la elegí como continuación natural. |
| Gambito Tennison 2.Cf3 | 1.e4 d5 2.Cf3 dxe4 3.Cg5 Cf6 4.d3 exd3 5.Axd3 (5...h6? 6.Cxf7 Rxf7 7.Ag6+) | `scandinavian-l06` · Trampa explicada con su continuación. La alternativa 5...Cc6 es la que sugiere el presentador. |
| 2.e5: ganar el peón de e5 | 1.e4 d5 2.e5 c5 3.Cf3 Ag4 4.Ae2 Cc6 5.O-O Axf3 6.Axf3 Cxe5 | `scandinavian-l07` · Línea del video. La fuente dice que la posición es técnicamente ganadora; en el texto solo digo que ganas un peón. |
| 2.e5: estructura de Francesa mejorada | 1.e4 d5 2.e5 c5 3.Cf3 Ag4 4.Ae2 Cc6 5.c3 e6 6.d4 Cge7 7.O-O cxd4 8.cxd4 Cf5 9.Cc3 Db6 | `scandinavian-l08` · El video da las jugadas negras (...e6, ...Ce7, ...cxd4, ...Cf5, ...Db6) con un orden aproximado; los movimientos blancos de relleno (5.c3, 9.Cc3) son míos. |
| 3...Dd8 y la trampa Ce5 | 1.e4 d5 2.exd5 Dxd5 3.Cc3 Dd8 4.Ac4 Cf6 5.Cf3 ... Ag4? Ce5 Axd1?? Axf7# | `scandinavian-l09` · La fuente no precisa las jugadas negras de relleno antes de ...Ag4. Verifiqué con chess.js que con ...c6 y ...g6 Axf7 es mate. La guía enseña la alternativa segura ...Af5. |
| 3...De5+ | 1.e4 d5 2.exd5 Dxd5 3.Cc3 De5+ 4.Ae2 | descartada: Error de principiante sin continuación útil; solo se menciona como advertencia en scandinavian-l09. |
| Sistema 3...Da5 con ...c6, ...Ag4, ...Dc7 y ...Ad6 | 1.e4 d5 2.exd5 Dxd5 3.Cc3 Da5 4.d4 c6 5.Cf3 Ag4 6.Ae2 Cd7 7.O-O Cgf6 8.Ad2 Dc7 9.a3 e6 10.b4 Ad6 (11.b5? Axf3 12.Axf3 Axh2+) | `scandinavian-l10` · Distinta de l02 (que usa ...Af5). El video dice que tras b5 la posición es ganadora; el texto solo dice que ganas un peón con jaque. Variante h3 Ah5 citada sin desarrollar. |
| Variante moderna 2...Cf6 3.Cc3 | 1.e4 d5 2.exd5 Cf6 3.Cc3 Cxd5 4.Cxd5 Dxd5 5.Cf3 Ag4 6.Ae2 Cc6 7.O-O O-O-O 8.d3 e5 | `scandinavian-l11` · Las jugadas 7.O-O y 8.d3 son de relleno: el video solo dice "quizá enroque largo y ...e5". |
| 2...Cf6 3.c4 e6 (trampa ...Dxf2#) | 1.e4 d5 2.exd5 Cf6 3.c4 e6 4.dxe6 Axe6 5.d4 Ab4+ 6.Cc3 Ce4 7.Ad2? Dxd4 8.Cf3?? Dxf2# | `scandinavian-l12` · Mate comprobado con chess.js. |
| 2.d3 | 1.e4 d5 2.d3 dxe4 3.dxe4 Dxd1+ 4.Rxd1 | descartada: Mención breve sin plan propio: tras el cambio de damas el rey blanco pierde el enroque y no hay más teoría. No da para una guía. |

## Defensa Siciliana (Najdorf) (`sicilian`) · 16 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| Najdorf, esquema Scheveningen (setup general) | 1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 ... e6, Ae7, Cbd7, Dc7, b5, Ab7, O-O, Tc8 | descartada: Es un esquema de piezas, no una línea concreta; se usa como hilo conductor en las notas de varias guías. |
| Peón envenenado 10.f5 | 6.Ag5 e6 7.f4 Db6 8.Dd2 Dxb2 9.Tb1 Da3 10.f5 b5 11.fxe6 fxe6 12.Axf6 gxf6 13.Ae2 Dc5 14.Cb3 Dg5 | `sicilian-l05` · La fuente elige 10...b5, que no es la jugada principal de la teoría (10...Cc6). Se presenta sin valoraciones fuertes. |
| Peón envenenado 10.e5 | 10.e5 dxe5 11.fxe5 h6 12.Ah4 g5 13.exf6 gxh4 14.Ae2 Cd7 15.O-O Da5 16.Rh1 Dg5 | `sicilian-l06` · La fuente dice que retirar el caballo es malo, pero 11...Cfd7 es de hecho la línea principal teórica; no se afirma lo contrario en la guía. |
| Peón envenenado 10.Axf6 | 10.Axf6 gxf6 11.Ae2 Cc6 12.Cxc6 bxc6 13.O-O Ae7 14.Rh1 Da5 15.f5 h5 | `sicilian-l06` · Incluida como pregunta dentro de la guía de 10.e5 (mismo tronco, misma idea de llevar la dama a g5). |
| 6.Ag5 e6 7.Dd2 | 7.Dd2 Ae7 8.O-O-O b5 9.f3 Ab7 10.g4 Cbd7 11.h4 b4 12.Cce2 d5 | `sicilian-l07` · Línea propia en la fuente. |
| 7.f4 Db6 8.Cb3 / 8.a3 | 8.Cb3 Ae7 9.Df3 Cbd7 10.O-O-O Dc7 11.Ad3 b5 12.The1 b4; 8.a3 Ae7 (8...Dxb2? 9.Ca4) | `sicilian-l08` · 8.a3 va como pregunta (trampa de la dama en b2). |
| Ataque inglés 6.Ae3 Cg4 7.Ag5 | 7.Ag5 h6 8.Ah4 g5 9.Ag3 Ag7 10.Ae2 h5 11.h4 gxh4 12.Axh4 Cc6 13.Cb3 Ae6 14.f3 Cge5 15.Dd2 Tc8 16.O-O-O Ca5 | `sicilian-l09` · Incluye la trampa 10.f3 Ce3. Las subvariantes 10.h3 Ce5 y 11.h3 h4 solo se citan en el informe. |
| Ataque inglés 7.Dd2 / 7.Ac1 | 7.Dd2 Cxe3 8.Dxe3 e6 9.O-O-O Ae7; 7.Ac1 Cf6 (repite) o 7...Cc6 8.f3 Db6 9.h3 Cf6 | `sicilian-l10` · Las jugadas blancas 10.f3 y 11.g4 de la guía son de relleno natural; la fuente solo indica el esquema negro. |
| Ataque Lipnitsky / Sozin 6.Ac4 | 6.Ac4 e6 7.O-O Ae7 8.Ag5 b5 9.Ab3 O-O 10.a3 Ab7 11.Te1 Cbd7 12.f3 Tc8 (12.Axe6 fxe6 13.Cxe6 Db6 14.Cxf8 Txf8) | `sicilian-l11` · La fuente lo llama Lipnitsky; en la teoría 6.Ac4 suele llamarse ataque Sozin/Fischer. El título recoge ambos nombres. |
| Opočenský 6.Ae2 | 6.Ae2 e6 7.O-O Ae7 8.Ae3 O-O 9.f4 Dc7 10.Af3 Cc6 11.Rh1 Cxd4 12.Axd4 e5 13.Ae3 exf4 14.Axf4 Ae6 | `sicilian-l12` · Línea propia en la fuente. |
| 6.Ad3 | 6.Ad3 e6 7.O-O Ae7 8.f4 Cbd7 9.Ae3 Dc7 10.Df3 b5 11.a3 Ab7 12.Tae1 Tc8 (9.f5 Db6) | `sicilian-l13` · Incluye la trampa 9.f5 Db6. |
| 6.f3 | 6.f3 e6 7.Ae3 b5 8.Dd2 Ab7 9.O-O-O Cbd7 10.g4 Cb6 11.h4 b4 12.Cb1 d5 13.e5 Cfd7 14.f4 Cc4 15.Axc4 dxc4 | `sicilian-l14` · La subvariante 11.g5 Cfd7 llega a la misma idea (...b4 y ...d5); no se hace guía aparte. |
| 6.Tb1 (demostración del esquema) | 6.Tb1 e6 7.Ta1 Ae7 ... | descartada: No es una línea: el presentador mueve la torre adelante y atrás solo para enseñar el esquema. |
| Siciliana cerrada / Gran Premio 2.Cc3 | 2.Cc3 d6 3.f4 a6 4.Cf3 Cf6 5.Ac4 b5 6.Ad5 Cxd5 7.Cxd5 e6 8.Cc3 Ab7 (6.Ab3 c4; 5.a4 e6 6.Ac4 d5); 3.Cf3 transpone a la Najdorf | `sicilian-l15` · Se tratan juntas porque la fuente las presenta como un solo capítulo; 5.a4 va como pregunta. |
| Alapin 2.c3 | 2.c3 Cf6 3.e5 Cd5 4.d4 cxd4 5.cxd4 d6 6.Cf3 Cc6 7.Ac4 Cb6 8.Ab5 dxe5 9.Cxe5 Ad7 10.Cxd7 Dxd7 11.O-O e6 (5.Cf3 dxc3? 6.Dxd5; 6.exd6 e6) | `sicilian-l16` · Línea propia en la fuente. |
| Gambito Smith-Morra 2.d4 cxd4 3.c3 | 3.c3 Cf6 4.e5 Cd5 5.Cf3 Cc6 6.cxd4 d6 | `sicilian-l17` · Transpone a la Alapin, pero la idea nueva es rechazar el gambito; se hace una guía corta. |
| Bowdler 2.Ac4 | 2.Ac4 a6 3.Cf3 e6 4.O-O d5 5.exd5 exd5 6.Te1+ Ae7 7.Af1 Cf6 (4.a4 d5 5.exd5 exd5 6.Ae2 Ae6) | `sicilian-l18` · Línea propia en la fuente. |
| Gambito del ala 2.b4 | 2.b4 cxb4 3.a3 d5 4.exd5 Dxd5 5.Cf3 e5 6.axb4 Axb4 7.c3 Ae7 8.d4 exd4 9.cxd4 Cf6 (5.axb4? De5+; 3...bxa3 4.Axa3) | `sicilian-l19` · Línea propia en la fuente. |
| Alapin retrasada 2...d6 3.c3 | 3.c3 Cf6 4.Ae2 e6 5.O-O Cc6 6.Dc2 Ae7 7.d4 O-O (4...Cxe4? 5.Da4+) | `sicilian-l20` · Línea propia en la fuente. |

## Dragón Siciliano (`dragon`) · 11 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| Yugoslavo 9.O-O-O d5 10.exd5 Cxd5 11.Cxc6 bxc6 12.Cxd5 cxd5 13.Dxd5 Dc7 | 14.Dxa8 Af5 15.Dxf8+ Rxf8 16.Td2 h5 (16.Ad3 De5) / 14.Dc5 Db7 15.Db5 Dxb5 16.Axb5 Tb8 / 15.Ad4 Af5 | `dragon-l05` · Línea larga: el paso line llega a 12...cxd5 (24 jugadas) y el resto va en move/explain/quiz. Las subvariantes de 16.Ad3 y 15.Da3 son demasiado profundas para una guía y no se desarrollan. |
| Yugoslavo 9.O-O-O d5 ... 12.Ad4 e5 | 12.Ad4 e5 13.Ac5 Ae6 14.Ce4 Te8 15.h4 h5 16.g4 Cf4 | `dragon-l06` · Línea propia en la fuente. La continuación 16.Ac4 Cf4 y el final con peones pasados se omite. |
| Yugoslavo 9.O-O-O d5 10.Cxc6 | 10.Cxc6 bxc6 transpone | descartada: Simple transposición a la línea principal. |
| Yugoslavo 9.O-O-O d5 10.exd5 Cxd5 11.Cxd5 | 11.Cxd5 Dxd5 12.Cxc6 Dxc6 13.Ah6 Af5 (12.Rb1 Cxd4 13.Axd4 Axd4 14.Dxd4 Dxd4 15.Txd4 Ae6) | `dragon-l07` · La transcripción es confusa en la subvariante 12.Rb1; se reconstruyó con jugadas legales y se presenta solo como pregunta con valoración prudente. |
| Yugoslavo 9.Ac4 | 9.Ac4 Ad7 10.O-O-O Tc8 11.Ab3 Cxd4 12.Axd4 b5 (13.Rb1 a5 14.a4 bxa4 15.Cxa4 Axa4 16.Axa4 Tc4; 13.Cd5; 13.h4 a5 14.h5 a4) | `dragon-l08` · Las subvariantes 13.Cd5 y 13.h4 solo se citan aquí. |
| Yugoslavo 9.g4 Ae6 10.O-O-O | 10.O-O-O Cxd4 11.Axd4 Da5 12.Rb1 Tfc8 13.a3 | `dragon-l09` · La fuente lo llama variante Panov; en la teoría habitual no es ese nombre (es el ataque yugoslavo con 9.g4). El título evita el nombre dudoso. |
| Yugoslavo 9.g4 Ae6 10.Cxe6 | 10.Cxe6 fxe6 11.O-O-O Ce5 12.Ae2 Dc8 13.h4 Cfd7 | `dragon-l10` · Se bifurca de 10.O-O-O con una idea distinta (estructura con ...fxe6): guía aparte. |
| Yugoslavo 9.h4 | 9.h4 d5 10.exd5 Cxd5 | `dragon-l11` · La continuación de la fuente (10.g5 Ch5 ...) no es posible desde esta posición (el peón g no llega a g5 en una jugada); se descarta y la guía se queda en la idea fiable 9...d5. |
| Variante 6.Ag5 | 6.Ag5 Ag7 7.Dd2 h6 8.Ah4 Cc6 9.Cxc6 bxc6 10.Ac4 O-O 11.O-O Db6 (9.O-O-O Cxe4; 8.Ae3 Cg4; 7.Ac4 O-O 8.O-O Cc6) | `dragon-l12` · La subvariante 9.O-O-O Cxe4 10.Cxc6 Cxd2 11.Cxd8 Cxf1 12.Thxf1 g5 es enrevesada y en la fuente está narrada con ambigüedad; solo se muestra el golpe ...Cxe4 con valoración prudente. |
| Variante 6.Ac4 | 6.Ac4 Ag7 7.O-O O-O 8.Ag5 h6 9.Ah4 Cc6 10.Te1 Db6 11.Cb3 Ce5 12.Af1 Ag4 (10.Cxc6 bxc6 11.f4 Db6+) | `dragon-l13` · Línea propia en la fuente. |
| Variante Levenfish 6.f4 | 6.f4 Cc6 7.Cxc6 bxc6 8.e5 Cd7 9.exd6 exd6 10.Ae3 Ae7 11.Dd2 d5 12.O-O-O O-O (7.Ae3 Ag7 8.Ae2 Ad7 9.O-O O-O 10.Af3 Tc8) | `dragon-l14` · La transcripción dice «Bishop B7» tras 10.Ae3, pero el razonamiento (defender d6 porque ...Ag7 lo deja colgando) solo tiene sentido con 10...Ae7, que es además la jugada teórica. Se usa ...Ae7. |
| Variante del fianchetto 6.g3 | 6.g3 Ag7 7.Ag2 O-O 8.O-O Cc6 9.Cde2 Tb8 10.a4 b6 11.h3 Ab7 12.Cd5 Cd7 | `dragon-l15` · El presentador dice que no hace falta conocerla en detalle; se hace guía corta porque la nombra y la desarrolla. |
| Etiquetas de capítulos (Rauzer, Panov) | - | descartada: Los títulos de los capítulos de la descripción (Rauzer, Ataque de torres, Panov) no corresponden a lo que se explica en el video; se ignoran y se usan los nombres reales de las líneas. |

## Ataque Indio de Rey (`kia`) · 5 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| Esquema base contra 1...d5 con ...e6 y ...c5 | 1.Cf3 d5 2.g3 Cf6 3.Ag2 e6 4.O-O Ae7 5.d3 O-O 6.Cbd2 c5 7.e4 Cc6 8.Te1 | descartada: Ya es la línea principal existente (l02). |
| Contra la Francesa 1...e6 | 1.e4 e6 2.d3 d5 3.Cd2 Cf6 4.Cgf3 c5 5.g3 Cc6 6.Ag2 Ae7 7.O-O O-O 8.Te1 b5 9.e5 Cd7 10.Cf1 a5 11.h4 | `kia-l05` · Incluida. Línea teórica muy conocida. |
| Contra la Francesa: 10...b4 11.h4 a5 12.Af4 | ... 10.Cf1 b4 11.h4 a5 12.Af4 | descartada: Descartada como guía propia: mismo plan que la guía anterior con otro orden. |
| Contra la Siciliana 1...c5 2.Cf3 e6 3.d3 | 1.e4 c5 2.Cf3 e6 3.d3 | descartada: Descartada: transpone a la estructura contra la Francesa. |
| Contra la Siciliana con ...Cc6 y ...g6 | 1.e4 c5 2.Cf3 Cc6 3.d3 g6 4.g3 Ag7 5.Ag2 d6 6.O-O e5 7.c3 Cge7 8.a3 O-O 9.b4 | `kia-l06` · Incluida. |
| Contra la Caro-Kann 1...c6 | 1.e4 c6 2.d3 d5 3.Cd2 e5 4.Cgf3 Ad6 5.g3 Cf6 6.Ag2 O-O 7.O-O Te8 8.Te1 Cbd7 9.b3 | `kia-l07` · Incluida. |
| Contra ...c6 y ...Af5 (plan De1) | 1.Cf3 d5 2.g3 c6 3.Ag2 Af5 4.O-O e6 5.d3 h6 6.Cbd2 Cf6 7.De1 Ae7 8.e4 Ah7 9.De2 | `kia-l08` · Incluida. La jugada 9.De2 es menos segura en cuanto a teoría que el resto; revisar. |
| Contra 1...Cf6 con fianchetto | 1.Cf3 Cf6 2.g3 g6 3.Ag2 Ag7 4.O-O O-O 5.d3 d6 6.e4 e5 7.Cbd2 Cc6 8.c3 a5 9.a4 | `kia-l09` · Incluida. |
| Trampas | (ninguna forzada) | descartada: El archivo no incluye trampas forzadas: la fuerza del sistema es estratégica. |

## Defensa India de Rey (`kings-indian`) · 10 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| Variante del Cambio (7.dxe5) | 1.d4 Cf6 2.c4 g6 3.Cc3 Ag7 4.e4 d6 5.Cf3 O-O 6.Ae2 e5 7.dxe5 dxe5 8.Dxd8 Txd8 9.Cxe5 Cxe4 10.Cxe4 Axe5 | `kings-indian-l05` · El video explica la estructura y el truco ...Cxe4 sin dar un orden exacto de jugadas; la línea concreta es mía. Las partidas ilustrativas (b4-c5-Cd6, Cb5 contra c7) no se convierten en guías. |
| Averbakh 6.Ag5: ...h6 antes de ...e5 | 1.d4 Cf6 2.c4 g6 3.Cc3 Ag7 4.e4 d6 5.Ae2 O-O 6.Ag5 h6 7.Ae3 e5 8.d5 c6 (6...e5? 7.dxe5 dxe5 8.Dxd8 Txd8 9.Cd5) | `kings-indian-l06` · El video da la trampa y la regla de jugar ...h6 primero. 8...c6 es una continuación habitual que añado yo. Contra la Averbakh también es muy jugada 6...c5 (no mencionada en el video para esta variante). |
| Semi-Averbakh 6.Ae3 e5 7.d5 con g4 | 1.d4 Cf6 2.c4 g6 3.Cc3 Ag7 4.e4 d6 5.Ae2 O-O 6.Ae3 e5 7.d5 Ca6 8.g4 Cc5 9.f3 a5 10.h4 | `kings-indian-l07` · La transcripción automática está muy deformada aquí ("by 0.95"...). Reconstruí la partida del presentador como ...Ca6, g4, ...Cc5, f3, ...a5, h4, que encaja con lo que describe. La continuación de la partida (...f5, Dh4, Rd2) no la incluyo. |
| Semi-Averbakh 6...c5 (estilo Benoni) | 1.d4 Cf6 2.c4 g6 3.Cc3 Ag7 4.e4 d6 5.Ae2 O-O 6.Ae3 c5 | descartada: Solo se menciona al final como alternativa, sin jugadas. Se cita en el texto de kings-indian-l07. |
| Clásica 9.Ce1 Cd7 10.Cd3 | 1.d4 Cf6 2.c4 g6 3.Cc3 Ag7 4.e4 d6 5.Cf3 O-O 6.Ae2 e5 7.O-O Cc6 8.d5 Ce7 9.Ce1 Cd7 10.Cd3 f5 11.Ad2 Cf6 12.f3 f4 (13.c5 g5) | `kings-indian-l08` · El video dice que teóricamente ...fxe4 es lo mejor tras Ad2 y presenta ...f4 como el plan de ataque; enseño ...f4 sin afirmar que sea lo mejor. |
| Mar del Plata 9.Ce1 Ce8 con ...f4, ...g5 y ruptura ...g3 | ... 9.Ce1 Ce8 10.Ae3 f5 11.f3 f4 12.Af2 g5 | `kings-indian-l09` · Incluye las ideas del video: ...g3 en lugar de ...gxf3 y la importancia del alfil de casillas claras (a5 y Cb6 de las blancas para cambiarlo). |
| Mar del Plata 9...Cd7 10.Ae3 f5 11.f3 f4 12.Af2 g5 13.Tc1 Cg6 ... Aa5, Tf7, Af8 | (línea teórica larga del video) | descartada: Prolongación muy profunda de la línea principal existente (l02) con sacrificios de calidad; la transcripción no deja claro el orden de jugadas. Descartada por fiabilidad y por exceder 24 jugadas. |
| Gligoric 7.Ae3 Cg4 | ... 6.Ae2 e5 7.Ae3 Cg4 8.Ag5 f6 9.Ah4 Cc6 10.d5 Ce7 | `kings-indian-l10` · Incluye el error 7...Cc6 8.d5 Ce7 9.Cd2 que describe el video. Las jugadas 9...Cc6 10.d5 Ce7 son mías, siguiendo la descripción de una posición cerrada con el alfil en h4. |
| Gligoric 7.Ae3 exd4 (peón aislado) | ... 7.Ae3 exd4 8.Cxd4 Te8 9.f3 c6 10.Af2 d5 11.exd5 cxd5 12.O-O Cc6 13.c5 | descartada: El presentador dice expresamente que no profundiza. Comparte idea (...Te8, ...c6, ...d5) con kings-indian-l11, así que no hago guía aparte. |
| Estructura abierta 7.O-O exd4 con ruptura ...d5 | ... 7.O-O exd4 8.Cxd4 Te8 9.f3 c6 10.Ae3 d5 11.cxd5 Cxd5 12.Cxd5 cxd5 | `kings-indian-l11` · Incluye la advertencia contra 10.Rh1 (no romper aún). La idea Ag5 de las blancas y la ruptura ...f5 con ...Ch5 contra Af4 se omiten por ser demasiado concretas y poco claras en la transcripción. |
| Estructura abierta: bind con b3 y b4, contrajuego ...a5-a4, ...Da5-b4 | (partidas ilustrativas) | descartada: Ejemplos de partidas sin línea teórica concreta. |
| Fianchetto: plan Panno | 1.d4 Cf6 2.c4 g6 3.Cf3 Ag7 4.g3 O-O 5.Ag2 d6 6.O-O Cc6 7.Cc3 a6 8.d5 Ca5 9.Cd2 c5 10.Dc2 Tb8 11.b3 b5 | `kings-indian-l12` · El video dice que hoy se considera menos fuerte que ...e5; el texto no afirma que sea lo mejor. |
| Sämisch: plan Panno con 9.Cc1 e5 y golpe ...Cxe4 | 1.d4 Cf6 2.c4 g6 3.Cc3 Ag7 4.e4 d6 5.f3 O-O 6.Ae3 Cc6 7.Cge2 a6 8.Dd2 Tb8 9.Cc1 e5 10.d5 Cd4 11.Axd4 exd4 12.Dxd4 Cxe4 | `kings-indian-l13` · Táctica comprobada: tras 13.Dxe4 Te8 clava la dama; tras 13.Cxe4 o fxe4, ...Axd4. |
| Sämisch 6...c5 | ... 5.f3 O-O 6.Ae3 c5 7.dxc5 / 7.d5 / 7.Cge2 Cc6 8.d5 Ce5 | descartada: Mencionada como línea principal moderna, pero sin desarrollo concreto. No hago guía para no inventar la continuación. |
| Sämisch con ...a6, ...Cbd7, ...b5 rápido y ...c6/...e5; ...h5 contra Cge2-g3 | ... 5.f3 O-O 6.Ae3 a6 7.Dd2 Cbd7 ... b5 / 5.Cge2 ... h5 | descartada: Ideas modernas descritas con órdenes de jugadas confusos en la transcripción. Descartadas por fiabilidad. |
| Makogonov 5.h3 con ...Cf4 | 1.d4 Cf6 2.c4 g6 3.Cc3 Ag7 4.e4 d6 5.h3 O-O 6.Ae3 e5 7.d5 Ca6 8.Dd2 Ch5 9.g4 Cf4 10.Axf4 exf4 11.Dxf4 f5 | `kings-indian-l14` · El orden exacto es incierto en la transcripción; el video afirma que el motor da -2/-3, en el texto solo digo que suele ser bueno para las negras. |
| Petrosian 7.d5 con Ag5-e3 y ...Cg4, ...f5 | ... 7.d5 a5 8.Ag5 h6 9.Ae3 Cg4 ... Dc1 f4 (no ...Rh7 por g4) | descartada: La transcripción es demasiado confusa para reconstruir la línea con seguridad. |
| Karpov / g4 contra ...e5 (partida McShane con ...c6, ...h5) | (partida ilustrativa) | descartada: Ejemplo de partida sin línea teórica concreta. |
| Smyslov: plan ...a6, ...c6, ...O-O, ...b5 | 1.d4 Cf6 2.c4 g6 3.Cc3 Ag7 4.Cf3 d6 5.Ag5 ... | descartada: Mención breve sin jugadas concretas de las blancas; no hay base suficiente para una guía. |
| Estructura Benoni (...c5 tras d5) y estructura checa (...c5, ...e5 cerrado) | (ideas generales) | descartada: Comentarios de estructura sin línea concreta. |

## Defensa Moderna (`modern`) · 13 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| Ruptura ...c5 contra el desarrollo clásico | 1.e4 g6 2.d4 Ag7 3.Cc3 d6 4.Cf3 a6 5.Ae3 b5 6.Ad3 Ab7 7.O-O Cd7 8.Dd2 c5 9.d5 Cgf6 10.Ah6 O-O 11.Axg7 Rxg7 | `modern-l05` · Línea desarrollada en el video; guía propia. |
| Sin Cc3: sistema con Ad3 y c3 | 1.e4 g6 2.d4 Ag7 3.Cf3 d6 4.Ad3 Cf6 5.O-O O-O 6.c3 Cc6 7.h3 e5 8.Ae3 h6 9.Cbd2 Ch5 10.Te1 Df6 11.Cf1 Cf4 | `modern-l06` · Línea desarrollada en el video; guía propia. |
| Contra h4 temprano: golpe ...d5 | 1.e4 g6 2.h4 d5 3.exd5 Dxd5 4.Cc3 Da5 5.h5 Cc6 6.hxg6 fxg6 | `modern-l07` · Línea desarrollada en el video; guía propia. |
| Ataque 150 con h4: ...h5 y ...c5 | 1.e4 g6 2.d4 Ag7 3.Cc3 d6 4.Ae3 a6 5.Dd2 b5 6.f3 Cd7 7.O-O-O Ab7 8.h4 h5 9.Ch3 c5 10.Cg5 cxd4 11.Axd4 Axd4 12.Dxd4 Cgf6 | `modern-l08` · Línea desarrollada en el video; guía propia. |
| Ataque 150 con g4: cierra con ...e6 y ...d5 | 1.e4 g6 2.d4 Ag7 3.Cc3 d6 4.Ae3 a6 5.Dd2 b5 6.f3 Cd7 7.g4 h5 8.g5 e6 9.h4 Ce7 10.Ch3 Ab7 11.O-O-O d5 12.e5 c5 | `modern-l09` · Línea desarrollada en el video; guía propia. |
| Ataque austriaco con e5: ...c5 y ...Ch6 | 1.e4 g6 2.d4 Ag7 3.Cc3 d6 4.f4 a6 5.Cf3 b5 6.Ad3 Cd7 7.e5 c5 8.Ae4 Tb8 9.O-O Ch6 | `modern-l10` · Línea desarrollada en el video; guía propia. |
| Ataque austriaco con a4: ...b4 y ...c5 | 1.e4 g6 2.d4 Ag7 3.Cc3 d6 4.f4 a6 5.Cf3 b5 6.Ad3 Cd7 7.a4 b4 8.Ce2 c5 9.c3 bxc3 10.bxc3 a5 11.O-O Cgf6 12.e5 Cd5 | `modern-l11` (recortada a 16 jugadas) · Línea desarrollada en el video; guía propia. |
| a4 contra Ae3: Pirc y golpe ...Cxe4 | 1.e4 g6 2.d4 Ag7 3.Cc3 d6 4.Ae3 a6 5.a4 Cf6 6.Dd2 O-O 7.Ah6 e5 8.d5 Cxe4 9.Cxe4 Dh4 10.Axg7 Dxe4+ 11.Ae2 Rxg7 | `modern-l12` · Línea desarrollada en el video; guía propia. |
| El hipopótamo contra Cf3, Cc3 y a4 | 1.e4 g6 2.d4 Ag7 3.Cc3 d6 4.Cf3 a6 5.a4 b6 6.Ac4 e6 7.O-O Ce7 8.Ae3 h6 9.Dd2 Cd7 10.Tfe1 Ab7 11.Tad1 g5 | `modern-l13` · Línea desarrollada en el video; guía propia. |
| Ac4 sin Cc3: el golpe ...Cxe4 | 1.e4 g6 2.d4 Ag7 3.Cf3 d6 4.Ac4 Cf6 5.Cc3 O-O 6.O-O Cxe4 7.Cxe4 d5 8.Ad3 dxe4 9.Axe4 Cd7 10.c3 c5 | `modern-l14` · Línea desarrollada en el video; guía propia. |
| Cc3 y f4: esquema Gran Premio con ...c5 | 1.e4 g6 2.Cc3 Ag7 3.f4 c5 4.Cf3 Cc6 5.Ac4 e6 6.O-O Cge7 7.d3 O-O 8.De1 d5 9.Ab3 Ca5 10.Dh4 Cec6 | `modern-l15` · Línea desarrollada en el video; guía propia. |
| Contra c4: ...Cc6 en lugar de la India de Rey | 1.e4 g6 2.d4 Ag7 3.c4 d6 4.Cc3 Cc6 5.Cf3 Ag4 6.Ae3 e5 7.d5 Cd4 8.Ae2 Axf3 9.Axf3 Ce7 | `modern-l16` · Línea desarrollada en el video; guía propia. |
| Contra el Londres: ...Cd7 y ...e5 rápido | 1.d4 g6 2.Af4 Ag7 3.e3 d6 4.Cf3 Cd7 5.c3 e5 6.Ag3 Ch6 7.Cbd2 Cf5 8.e4 Cxg3 9.hxg3 O-O | `modern-l17` · Línea desarrollada en el video; guía propia. |
| Transposición a la Pirc (1.e4 d6 2.d4 Cf6 3.Cc3 g6) | 1.e4 d6 2.d4 Cf6 3.Cc3 g6 4.Cf3 Ag7 | descartada: Solo se menciona como transposición para explicar por qué se retrasa ...Cf6; no aporta una idea nueva. |
| Comparación con la Siciliana Dragón (ataque yugoslavo) | 1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3 Ag7 7.f3 O-O 8.Dd2 Cc6 | descartada: Es otra apertura; solo sirve de analogía. |
| Error 8.a3 contra el plan tigre | 1.e4 g6 2.d4 Ag7 3.Cc3 d6 4.Cf3 a6 5.Ae3 b5 6.a3 | descartada: Incluido como quiz dentro de modern-l05 (pierde un tiempo); no justifica una guía propia. |
| ...Cgf6 prematuro en el plan tigre: e5 dxe5 Cg4 / e6 | ... Dd2 Cgf6 e5 dxe5 dxe5 Cg4 (o e6 fxe6 Cg5) | descartada: Advertencia sin línea concreta completa; la idea de jugar ...c5 antes de ...Cf6 ya está en modern-l05. |
| Ignorar h4 temprano con ...Ag7 (h5, h6) | 1.e4 g6 2.h4 Ag7 3.h5 d6 4.d4 | descartada: Mostrado como lo que no conviene; mencionado en el primer paso de modern-l07. |
| 2.d4 Ag7 3.h4 d5 (4.exd5 Dxd5 5.Cf3 Ag4 / 4.e5 c5 5.c3 cxd4 6.cxd4 h5) | 1.e4 g6 2.d4 Ag7 3.h4 d5 4.e5 c5 5.c3 cxd4 6.cxd4 h5 | descartada: Misma idea que modern-l07; se explica en su segundo paso en lugar de crear otra guía. |
| h4 en la jugada 4 (tras Cf3 d6): ...h5 o ...h6 | 1.e4 g6 2.d4 Ag7 3.Cc3 d6 4.Cf3 ... 5.h4 h5 | descartada: El presentador dice que es rara y solo da la regla general (...h5); el orden exacto de jugadas no es claro. |
| Ataque 150 con h4: alternativa ...h6 | ... O-O-O Ab7 h4 h6 | descartada: El presentador la menciona pero recomienda ...h5; se omite para no duplicar. |
| 150: rey en b1 y ...c5 prematuro (golpe en b5) | ... O-O-O Ab7 h4 h5 Rb1 c5 dxc5 Cxc5 | descartada: La transcripción del sacrificio en b5 es confusa; se incluye solo como quiz conceptual en modern-l08 (prepara con ...Tc8). |
| 150: Cf6 temprano y e5 (Ca2, Rd1) | ... h4 h5 Cf6 Rb1 c5 dxc5 Cxc5 e5 | descartada: Matiz táctico con jugadas blancas que el propio presentador llama aleatorias; descartado. |
| 150: g4 con ...c5 en lugar de ...h5 | ... g4 c5 dxc5 Cxc5 h4 h5 g5 | descartada: Ejemplo de error sin continuación útil para el usuario; la recomendación correcta (...h5) está en modern-l09. |
| 150: g4 h5 gxh5 (partida de ejemplo) | ... g4 h5 gxh5 Txh5 Ce2 e6 Cg3 Th8 | descartada: Partida de ejemplo; la idea (...Cb6-c4) aparece como quiz en modern-l09. |
| Partida de Carlsen (Titled Tuesday) en el ataque 150 | ... Ch3 c5 Cg5 cxd4 Axd4 Axd4 Dxd4 ... Db6 | `modern-l08` · Base de modern-l08 hasta ...Cgf6; el resto de la partida es medio juego. |
| Ataque austriaco: exd6 temprano (partida del presentador) | 1.e4 g6 2.d4 Ag7 3.Cc3 d6 4.f4 a6 5.Cf3 b5 6.e5 ... exd6 exd6 | descartada: Incluido como paso y quiz en modern-l10. |
| Ataque austriaco: e5 c5 e6 y Cg5 (sacrificios, ...Cf8, ...Ch6, sacrificio de dama) | ... e5 c5 e6 fxe6 Cg5 Cf8 / ... Cg5 Ch6 | descartada: Líneas muy tácticas que el presentador pide no memorizar y cuyo orden exacto no queda claro en la transcripción. |
| Ataque austriaco con enroque antes de e5 | ... O-O c5 | descartada: Lleva a estructuras de Dragón o Benoni ya vistas en modern-l05; sin idea nueva. |
| 150 con a4 (sin f4): ...b4 Ce2 c5 c3 | 1.e4 g6 2.d4 Ag7 3.Cc3 d6 4.Ae3 a6 5.Dd2 b5 6.f3 Cd7 7.a4 b4 8.Ce2 c5 9.c3 | descartada: Mismo plan que modern-l11; el presentador solo lo menciona de pasada. |
| a4 contra Ae3 con Cf3 y Ae2: ...b6, ...Ab7 (Cd2 e6 f4 c5) o ...Cc6 y ...e5 (d5 Cb4) | 1.e4 g6 2.d4 Ag7 3.Cc3 d6 4.Ae3 a6 5.a4 Cf6 6.Cf3 O-O 7.Ae2 b6 8.O-O Ab7 9.Cd2 e6 | descartada: Plan secundario dentro de la misma variante; aparece como quiz en modern-l12. |
| Ae2 sin Cc3: ...Cf6, Cc3 O-O y ...Cc6/...e5 | 1.e4 g6 2.d4 Ag7 3.Cf3 d6 4.Ae2 Cf6 5.Cc3 O-O 6.O-O Cc6 | descartada: Mismas ideas que modern-l06 (...Cc6, ...e5, ...Cb8 contra d5); no se repite. |
| c4 con transposición a la India de Rey (con ...a6) | 1.e4 g6 2.d4 Ag7 3.c4 d6 4.Cc3 Cf6 | descartada: Es otra apertura; la alternativa propia de la Moderna está en modern-l16. |
| Hipopótamo contra el ataque austriaco | 1.e4 g6 2.d4 Ag7 3.Cc3 d6 4.f4 b6 ... e6 | descartada: Mostrado como lo que no se debe hacer; quiz en modern-l13. |
| Ac4 con Cf6 y De2 | 1.e4 g6 2.d4 Ag7 3.Cf3 d6 4.Ac4 Cf6 5.De2 O-O 6.O-O Ag4 | descartada: El presentador la describe de forma vaga (varios planes posibles); la parte concreta (...Cxe4 contra Cc3) está en modern-l14. |
| Ac4 con d3 en lugar de d4 | 1.e4 g6 2.Cf3 Ag7 3.Ac4 d6 4.d3 c5 | descartada: Mención breve sin desarrollo. |
| Esquema Gran Premio con Ab5 (...Cd4) | 1.e4 g6 2.Cc3 Ag7 3.f4 c5 4.Cf3 Cc6 5.Ab5 Cd4 | descartada: Explicado como paso dentro de modern-l15; la continuación de la transcripción es confusa. |
| Contra c4: Ae3 sin Cf3 (...e5 d5 Cd4 Ce2) y 5.d5 Ce5 | 1.e4 g6 2.d4 Ag7 3.c4 d6 4.Cc3 Cc6 5.Ae3 e5 6.d5 Cd4 7.Cge2 Ce7 | descartada: Mismas ideas que modern-l16; incluido como quiz. |
| 1.d4 g6 sin e4 (Cf3, Cc3) | 1.d4 g6 2.Cf3 Ag7 3.Cc3 | descartada: El presentador solo avisa de que hay que adaptar el repertorio; sin línea concreta. |
| Londres con Cc3 y Dd2 (estilo Jobava): ...a6, ...b5 | 1.d4 g6 2.Af4 Ag7 3.Cc3 d6 4.Dd2 a6 5.O-O-O b5 | descartada: El presentador dice que se parece al ataque 150 pero peor para las blancas; ya cubierto por modern-l08. |

## Defensa Pirc (`pirc`) · 6 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| Ataque austriaco 4.f4 Ag7 5.Cf3 c5 6.dxc5 Da5 7.cxd6 | 7.cxd6 Cxe4 ... Cxc3 bxc3 O-O, Te8, Dc5 (Tb1/Tb5? Dxb5; Cd4 Cc6) | `pirc-l05` · La guía llega a 7...Cxe4. Las continuaciones de la fuente (8.Ad2 / captura con peón, ...O-O, ...Te8, ...Dc5, trucos con Tb5 y Cd4) no dicen qué jugada hacen las blancas en la jugada 8 y no se pueden reconstruir con seguridad; se describen solo en general. |
| Ataque austriaco 7.Ad3 Dxc5 8.De2 | 8.De2 O-O 9.Ae3 Db4 10.O-O-O Cxe4 11.Axe4 Axc3 12.bxc3 Dxe4 (11.Cxe4 Axb2+ ... Db2#; 9...Da5 sólida) | `pirc-l06` · Orden de jugadas reconstruido: la fuente omite cuándo enrocan las negras y la blanca necesita mover el alfil de c1 antes de enrocar largo. La línea de mate tras 11.Cxe4 no se incluye por no poder verificarla con seguridad. |
| Austriaco 5...O-O 6.Ae3 Cbd7 7.e5 Cg4 8.Ag1 c5 (partida ilustrativa) | 9.exd6 cxd4 10.Cxd4 Cxe5?... (complicaciones de la partida) | `pirc-l07` · Es una partida de ejemplo; se usa solo el tramo inicial porque ilustra un patrón claro (...Cg4 y ...c5). Las complicaciones posteriores son específicas de la partida y la transcripción es confusa. |
| Desarrollo clásico Cf3, Ac4, O-O | 4.Cf3 Ag7 5.Ac4 O-O 6.O-O Ag4 7.h3 Axf3 8.Dxf3 Cc6 9.d5 Ce5 (9.Ae3 e5 10.dxe5 Cxe5) | `pirc-l08` · Distinta de la línea principal existente (l02, con 5.Ae2 y ...c6). |
| Clásico 9.Ae3 e5 10.d5 Cd4 | 10.d5 Cd4 11.Axd4 exd4 12.Ce2 Te8 13.Cxd4 Cxe4 14.c3? Cd2 | `pirc-l09` · La transcripción dice «Knight e4» en lugar de ...Cd4; por el contexto (ataca dama y peón, el cambio obliga a mover el caballo de c3) es ...Cd4. |
| Sistema 4.Ae3 (con Dd2, f3, Ah6) | 4.Ae3 c6 5.Dd2 b5 6.f3 Cbd7 7.O-O-O Da5 8.Rb1 Ag7 9.h4 h5 10... Cb6, b4, Cc4, Aa6 | `pirc-l10` · Se corta en 9...h5; el resto (g4, b4, Cce2, Cc4, Aa6, final con Cxd5) se resume en un paso explicativo porque las jugadas blancas no se pueden fijar con seguridad. |
| 4.Ag5 seguido de e5 | 4.Ag5 ... e5 | descartada: La fuente solo la nombra y remite a otro video; no da ninguna jugada. |

## Partida Escocesa (`scotch`) · 12 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| 3.Cc3 Cf6 4.d4 (Cuatro Caballos por otro orden) | 1.e4 e5 2.Cf3 Cc6 3.Cc3 Cf6 4.d4 exd4 5.Cxd4 Ab4 6.Cxc6 bxc6 7.Ad3 d5 8.exd5 cxd5 9.O-O O-O 10.Ag5 | `scotch-l14` · Se enseña por el orden escocés (3.d4 ... 5.Cc3), que lleva a la misma posición. |
| 3.Ac4 (Italiana) | 1.e4 e5 2.Cf3 Cc6 3.Ac4 | descartada: Otra apertura; solo se menciona para comparar. |
| 3...Cxd4 4.Cxe5 Ac5 5.Cxf7 | 1.e4 e5 2.Cf3 Cc6 3.d4 Cxd4 4.Cxe5 Ac5 5.Cxf7 Rxf7 6.Dh5+ g6 7.Dxc5 | `scotch-l05` · Trampa clara; 4...Ce6 va en un explain. |
| 3...d6 4.d5 Cce7 | 1.e4 e5 2.Cf3 Cc6 3.d4 d6 4.d5 Cce7 | `scotch-l06` · Línea corta (8 jugadas): la fuente no la prolonga y no se ha inventado continuación. |
| Gambito Escocés 4.Ac4 | 1.e4 e5 2.Cf3 Cc6 3.d4 exd4 4.Ac4 | descartada: La fuente remite a otro vídeo y no da jugadas. |
| Gambito Göring 4.c3 dxc3 5.Cxc3 | 1.e4 e5 2.Cf3 Cc6 3.d4 exd4 4.c3 dxc3 5.Cxc3 | descartada: Solo aparece en el PGN de la descripción, sin explicación. |
| 4...Cxd4 5.Dxd4 Df6 6.e5 Db6 7.Dxb6 axb6 | 1.e4 e5 2.Cf3 Cc6 3.d4 exd4 4.Cxd4 Cxd4 5.Dxd4 Df6 6.e5 Db6 7.Dxb6 axb6 8.Cc3 | `scotch-l07` · 8.Cc3 añadido como desarrollo natural ("desarrollas rápido"). |
| 4...Cxd4 5.Dxd4 d6 | ... 5.Dxd4 d6 | descartada: Solo aparece en el PGN, sin explicación. |
| Steinitz 4...Dh4 5.Cc3 Ab4 6.Ae2 Dxe4 7.Cb5 Axc3+ 8.bxc3 Rd8 9.O-O | 1.e4 e5 2.Cf3 Cc6 3.d4 exd4 4.Cxd4 Dh4 5.Cc3 Ab4 6.Ae2 Dxe4 7.Cb5 Axc3+ 8.bxc3 Rd8 9.O-O | `scotch-l08` · Los errores 6.Dd3, 6.Ad3, 6.De2 y 6.Ad2 van en el explain y en el quiz. |
| Steinitz 8...De5 9.f4 Dc5 10.Cxc7+ | ... 8.bxc3 De5 9.f4 Dc5 10.Cxc7+ Rd8 11.Cxa8 Dxc3+ 12.Ad2 | `scotch-l09` · Trampa clara y comprobada. |
| Steinitz 6.Dd3 / 6.Ad3 / 6.De2 / 6.Ad2 | ... 5...Ab4 6.Dd3 Cf6 / 6.Ad3 Cxd4 / 6.De2 Cxd4 / 6.Ad2 Cxd4 | descartada: Errores sin continuación propia; se explican dentro de l08. |
| Clásica 5.Cxc6 Df6 | 1.e4 e5 2.Cf3 Cc6 3.d4 exd4 4.Cxd4 Ac5 5.Cxc6 Df6 6.Dd2 dxc6 | descartada: La fuente la desaconseja; se enseña como explain (con play) en l10 y como quiz del repaso. |
| Clásica 5.Ae3 Cf6 6.Cxc6 (trampa del alfil) | 1.e4 e5 2.Cf3 Cc6 3.d4 exd4 4.Cxd4 Ac5 5.Ae3 Cf6 6.Cxc6 bxc6 7.Axc5 | `scotch-l10` · Trampa muy común. 5...a6 6.Cxc6 es la misma idea. |
| Clásica 5.Ae3 Cxd4 6.Axd4 Axd4 7.Dxd4 | ... 5.Ae3 Cxd4 6.Axd4 Axd4 7.Dxd4 | descartada: Solo un cambio que centraliza la dama; sin idea nueva. |
| Clásica 5.Ae3 Df6 6.Cb5 Axe3 7.fxe3 Dxb2 8.C1c3 Rd8 9.Tb1 (trampa de la dama) | 1.e4 e5 2.Cf3 Cc6 3.d4 exd4 4.Cxd4 Ac5 5.Ae3 Df6 6.Cb5 Axe3 7.fxe3 Dxb2 8.C1c3 Rd8 9.Tb1 | `scotch-l11` · Comprobado: la dama no tiene casillas (b4 la cubre la torre a rayos X, a3 el caballo de b5, c3 el peón de d2). |
| Clásica 6.Cb5 Axe3 7.fxe3 Dh4+ 8.g3 Dxe4 9.Cxc7+ Rd8 10.Cxa8 Dxh1 | ... 7.fxe3 Dh4+ 8.g3 Dxe4 9.Cxc7+ Rd8 10.Cxa8 Dxh1 | descartada: Rama sin trampa; va como explain con play en l11 (bifurcación pequeña, no merece guía propia). |
| Clásica 6.Cb5 Axe3 7.Cxc7+ / 7...Axd4 | ... 6.Cb5 Axe3 7.Cxc7+ Rd8 | descartada: Fragmentos del PGN mal transcritos; no se pueden reconstruir. |
| Clásica 5.Ae3 Df6 6.c3 Cge7 7.Ac4 O-O 8.O-O | 1.e4 e5 2.Cf3 Cc6 3.d4 exd4 4.Cxd4 Ac5 5.Ae3 Df6 6.c3 Cge7 7.Ac4 O-O 8.O-O | `scotch-l12` · La línea más jugada según la fuente. |
| Clásica 5.Cb3 Ab6 6.Cc3 Cf6 7.De2 | 1.e4 e5 2.Cf3 Cc6 3.d4 exd4 4.Cxd4 Ac5 5.Cb3 Ab6 6.Cc3 Cf6 7.De2 O-O 8.Ae3 Te8 9.f3 d6 10.O-O-O | `scotch-l13` · La propia fuente admite que dejó e4 colgando; se adelanta f3 antes del enroque largo para que la línea sea correcta. |
| Clásica 5.Cc3 Ab4 / 5.Ad3 / 5.f3 d5 | ... 4...Ac5 5.Cc3 Ab4 / 5.Ad3 / 5.f3 d5 | descartada: Solo en el PGN, sin explicación. |
| 4...Cf6 5.Cxc6 dxc6 6.Dxd8+ Rxd8 7.f3 | 1.e4 e5 2.Cf3 Cc6 3.d4 exd4 4.Cxd4 Cf6 5.Cxc6 dxc6 6.Dxd8+ Rxd8 7.f3 | `scotch-l15` · La fuente explica la mayoría de peones con detalle. |
| Mieses 4...Cf6 5.Cxc6 bxc6 6.e5 De7 7.De2 Cd5 8.c4 Aa6 | ... 8.c4 Aa6 9.b3 g6 10.f4 Ag7 11.Df2 Cb6 12.Aa3 d6 13.Cc3 | descartada: Es la línea principal existente (l02) y su prolongación; no se repite. |
| Mieses 8...Cb6 9.Cc3 De6 10.De4 g6 11.Ad3 Ag7 12.f4 | 1.e4 e5 2.Cf3 Cc6 3.d4 exd4 4.Cxd4 Cf6 5.Cxc6 bxc6 6.e5 De7 7.De2 Cd5 8.c4 Cb6 9.Cc3 De6 10.De4 g6 11.Ad3 Ag7 12.f4 O-O 13.O-O Aa6 14.b3 | `scotch-l16` · Recortada en 12.f4 por el límite de 24 jugadas; el resto va en el explain. |
| Mieses 7.Af4 Cd5 8.Ag3 Db4+ / 7.f4 d6 | ... 6...De7 7.Af4 Cd5 8.Ag3 Db4+ 9.Cd2 Dxb2 / 7.f4 d6 | descartada: Errores blancos sin continuación útil; se usan en el quiz de l16. |

## Gambito Evans (`evans`) · 10 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| 4...Cxb4 5.c3 Cc6 6.d4 | 1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Cxb4 5.c3 Cc6 6.d4 exd4 7.O-O d6 8.cxd4 Ab6 | `evans-l05` · La fuente dice que casi no se juega pero la explica. |
| Evans declinado 4...Ab6 5.a4 a6 6.Cc3 Cf6 7.Cd5 | 1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Ab6 5.a4 a6 6.Cc3 Cf6 7.Cd5 Cxd5 8.exd5 Cd4 9.a5 Aa7 10.d6 cxd6 11.c3 | `evans-l06` · 10...cxd6 es la lectura más coherente de la transcripción ("doblas sus peones en d6"). |
| Declinado 7...Cxe4 8.O-O / 10.Cxe5 | ... 7.Cd5 Cxe4 8.O-O / 9...Aa7 10.Cxe5 | descartada: Errores sin continuación concreta; se usan en el quiz de l06. |
| Mayet 5...Af8 6.d4 Ca5 7.Ae2 d6 8.Da4+ | 1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Af8 6.d4 Ca5 7.Ae2 d6 8.Da4+ c6 9.dxe5 dxe5 10.Cxe5 Dc7 11.Cf3 | `evans-l07` · La transcripción dice "dxc5 dxc5 Cxc5"; por contexto es dxe5 dxe5 Cxe5. Las jugadas siguientes de la teoría (Cd4, Ae3, Cd2, f5) no se incluyen. |
| Anderssen 5...Ae7 6.d4 Ca5 7.Ae2 exd4 8.Dxd4 d6 | 1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Ae7 6.d4 Ca5 7.Ae2 exd4 8.Dxd4 d6 9.Dxg7 Af6 10.Dg3 De7 11.O-O Dxe4 12.Te1 Rf8 13.Cd4 | `evans-l08` · 13.Cd4 es un paso move por el límite de 24 jugadas. La fuente desaconseja 13.Ab5 (...Dg6) y 11.Df4. |
| Anderssen 7...d6 8.Da4+ c6 9.dxe5 | ... 7.Ae2 d6 8.Da4+ c6 9.dxe5 dxe5 10.Cxe5 Cf6 11.O-O Dc7 12.Cf3 | descartada: Casi idéntica a la Mayet (l07); sin idea nueva. |
| Anderssen 8...Cf6 (Kasparov–Anand 1995) | ... 8.Dxd4 Cf6 9.e5 Cc6 10.Dh4 Cd5 11.Dg3 g6 12.O-O | `evans-l09` · Duda: la fuente dice que Anand jugó 12...d6; en la partida real se jugó 12...Cb6 (13.c4 d6). La guía para en 12.O-O y menciona 12...Cb6. |
| McDonnell 5...Ac5 6.d4 exd4 7.O-O dxc3 8.Axf7+ | 1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Ac5 6.d4 exd4 7.O-O dxc3 8.Axf7+ Rxf7 9.Dd5+ Re8 10.Dxc5 | `evans-l10` · La línea sólida 7...d6 8.cxd4 Ab6 9.Cc3 Ca5 10.Ad3 va en un explain. Llega a una posición muy parecida a la de l02, con 10.Ad3 en vez de 10.Ag5. |
| McDonnell 7...d6 8.cxd4 Ab6 9.Cc3 Ca5 10.Ad3 Ce7 11.h3 O-O 12.Te1 | ... 7...d6 8.cxd4 Ab6 9.Cc3 Ca5 10.Ad3 Ce7 11.h3 O-O 12.Te1 | descartada: Transpone casi a la línea principal existente (l02); va como explain dentro de l10. |
| Stone-Ware 5...Ad6 6.d4 Cf6 7.O-O O-O 8.Te1 | 1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Ad6 6.d4 Cf6 7.O-O O-O 8.Te1 h6 9.Cbd2 Te8 10.Db3 De7 11.Ad3 Ca5 12.Dc2 b6 13.Tb1 Ab7 | `evans-l11` · Recortada en 12.Dc2; el resto va en el explain. La trampa 7...Cxe4 8.dxe5 va en el quiz. |
| Lasker 6...d6 7.O-O Ab6 8.dxe5 dxe5 9.Dxd8+ Cxd8 10.Cxe5 Ae6 | 1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.d4 d6 7.O-O Ab6 8.dxe5 dxe5 9.Dxd8+ Cxd8 10.Cxe5 Ae6 | `evans-l12` · La fuente prefiere a las negras; el texto lo dice sin exagerar. |
| Bronstein 6...d6 7.O-O Cf6 | ... 6.d4 d6 7.O-O Cf6 8.? | descartada: Descartada: la transcripción ("D5 D5 Queen C2") no permite reconstruir la línea. |
| Pierce 6...exd4 7.O-O Cge7 8.cxd4 d5 9.exd5 Cxd5 10.Aa3 | 1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.d4 exd4 7.O-O Cge7 8.cxd4 d5 9.exd5 Cxd5 10.Aa3 Ae6 11.Cbd2 Ab4 | `evans-l13` · Distinta de l02 (7...d6). |
| Pierce 7.Db3 De7 8.O-O Ab6 9.cxd4 Cxd4 10.Cxd4 Axd4 11.Cc3 Cf6 12.Cb5 | 1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.d4 exd4 7.Db3 De7 8.O-O Ab6 9.cxd4 Cxd4 10.Cxd4 Axd4 11.Cc3 Cf6 12.Cb5 | `evans-l14` · Recortada en 12.Cb5. Duda: la continuación de la fuente (12...d5 13.exd5 Axa1 14.Aa3 De5 15.f4 Ad4+ 16.Rh1 De3 17.Cxd4 Dxb3 18.Te1+ Rd8 19.Ae7+ Rd7 20.Cxb3) está mal transcrita en varios puntos y no pude verificarla; solo se menciona 12...d5. |
| Pierce 7.Db3 ... 11.Cc3 Cf6 12.Ab2 / Aa3 / Ag5 | ... 12.Ab2 / 12.Aa3 / 12.Ag5 | descartada: Alternativas que la fuente solo nombra ("suelen acabar en tablas"). |

## Gambito Blackmar-Diemer (`bdg`) · 10 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| 2...e6 / 2...c6 (Francesa / Caro-Kann) | 1.d4 d5 2.e4 e6 / 2...c6 | descartada: Descartadas: son transposiciones a otras aperturas; la fuente solo sugiere usar el repertorio propio contra ellas. |
| 2...Cf6 (PGN) | 1.d4 d5 2.e4 Cf6 | descartada: Descartada: solo aparece en el PGN sin continuación ni comentario. |
| 3...Af5 4.f3 / 3...f5 4.f3 | 3.Cc3 Af5 4.f3 / 3...f5 4.f3 | descartada: Descartadas: solo en el PGN, sin continuación ni idea propia. |
| 4...e3 5.Axe3 | 4.f3 e3 5.Axe3 | descartada: Descartada: la fuente solo dice "si empujan, tomas"; no hay continuación útil. |
| Línea principal 5...e6 (existente) | 4.f3 exf3 5.Cxf3 e6 6.Ad3 ... | descartada: Ya es l02. |
| 5...Af5 6.Ad3 Axd3 7.Dxd3 c6 8.Af4 e6 9.O-O-O | 5.Cxf3 Af5 6.Ad3 Axd3 7.Dxd3 c6 8.Af4 e6 9.O-O-O | `bdg-l05` · Sí, es la línea principal del PGN. |
| 5...Ag4 6.h3 Ah5 7.g4 Ag6 8.Ce5 Cbd7 9.De2 e6 10.h4 Cxe5 11.dxe5 Cd5 12.h5 Cxc3 13.bxc3 | ídem | `bdg-l06` · Sí. La subvariante 8...e6 9.Ag2 c6 10.h4 va como quiz. |
| 5...Ag4 6.Ac4 e6 7.Ae3 Cc6 8.De2 | 6.Ac4 e6 7.Ae3 Cc6 8.De2 | descartada: Descartada: alternativa solo listada en el PGN, sin explicación; se prioriza 6.h3 que el presentador desarrolla. |
| 4...Cc6 5.d5 Ce5 6.fxe4 e6 7.Cf3 Cxf3+ 8.Dxf3 exd5 9.exd5 Ac5 10.Ag5 O-O 11.O-O-O | ídem | `bdg-l07` · Sí. 5.Ae3 se menciona en el quiz. La mejora 7.Dd4 de la partida 1 es de una partida concreta y la posición no queda clara en la transcripción: no se usa. |
| 4...Af5 5.Ag5 (y el orden 4.Ag5 Af5 5.f3) | 4.f3 Af5 5.Ag5 / 4.Ag5 Af5 5.f3 | `bdg-l08` · Sí, una guía para ambos órdenes (llegan a la misma posición). La continuación de la partida 2 no se usa por ser confusa en la transcripción. |
| 4...c5 5.d5 | 4.f3 c5 5.d5 | `bdg-l09` · Sí, aunque la fuente solo da 5.d5 y la idea general; la guía es corta (9 jugadas). |
| 1...Cf6 2.Cc3 d5 3.e4 Cxe4 (Gambito Hübsch) | 1.d4 Cf6 2.Cc3 d5 3.e4 Cxe4 4.Cxe4 dxe4 5.Ac4 | `bdg-l10` · Sí. La transcripción es confusa; reconstruí la línea como el Gambito Hübsch conocido. El plan Dh5, c3, Ae3, O-O-O es el que menciona el presentador. |
| Ataque Jobava-Londres (1...Cf6 2.Cc3 y Af4) | 1.d4 Cf6 2.Cc3 ... Af4 | descartada: Descartada: es otra apertura, solo mencionada de pasada. |
| 5.Dxf3 en el video principal | 4.f3 exf3 5.Dxf3 | `bdg-l11` · El video principal lo desaconseja ("al ordenador no le gusta"); es el Gambito Ryder, cubierto por las guías l11-l14 según la petición del usuario. |
| Ryder 5...a6 6.d5 Ag4 7.Dg3 h5 8.Ag5 Cxd5 9.h3 Cxc3 10.Dxc3 Af5 11.Td1 | ídem | `bdg-l11` · Sí. 8...h4 9.Axh4 solo se menciona en el informe. |
| Ryder 5...a6 6.d5 e5 7.dxe6 Axe6 8.Dxb7 Cbd7 9.Af4 Tb8 10.Dxc7 Dxc7 11.Axc7 Txb2 12.Ad3 | ídem | `bdg-l12` · Sí, con la trampa 12.Axa6? Ab4 como quiz. |
| Ryder 5...Cc6 6.Ab5 Ad7 7.Cge2 (y trampas 6...Dxd4? / 6...a6) | 6.Ab5 Ad7 7.Cge2 / 6...Dxd4 7.Axc6+ bxc6 8.Dxc6+ / 6...a6 7.Axc6+ bxc6 8.Dxc6+ Ad7 9.Dc4 | `bdg-l13` · Sí; las trampas van como paso "move" y quiz. |
| Ryder 5...Dxd4 6.Ae3 Dg4 7.Df2 e5 8.Cf3 | ídem | `bdg-l14` · Sí. La alternativa 7.O-O-O Dxf3 8.Cxf3 va como opción del quiz. |

## Defensa Caro-Kann (`caro-kann`) · 11 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| Avance 3.e5 c5 4.c3 (Botvinnik-Carls) | 1.e4 c6 2.d4 d5 3.e5 c5 4.c3 Cc6 5.Cf3 cxd4 6.cxd4 Ag4 7.Ae2 e6 8.O-O Ce7 ... | `caro-kann-l05` · Línea desarrollada por el presentador. |
| Avance 4.c3: trampa 8.h3 (y 7.h3) | ... 7.Ae2 e6 8.h3 Axf3 9.Axf3 Db6 | `caro-kann-l05` · Integrada como paso "encuentra la jugada" en l05; 7.h3 Axf3 solo mencionada, no tiene guía propia. |
| Avance 4.dxc5 e6 5.Ae3 (gambito) | 4.dxc5 e6 5.Ae3 Cd7 6.Ab5 Ce7 7.c3 a6 8.Axd7+ Axd7 9.Cf3 Cf5 10.Ad4 Cxd4 11.cxd4 b6 12.cxb6 Dxb6 | `caro-kann-l06` · Sí. La subvariante 8.Aa4 Cc6 9.Cf3 Axc5 va como quiz. |
| Avance 4.dxc5 e6 5.a3 | 5.a3 Axc5 6.b4 Ae7 7.Cf3 f6 8.Ab2 a5 9.b5 Cd7 10.Ad3 Ch6 11.O-O Cf7 12.exf6 Axf6 | `caro-kann-l07` · Sí. 11.O-O es una jugada blanca de relleno (la fuente no la precisa). |
| Clásica 3.Cc3/3.Cd2 dxe4 4.Cxe4 Cf6 5.Cxf6+ exf6 (Tartakower) con 6.Cf3 | 6.Cf3 Ad6 7.Ad3 O-O 8.O-O Te8 9.Ae3 Cd7 10.c3 Cf8 11.h3 Ae6 12.Dc2 Dd7 | `caro-kann-l08` · Sí. El sacrificio ...Axh3 se explica como idea, no como línea forzada: la fuente lo basa en una partida propia y no pude verificarlo con motor. Las jugadas blancas 10.c3 y 12.Dc2 son de relleno coherente con el texto. |
| Clásica 5.Cg3 (rechazo) | 5.Cg3 h5 6.h4 Ag4 7.Ae2 e6 8.Cf3 Ad6 | `caro-kann-l08` · Sin guía propia (sideline floja según la fuente); integrada como quiz y paso "move" en l08. |
| Tartakower contra 6.c3, Ad3 y Dc2 (plan ...h5) | 6.c3 Ad6 7.Ad3 O-O 8.Dc2 Te8+ 9.Ce2 h5 10.Ae3 Cd7 11.O-O-O Cf8 12.Rb1 Ae6 13.h3 Ad5 | `caro-kann-l09` · Sí. 6.Ad3 antes de c3 (la fuente dice que cuelga d4) va como quiz. |
| Variante del Cambio | 3.exd5 cxd5 4.Ad3 Cc6 5.Cf3 Ag4 6.c3 e6 7.O-O Ad6 8.Ae3 Cge7 9.Cbd2 h6 10.Te1 O-O 11.Tc1 Dc7 | `caro-kann-l10` · Sí. 9.Cbd2, 10.Te1 y 11.Tc1 son jugadas blancas de relleno (la fuente dice "una jugada cualquiera"). Variante con 5.c3 Dc7 y orden con 2.Cf3: transposiciones, sin guía. |
| Ataque Panov con ...g6 (gambito del fianchetto) | 4.c4 Cf6 5.Cc3 g6 6.cxd5 Ag7 7.Cf3 O-O 8.Ac4 Cbd7 9.O-O Cb6 10.Ab3 Cfxd5 11.Te1 Ag4 12.h3 Axf3 13.Dxf3 e6 | `caro-kann-l11` · Sí. Las subvariantes 10.Db3 Af5 y 11.Cxd5 (con ...Tac8) se resumen en un paso explicativo; no tienen guía propia. |
| Dos Caballos, Mindeno 4.h3 con 6.e5 y trampa 9.Ae3 | 1.e4 c6 2.Cf3 d5 3.Cc3 Ag4 4.h3 Axf3 5.Dxf3 Cf6 6.e5 Cfd7 7.d4 e6 8.Ad3 c5 9.Ae3 Cc6 10.dxc5 Cdxe5 11.Dg3 Cxd3+ 12.cxd3 d4 | `caro-kann-l12` · Sí. La fuente afirma que 9.Ae3 "pierde por completo"; en el texto lo suavicé a "ganas material" en la línea concreta 10.dxc5. |
| Dos Caballos 4.h3 Axf3 5.Dxf3 Cf6 6.d3 | 6.d3 d4 7.Ce2 e6 8.Ag5 Ae7 ... c5, Cc6 | `caro-kann-l12` · Integrada como quiz en l12 para no repetir el mismo planteamiento. |
| Dos Caballos 4.Ae2 / 4.d4 | 4.Ae2 e6 5.O-O Cf6 6.e5 Cfd7 7.d4 ... / 4.d4 e6 ... | descartada: Descartadas: el propio presentador dice que son "muy parecidas" a la línea con h3 (mismo plan ...Cf6, ...Cfd7, ...c5). |
| Fantasía 3.f3 Db6 con 6.dxe5 Ae6 | 3.f3 Db6 4.Cc3 dxe4 5.fxe4 e5 6.dxe5 Ae6 7.Cf3 Cd7 8.Ad3 Ce7 9.De2 Cg6 10.Ae3 Da5 11.O-O-O Cdxe5 | `caro-kann-l13` (recortada a 18 jugadas) · Sí. El orden exacto de 9.De2/10.Ae3 y los enroques está reconstruido desde la narración (la fuente es imprecisa). |
| Fantasía 6.Cf3 exd4 | 6.Cf3 exd4 7.Dxd4 Dxd4 8.Cxd4 Ac5 9.Cb3 Ad6 / 7.Cxd4 Cf6 8.Ac4 Ag4 9.Dd3 Cbd7 10.Af4 O-O-O | `caro-kann-l13` (recortada a 18 jugadas) · Integrada como quiz en l13. |
| Fantasía 3...dxe4 4.fxe4 e5 (teoría principal) | 3.f3 dxe4 4.fxe4 e5 | descartada: Descartada: el presentador la menciona solo para desaconsejarla por ser muy afilada. |
| Gambito Hillbilly 2.Ac4 | 2.Ac4 d5 3.Ab3 dxe4 4.Dh5 g6 5.Dh4 Cf6 6.Cc3 Af5 7.f3 exf3 8.Cxf3 Ag7 | `caro-kann-l14` · Sí. 3.exd5 cxd5 (mala para las blancas) y 5.De5/5.De2 solo mencionadas. |
| Gambito Rasa-Studier 4.f3 | 3.Cc3 dxe4 4.f3 exf3 5.Cxf3 Af5 6.Ac4 Cf6 7.O-O e6 8.Ce5 Ag6 9.Af4 Ad6 | `caro-kann-l15` · Sí, con la trampa 8...Ae7? 9.Txf5 exf5 10.Cxf7 como quiz. |
| Clásica principal 4...Af5 (línea existente) | 3.Cc3 dxe4 4.Cxe4 Af5 ... | descartada: No aparece en la fuente (que recomienda 4...Cf6); ya es l02. |

## Ruy López (`ruy-lopez`) · 0 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| Berlinesa 4.O-O Cxe4 5.d4 Cd6 6.dxe5 (caballo atrapado) | 1.e4 e5 2.Cf3 Cc6 3.Ab5 Cf6 4.O-O Cxe4 5.d4 Cd6 6.dxe5 Cxb5 7.Ag5 Ae7 8.Axe7 Dxe7 9.a4 Cbd4 10.Cxd4 Cxd4 11.Dxd4 O-O 12.Cc3 | `ruy-lopez-l05` · Línea central del vídeo. Se usa la rama 10...Cxd4 (la que la fuente llama mejor); la idea de ...d6 y Tad1 va en un explain. |
| Berlinesa 10...Cxe5 11.f4 y Te1 | ... 10.Cxd4 Cxe5 11.f4 Cc6 12.Te1 | descartada: Descartada: la fuente dice que la clavada gana, pero las negras pueden enrocar (f8 y g8 están libres) y la afirmación no se sostiene. |
| Berlinesa 10...O-O 11.Cb5 Dxe5 12.Te1 Dxb2 13.Cc3 | ... 10.Cxd4 O-O 11.Cb5 Dxe5 12.Te1 Dxb2 13.Cc3 Db4 14.Cd5 Da5 15.Cbxc7 | descartada: Descartada: transcripción confusa y la supuesta captura de la dama con Tb1 no es forzada (la dama escapa por b4). No verificable sin motor. |
| Berlinesa 5...exd4 6.Te1 d5 7.Cxd4 Ad6 | 1.e4 e5 2.Cf3 Cc6 3.Ab5 Cf6 4.O-O Cxe4 5.d4 exd4 6.Te1 d5 7.Cxd4 Ad6 8.Cxc6 Axh2+ 9.Rh1 Dh4 10.Txe4+ dxe4 11.Dd8+ Dxd8 12.Cxd8+ Rxd8 13.Rxh2 | `ruy-lopez-l06` · Línea teórica conocida. La fuente dice "final con un peón menos pero mejor"; el texto evita valorar el material y habla de rey en el centro y peón de e4 débil. |
| Berlinesa 5...exd4 6.Te1 f5 | ... 5...exd4 6.Te1 f5 7.Cxd4 Cxd4 8.Dxd4 c6 9.f3 | descartada: Solo se menciona en el explain de l06: la fuente la trata como la opción débil y la secuencia está poco clara. |
| Berlinesa 7.Ag5 f6 8.exf6 gxf6 9.Te1+ | ... 6.dxe5 Cxb5 7.Ag5 f6 8.exf6 gxf6 9.Te1+ Rf7 10.Dd5+ Rg7 11.Ad2 Cbd6 12.Dh5 | descartada: Descartada: sacrificio de pieza con afirmaciones de motor ("ventaja ligera") que no puedo comprobar; la rama 9...Ab7 de la transcripción no tiene sentido (sería ...Ae7). |
| Berlinesa 4...Ac5 5.Cxe5 Cxe5 6.d4 | 1.e4 e5 2.Cf3 Cc6 3.Ab5 Cf6 4.O-O Ac5 5.Cxe5 Cxe5 6.d4 Axd4 7.Dxd4 Cc6 8.Axc6 dxc6 9.Dxd8+ Rxd8 10.Cc3 | `ruy-lopez-l07` · Reconstruida de la transcripción ("cae el caballo atrás, este cambio, Cc3"). Ag5 y e5 como ideas. |
| Berlinesa 4...d6 5.Te1 Ad7 6.c3 Ae7 7.d4 O-O | 1.e4 e5 2.Cf3 Cc6 3.Ab5 Cf6 4.O-O d6 5.Te1 Ad7 6.c3 Ae7 7.d4 O-O 8.h3 | descartada: Descartada como guía propia: mismo plan (c3-d4, h3, Cd2-f1-g3) que la Steinitz antigua (l12) y la línea principal cerrada. |
| Berlinesa 4...a6 5.Axc6 dxc6 6.Cxe5 | ... 4...a6 5.Axc6 dxc6 6.Cxe5 Dd4 7.Cf3 Dxe4 8.Te1 | descartada: Descartada: la fuente dice que la dama queda clavada y perdida, pero las negras interponen ...Ae6 o ...Ae7. Error de la fuente. |
| Morphy 5.d4 exd4 6.O-O Ae7 7.e5 Ce4 8.Cxd4 O-O 9.Te1 Cc5 10.Cf5 | 1.e4 e5 2.Cf3 Cc6 3.Ab5 a6 4.Aa4 Cf6 5.d4 exd4 6.O-O Ae7 7.e5 Ce4 8.Cxd4 O-O 9.Te1 Cc5 10.Cf5 Cxa4 11.Dg4 g6 12.Cxe7+ Dxe7 13.Dxa4 | `ruy-lopez-l08` · La línea pasa de 24 jugadas, así que 13.Dxa4 es un paso move. Las subvariantes 13...d6 14.Ah6 y Dh4 no se incluyen. |
| Morphy 7...Cd5 8.Ab3 Cb6 9.Te1 | ... 6.O-O Ae7 7.e5 Cd5 8.Ab3 Cb6 9.Te1 O-O 10.Cxd4 Cxd4 11.Dxd4 d6 12.exd6 Axd6 13.Af4 | descartada: Descartada como guía: es una rama secundaria sin idea táctica propia (más espacio y desarrollo normal). |
| Morphy 6...Cxe4 7.Te1 | ... 5.d4 exd4 6.O-O Cxe4 7.Te1 | descartada: Transposición a la Berlinesa con ...a6/Aa4 incluidas, como dice la propia fuente. |
| Morphy 6...Ac5 7.e5 Cd5 8.Ab3 Cb6 9.Cg5 | 1.e4 e5 2.Cf3 Cc6 3.Ab5 a6 4.Aa4 Cf6 5.d4 exd4 6.O-O Ac5 7.e5 Cd5 8.Ab3 Cb6 9.Cg5 O-O 10.Dh5 | `ruy-lopez-l09` · Trampa clara. La defensa 8...Ce7 va en un explain. |
| Morphy 6...Ac5 ... 8...Ce7 9.Te1 O-O 10.Ag5 / c3 | ... 8.Ab3 Ce7 9.Te1 O-O 10.c3 | descartada: Mencionada en el explain de l09; la fuente no da una secuencia concreta. |
| Morphy 6...b5 7.Ab3 (Cg5, ...Ce5 f4) | ... 6.O-O b5 7.Ab3 d6 8.Cg5 / 7...Ce5 8.f4 Cc4 9.e5 | descartada: Descartada: secuencias incompletas y sacrificios sin comprobación; la fuente la trata como rama menor. |
| Variante Clásica 3...Ac5 4.c3 Cf6 5.d4 exd4 6.cxd4 Ab4+ 7.Rf1 | 1.e4 e5 2.Cf3 Cc6 3.Ab5 Ac5 4.c3 Cf6 5.d4 exd4 6.cxd4 Ab4+ 7.Rf1 O-O 8.Db3 a5 9.a3 Ae7 10.Cc3 | `ruy-lopez-l10` · Incluye la trampa 7...Cxe4 8.d5 Ce7 9.Dd4 como paso move. |
| Clásica 6...Ab6 7.e5 / 4...d6, ...b6, ...a6 y ...Ad7 con Rf1 | ... 6.cxd4 Ab6 7.e5 Cd5 8.O-O / 7.Rf1 Ad7 8.Da4 | descartada: Ramas menores tras 6.cxd4; la fuente las resume en una frase cada una y algunas están mal transcritas. |
| Clásica 4...a6 / 4...De7 / ...Dg5 tras Axc6 | ... 4.c3 a6 5.Axc6 dxc6 6.Cxe5 | descartada: Descartada: mencionada de pasada sin secuencia completa. |
| Variante Caro 3...a6 4.Aa4 b5 5.Ab3 Cf6 6.d4 Cxe4 7.dxe5 Cc5 8.Ad5 | 1.e4 e5 2.Cf3 Cc6 3.Ab5 a6 4.Aa4 b5 5.Ab3 Cf6 6.d4 Cxe4 7.dxe5 Cc5 8.Ad5 Ab7 9.O-O Ae7 10.Cc3 | `ruy-lopez-l11` · 9...Ae7 se añade como jugada natural para enlazar con Cc3, que la fuente menciona. |
| Caro 5...Ca5 6.O-O | ... 5.Ab3 Ca5 6.O-O Cxb3 7.axb3 d6 8.d4 | descartada: Descartada: rama menor sin idea táctica propia. |
| Caro 6...exd4 7.O-O / 6...Cxd4 7.Cxd4 exd4 8.e5 / 6...d6 | ... 6.d4 exd4 7.O-O Ac5 8.e5 Cg4 / 6...Cxd4 7.Cxd4 exd4 8.e5 Cg8 9.Df3 / 6...d6 7.dxe5 dxe5 8.Dxd8+ Cxd8 9.Cxe5 | descartada: Descartadas por número de guías y porque la fuente da valoraciones dudosas ("ganando por completo") en secuencias incompletas. |
| Steinitz antigua 3...d6 4.d4 exd4 5.Cxd4 Ad7 6.Cc3 Cxd4 | 1.e4 e5 2.Cf3 Cc6 3.Ab5 d6 4.d4 exd4 5.Cxd4 Ad7 6.Cc3 Cxd4 7.Axd7+ Dxd7 8.Dxd4 Cf6 9.Af4 Ae7 10.O-O-O | `ruy-lopez-l12` · 9...Ae7 es una jugada natural añadida para poder enrocar largo. La rama 4...Ad7 5.Cc3 a6 va en un explain. |
| Steinitz antigua 4...Ad7 5.Cc3 Cf6 6.Axc6 Axc6 7.Dd3 | ... 4.d4 Ad7 5.Cc3 Cf6 6.Axc6 Axc6 7.Dd3 Ae7 8.dxe5 dxe5 9.Dxd8+ Txd8 10.Cxe5 | descartada: Descartada como guía propia: misma idea de ganar e5 que el explain de l12. |
| Variante Bird 3...Cd4 4.Cxd4 exd4 5.O-O c6 6.Ac4 d5 | 1.e4 e5 2.Cf3 Cc6 3.Ab5 Cd4 4.Cxd4 exd4 5.O-O c6 6.Ac4 d5 7.exd5 cxd5 8.Ab5+ Ad7 9.Te1+ Ae7 10.Dg4 Axb5 11.Dxg7 | `ruy-lopez-l13` · Trampa verificada: el alfil de e7 está clavado y no puede ir a f6. |
| Bird 5...c6 6.Ac4 b5 | ... 6.Ac4 b5 7.Ab3 a5 8.a4 b4 9.Te1 | descartada: Descartada: rama menor sin idea táctica propia. |
| Schliemann 3...f5 4.d3 fxe4 5.dxe4 Cf6 6.O-O Ac5 7.Dd3 | 1.e4 e5 2.Cf3 Cc6 3.Ab5 f5 4.d3 fxe4 5.dxe4 Cf6 6.O-O Ac5 7.Dd3 d6 8.Dc4 Ad7 9.Axc6 Axc6 10.Cxe5 Axf2+ 11.Txf2 dxe5 12.Cc3 | `ruy-lopez-l14` · Se usa la rama 8...Ad7. La rama 8...De7 9.Cc3 Ae6 10.Cd5 de la fuente es dudosa (tras ...Axc4 se cambian damas), así que solo se menciona el plan. |
| Schliemann 6...Cxe4 7.Te1 | ... 5.dxe4 Cf6 6.O-O Cxe4 7.Te1 Cf6 8.Axc6 | descartada: Descartada: la fuente solo dice "no es bueno" sin desarrollar. |
| Schliemann 4...Cf6 5.exf5 d6 6.d4 e4 7.d5 | ... 4.d3 Cf6 5.exf5 d6 6.d4 e4 7.d5 ... | descartada: Descartada: la transcripción es incoherente (repite d5 y mezcla capturas); no se puede reconstruir una línea fiable. |
| Defensa Cozio 3...Cge7 4.Cc3 a6 5.Aa4 b5 6.Ab3 Cg6 7.d4 | 1.e4 e5 2.Cf3 Cc6 3.Ab5 Cge7 4.Cc3 a6 5.Aa4 b5 6.Ab3 Cg6 7.d4 exd4 8.Cxd4 Cxd4 9.Dxd4 c5 10.Axf7+ Rxf7 11.Dd5+ | `ruy-lopez-l15` · Trampa clara y comprobada. |
| Cozio 6...d6 7.Cg5 d5 8.Cxd5 / 6...h6 7.d4 ... a4 | ... 6.Ab3 d6 7.Cg5 d5 8.Cxd5 / 6...h6 7.d4 exd4 8.Cxd4 Cxd4 9.Dxd4 d6 10.a4 | descartada: Descartadas: ideas sueltas sin secuencia completa ("hígado frito") o planes lentos. |
| Cozio 4...g6 5.d4 Ag7 / 5...exd4 6.Cd5 | ... 4.Cc3 g6 5.d4 Ag7 6.dxe5 Cxe5 7.Cxe5 Axe5 8.Df3 / 5...exd4 6.Cd5 Ag7 7.Ag5 h6 8.Af6 | descartada: Descartadas por límite de guías y porque la fuente no da jugadas negras claras en varios puntos. |

## Variante Rossolimo (`rossolimo`) · 9 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| 3...g6 4.Axc6 dxc6 5.d3 (Cbd2-c4 o e5) | 1.e4 c5 2.Cf3 Cc6 3.Ab5 g6 4.Axc6 dxc6 5.d3 | descartada: Es la línea principal existente (l02); la fuente añade la idea Cbd2-c4 y que d3 frena ...c4, sin línea nueva. |
| 3...g6 4.O-O Ag7 5.c3 Cf6 6.Te1 O-O 7.d4 | 1.e4 c5 2.Cf3 Cc6 3.Ab5 g6 4.O-O Ag7 5.c3 Cf6 6.Te1 O-O 7.d4 cxd4 8.cxd4 d5 9.e5 Ce4 10.Cc3 Cxc3 11.bxc3 | `rossolimo-l05` · La fuente nombra también 10...Af5 y 10...Ag4 ("muy teórica") sin desarrollarlas; no hay material para guías propias. |
| 3...g6 ... 6...e5 7.d4 | 1.e4 c5 2.Cf3 Cc6 3.Ab5 g6 4.O-O Ag7 5.c3 Cf6 6.Te1 e5 7.d4 cxd4 8.cxd4 exd4 9.Af4 | `rossolimo-l06` · Fiabilidad dudosa: la fuente dice "si cxd4, cxd4; si exd4, Af4" sin precisar el orden. Se interpretó como 7...cxd4 8.cxd4 exd4 9.Af4 (gambito de peón con idea Ca3-c4-d6). Revisar con motor. |
| 3...e6 4.O-O Cge7 5.Te1 a6 6.Af1 | 1.e4 c5 2.Cf3 Cc6 3.Ab5 e6 4.O-O Cge7 5.Te1 a6 6.Af1 | `rossolimo-l07` · La continuación c3/d4, cxd4 Cxd4 y e5, y la idea ...Dc7 Cc3, quedan en los pasos explicativos (la fuente no da jugadas negras concretas). |
| 3...d6 4.O-O Ad7 5.Te1 Cf6 6.c3 | 1.e4 c5 2.Cf3 Cc6 3.Ab5 d6 4.O-O Ad7 5.Te1 Cf6 6.c3 | `rossolimo-l08` · Línea corta: la fuente solo da el esquema. |
| 3...d6 4.O-O Ag4 5.h3 Ah5 6.c3 | 1.e4 c5 2.Cf3 Cc6 3.Ab5 d6 4.O-O Ag4 5.h3 Ah5 6.c3 | `rossolimo-l09` · Idea distinta (h3 contra la clavada). |
| Sacrificio temporal de peón (la fuente dice "d5") | 1.e4 c5 2.Cf3 Cc6 3.Ab5 e5 4.Axc6 dxc6 5.Cxe5 Dd4 6.Cf3 Dxe4+ 7.De2 | `rossolimo-l10` · La transcripción dice "d5" y "...De7", pero describe Axc6 dxc6 Cxe5 y la dama recuperando el peón: eso exige ...e5. Se usó la forma correcta conocida 5...Dd4 (ataca e5, e4 y f2). Revisar. |
| 3...Ca5 4.c3 a6 5.Aa4 b5 6.Ac2 | 1.e4 c5 2.Cf3 Cc6 3.Ab5 Ca5 4.c3 a6 5.Aa4 b5 6.Ac2 Ab7 7.d4 | `rossolimo-l11` |
| 3...Db6 4.Cc3 | 1.e4 c5 2.Cf3 Cc6 3.Ab5 Db6 4.Cc3 a6 5.Axc6 Dxc6 6.O-O b5 7.d4 | `rossolimo-l12` · La fuente menciona una transposición a la Paulsen con un tiempo de retraso para las negras. |
| 3...Cf6 4.Cc3 | 1.e4 c5 2.Cf3 Cc6 3.Ab5 Cf6 4.Cc3 g6 5.O-O | `rossolimo-l13` · La fuente solo indica 4.Cc3 y las respuestas ...g6 / ...Dc7; el enroque se añade por su regla general ("enroque prioritario"). |
| Otras segundas jugadas negras (Benoni/Pelícano, Dragón acelerado, Clásica, Scheveningen, Najdorf) | 2...d6 / 2...e6 / ... | descartada: Solo se mencionan como lo que la Rossolimo evita; no son líneas del curso. |

## Variante Alapin (`alapin`) · 10 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| 2...Cf6 con 9...dxc3 10.Cg5 | 1.e4 c5 2.c3 Cf6 3.e5 Cd5 4.d4 cxd4 5.Cf3 Cc6 6.Ac4 Cb6 7.Ab3 d5 8.exd6 Dxd6 9.O-O dxc3 10.Cg5 e6 11.Dh5 De7 12.Cxc3 | `alapin-l05` · Línea principal del PGN y de la transcripción. |
| 2...Cf6 con 9...Ae6 10.Ca3 | ... 9.O-O Ae6 10.Ca3 dxc3 11.De2 Axb3 12.Cb5 Db8 13.axb3 e6 14.g3 Dc8 15.Cg5 | `alapin-l06` · La línea pasaría de 24 jugadas: la guiada llega hasta 12.Cb5 y el resto se muestra en un paso explain. Incluye 10...Axb3 11.Dxb3 como quiz. |
| 2...Cf6 con 4...e6 | 1.e4 c5 2.c3 Cf6 3.e5 Cd5 4.d4 e6 5.Cf3 cxd4 6.cxd4 d6 7.Ac4 Cc6 8.O-O Ae7 9.De2 | `alapin-l07` · Variante del PGN; plan Td1, Ad2 y Cc3 tomado de la transcripción. |
| 2...Cf6 con 6...e6 7.Axd5 | ... 5.Cf3 Cc6 6.Ac4 e6 7.Axd5 exd5 8.cxd4 d6 9.O-O | `alapin-l08` · Sale de la partida 2 y del comentario final del presentador (8...d6, enroque y De2). 8...d6 9.O-O es la continuación que él menciona. |
| 2...d5 con 5.Ca3 Cc6 6.Ac4 y 8.Db3 | 1.e4 c5 2.c3 d5 3.exd5 Dxd5 4.Cf3 Cf6 5.Ca3 Cc6 6.Ac4 Dd8 7.O-O Ag4 8.Db3 | `alapin-l09` · Línea del PGN. La transcripción sugiere ...Axf3 Axf7+ Rd7 como algo demoledor; el texto solo dice que el rey queda expuesto. |
| 2...d5 con 5...e6 y 7.Cb5 | ... 5.Ca3 e6 6.d4 cxd4 7.Cb5 Ca6 8.Dxd4 Dxd4 9.Cfxd4 Ae7 10.Af4 | `alapin-l10` · Línea del PGN. |
| 2...d5 con 5...Ag4 y 8.Da4 | ... 5.Ca3 Ag4 6.Ae2 Cc6 7.O-O e6 8.Da4 Ae7 9.Cc4 O-O 10.Ce3 Dh5 11.Cxg4 Cxg4 | `alapin-l11` · Línea del PGN. |
| 2...d5 con 5...Ag4 y 8.d4 cxd4 9.Cb5 | ... 7.O-O e6 8.d4 cxd4 9.Cb5 Dd8 10.Cbxd4 Cxd4 11.Cxd4 Axe2 12.Dxe2 | `alapin-l12` · El PGN solo da 8.d4; la continuación es la que explica el presentador en la teoría ("Cb5, vuelven, y entonces capturas") y en la revisión de la partida 1. |
| 2...Cc6 | 1.e4 c5 2.c3 Cc6 3.d4 cxd4 4.cxd4 d5 5.exd5 Dxd5 6.Cf3 Ag4 7.Ae2 O-O-O 8.Cc3 Da5 9.Ae3 e6 10.O-O | `alapin-l13` · Línea del PGN. Incluye como explain/move la trampa de la transcripción 4...g6? 5.d5 Ce5 6.f4. |
| 2...d6 | 1.e4 c5 2.c3 d6 3.d4 cxd4 4.cxd4 Cf6 5.Cc3 g6 6.Cf3 Ag7 7.Ae2 O-O 8.O-O | `alapin-l14` · Línea del PGN; comparte guía con 2...g6 (ambas son respuestas lentas con la misma idea). |
| 2...g6 | 1.e4 c5 2.c3 g6 3.d4 cxd4 4.cxd4 d5 5.e5 | `alapin-l14` · Línea corta del PGN; segunda línea guiada de la misma lección. |
| 2...Cf6 3.e5 Cd5 4.d4 Cc6 | 1.e4 c5 2.c3 Cf6 3.e5 Cd5 4.d4 Cc6 | descartada: El presentador solo dice que "capturas y el caballo queda colgando, después c4"; sin continuación concreta. |
| 2...Cc6 ... 4...d6 5.d5 | 1.e4 c5 2.c3 Cc6 3.d4 cxd4 4.cxd4 d6 | descartada: Se menciona que d5 es menos bueno y que basta con Cc3; idea integrada en las guías de centro, sin línea propia. |
| Trampa Cb5/...Ad6/c4 (dama atrapada) | (posiciones de 5...Ag4 con Cb5) | descartada: Idea suelta de la partida 1 sin posición concreta fiable; no se convierte en guía. |
| Siciliana cerrada (Cc3, g3, Ag2) | 1.e4 c5 2.Cc3 | descartada: Solo se nombra como alternativa a la Alapin; no es una línea de esta apertura. |
| Partidas 1 y 2 de suscriptores | - | descartada: La 1 ilustra 5...Ag4 (usada en alapin-l12, quiz sobre el orden de jugadas); la 2 ilustra 6...e6 (alapin-l08). No se hace guía por partida. |

## Gambito de dama (`queens-gambit`) · 18 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| Aceptado 3.e4 b5 4.a4 | 1.d4 d5 2.c4 dxc4 3.e4 b5 4.a4 c6 5.axb5 cxb5 6.Cc3 Ad7 7.d5 e6 8.dxe6 fxe6 9.Cxb5 Axb5 10.Dh5+ g6 11.Dxb5+ | `queens-gambit-l05` · Línea desarrollada con trampa (Dh5+). La fuente exagera ("completamente ganado"); los textos dicen "suele". |
| Aceptado 3...b5: 6...b4 y 7...a6/8...e6 con d6 | 6...b4 7.Da4/Cb5; 7...a6 8.Cf3 e6 9.d6 | descartada: Ramas secundarias de la misma idea (castigar b5 y el alfil de d7); se resumen en el paso explicativo de l05. |
| Aceptado 3.e4 e6 con ...c5 (también 3...Cf6/3...Cc6) | 1.d4 d5 2.c4 dxc4 3.e4 e6 4.Axc4 Cf6 5.Cc3 c5 6.d5 exd5 7.Cxd5 Cxd5 8.Axd5 Ae7 9.Cf3 O-O 10.O-O | `queens-gambit-l06` · La fuente dice que 3...Cf6 y 3...Cc6 son muy parecidas; no merecen guía aparte. |
| Aceptado 3...e6 5...Ae7 6.e5 Cd5 7.Dg4 (trampa Ah6) | 5...Ae7 6.e5 Cd5 7.Dg4 O-O 8.Ah6 g6 9.Axf8 | `queens-gambit-l06` · Incluida como paso explicativo con play dentro de l06 (misma apertura 3...e6). |
| Aceptado 3...e6 5...Ab4 6.e5 Cd5 7.Cge2 ... 9.Db3 Axc3 10.bxc3 Cc6 11.Aa3 | 5...Ab4 6.e5 Cd5 7.Cge2 O-O 8.O-O c5 9.Db3 Axc3 10.bxc3 Cc6 11.Aa3 | descartada: Descartada: variante menor de 3...e6 con el mismo plan (e5 y desarrollo); para no saturar el curso. |
| Aceptado 3...e5 4.Cf3 exd4 5.Axc4 Cc6 6.O-O Ae6 7.Cbd2 | 1.d4 d5 2.c4 dxc4 3.e4 e5 4.Cf3 exd4 5.Axc4 Cc6 6.O-O Ae6 7.Cbd2 Cf6 8.Db3 Axc4 9.Cxc4 b6 10.Te1 | `queens-gambit-l07` · El autor reconoce que 7.Cbd2 es rara; 9...b6 es su ejemplo, poco natural. Textos prudentes. |
| Aceptado 3...e5 5...c5 6.Ce5 | 5...c5 6.Ce5 Ae6 7.Axe6 fxe6 8.Dh5+ | `queens-gambit-l07` · Recogida como quiz en l07. |
| Aceptado 3...e5 4...exd4 5.Axc4 Cf6 (y 6.e5) | 5...Cf6 6.e5 Cd5 7.Dxd4 ... Df4 | descartada: Descartada: transposición con poca idea nueva respecto a l07. |
| Clavada 4...Ag4 y 6...Ag4 7.Db3 | 4...Ag4 5.Axc4 exd4 6.Axf7+ Rxf7 7.Ce5+ Re8 8.Dxg4; 4...exd4 5.Axc4 Cc6 6.O-O Ag4 7.Db3 Axf3 8.Axf7+ Re7 9.De6# | `queens-gambit-l08` · Dos trampas con el mismo motivo; la segunda como paso move. La línea 7...Dd7 8.Axf7+ se omite (poco clara en la fuente). |
| Cambio 4...Cxd5 5.e4 | 1.d4 d5 2.c4 e6 3.Cc3 Cf6 4.cxd5 Cxd5 5.e4 Cxc3 6.bxc3 c5 7.Cf3 cxd4 8.cxd4 Ab4+ 9.Ad2 Axd2+ 10.Dxd2 O-O 11.Ac4 Cd7 12.O-O | `queens-gambit-l09` · La subvariante 6...Ae7 7.Cf3 8.Ad3 se omite (mismo plan). |
| Cambio 4...exd5 5.Ag5: plan f3-e4 | 1.d4 d5 2.c4 e6 3.Cc3 Cf6 4.cxd5 exd5 5.Ag5 Ae7 6.e3 O-O 7.Ad3 c6 8.Dc2 h6 9.Ah4 Cbd7 10.Cge2 Te8 11.O-O Cf8 12.f3 | `queens-gambit-l10` · Incluye la trampa 7...b6? 8.Axf6 Axf6 9.Dh5 como explain + move. |
| Cambio: 7...h6/...g5, 7...c5 8.dxc5 (enroque largo), 7...Cbd7 8.Cge2, 8...Ce4 y 10...f5 | varias | descartada: Subvariantes del mismo plan del Cambio; se descartan para no repetir l10 (las ideas f3/e4/h3 ya están en sus pasos). |
| Tarrasch 3...c5 4.cxd5 exd5 5.Cf3 Cc6 6.dxc5 d4 7.Ca4 | 1.d4 d5 2.c4 e6 3.Cc3 c5 4.cxd5 exd5 5.Cf3 Cc6 6.dxc5 d4 7.Ca4 | `queens-gambit-l11` · La continuación posterior de la fuente (Ab2, Tc1, Ac3) es confusa: hay jugadas imposibles en su orden (Ab2 sin b3). Se corta en 7.Ca4. |
| Tarrasch 4...cxd4 5.Da4+ (Gambito Schara) | 1.d4 d5 2.c4 e6 3.Cc3 c5 4.cxd5 cxd4 5.Da4+ Ad7 6.Dxd4 exd5 7.Dxd5 Cc6 8.Cf3 Cf6 9.Db3 Ac5 10.Ag5 h6 11.Axf6 Dxf6 12.e3 | `queens-gambit-l12` · Idea distinta (jaque en a4 y peón de más). |
| Transposición a la Nimzoindia 3...Ab4 4.e3 | 1.d4 d5 2.c4 e6 3.Cc3 Ab4 4.e3 Cf6 5.a3 Axc3+ 6.bxc3 O-O 7.cxd5 exd5 8.Ad3 Cc6 9.Ce2 b6 10.O-O Ab7 11.Cg3 Te8 12.f3 | `queens-gambit-l13` · 7...Cxd5 8.Ad3 Cxc3 9.Dc2 va como quiz. 4...Axc3+ (idea Aa3) y 8...c5 se omiten por ser secundarias. |
| Gambito Marshall 3...c6 4.e4 dxe4 5.Cxe4 Ab4+ 6.Ad2 Dxd4 7.Axb4 Dxe4+ 8.Ae2 Dxg2 | 1.d4 d5 2.c4 e6 3.Cc3 c6 4.e4 dxe4 5.Cxe4 Ab4+ 6.Ad2 Dxd4 7.Axb4 Dxe4+ 8.Ae2 Dxg2 9.Af3 Dg6 10.Ce2 | `queens-gambit-l14` · El propio autor admite que el motor lo da igualado. Textos sin valoraciones de ventaja. |
| Marshall: 8...Cd7 y 8...Ca6 9.Aa5 (b6 / Ad7, enroques opuestos) | 8...Ca6 9.Aa5 b6 10.Dd6 ... / 9...Ad7 10.Ac3 f6 11.O-O-O O-O-O ... | descartada: Descartadas: ramas largas, muy tácticas y poco fiables en la fuente. |
| Marshall: 4...Cf6 y 4...Ab4 (estructura francesa, sacrificio griego) | 4...Cf6 5.cxd5 cxd5/exd5 6.e5; 4...Ab4 5.cxd5 exd5 6.e5 ... Axh7+ | descartada: Descartadas: la fuente es ambigua sobre la recaptura en d5 y son errores negros sin línea clara. 4...dxe4 5.Cxe4 Cf6 va como quiz en l14. |
| Eslava 3.Cc3 Af5 4.Db3 (y 4.e3 Af5 5.Db3) | 1.d4 d5 2.c4 c6 3.Cc3 Af5 4.Db3 Db6 5.cxd5 Dxb3 6.axb3 cxd5 7.Cxd5 | `queens-gambit-l15` · La versión con 3...Cf6 4.e3 Af5 5.Db3 tiene la misma idea; no se duplica. |
| Eslava 3...e6 (transpone al Marshall) | 3...e6 4.e4 | descartada: Transposición pura a l14. |
| Gambito eslavo 3...dxc4 4.e4 b5 5.a4 b4 6.Ca2 | 1.d4 d5 2.c4 c6 3.Cc3 dxc4 4.e4 b5 5.a4 b4 6.Ca2 Cf6 7.e5 Cd5 8.Axc4 e6 9.Cf3 Ae7 10.Ad2 a5 11.O-O O-O 12.Cc1 | `queens-gambit-l16` · La fuente duda en el orden Ad2/enroque; se usa Ad2 antes de enrocar, que es coherente con su explicación. 5...Ad7 transpone a l05; 6...a5 se omite. |
| Semieslava: ataque Shabalov 7.g4 Cxg4 | 1.d4 d5 2.c4 c6 3.Cc3 Cf6 4.e3 e6 5.Cf3 Cbd7 6.Dc2 Ad6 7.g4 Cxg4 8.Tg1 Cxh2 9.Cxh2 Axh2 10.Txg7 Df6 11.Tg2 Ad6 12.e4 | `queens-gambit-l17` · El autor la llama "dudosa pero divertida". La retirada 11...Ad6 no la concreta la fuente ("el alfil vuelve"); se eligió Ad6. |
| Shabalov 7...h6 8.Tg1 e5 9.cxd5 cxd5 10.Cb5 Ab8 11.g5 | 7...h6 8.Tg1 e5 9.cxd5 cxd5 10.Cb5 Ab8 11.g5 hxg5 12.Cxg5 e4 13.Ad2 | descartada: Descartada: rama larga y dudosa; se prioriza la aceptación del peón. |
| Defensa Marshall 2...Cf6 3.cxd5 | 1.d4 d5 2.c4 Cf6 3.cxd5 Cxd5 4.e4 Cb6 5.Cc3 | `queens-gambit-l18` · La fuente solo dice que el caballo se retira; se eligió Cb6. 3...Dxd5 y 3...e5 van como quiz. 3...e6 4.Cf3 5.Af4 se omite (poco concreta). |
| Contragambito Albin 2...e5 (con blancas) | 1.d4 d5 2.c4 e5 3.dxe5 d4 4.Cf3 Cc6 5.a3 Ag4 6.Cbd2 Cge7 7.Cb3 Axf3 8.gxf3 Cxe5 9.Cxd4 | `queens-gambit-l19` · La fuente dice "recapturar con peón" sin precisar; se eligió gxf3. El final (cambio de damas, Ae3) es confuso y se corta en 9.Cxd4. |
| Albin 4...c5 5.e3 y 5...a5 6.e3 | 4...c5 5.e3 Cc6 6.exd4 7.Ad3; 5...a5 6.e3 Ac5 7.exd4 Axd4 8.Ae3 | descartada: Descartadas: ramas secundarias con el mismo plan (e3 una vez evitado el jaque). |
| Defensa austriaca 2...c5 3.cxd5 | 1.d4 d5 2.c4 c5 3.cxd5 Dxd5 4.Cf3 cxd4 5.Cc3 Da5 6.Cxd4 e5 7.Cb3 Dc7 8.e4 | `queens-gambit-l20` · La transcripción dice "Cc3" dos veces; la primera es claramente Cf3 (defiende d4). La retirada 5...Da5 se eligió por coherencia con 7.Cb3 y ...Dc7. |
| Austriaca 3...cxd4 4.Dxd4 | 3...cxd4 4.Dxd4 | descartada: Descartada: simple peón de más sin idea nueva. |
| Defensa báltica 2...Af5 3.Db3 e6 4.Dxb7 Cd7 5.c5 | 1.d4 d5 2.c4 Af5 3.Db3 e6 4.Dxb7 Cd7 5.c5 e5 6.e3 | `queens-gambit-l21` · La sugerencia posterior de la fuente "Ab2" es imposible con la dama en b7; se omite. |
| Báltica 3...b6 y 3...dxc4 | 3...b6 4.cxd5; 3...dxc4 4.Dxb7 Cd7 5.Cc3 e6 6.e4 Ag6 7.Dxc4 | descartada: Descartadas: variantes menores con el mismo motivo (Db3 contra b7). |
| Defensa Chigorin 2...Cc6 3.Cc3 dxc4 4.d5 | 1.d4 d5 2.c4 Cc6 3.Cc3 dxc4 4.d5 Ce5 5.f4 Cg6 6.e4 | `queens-gambit-l22` · La línea con 3...Cf6 4.Cf3 e6 5.Ag5 va como quiz. |

## Gambito de rey (`kings-gambit`) · 13 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| Clásica 3...g5 4.h4 f6 (trampa Cxg5) | 1.e4 e5 2.f4 exf4 3.Cf3 g5 4.h4 f6 5.Cxg5 fxg5 6.Dh5+ Re7 7.Dxg5+ Re8 8.Dh5+ Re7 9.De5+ Rf7 10.Ac4+ | `kings-gambit-l05` · Trampa con continuación clara. Corto en 10.Ac4+; la fuente afirma mate forzado que no verifiqué. |
| Kieseritzky 5...h5 (Long Whip) | ... 4.h4 g4 5.Ce5 h5 6.Ac4 Ch6 7.d4 d6 8.Cd3 f3 9.gxf3 Ae7 10.Ae3 Axh4+ 11.Rd2 | `kings-gambit-l06` · La fuente dice 10.Af4; uso 10.Ae3, que es la jugada habitual de la teoría. |
| Kieseritzky 5...h5 6.Ac4 Th7 / 8...Ag7 / 8...Ae7 | 6...Th7 7.d4; 8...Ag7 9.Cxf4; 8...Ae7 9.Axf4 Axh4+ 10.g3 | descartada: Sub-ramas menores de la misma línea; no justifican guía propia. |
| Kieseritzky 5...Cf6 6.d4 | ... 5.Ce5 Cf6 6.d4 d6 7.Cd3 Cxe4 8.Axf4 Ag7 9.c3 O-O 10.Cd2 Te8 11.Cxe4 Txe4+ 12.Ae2 | `kings-gambit-l07` · Distinta de l02 (allí 6.Ac4). |
| Kieseritzky 5...De7 | 5...De7 6.d4 d6 7.Cxg4 Dxe4+ 8.De2 | descartada: Sideline breve que lleva a un final igualado; poco valor didáctico. |
| Kieseritzky 5...d6 (Kolisch) | ... 5.Ce5 d6 6.Cxg4 Cf6 7.Cxf6+ Dxf6 8.Cc3 c6 9.Df3 Tg8 10.Df2 Ah6 11.d4 Ae6 12.Ce2 | `kings-gambit-l08` · Línea más común según la fuente. |
| Kieseritzky 5...d6 6.Cxg4 con 6...h5 o 6...Ae7 | 6...h5 7.Cf2 Ae7 8.d4; 6...Ae7 7.d4 Axh4+ 8.Cf2 Ag3 9.Df3 | descartada: Sub-ramas; la de 6...Ae7 tiene un tramo incoherente en la fuente (un caballo en e2 que luego salta a b5). |
| Defensa Fischer 3...d6 | 3...d6 4.d4 g5 5.h4 g4 6.Cg1 Df6 7.Cc3 Ce7 8.Cge2 Ah6 9.Dd2 Cbc6 10.Cb5 Rd8 11.d5 Ce5 12.Cxf4 | `kings-gambit-l09` · Uso la rama 6...Df6 7.Cc3 Ce7, que la fuente llama la mejor. |
| Fischer 6...Ah6 / 7...c6 | 6...Ah6 7.Cc3 c6 8.Cge2 Df6 9.g3 f3 10.Cf4 Ce7 11.e5 | descartada: Muy larga y con tramos confusos en la transcripción. |
| Defensa Moderna 3...d5 | 3...d5 4.exd5 Cf6 5.c4 c6 6.d4 cxd5 7.Axf4 Ab4+ 8.Cc3 O-O 9.Ae2 dxc4 10.Axc4 Te8+ 11.Ce5 Ae6 12.O-O | `kings-gambit-l10` · La recaptura 4...Dxd5 5.Cc3 va como quiz. |
| Falkbeer 2...d5 3.exd5 c6 (Nimzowitsch-Marshall) | 3...c6 4.De2 cxd5 5.fxe5 Cc6 6.Cf3 Ag4 7.Cc3 Cd4 8.Dd3 Cxf3+ 9.gxf3 Ae6 10.Db5+ Dd7 11.Dxd7+ Rxd7 12.d4 | `kings-gambit-l11` · La transcripción dice "capturan y el peón recaptura" sin decir qué pieza; interpreto 8...Cxf3+ 9.gxf3. |
| Falkbeer 3...Dxd5 | 3...Dxd5 4.Cc3 De6 ... | descartada: Recaptura débil, idea igual a la de Moderna 4...Dxd5. |
| Falkbeer 2...d5 3.exd5 e4 | 3...e4 4.d3 Cf6 5.dxe4 Cxe4 6.Cf3 Ac5 7.De2 O-O 8.Dxe4 Te8 9.Ce5 f6 10.Ad3 g6 11.Dc4 Ad6 12.O-O | `kings-gambit-l12` · Las ramas 4...exd3 y 4...Ab4 (trampa Db5) no se desarrollan con claridad en la fuente. |
| Falkbeer 2...d5 3.exd5 exf4 | 3...exf4 4.Cf3 | descartada: Transpone a la Moderna. |
| Declinada 2...d6 | 2...d6 3.Cf3 Cc6 4.d4 / 3...exf4 4.d4 | descartada: Transpone a la Fischer o a posiciones normales; sin idea nueva. |
| Declinada 2...d6 3.Cf3 Ag4 (trampa) | 3...Ag4 4.Ac4 Cf6 5.fxe5 dxe5 6.Axf7+ Rxf7 7.Cxe5+ Re8 8.Cxg4 | `kings-gambit-l17` · Trampa clara. |
| Clásica 2...Ac5 | 2...Ac5 3.Cf3 d6 4.c3 Cf6 5.d4 exd4 6.cxd4 Ab6 7.Cc3 O-O 8.e5 dxe5 9.fxe5 Cd5 10.Ac4 Ae6 11.Db3 c6 12.O-O | `kings-gambit-l13` · La transcripción dice "Bishop B6 defendiendo el caballo"; interpreto 10...Ae6. La trampa de 4...f5 va como paso move. |
| Clásica 2...Ac5 4...f5 | 4...f5 5.d4 fxe4 6.Cxe5 dxe5 7.Dh5+ Rf8 8.Ac4 De7 9.fxe5 | `kings-gambit-l13` · Integrada como paso move de l13. |
| Petrov 2...Cf6 | 2...Cf6 3.fxe5 Cxe4 4.Cf3 d5 5.d3 ... | descartada: La continuación de la fuente no se puede reconstruir (menciona ...Ab7 sin ...b6). |
| Caballo de dama 2...Cc6 / Miles 3...f5 | 2...Cc6 3.Cf3 d6 4.d4; 3...f5 4.d3 | descartada: Transpone a la 2...d6 o es una rareza sin línea concreta. |
| Cunningham 3...Ae7 (gambito de los tres peones) | 3...Ae7 4.Ac4 Ah4+ 5.g3 fxg3 6.O-O gxh2+ 7.Rh1 d5 8.Axd5 Cf6 9.Cxh4 Cxd5 10.exd5 Dxh4 11.De1+ Rf8 12.Cc3 | `kings-gambit-l14` (recortada a 21 jugadas) · La fuente lo llama "Burton Gambit"; en la teoría se conoce como gambito Bertin o de los tres peones. La trampa 7...d6 8.Axf7+ va como paso move. |
| Schallopp 3...Cf6 | 3...Cf6 4.e5 Ch5 5.d4 d6 6.De2 dxe5 7.Dxe5+ De7 8.Ae2 Dxe5 9.Cxe5 Cf6 10.Axf4 | `kings-gambit-l15` · Las sub-ramas 4...Cd5, 5...d5 y 5...Ae7 son secundarias. |
| Macleod 3...Cc6 | 3...Cc6 4.d4 d5 5.exd5 Dxd5 6.Cc3 / 4...g5 5.h4 g4 6.Ce5 | descartada: Línea débil que la fuente trata de pasada y con errores (habla de "Bishop B2"). |
| 3...Ac5 | 3...Ac5 4.d4 Ab6 5.Axf4 | descartada: Error simple, sin continuación de interés. |
| Bonsch-Osmolovsky 3...Ce7 | 3...Ce7 4.d4 d5 5.Cc3 dxe4 6.Cxe4 Cd5 7.Ac4 ... | descartada: La rama final es confusa en la transcripción (habla de "Bishop B6" donde no puede haber alfil). |
| Becker 3...h6 | 3...h6 4.d4 g5 5.g3 fxg3 6.hxg3 Ag7 7.Ac4 d6 8.Cxg5 hxg5 9.Txh8 Axh8 10.Dh5 Df6 11.Axg5 Dg7 12.Cc3 | `kings-gambit-l16` · La variante con 7...Ce7 es la misma idea. |

## Contragambito Albin (`albin`) · 7 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| Trampa Lasker: 4.e3 Ab4+ 5.Ad2 dxe3 6.Axb4 | 1.d4 d5 2.c4 e5 3.dxe5 d4 4.e3 Ab4+ 5.Ad2 dxe3 6.Axb4 exf2+ 7.Re2 fxg1=C+ 8.Txg1 Ag4+ | `albin-l05` · La rama 8.Re1 Dh4+ 9.g3 De4 se menciona como idea, sin guía propia. |
| 4.e3 Ab4+ 5.Ad2 dxe3 6.fxe3 (sin caballos) | 6.fxe3 Dh4+ 7.g3 De4 ... 9.Df3 Axd2+ 10.Cxd2 Dxe5 | descartada: Descartada como guía: es la misma maniobra Dh4-e4 de l06 con un cambio de alfiles previo. |
| 4.e3 Ab4+ 5.Cd2 dxe3 6.fxe3 Dh4+ 7.g3 De4 | 1.d4 d5 2.c4 e5 3.dxe5 d4 4.e3 Ab4+ 5.Cd2 dxe3 6.fxe3 Dh4+ 7.g3 De4 8.Df3 Dxe5 9.a3 Axd2+ 10.Axd2 Dxb2 11.Td1 Cc6 | `albin-l06` · La rama 8.Cf3 Cc6 (y 9.De2 Cxe5 ... Cd3+) va como quiz. |
| 4.Cf3 Cc6 5.e3 Ab4+ 6.Ad2 dxe3 7.Axb4 | 1.d4 d5 2.c4 e5 3.dxe5 d4 4.Cf3 Cc6 5.e3 Ab4+ 6.Ad2 dxe3 7.Axb4 exf2+ 8.Re2 Dxd1+ 9.Rxd1 Cxb4 10.a3 Cc6 11.Re2 Af5 12.Rxf2 O-O-O | `albin-l07` · El orden 11.Re2 (el rey va a por el peón de f2) se dedujo de la explicación; la fuente no nombra la casilla. |
| 7.fxe3 Axd2+ 8.Cbxd2 De7 9.Ae2 | ... 8.Cbxd2 De7 9.Ae2 Cxe5 10.O-O Cg4 11.Db3 Dxe3+ 12.Dxe3 Cxe3 | `albin-l08` · Jugada rara (...De7) que el autor presenta como especialidad propia. 9.Ad3 Cxe5 ... queda fuera (variante del mismo plan). |
| 8...De7 9.Da4 Ad7 10.Db5 Cb4 11.Dxb7 Ac6 | ... 9.Da4 Ad7 10.Db5 Cb4 11.Dxb7 Ac6 | `albin-l09` · Comprobado: tras 11...Ac6 todas las casillas de la dama están atacadas. La transcripción no nombra 10.Db5 ("se acerca"), se dedujo porque ...Cb4 tiene que descubrir ataque sobre la dama. |
| 8...De7 9.Ad3 Cxe5 10.Cxe5 Dxe5 11.Df3 | 9.Ad3 Cxe5 10.Cxe5 Dxe5 11.Df3 Cf6 12.O-O Ag4 | descartada: Descartada: rama secundaria del mismo plan; la fuente es poco precisa sobre las capturas. |
| 7.fxe3 Axd2+ 8.Dxd2 Ag4 | 1.d4 d5 2.c4 e5 3.dxe5 d4 4.Cf3 Cc6 5.e3 Ab4+ 6.Ad2 dxe3 7.fxe3 Axd2+ 8.Dxd2 Ag4 9.Dxd8+ Txd8 10.Cc3 Cge7 11.Ae2 Cg6 12.O-O Ccxe5 | `albin-l11` · La fuente dice "permitir el cambio" y luego "la torre viene"; se interpretó 9.Dxd8+ Txd8. Evaluación casi igual según el autor. |
| 5.e3 Ab4+ 6.Cbd2 dxe3 7.fxe3 Ch6 | 1.d4 d5 2.c4 e5 3.dxe5 d4 4.Cf3 Cc6 5.e3 Ab4+ 6.Cbd2 dxe3 7.fxe3 Ch6 8.a3 Ae7 9.Ae2 Cg4 10.Ce4 Dxd1+ 11.Axd1 Cgxe5 12.Cxe5 Cxe5 | `albin-l10` · 13.b3 Cd3+ va como paso move; 9.O-O Cxe3 y 9.h3 Ah4+ como explain. |
| 7.h3 Cf5 8.Db3 O-O 9.a3 Ae7 10.g4 Ah4+ | ...Ch6 7.h3 Cf5 ... | descartada: Descartada: rama larga y tardía; idea (...Ah4+) ya mostrada en l10. |
| 4.g3 (la más jugada a nivel GM) | 4.Cf3 Cc6 5.g3 | descartada: Es la línea principal existente (l02); la fuente solo la nombra. |
| 4.Cc3, 4.e3 sin Cf3 con transposición a la Francesa, 4.Cf3 (otros), 5.a3, 5.Cbd2, 5.Af4, 5.Ag5 | — | descartada: Solo se nombran para otras partes de la serie; esta parte 1/10 no las desarrolla. |

## Apertura Catalana (`catalan`) · 7 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| Contra ...b6: cxd5 exd5, Ce5 y castigo de ...c5 con Db3 (incluye mate de la coz) | 1.d4 Cf6 2.c4 e6 3.g3 d5 4.Ag2 Ae7 5.Cf3 O-O 6.O-O b6 7.cxd5 exd5 8.Cc3 Ab7 9.Ce5 c5 10.dxc5 bxc5 11.Db3 Db6 12.Cxd5 | `catalan-l05` · El video no da el orden exacto; 8.Cc3 se añadió para que el ataque a d5 con dama, caballo y alfil sea el que describe. La trampa 12...Dxb3? 13.Cxe7+ y el mate de la coz (Cxf7, Ch6+, Dg8+, Cf7#) van como pasos "encuentra la jugada". |
| Contra ...b6: plan estándar Af4 y Tc1 | ... 7.cxd5 exd5 8.Af4 | descartada: Descartada como guía: el autor la menciona como alternativa y prefiere Ce5. |
| Contra ...b6 y ...Cbd7: Da4 | ... 9.Ce5 Cbd7 10.Da4 | descartada: Descartada como guía propia: idea secundaria de la misma línea y la transcripción no permite fijar las jugadas. |
| Órdenes de jugadas: 3.g3 contra Nimzoindia/India de Dama; Cf3 antes de d4 contra Benko/Benoni | 1.d4 Cf6 2.c4 e6 3.g3 / 1.Cf3 | descartada: Descartada: transposiciones sin línea nueva. |
| Catalana cerrada con ...c6 | ... 6...c6 7.Dc2 Cbd7 8.Cbd2 b6 9.e4 dxe4 10.Cxe4 Ab7 11.Cxf6+ Axf6 | `catalan-l06` · Incluida. La transcripción habla de "cambiar este caballo" sin precisar; se eligió 11.Cxf6+. Las ideas Td1/Af4/c5 posteriores van en un explain. |
| Sistema ...c6 y ...Ad6 con Cc3, Cd2 y e4 | 1.d4 Cf6 2.c4 e6 3.g3 d5 4.Ag2 c6 5.Cf3 Ad6 6.O-O O-O 7.Cc3 Cbd7 8.Cd2 Te8 9.e4 dxe4 10.Cdxe4 Cxe4 11.Cxe4 Ae7 12.Dc2 | `catalan-l07` · Incluida. La rama 11...Ac7 12.Ag5 con d5 y Dxd5+ se menciona sin jugadas precisas; se omitió. |
| Trampa ...dxc4 y ...b5 contra Cd2 | ... 7.Cc3 dxc4 8.Cd2 b5 9.Cxb5 Cd5 10.Cxd6 Dxd6 11.Cxc4 | `catalan-l08` · Incluida. La jugada negra 9...Cd5 no está en el video (solo "desde b5 el caballo toma el alfil"); se eligió una defensa natural. |
| Abierta 7...b5 8.a4 c6 9.axb5 cxb5 10.Cg5 | ... 6...dxc4 7.Dc2 b5 8.a4 c6 9.axb5 cxb5 10.Cg5 Cd5 11.Dxh7# | `catalan-l09` · Incluida. Las ramas 8...a6? 9.axb5 y 8...bxa4 se mencionan como inferiores; quedan cubiertas por la explicación. |
| Abierta 7...a6 8.Dxc4 b5 (igualada) | ... 7.Dc2 a6 8.Dxc4 b5 9.Dc2 Ab7 | descartada: Descartada: el autor la usa solo para justificar 8.a4 de la línea principal. |
| Abierta: trampa 9...b5 (no tomar en b5) | ... 7.Dc2 a6 8.a4 Ad7 9.Dxc4 b5 10.Dc2 | `catalan-l10` · Incluida como trampa. |
| Abierta 9...Ac6 10.Ag5 con Cbd7/Ce7, Cc3, h6, Axf6, ...Ce4 y la idea ...b5? Cg5 | ... 9.Dxc4 Ac6 10.Ag5 | descartada: Descartada: prolongación de la línea principal existente (l02); el video no fija las jugadas. |
| Jaque temprano ...Ab4+ con Ad2 y la idea Aa5 | 1.d4 Cf6 2.c4 e6 3.g3 Ab4+ 4.Ad2 Ae7 5.Ag2 d5 6.Cf3 O-O 7.O-O dxc4 8.Dc2 b5 9.a4 c6 10.axb5 cxb5 11.Aa5 | `catalan-l11` · Incluida. La continuación del video (Ce5, ...Cd5, Cc3, Ce4 atrapando la dama) no se fijó porque no indica a qué casilla va la dama negra. |
| Plan de Carlsen: cambiar piezas y presionar en el final con el alfil de g2 | (sin jugadas concretas) | descartada: Descartada: es un plan de medio juego y final sin línea de apertura. |

## Apertura Inglesa (`english`) · 11 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| 1...e5 2.g3 Cf6 (Dragón invertido) con Tb1, b5 y Cd2-c4 | 1.c4 e5 2.g3 Cf6 3.Ag2 d5 4.cxd5 Cxd5 5.Cc3 Cb6 6.Cf3 Cc6 7.O-O Ae7 8.a3 O-O 9.b4 Ae6 10.Tb1 f6 11.d3 a5 12.b5 Cd4 13.Cd2 | `english-l05` · Sí. Llega a una posición cercana a l02 por otro orden, pero aporta el plan Tb1/b5/Cd2-c4 y la trampa ...a5. 4...Cxc3 5.bxc3 va como quiz. |
| 1...e5 2.g3 c6 (Alapin invertida) | 2.g3 c6 3.Ag2 d5 4.cxd5 cxd5 5.d4 | descartada: Descartada: solo esbozada en dos frases, sin plan concreto ni continuación clara. |
| Simétrica: Rubinstein | 1.c4 c5 2.g3 Cf6 3.Ag2 d5 4.cxd5 Cxd5 5.Cc3 Cc7 6.Cf3 Cc6 7.O-O e5 8.d3 Ae7 9.Cd2 Ad7 10.Cc4 f6 11.f4 b5 12.Ce3 | `english-l06` · Sí. 6.Cf3 y 8.d3 los añadí como orden natural (la fuente da Cd2 sin decir de dónde viene el caballo). La idea 9...O-O 10.Axc6 va como quiz. |
| Sistema Botvinnik (contra 1...c5 2...g6 y contra 1...g6) | 1.c4 c5 2.g3 g6 3.Ag2 Ag7 4.Cc3 Cc6 5.d3 d6 6.e4 Cf6 7.Cge2 O-O 8.O-O a6 9.h3 Tb8 10.a4 Ce8 11.Ae3 Cc7 12.d4 | `english-l07` · Sí. La versión con 1...g6 es la misma estructura (transposición); va como quiz sobre cuándo jugar e4. |
| 1...c5 2.g3 Cc6 3.Ag2 Cf6 4.Cc3 e6 | ídem | descartada: Descartada: la fuente dice que transpone al capítulo de 1...e6. |
| 1...e6: Benoni invertida con ...d4 | 1.c4 e6 2.g3 d5 3.Ag2 Cf6 4.Cf3 d4 5.O-O c5 6.e3 Cc6 7.exd4 cxd4 8.d3 | `english-l08` · Sí. 6...Cc6 es jugada negra de relleno. La recuperación ...dxc4 Da4+ va como paso "move". |
| 1...e6: Gambito de Dama rehusado contra doble fianchetto | 4.Cf3 Ae7 5.O-O O-O 6.b3 c5 7.Ab2 Cc6 8.e3 b6 9.Cc3 Ab7 10.cxd5 Cxd5 11.Cxd5 Dxd5 12.d4 | `english-l09` · Sí. La transcripción dice "Ab7, enroque, enroque" donde lo lógico es 4...Ae7; lo interpreté así. |
| 1...e6 con 4.d4 (Catalana) | 4.d4 | descartada: Descartada: la fuente la menciona como alternativa pero no la juega. |
| 1...c6 2.Da4 | 1.c4 c6 2.Da4 e5 3.Cc3 d6 4.g3 g6 5.Ag2 Ag7 | `english-l10` · Sí, con la trampa 2...d5? 3.cxd5. El orden exacto de 3.Cc3 está reconstruido (la fuente da ...e5, ...d6, g3, ...g6, Ag2, ...Ag7 y Cc3). |
| 1...Cf6 y ...c6: Londres invertido con Db3 | 1.c4 Cf6 2.g3 c6 3.Ag2 d5 4.Cf3 Af5 5.Db3 Db6 6.d3 e6 7.Ae3 Dxb3 8.axb3 a6 | `english-l11` · Sí. |
| 1...Cf6 y ...c6 con 4...dxc4 | 4...dxc4 5.O-O Cbd7 6.Dc2 Cb6 7.a4 a5 8.Ca3 / 5...Ae6 6.Ag5 Ad5 7.e4 | `english-l11` · Integrada como paso explicativo en l11 (la línea ...Ae6 se omite: la narración es confusa). |
| 1...Cf6 con transposiciones (e6, e5, c5) | 1.c4 Cf6 ... | descartada: Descartadas: transposiciones a los capítulos ya cubiertos. |
| Holandesa Leningrado | 1.c4 f5 2.g3 Cf6 3.Ag2 g6 4.Cc3 Ag7 5.d3 O-O 6.e4 fxe4 7.dxe4 d6 8.Cge2 c5 9.O-O Cc6 10.h3 Tb8 11.f4 Ae6 12.Cd5 Dd7 13.g4 | `english-l12` · Sí. 10...Tb8 es jugada negra de relleno; puse f4 antes de ...Ae6 para que Cd5 tape la diagonal hacia c4 (si no, ...Axc4 gana un peón). |
| Holandesa clásica | 1.c4 f5 2.g3 Cf6 3.Ag2 e6 4.Cf3 Ae7 5.O-O O-O 6.Cc3 d6 7.b4 e5 8.a4 Cc6 9.b5 Cb4 10.a5 | `english-l13` · Sí. |
| Holandesa Stonewall | 3...e6 4.Cf3 d5 5.O-O c6 6.d3 Ad6 7.Cc3 O-O 8.e4 dxe4 9.dxe4 e5 10.Db3 | `english-l14` · Sí. 6.d3 lo añadí (la fuente dice que el peón va a d3). La afirmación de que 10.Db3 solo se jugó dos veces y que lo mejor es ...Ac5 es de la fuente; no la pude verificar. |
| 1...b6 | 1.c4 b6 2.Cc3 Ab7 3.e4 e6 4.Cf3 Ab4 5.Ad3 Ce7 6.O-O d6 7.Ac2 Cd7 8.d4 O-O 9.Te1 | `english-l15` · Sí. La rama 7.Ac2 f5 8.e4... es confusa en la transcripción (parece haber errores de dictado): no se usa. |

## Gambito Danés (`danish`) · 11 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| 3...d5 | 1.e4 e5 2.d4 exd4 3.c3 d5 4.exd5 Dxd5 5.cxd4 Cc6 6.Cf3 Ag4 7.Ae2 O-O-O 8.Cc3 Ab4 9.O-O Axc3 10.bxc3 Cf6 | `danish-l05` · Línea del PGN. La subvariante 6...Cf6 7.Cc3 Da5 8.d5 se incluye como paso move. |
| 3...d3 | 1.e4 e5 2.d4 exd4 3.c3 d3 4.Axd3 | `danish-l06` · Línea corta (7 jugadas); el plan (c4, caballos, f4) sale de la transcripción. |
| 3...De7 | ... 3...De7 4.cxd4 Dxe4+ 5.Ae3 Ab4+ 6.Cc3 Cf6 7.Cf3 Cd5 8.Dd2 Cxe3 9.fxe3 Dg6 10.Ad3 | `danish-l07` · Línea del PGN y de la partida 3. |
| Triple gambito 4.Ac4 cxb2 5.Axb2 Ab4+ 6.Rf1 | ... 5...Ab4+ 6.Rf1 Cf6 7.e5 d5 8.Ab5+ c6 9.exf6 cxb5 10.fxg7 | `danish-l08` · El PGN acaba en 8...c6; 9.exf6 cxb5 10.fxg7 sale de la transcripción. La mejor defensa, 8...Cfd7 (con 9.Axg7 Tg8 10.Dh5), se menciona en un explain sin línea propia. 6.Cd2 Cf6 se descarta (solo aparece en el PGN sin comentario). |
| Triple gambito con 5...Cc6 | ... 5.Axb2 Cc6 6.Cf3 Ab4+ 7.Cc3 Cf6 8.O-O O-O 9.Cd5 Cxd5 10.exd5 Ca5 11.Ad3 | `danish-l09` · Línea del PGN. Las ideas de la transcripción tras ...d6 o ...Ce7 (Da4, Dd4, Dg4) no se dan con jugadas exactas y no se incluyen. |
| 4.Cxc3 Ac5 | ... 4.Cxc3 Ac5 5.Ac4 d6 6.Cf3 Cf6 7.e5 | `danish-l10` · Línea del PGN. 6.Db3 De7 7.Cd5 Dxe4+ 8.Ae3 se muestra en un explain; las continuaciones 8...Dxg2 y 8...Axe3 9.fxe3 Rd8 no tienen comentario y quedan fuera. |
| 4.Cxc3 Ab4 | ... 4.Cxc3 Ab4 5.Ac4 Cf6 6.e5 d5 7.exf6 dxc4 8.Dxd8+ Rxd8 9.fxg7 Tg8 10.Ag5+ Re8 11.O-O-O | `danish-l11` · Línea del PGN. La alternativa 6.Axf7+ solo aparece en el PGN sin desarrollo. |
| 4...Cc6 5.Ac4 Cf6 6.Cf3 Ac5 7.e5 | ... 6.Cf3 Ac5 7.e5 Cg4 8.Axf7+ Rxf7 9.Dd5+ | `danish-l12` · Final de la línea principal del PGN. |
| 4...Cc6 ... 6...Ab4 | ... 6.Cf3 Ab4 7.e5 d5 8.exf6 dxc4 9.Dxd8+ Cxd8 10.fxg7 Tg8 11.Ah6 | `danish-l13` · Línea del PGN; incluye en un explain 7...Cg4 8.Axf7+ Rxf7 9.Cg5+ Re8 10.Dxg4 (transcripción). |
| 4...Cc6 ... 6...d6 | ... 6.Cf3 d6 7.Cg5 Ce5 8.Ab3 h6 9.f4 hxg5 10.fxe5 dxe5 11.Axf7+ Re7 12.Db3 | `danish-l14` · Línea del PGN (23 jugadas). |
| 2...Cc6 (gambito no aceptado) | 1.e4 e5 2.d4 Cc6 3.dxe5 Cxe5 4.f4 | `danish-l15` · Comentario final de la teoría. Las alternativas (cambio de caballos con Cf3, d5, transposición a la Escocesa con 3.Cf3, y 2...d6 con cambio de damas) se mencionan sin líneas concretas y no tienen guía propia. |
| Línea teórica 6...Ab4 7.O-O Axc3 8.bxc3 y Aa3 | ... 6.Cf3 Ab4 (7.O-O Axc3 8.bxc3) | descartada: El presentador la llama "teoría principal" de pasada (enroque y Aa3) sin dar jugadas; no se reconstruye. |
| Partidas 1-3 de suscriptores | - | descartada: La 1 (Axf7+ y Db3 en el triple gambito) y la 2 (4...Ac5 con Db3) no aportan líneas teóricas nuevas; la 3 ilustra 3...De7 (danish-l07). No se hace guía por partida. |

## Defensa Francesa (`french`) · 14 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| Avance 3.e5 c5 4.dxc5 | 4.dxc5 Axc5 | descartada: Se menciona de pasada (recapturas y juego cómodo), sin continuación concreta. |
| Avance 6.Ae2 | 6.Ae2 cxd4 7.cxd4 Cge7 8.Cc3 Cf5 9.Ca4 Da5+ 10.Cc3 Ab4 (8.O-O Cf5) | `french-l05` · La fuente dice «Bishop B2» por error de transcripción; por el contexto es 6.Ae2. |
| Avance 6.a3 c4 | 6.a3 c4 7.Cbd2 Ca5 8.Ae2 Ad7 9.O-O Ce7 10.Tb1 Dc7 (11.b4 cxb3 12.Cxb3 Aa4) | `french-l06` · El orden de jugadas blancas está reconstruido (la fuente lo narra con poca precisión); las ideas negras (...c4, ...Ca5, ...Ad7, ...Dc7 contra b4, ...Cf5) son las de la fuente. |
| Avance: gambito Milner-Barry 6.Ad3 | 6.Ad3 cxd4 7.cxd4 Ad7 8.O-O Cxd4 9.Cxd4 Dxd4 10.Cc3 a6 11.De2 Tc8 12.Rh1 Ac5 13.f4 Ce7 (7...Cxd4? 8.Cxd4 Dxd4 9.Ab5+) | `french-l07` · El final de la línea (14.Ad2 f5) no se incluye: la transcripción es confusa en ese tramo. |
| Sistema Nimzowitsch 4.Cf3 | 4.Cf3 cxd4 5.Cxd4 Ce7 6.Cc3 Cbc6 7.Ab5 Ad7 8.Axc6 Cxc6 9.Cxc6 Axc6 10.Ae3 Dc7 11.f4 Ab4 (5.Dxd4 Cc6) | `french-l08` · Jugada blanca 11.f4 añadida como continuación natural; la fuente solo da el plan negro (...Dc7, ...Ab4). |
| Nimzowitsch 5.Dxd4: trampa de la dama con ...Cf5 | 5.Dxd4 Cc6 6.Ab5 Ce7 ... 9.Cc3 c5 10.Dxc5? Cf5 | descartada: Descartada: la transcripción no permite reconstruir una secuencia legal y fiable en la que la dama quede atrapada. Solo se usa 5...Cc6 como pregunta. |
| Variante del cambio 3.exd5 | 3.exd5 exd5 4.Cf3 Cf6 5.Ad3 Ad6 6.O-O O-O 7.c3 Ag4 8.h3 Ah5 9.Ag5 Cbd7 10.Cbd2 c6 11.Dc2 Dc7 | `french-l09` · Línea propia en la fuente. |
| Cambio: Monte Carlo 4.c4 | 4.c4 Ab4+ 5.Cc3 Cf6 6.Cf3 O-O 7.Ad3 dxc4 8.Axc4 Cc6 9.O-O Ag4 10.Ae3 Dd7 | `french-l10` · Línea propia en la fuente. |
| Tarrasch 3.Cd2 c5 4.c3 | 4.c3 cxd4 5.cxd4 dxe4 6.Cxe4 Ab4+ 7.Cc3 Cf6 8.Cf3 O-O 9.Ad3 b6 10.O-O Ab7 (7.Ad2 Dxd4) | `french-l11` · Línea propia en la fuente. |
| Tarrasch 4.Cgf3 | 4.Cgf3 cxd4 5.Cxd4 Cc6 6.Ab5 Ad7 7.Cxc6 bxc6 8.Ad3 Ad6 9.O-O Dc7 10.h3 Cf6 | `french-l12` · La subvariante 7.Axc6 se menciona sin continuación clara; no se desarrolla. |
| Tarrasch 4.exd5 Dxd5 | 4.exd5 Dxd5 5.Cgf3 cxd4 6.Ac4 Dd6 7.O-O Cf6 8.Cb3 Cc6 9.Cbxd4 Cxd4 10.Cxd4 a6 11.Te1 Dc7 12.Ab3 Ad6 | `french-l13` · Línea propia en la fuente (la principal de la Tarrasch abierta). |
| Winawer 3.Cc3 Ab4 | 3...Ab4 | descartada: El presentador la menciona solo para desaconsejarla; no da ninguna línea. |
| Clásica: McCutcheon 4.Ag5 Ab4 5.e5 | 5.e5 h6 6.Ad2 Axc3 7.bxc3 Ce4 8.Dg4 g6 9.Ad3 Cxd2 10.Rxd2 c5 11.h4 Cc6 12.Cf3 cxd4 ... Da5, b6, Aa6 (6.exf6 hxg5 7.fxg7 Tg8; 6.Ah4 g5 7.Ag3 Ce4) | `french-l14` · La línea principal existente (l02) es la clásica con 4...Ae7; esta guía es la alternativa que recomienda la fuente. |
| Clásica: McCutcheon 5.exd5 | 5.exd5 Dxd5 6.Axf6 Axc3+ 7.bxc3 gxf6 8.Dd2 Cc6 | `french-l15` · Línea propia en la fuente. |
| Clásica 4.e5 (Steinitz) 8.Dd2 Dxb2 | 4.e5 Cfd7 5.f4 c5 6.Cf3 Cc6 7.Ae3 Db6 8.Dd2 Dxb2 9.Tb1 Da3 10.Ab5 a6 (10.Cb5 Dxa2 ...) | `french-l16` · La subvariante 10.Cb5 Dxa2 está narrada de forma confusa en la fuente; se menciona solo como idea. |
| Clásica 4.e5 (Steinitz) 8.a3 | 8.a3 cxd4 9.Cxd4 Ac5 10.Ca4 Da5+ 11.c3 Axd4 12.Axd4 Cxd4 13.Dxd4 b6 14.Ad3 Aa6 | `french-l17` · Línea propia en la fuente. |
| Clásica 4.e5 (Steinitz) 8.Ca4 | 8.Ca4 Da5+ 9.c3 b6 ... sacrificio de pieza en b4 | descartada: Descartada: la secuencia del sacrificio (...Cxb4 / ...Axb4, ...b5, ...b4) está narrada sin jugadas blancas claras y no se puede reconstruir con fiabilidad. |
| Dos caballos 2.Cf3 d5 3.Cc3 | 3.Cc3 Cf6 4.e5 Cfd7 5.d4 c5 6.dxc5 Cc6 7.Af4 Cxc5 (4.exd5 exd5) | `french-l18` · Las subvariantes 5.Ab5/«Bishop B3», 5.Ag5 y 5.Ca4 están transcritas de forma ilegible y se omiten. |
| Variante Schlechter (capítulo final) | - | descartada: El capítulo así titulado corresponde en la transcripción a ideas sueltas (capturas tempranas en c5 y d5) sin una línea identificable; se descarta. |

## Defensa Nimzoindia (`nimzo-indian`) · 12 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| Tres Caballos 4.Cf3 | 1.d4 Cf6 2.c4 e6 3.Cc3 Ab4 4.Cf3 Axc3+ 5.bxc3 b6 6.Ag5 Ab7 7.e3 d6 8.Ad3 Cbd7 9.O-O h6 10.Ah4 g5 11.Ag3 Ce4 | `nimzo-indian-l05` · El video intercala ...De7 y Te1 antes de ...h6; se omitieron para no pasar de 24 jugadas. El cambio inmediato 4...Axc3+ es jugable pero menos habitual que 4...b6, 4...c5 o 4...O-O. |
| Tres Caballos: 10.Axf6 Cxf6 11.e4 e5 / 10...Ah4 g5 11.Ag3 con Cd2, e4, ...e5, ...f5 | ... 10.Axf6 Cxf6 11.e4 e5 | descartada: Subvariantes del mismo plan; la transcripción es confusa y repiten las ideas de la guía 4.Cf3. |
| Rubinstein 4.e3 O-O 5.Ce2 c6 | 1.d4 Cf6 2.c4 e6 3.Cc3 Ab4 4.e3 O-O 5.Ce2 c6 6.e4 d5 7.e5 Cfd7 | descartada: Descartada: 5...c6 no es la respuesta teórica habitual (5...d5 o 5...b6) y la continuación del video es confusa y discutible (incluye un sacrificio ...Cxe5 sin justificar). |
| Rubinstein 4.e3 con 5.Ad3 d5 6.Cf3 dxc4 y peón aislado | ... 4.e3 O-O 5.Ad3 d5 6.Cf3 dxc4 7.Axc4 c5 8.O-O cxd4 9.exd4 b6 10.Ag5 Ab7 | `nimzo-indian-l06` · Incluida. La idea táctica ...Cg4 que da el video tras ...Dc7, De2 y Tac1 no se incluyó: el supuesto mate no es forzado. |
| Rubinstein: rama con Cxd4 y ...a6, a3 Axc3, ...Dc7, ...b5 | ... 8...cxd4 9.Cxd4 a6 10.a3 Axc3 11.bxc3 Dc7 | descartada: Descartada: muy parecida a la línea principal existente (l02). |
| Clásica 4.Dc2 O-O 5.a3 Axc3+ 6.Dxc3 b6 7.Ag5 Ab7 8.e3 | ... 8.e3 d6 9.Ce2 Cbd7 10.Dc2 h6 11.Ah4 c5 | `nimzo-indian-l07` · Incluida. La continuación larga (Td1, ...De7, Cc3 cxd4, Txd4 Ce5, f3, ...Tac8, ...Cg6, ...e5) se resume en el quiz y no se juega completa. |
| Clásica 8.Cf3 | ... 8.Cf3 d6 9.e3 Cbd7 10.Ae2 h6 11.Ah4 c5 12.O-O g5 13.Ag3 Ce4 | descartada: Descartada como guía propia: el propio autor dice que es el mismo esquema que 8.e3 (...d6, ...Cbd7, ...h6, ...c5). |
| Clásica 8.f3 | ... 8.f3 h6 9.Ah4 d5 10.e3 Cbd7 11.Ad3 c5 | `nimzo-indian-l08` · Incluida. La rama forzada 11.cxd5 Cxd5 12.Axd8 Cxc3 13.Ah4 ... (y la línea con sacrificio de dama por dos torres) se descartó por larga y por ser un análisis de motor poco didáctico. |
| Variante 4.Ad2 | ... 4.Ad2 O-O 5.Cf3 b6 6.e3 Ab7 7.Ae2 d6 8.O-O Cbd7 9.a3 Axc3 10.Axc3 Ce4 11.Dc2 f5 | `nimzo-indian-l09` · Incluida; la idea ...Dg5 contra 12.Cd2 va como paso "encuentra la jugada". Las ramas largas con ...Tf6-g6 y sacrificios en g2/h2 se omitieron: el propio autor dice que no hace falta saberlas. |
| Spielmann 4.Db3 c5 5.a3 Axc3+ 6.Dxc3 | ... 4.Db3 c5 5.a3 Axc3+ 6.Dxc3 cxd4 7.Dxd4 Cc6 8.Dd3 d5 | `nimzo-indian-l10` · Incluida. El video no precisa a qué casilla va la dama en la jugada 8; se eligió 8.Dd3 (legal y natural). Las ramas 5.dxc5 y 5.e3 cxd4 y la recaptura 6.bxc3 se mencionan sin continuación clara. |
| Variante 4.a3 con 5.Cf3 | ... 4.a3 Axc3+ 5.bxc3 b6 6.Cf3 Ab7 | descartada: Descartada: el autor dice que es lo mismo que la línea 4.Cf3 con un tiempo de más para las negras. |
| Sämisch 4.a3 con 6.f3 | ... 4.a3 Axc3+ 5.bxc3 b6 6.f3 Aa6 7.e4 Cc6 8.Ad3 Ca5 9.De2 c5 | `nimzo-indian-l11` · Incluida. El video no precisa la jugada blanca entre ...Cc6 y ...Ca5; se puso 8.Ad3, que encaja con la idea de defender c4 con Ad3 y De2. |
| Leningrado 4.Ag5 c5 5.e3 Da5 (trampa 6.Axf6) | ... 4.Ag5 c5 5.e3 Da5 6.Axf6 Axc3+ 7.bxc3 Dxc3+ 8.Re2 gxf6 | `nimzo-indian-l12` · Incluida como trampa. La defensa 6.Ce2 Ce4 7.Dd3 se descartó: la transcripción es confusa. |
| Leningrado 5.d5 (estructura Benoni) | ... 4.Ag5 c5 5.d5 d6 6.e3 exd5 7.cxd5 Cbd7 8.Ad3 O-O 9.Ce2 Te8 10.O-O h6 11.Ah4 Ce5 | `nimzo-indian-l13` · Incluida; el orden exacto de jugadas del video es impreciso y se ordenó de forma legal y lógica. |
| Kmoch 4.f3 | ... 4.f3 d5 5.a3 Ae7 6.e4 dxe4 7.fxe4 e5 8.d5 O-O 9.Cf3 Ag4 10.Ae2 Cbd7 | `nimzo-indian-l14` · El video mete 5.cxd5 exd5 antes de 6.e4 dxe4 7.fxe4 e5, pero eso es imposible (las negras ya no tendrían peón e). Se usa el orden sin cxd5. El plan posterior ...a5, ...Ac5 se menciona sin incluirlo. |
| Sistema Romanishin-Kasparov 4.g3 | ... 4.g3 d5 5.Ag2 O-O 6.Cf3 dxc4 7.O-O Cc6 8.a3 Ae7 9.e4 a6 | `nimzo-indian-l15` · Incluida. |
| Ataque Mikenas 4.Dd3 (y trampa 7.e4?) | ... 4.Dd3 c5 5.d5 exd5 6.cxd5 O-O 7.e4 Cxe4 8.Dxe4 Te8 | `nimzo-indian-l16` · Incluida como trampa. Las ramas 5.dxc5 Ca6 y 5.Cf3 cxd4 se mencionan sin plan propio y se descartaron. |

## Defensa Petrov (`petrov`) · 5 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| Tres Caballos con ...Ab4 | 1.e4 e5 2.Cf3 Cf6 3.Cc3 Ab4 4.Cxe5 O-O 5.Ae2 Axc3 6.dxc3 d6 7.Cf3 Cxe4 8.O-O | `petrov-l05` · Línea recomendada por el autor contra 3.Cc3. En la teoría 5...Te8 es más habitual, pero el orden del video es jugable. |
| Tres Caballos con ...Cc6 (Cuatro Caballos) | 1.e4 e5 2.Cf3 Cf6 3.Cc3 Cc6 | descartada: Descartada: transpone a los Cuatro Caballos; el autor no la recomienda ni la desarrolla. |
| Ataque moderno 3.d4 | 1.e4 e5 2.Cf3 Cf6 3.d4 Cxe4 4.Ad3 d5 5.Cxe5 Cd7 6.Cxd7 Axd7 7.O-O Ad6 | `petrov-l06` · Línea desarrollada en el video. |
| Ataque moderno 3.d4 Cxe4 4.Cxe5 (u otra 4.ª) | 1.e4 e5 2.Cf3 Cf6 3.d4 Cxe4 4.? | descartada: Descartada: solo se menciona de pasada como "no considerada buena", sin continuación. La transcripción es confusa. |
| Variante Damiano 3...Cxe4 (trampas 4...Cf6?? y 4...d5) | 1.e4 e5 2.Cf3 Cf6 3.Cxe5 Cxe4 4.De2 De7 5.Dxe4 d6 6.d4 dxe5 7.dxe5 Cc6 8.Ab5 Ad7 9.Cc3 | `petrov-l07` · Incluida como error típico: la trampa 4...Cf6?? 5.Cc6+ va en un paso explain. La rama 4...d5 5.d3 De7 6.dxe4 Dxe5 7.exd5 se menciona pero no merece guía propia (mismo mensaje: las negras quedan peor). |
| Ataque Paulsen 4.Cc4 | 1.e4 e5 2.Cf3 Cf6 3.Cxe5 d6 4.Cc4 | descartada: Descartada: el autor solo la nombra y no da continuación. |
| Clásica 5.d4 (Chigorin) | ... 5.d4 d5 6.Ad3 Cc6 7.O-O Ae7 8.c4 Cb4 9.Ae2 O-O | descartada: Ya es la línea principal existente (l02). |
| Clásica con c4 y peón aislado | ... 5.d4 d5 6.c4 dxc4 7.Axc4 | descartada: Descartada: mención breve sin plan ni continuación clara. |
| Ataque Cozio 5.De2 (y trampa 5...Af5? 6.d3) | ... 5.De2 De7 6.d3 Cf6 7.Ag5 Dxe2+ 8.Axe2 Ae7 9.Cc3 c6 | `petrov-l08` · Incluida; la trampa 5...Af5? va como quiz. El plan ...g6 de Caruana se menciona en un explain. |
| Ataque Nimzowitsch 5.Cc3 | ... 5.Cc3 Cxc3 6.dxc3 Ae7 7.Ae3 O-O 8.Dd2 Cd7 9.O-O-O Ce5 10.h4 | `petrov-l09` · Incluida. La subvariante con ...Ae6 que el autor menciona queda fuera porque la transcripción es ininteligible. |
| Apertura de alfil 2.Ac4 (evitar la Petrov) | 1.e4 e5 2.Ac4 | descartada: Descartada: solo se menciona como forma de evitar la Petrov. |

## Gambito de dama declinado (`queens-gambit-declined`) · 14 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| Tartakower con 9.cxd5 Cxd5 (Ag5) | 1.d4 d5 2.c4 e6 3.Cc3 Cf6 4.Ag5 Ae7 5.e3 O-O 6.Cf3 h6 7.Ah4 b6 8.cxd5 Cxd5 9.Axe7 Dxe7 10.Cxd5 exd5 11.Tc1 Ae6 | descartada: Es la línea principal existente (l02). La fuente insiste en ...h6 antes de ...b6 y en recapturar con el caballo en d5; ya está cubierto. |
| Ag5 ...h6 Axf6 | 7.Axf6 Axf6 8.Tc1 c6 9.Ad3 Cd7 10.O-O dxc4 11.Axc4 e5 | `queens-gambit-declined-l05` · La fuente menciona la pareja de alfiles y los planes ...dxc4/...c5 o ...c6/...Cd7; uso el desarrollo clásico con ...e5. |
| Defensa Lasker | 7.Ah4 Ce4 8.Axe7 Dxe7 9.cxd5 Cxc3 10.bxc3 exd5 11.Db3 Td8 | `queens-gambit-declined-l06` · El presentador la nombra (no la recomienda por ser algo seca). Continuación estándar. |
| Tartakower con ...Cbd7 y ...Ce4 contra De2 | 7.Ah4 b6 8.Ad3 Ab7 9.O-O Cbd7 10.De2 Ce4 11.Axe7 Dxe7 | `queens-gambit-declined-l07` · Idea explícita de la fuente (si Ag3, ...Cxg3; si Axe7, caballo fuerte en e4 y ...f5). El orden exacto de jugadas es mío. |
| Tartakower con ...c5 y recaptura ...Axd5 | 10.De2 c5 11.cxd5 Cxd5 12.Axe7 Dxe7 13.Cxd5 Axd5 14.e4 Ab7 | `queens-gambit-declined-l08` · La línea completa supera 24 jugadas; la guía llega hasta 10...c5 y muestra la continuación en un paso explicativo y en un ejercicio. |
| Ruptura ...c5 con peones colgantes | ...c5, dxc5 bxc5 | descartada: Idea general sin orden concreto en la fuente; se menciona dentro de la guía de ...c5. |
| Variante del Cambio (Carlsbad) con ...Te8 y ...Cf8 | 4.cxd5 exd5 5.Ag5 c6 6.e3 Ae7 7.Ad3 Cbd7 8.Dc2 O-O 9.Cf3 Te8 10.O-O Cf8 | `queens-gambit-declined-l09` · Sección más larga del video. Incluye ataque de minoría y el castigo a Ce5 prematuro (...Cg4 y ...Cxe3 si f4). |
| Ataque de minoría (Tab1, b4, b5) y la idea ...b5 de las negras | Tab1 h6 Ah4 a5 a3 ... b5 | descartada: Son planes de medio juego explicados con partidas de ejemplo (Lichess y una Grünfeld); se resumen en la guía del Cambio. |
| Trampa del Elefante | 4.Ag5 Cbd7 5.cxd5 exd5 6.Cxd5? Cxd5 7.Axd8 Ab4+ 8.Dd2 Axd2+ 9.Rxd2 Rxd8 | `queens-gambit-declined-l10` · La fuente la muestra como trampa con ...Cbd7. Línea forzada conocida. |
| Cambio con Cf3 temprano: ...h6 y ...Af5, Db3 g5 | 3.Cf3 Cf6 4.cxd5 exd5 5.Cc3 c6 6.Ag5 h6 7.Ah4 Af5 8.Db3 g5 9.Ag3 Db6 | `queens-gambit-declined-l11` · La fuente afirma que las negras quizá ya están algo mejor; en el texto uso una valoración más prudente. |
| Cambio: ...c6 Af5 contra Df3 (doblado de peones f) | 5.Ag5 c6 6.e3 Af5 7.Df3 | descartada: El presentador no lo recomienda para jugadores de club; solo lo menciona. |
| Plan Botvinnik (Cge2, f3, e4) con ...g6, ...Cg4 y ...b5 | 9.Cge2 ... f3 ... Tae1 Ce6 Ah4 b5 | descartada: La transcripción es demasiado confusa para reconstruir un orden de jugadas fiable (casillas mal transcritas). Descartada. |
| Cambio con ...h6 y ...Ch5 (idea de Ntirlis) y la táctica Cxd5/Ac7 | ...h6 Ah4 Ch5 | descartada: No se puede reconstruir la posición exacta ni la táctica desde la transcripción. Descartada. |
| Orden 3...Ae7 con cambio Af4 y g4 | 3.Cc3 Ae7 4.cxd5 exd5 5.Af4 c6 6.e3 Af5 7.g4 Ae6 | `queens-gambit-declined-l12` · La fuente menciona ...Af5 y g4 como intento crítico. |
| Variante Af4 con ...c5 | 5.Af4 O-O 6.e3 c5 7.dxc5 Axc5 8.Dc2 Cc6 9.a3 Da5 | `queens-gambit-declined-l13` · La fuente la nombra como línea principal alternativa a ...b6. |
| Variante Af4 con ...Cbd7 y c5 | 6.e3 Cbd7 7.c5 c6 8.h3 b6 9.b4 a5 10.a3 Aa6 | `queens-gambit-declined-l14` · La fuente explica c5, ...c6 antes de ...b6 y h3. El final (10.a3 Aa6) es teoría estándar añadida. |
| Variante Af4 con 6.c5 sin e3 (...b6, ...a5, ...Ce4, ...g5) | 6.c5 b6 7.b4 a5 8.a3 Ce4 ... | descartada: La fuente da una secuencia larga muy confusa en la transcripción y con valoraciones tajantes ("las blancas quedan destrozadas"); no se puede verificar con fiabilidad. Descartada. |
| Variante Af4 con ...b6 y Cxd5 Dxd5 (Axc7 Ab4+) | 6.e3 b6 7.cxd5 Cxd5 8.Cxd5 Dxd5 9.Axc7 Ab4+ | descartada: Ideas sueltas (...Aa6, ...Dc8-b7) sin orden claro y con jugadas mal transcritas. Descartada. |
| Variante Af4 con a3 (...c5, Cxd5, Ae5) | 6.e3 Cbd7 7.a3 c5 8.cxd5 Cxd5 9.Cxd5 exd5 10.dxc5 Cxc5 11.Ae5 | `queens-gambit-declined-l15` · Coincide con la fuente; la guía termina en 10...Cxc5 y Ae5 se muestra en un paso explicativo. |
| Estructura de dos islas en el flanco de dama (bxc5) | ...bxc5 en lugar de ...Axc5 | descartada: Concepto de estructura citado de un libro, sin línea concreta reproducible. |
| Esquema catalán con Cc3 (...dxc4, ...Cc6, ...Tb8) | 5.g3 O-O 6.Ag2 dxc4 7.O-O Cc6 8.e4 Tb8 9.d5 exd5 10.exd5 Cb4 | `queens-gambit-declined-l16` · Coincide con la fuente. |
| Catalán con Ce5 inmediato (...Dd6-a6, ...Td8) | 7.Ce5 ... Dd6 ... Da6 ... Td8 | descartada: Línea poco natural y con transcripción confusa (el propio presentador la desaconseja para jugadores de club). Descartada. |
| Sistema con e3 y Ad3 | 4.e3 Ae7 5.Cf3 O-O 6.Ad3 dxc4 7.Axc4 a6 8.O-O b5 9.Ad3 Ab7 10.De2 Cbd7 11.Td1 c5 | `queens-gambit-declined-l17` · Coincide con la fuente; las jugadas blancas de relleno (De2, Td1) son mías. |
| Sistema con b3 | 5.e3 O-O 6.b3 c5 7.Ab2 cxd4 8.exd4 Cc6 9.Ad3 b6 10.O-O Ab7 | `queens-gambit-declined-l18` · Coincide con la fuente. |
| Cambio tardío con el alfil en c1 (...Ag4, ...Ad6) | 5.e3 O-O 6.cxd5 exd5 7.Ad3 c6 8.O-O Ag4 | descartada: Ideas generales sin orden concreto; muy parecido a las guías del Cambio. Descartada. |
| Ragozin (3...Ab4) y error ...Cc6 delante del peón c | 3...Ab4 4.Da4+ Cc6 | descartada: Solo se menciona como ejemplo de idea general; no es una línea de este curso. |

## Gambito de dama aceptado (`queens-gambit-accepted`) · 8 guías

| Línea | Jugadas | Guía / motivo |
|---|---|---|
| Cambio en c5 (7.dxc5) con final sin damas | 1.d4 d5 2.c4 dxc4 3.Cf3 Cf6 4.e3 e6 5.Axc4 c5 6.O-O a6 7.dxc5 Dxd1 8.Txd1 Axc5 9.Cbd2 Ad7 10.Cb3 Ae7 11.Ad2 | `queens-gambit-accepted-l05` · El presentador lo trata como la respuesta más común. La fuente sugiere 7...Axc5; uso el orden estándar 7...Dxd1 8.Txd1 Axc5 y la idea ...Ad7/...Ab5 que menciona. |
| Sistema con 7.a4 (peón aislado) | 7.a4 Cc6 8.De2 cxd4 9.Td1 Ae7 10.exd4 O-O 11.Cc3 | `queens-gambit-accepted-l06` · La fuente describe ...cxd4, Td1, posición de peón aislado y la casilla b4. |
| 7.De2 b5 8.Ab3 Ab7 9.Td1 Cbd7 10.Cc3 | 7.De2 b5 8.Ab3 Ab7 9.Td1 Cbd7 | descartada: Es la línea principal existente (l02). |
| 7.e4, 7.b3 y 7.Cc3 b5 | 7.e4 / 7.b3 / 7.Cc3 b5 | descartada: Solo se mencionan de pasada, sin jugadas concretas que formen una línea. |
| 6...Cc6 (en lugar de 6...a6) | 6.O-O Cc6 7.De2 cxd4 8.Td1 Ae7 | descartada: Según la fuente lleva a las mismas posiciones de peón aislado (transpone a la guía de 7.a4). La transcripción es confusa en el orden. |
| 5...a6 6.O-O b5 (avance acelerado) | 5.Axc4 a6 6.O-O b5 7.Ae2 Ab7 8.a4 b4 9.Cbd2 c5 10.Cc4 | `queens-gambit-accepted-l07` · La fuente lo menciona con ideas de ...Ae7 o ...Ce7; desarrollo la respuesta blanca típica (a4 y Cc4). |
| 3...a6 4.e3 b5 (sistema Christiansen) | 3.Cf3 a6 4.e3 b5 5.a4 Ab7 6.axb5 axb5 7.Txa8 Axa8 8.b3 e6 9.bxc4 bxc4 10.Axc4 Cf6 11.O-O | `queens-gambit-accepted-l08` · La fuente lo nombra como sistema que no iguala del todo; el orden exacto no se da, uso el plan estándar a4/b3. |
| 4...Ag4 | 4.e3 Ag4 5.Axc4 e6 6.h3 Ah5 7.Cc3 Cbd7 8.O-O Ad6 9.e4 | `queens-gambit-accepted-l09` · La fuente dice que es la alternativa más común y que ...c5 es lo más sólido; la continuación concreta es mía, con jugadas estándar. |
| 3.Cf3 Cf6 4.Cc3 a6 | 4.Cc3 a6 5.e4 / 5.a4 Cc6 | descartada: Mencionado brevemente desde el punto de vista negro; para las blancas no es una línea recomendable. |
| 3.e3 e5 | 3.e3 e5 4.Axc4 exd4 5.exd4 Cf6 6.Cf3 Ad6 7.O-O O-O 8.h3 h6 9.Cc3 | `queens-gambit-accepted-l10` · La fuente cita ...Ad6 para evitar Db3 y 7.De2+ como intento más crítico (incluido en un paso explicativo). |
| 3.e4 e5 4.Cf3 exd4 5.Axc4 Cc6 6.O-O Ae6 | 3.e4 e5 4.Cf3 exd4 5.Axc4 Cc6 6.O-O Ae6 7.Axe6 fxe6 8.Db3 Dd7 9.Dxb7 Tb8 10.Da6 Cf6 11.Cbd2 | `queens-gambit-accepted-l11` · Línea principal tradicional que menciona la fuente (...Ae6 devolviendo el peón). |
| 3.e4 e5 4.d5 | 3.e4 e5 4.d5 | descartada: La fuente dice que es un error frecuente en línea, sin continuación clara (la transcripción es confusa); no es buena para las blancas. |
| 3.e4 e5 4.Cf3 con ...Ce7, ...Ab4+ o ...Ac5 | 4.Cf3 exd4 5.Axc4 Ce7 / 4...Ab4+ / 5...Ac5 | descartada: Solo se mencionan sin jugadas; la transcripción no permite reconstruir líneas fiables. |
| 3.e4 Cf6 4.e5 Cd5 5.Axc4 Cb6 | 3.e4 Cf6 4.e5 Cd5 5.Axc4 Cb6 6.Ab3 Cc6 7.Ce2 Af5 8.Cbc3 e6 9.O-O | `queens-gambit-accepted-l12` · La fuente menciona ...Af5 como más preciso; la transcripción habla de "knight D6", que interpreto como ...Cb6. |
| 3.e4 b5, 3.e4 c5 y 3.e4 Cc6 | 3.e4 c5 / 3.e4 Cc6 / ...b5 con ...Db6 | descartada: Mencionadas muy por encima y con transcripción confusa (por ejemplo "Bishop F4 key 5"); no se pueden reconstruir con fiabilidad. |
| 3.Cc3 (con ...a6, ...e5) | 3.Cc3 a6 4.a4 Cc6 / 3.Cc3 e5 | descartada: La fuente lo presenta como un error típico de club; no tiene sentido enseñarlo al bando blanco. |
| Aperturas de flanco (1.Cf3, 1.c4) | 1.Cf3 d5 2.c4 dxc4 / 1.c4 e5 | descartada: No forman parte del gambito de dama para las blancas. |
