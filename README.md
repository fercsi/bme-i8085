# i8085sim - a Processor Simulator for i8085

_2007-2014_

`i8085sim` has been created as a practicing tool for Budapest University of Technology and Economics
electrical engineering students. Following text is therefore in Hungarian (yet). Technology has not been updated since 2007, so forgive me for this :).

## Előszó

Az alábbi súgó szép lassacskán készül. A használat remélhetőleg magától értetődő. Elsősorban azt próbáltam itt leírni, ami nem feltétlenül triviális.

A rendszer futtatásához elsősorban Firefox 2.0 ill. 3.0 verziók használata javasolt. Internet Explorer alatt a böngésző erőforrásainak gyenge kezelése miatt a rendszer lassan működhet.

## Programkód betöltése

A processzorhoz kapcsolódó memóriába három módon tölthetünk be kódot:

* Saját kód feltöltése ("Import file into i8085 Simulator"): Lehet assembly forráskód, vagy egy fordító ihx (intel hex) típusú kimenete.
* Közvetlen assembly forrás bevitele online formában ("Direct assembly"). Csak egyszerű kódrészletek tesztelésére javasolt.
* Előre feltöltött példaprogramok betöltése és futtatása, illetve azok forráskódjának megtekintése ("Online Examples").

## Modulok

A szimulátor beépülő modulok segítségével lehetővé teszi különféle (szintén szimulált) hardveregységek illesztését a processzorhoz. Az alábbiakban ismertetjük a jelenleg implementált modulokat.

A modulok használata érdekében a fordító program feldolgozza és kezeli az erre a célra kialakított `#import` pragmát, amely segítségével kérhetjük a szimulátort, hogy az adott hálózatot illessze a processzorhoz. pl: `#import Seg7`

Mivel az egyes modulok megjelenítése külön ablakban történik, ezt a böngészőben engedélyezni kell, majd újr be kell tölteni a szimulátort.

### SwLed

Egy ki-bemeneti modul, amely tartalmaz egy kapcsolósort, és egy kimeneti regisztert, amelyen 8 ledet helyeztünk el. A modul a `00H` I/O címen érhető el olvasásra és írásra is. A kapcsolók ON állásban "1" értéket adnak. Az 1-es számú kapcsoló a 7. bitre van kötve, míg a 8-as a 0.-ra. A ledek "1" érték esetén világítanak.

### Seg7

Hét szegmenses kijelző, amely 6 számjegyet tartalmaz. Az eszköz a `D0-D5` I/O-címeken érhető el. Minden cím egy-egy számjegynek felel meg. Az egyes bitek értéke a hozzá tartozó szegmens állapotát jelzik, ahol "1" érték esetén jelenik meg fény. A szegmensek bitkoisztása a következő: dp g f e d c b a:

### Screen

Karakteres megjelenítő, amely egy 80x25 karakterfelbontású képernyőt szimulál. A képernyő elérhető a `8000H-87CFH` memóriacímeken. Minden bájt egy-egy karakternek felel meg. Az eszköz karakterkódolása az ISO-8859-1 kódolásnak felel meg.

## Beállítások

A beállításokhoz kattintsunk a fő menü "Config" gombjára. Ott az alábbi lehetőségek közül választhatunk.

### CPU Frequency

A processzor belső órajele MHz-ben. Ez a 8085 CLKOUT jelének megfelelő frekvencia, vagyis a gépi ciklus alap órajele.

### Code Start at

A disassembler mezőben található kódok kezdőcíme. Az online rendszerek erőteljes korlátozásai miatt a rendszer a kódnak csak egy részletét elemzi. Itt adhatjuk meg az elemzés kezdőcímét. Amennyiben az érték mellett elhelyezkedő mezőt bekattintjuk, az elemzés minden esetben az PC aktuális értékénél kezdődik.

### Code Size

Az elmezni kívánt adatterület mérete. Amennyiben ezt túl nagyra állítjuk, a böngésző erőteljesen belassulhat, vagy akár le is fagyhat.

### Stack Size

A megjeleníteni kívánt stack-méret duplaszóban.

### Show Bus Activity

A futás közbeni buszműveleteket és a regiszterek változását megjeleníti. Megjegyzendő, hogy a megváltozott regiszterek értéke csak a következő buszműveletben jelenik meg (mivel a buszművelet alatt még a korábbi értéket tartalmazzák).

### Follow Code

A segítségével folyamatosan követhetők a változások a processzorban futtatás esetén. Ezt alkalmazva nagy mértékben lelassul a szimulált gép sebessége.


