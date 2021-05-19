Rutes GPS 
--------------
Autor: Joan Quintana (joanillo)
<pre>
$ git clone https://github.com/joanillo/rutesgps.git
$ cd rutesgps
$ npm install
$ npm start
</pre>

open your browser:

http://localhost:1234

script generar_array_rutes.py generates:
<ul>
<li>./js_btt/llista_modalitats.js</li>
<li>./js_btt/llista_rutes.js</li>
</ul>
You must to copy rutesgps/ files into dist/folder.
Don't confuse the name of the app (rutesgps) with the name where de GPX routes are stored (rutesgps/)

to parse correctly your gpx files, it is important to store inside the GPX file an statistical information with this format:
<pre>
	<metadata>
		<name>Bagà-Brocà-Collada Grossa-L'Estret-Riutort</name>
		<desc>BTT*Bagà*baga-broca-collada_grossa-estret-riutort.gpx*2020-06-21*26.8 Km*02:22:47*03:10:57*1179 m*1029 m*747m*1551m*vNOPnVDzrYq</desc>
	</metadata>
</pre>
where:
<ul>
<li>name is the title of the route</li>
<li>BTT is the type of sport (BTT means MTB in Catalan; Hiking; Cyclism; ...)</li>
<li>Bagà is a zone</li>
<li>broca-collada_grossa-estret-riutort.gpx: is the filename</li>
<li>2020-06-21: date</li>
<li>26.8 Km</li>
<li>02:22:47: time without stops</li>
<li>03:10:57: time with stops</li>
<li>1179 m: total ascent</li>
<li>1029 m: total ascent (with smoothness. Several GPS gadgets calculate ascent differently. It is not easy to calculate).</li>
<li>747m: minimal elevation</li>
<li>1551m: maximal elevation</li>
<li>vNOPnVDzrYq: Relieve id (if exists)</li>
</ul>

