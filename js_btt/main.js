import 'ol/ol.css';
import {Map, View} from 'ol';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {fromLonLat} from 'ol/proj';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ'; //necessari per topotresc, ICGC
import GPX from 'ol/format/GPX';
import VectorSource from 'ol/source/Vector';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import Overlay from 'ol/Overlay';
import {FullScreen, defaults as defaultControls} from 'ol/control';

//exemple: https://openlayers.org/en/latest/examples/select-features.html?q=select+feature
import Select from 'ol/interaction/Select';
import {altKeyOnly, click, pointerMove} from 'ol/events/condition';

//importació
import llista_modalitats from './llista_modalitats.js';
import llista_rutes from './llista_rutes.js';

var container = document.getElementById('tooltip');
var content = document.getElementById('tooltip-content');

var overlay = new Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250,
  },
});

var body = document.getElementsByTagName("body")[0];
body.addEventListener("load", init(), false);

var map;
var layers;
var vector

let modalitats_actives = [];
let todo_checked;

function init() {
	
	carregar_rasters();
	carregar_modalitats();
	carregar_modalitat_i_rutes(); //omple la matriu modalitats_actives
	carregar_ruta_inicial();

	document.getElementById("perfil").addEventListener("click", function () { mostrar_perfil(); }, false);
	document.getElementById("0_OSM").addEventListener("click", function () { canviar_render("0_OSM"); }, false);
	document.getElementById("1_ORTO").addEventListener("click", function () { canviar_render("1_ORTO"); }, false);
	document.getElementById("2_TOPOTRESC").addEventListener("click", function () { canviar_render("2_TOPOTRESC"); }, false);
	document.getElementById("3_ICGC").addEventListener("click", function () { canviar_render("3_ICGC"); }, false);
};

function carregar_rasters() {

	var raster_OSM = new TileLayer({
	  source: new OSM()
	})

	var raster_TOPOTRESC = new TileLayer({
	  source: new XYZ({
	    url: 'https://api.topotresc.com/tiles/{z}/{x}/{y}',
	    attributions: 'Map data <a href="https://www.topotresc.com/" target="_blank">TopoTresk</a> by <a href="https://github.com/aresta/topotresc" target="_blank">aresta</a>',
	  }),
	})

	//https://openicgc.github.io/
	//ortofoto: https://geoserveis.icgc.cat/icc_mapesmultibase/noutm/wmts/orto/GRID3857/{z}/{x}/{y}.jpeg
	//topogràfic clàssic: https://geoserveis.icgc.cat/icc_mapesmultibase/noutm/wmts/topo/GRID3857/{z}/{x}/{y}.jpeg
	//hi ha més possibilitats

	var raster_ORTO = new TileLayer({
	  source: new XYZ({
	    url: 'https://geoserveis.icgc.cat/icc_mapesmultibase/noutm/wmts/orto/GRID3857/{z}/{x}/{y}.jpeg',
	    attributions: 'Institut Cartogràfic i Geològic de Catalunya -ICGC',
	  }),
	})

	var raster_ICGC = new TileLayer({
	  source: new XYZ({
	    url: 'https://geoserveis.icgc.cat/icc_mapesmultibase/noutm/wmts/topo/GRID3857/{z}/{x}/{y}.jpeg',
	    attributions: 'Institut Cartogràfic i Geològic de Catalunya -ICGC',
	  }),
	})


	layers = [raster_OSM, raster_ORTO, raster_TOPOTRESC, raster_ICGC];
}

function carregar_modalitats() {
	let modalitats_arr = llista_modalitats();
	let modalitats_div = document.getElementById("modalitats");
	let str = "";

	for (let i=0; i<modalitats_arr.length;i++) {
		var lbl = document.createElement("label");
		var br = document.createElement("BR");
		lbl.setAttribute("value", modalitats_arr[i].value);
		lbl.innerText = modalitats_arr[i].modalitat;
		var x = document.createElement("INPUT");
		x.setAttribute("type", "checkbox");
		x.setAttribute("value", modalitats_arr[i].value);
		x.setAttribute("id", modalitats_arr[i].id);
		x.setAttribute("checked", true);
		modalitats_div.appendChild(document.createTextNode('\u00A0'));
		modalitats_div.appendChild(document.createTextNode('\u00A0'));
		modalitats_div.appendChild(document.createTextNode('\u00A0'));
		modalitats_div.appendChild(x);
		modalitats_div.appendChild(document.createTextNode('\u00A0'));
		modalitats_div.appendChild(document.createTextNode('\u00A0'));
		modalitats_div.appendChild(lbl);
		modalitats_div.appendChild(br);
		x.addEventListener("change", function () { carregar_modalitat_i_rutes(); }, false);
	}

	var hr = document.createElement("HR");
	modalitats_div.appendChild(hr);

	//crear label ToDo
	var lbl = document.createElement("label");
	var br = document.createElement("BR");
	lbl.setAttribute("value", "ToDo");
	lbl.innerText = "ToDo";
	var x = document.createElement("INPUT");
	x.setAttribute("type", "checkbox");
	x.setAttribute("value", "true");
	x.setAttribute("id", "ToDo");
	x.setAttribute("checked", true);
	modalitats_div.appendChild(document.createTextNode('\u00A0'));
	modalitats_div.appendChild(document.createTextNode('\u00A0'));
	modalitats_div.appendChild(document.createTextNode('\u00A0'));
	modalitats_div.appendChild(x);
	modalitats_div.appendChild(document.createTextNode('\u00A0'));
	modalitats_div.appendChild(document.createTextNode('\u00A0'));
	modalitats_div.appendChild(lbl);
	modalitats_div.appendChild(br);
	x.addEventListener("change", function () { carregar_modalitat_i_rutes(); }, false);

	var hr = document.createElement("HR");
	modalitats_div.appendChild(hr);
}

function carregar_modalitat_i_rutes() {
	//while (modalitats_actives.length) { modalitats_actives.pop(); } //també modalitats_actives = []
	modalitats_actives = []
	let modalitats_div = document.getElementById("modalitats");
	let inputs = modalitats_div.getElementsByTagName("INPUT");
	for (let i=0; i<inputs.length;i++) {
		if (inputs[i].checked==true) modalitats_actives.push(inputs[i].value);
	}
	todo_checked = document.getElementById("ToDo").checked;
	carregar_rutes();
}

function carregar_rutes() {
	let rutes_arr = llista_rutes();
	let rutes_ul = document.getElementById("rutes");

	//console.log(modalitats_actives);
	//primer, eliminem totes les rutes
	while (rutes_ul.firstChild) {
		rutes_ul.removeChild(rutes_ul.lastChild);
	}

	for (let i=0; i<rutes_arr.length;i++) {
		var ele_li = document.createElement("LI");
		ele_li.setAttribute("class", "mb-1");

		var ele_bt = document.createElement("BUTTON");
		ele_bt.setAttribute("class", "btn d-inline-flex align-items-center rounded collapsed");
		ele_bt.setAttribute("data-bs-toggle", "collapse");
		ele_bt.setAttribute("data-bs-target", "#" + rutes_arr[i].id + "-collapse");
		ele_bt.setAttribute("aria-expanded", "false");
		ele_bt.innerText = rutes_arr[i].zona;
		ele_li.appendChild(ele_bt);

		var ele_div = document.createElement("DIV");
		ele_div.setAttribute("class", "collapse");
		ele_div.setAttribute("id", rutes_arr[i].id + "-collapse");

		for (let j=0; j<rutes_arr[i].rutes.length;j++) {
			//ToDo: quan està marcat es mostren els ToDo (si està desmarcat, es mostren només les rutes que he fet)
			if (todo_checked || rutes_arr[i].rutes[j].ruta.indexOf("ToDo") == -1) {
			//només he de mostrar les modalitats seleccionades
			if (modalitats_actives.includes(rutes_arr[i].rutes[j].desc.split("*")[0].toLowerCase())) {
				var ele_ul = document.createElement("UL");
				ele_ul.setAttribute("class", "list-unstyled fw-normal pb-1 small");
				var ele_li2 = document.createElement("LI");
				//ele_li2.innerHTML = "<a href=\"./rutesgps/" + rutes_arr[i].rutes[j].fitxer + "\" class=\"d-inline-flex align-items-center rounded\">" + rutes_arr[i].rutes[j].ruta  + "</a>";
				ele_li2.innerHTML = "<a href=\"#\" class=\"d-inline-flex align-items-center rounded\">" + rutes_arr[i].rutes[j].ruta  + "</a>";
				//ele_li2.addEventListener("click", function () { return confirm(rutes_arr[i].rutes[j].fitxer); }, false);
				ele_li2.addEventListener("click", function () { carregar_ruta(rutes_arr[i].rutes[j].ruta, rutes_arr[i].rutes[j].fitxer, rutes_arr[i].rutes[j].desc); }, false);
				ele_ul.appendChild(ele_li2);
				ele_div.appendChild(ele_ul);
			}
			}
		}

		ele_li.appendChild(ele_div);

		rutes_ul.appendChild(ele_li);
	}

	//hem d'eliminar les zones que no tenen rutes
	for (let i=rutes_ul.childNodes.length-1;i>=0;i--) {
		if (rutes_ul.childNodes[i].getElementsByTagName("LI").length == 0) rutes_ul.removeChild(rutes_ul.childNodes[i])
	}
}


function carregar_ruta(ruta, fitxer, desc) {
	//console.log(ruta);
	let titol_ruta = document.getElementById("titol_ruta");
	let desc_ruta = document.getElementById("desc_ruta");
	var desc_ruta_arr = desc.split('*');
	var str_img = "<img src='./img/" + desc_ruta_arr[0].toLowerCase() + "_64.png'>&nbsp;";
	//console.log(str_img)
	titol_ruta.innerHTML = str_img + ruta;


	var str = "";
	str = changeDateFormat(desc_ruta_arr[3])
	str = str + " - " + desc_ruta_arr[4] + " - " + desc_ruta_arr[5] + " h" + " - " + desc_ruta_arr[8] +  " - (" + desc_ruta_arr[9] + " " + "&rarr;" + " " + desc_ruta_arr[10] + ")";
	desc_ruta.innerHTML = str;

	var relieve = desc_ruta_arr[11]
	let relieve_div = document.getElementById("relieve");
	if (relieve != "") {
		relieve_div.href = "https://www.relive.cc/view/" + relieve;
		relieve_div.style.display = "block";
	} else {
		relieve_div.href = "";
		relieve_div.style.display = "none";
	} 

	let id_download = document.getElementById("download");
	id_download.href = "./rutesgps/" + fitxer;
	console.log(fitxer)
	repintar_mapa(fitxer)
}

function carregar_ruta_inicial() {
	let rutes_arr = llista_rutes();
	let num1 = Math.floor(Math.random() * rutes_arr.length);
	let num2 = Math.floor(Math.random()*rutes_arr[num1].rutes.length);
	//console.log(rutes_arr[num1].rutes[num2].ruta);

	let titol_ruta = document.getElementById("titol_ruta");
	let desc_ruta = document.getElementById("desc_ruta");
	var desc_ruta_arr = rutes_arr[num1].rutes[num2].desc.split('*');
	var str_img = "<img src='./img/" + desc_ruta_arr[0].toLowerCase() + "_64.png'>&nbsp;";
	titol_ruta.innerHTML = str_img + rutes_arr[num1].rutes[num2].ruta;

	var str = "";
	str = changeDateFormat(desc_ruta_arr[3])
	str = str + " - " + desc_ruta_arr[4] + " - " + desc_ruta_arr[5] + " h" + " - " + desc_ruta_arr[8] +  " - (" + desc_ruta_arr[9] + " " + "&rarr;" + " " + desc_ruta_arr[10] + ")";
	desc_ruta.innerHTML = str;

	var relieve = desc_ruta_arr[11]
	let relieve_div = document.getElementById("relieve");
	if (relieve != "") {
		relieve_div.href = "https://www.relive.cc/view/" + relieve;
		relieve_div.style.display = "block";
	} else {
		relieve_div.href = "";
		relieve_div.style.display = "none";
	} 

	let id_download = document.getElementById("download");
	id_download.href = "./rutesgps/" + rutes_arr[num1].rutes[num2].fitxer;

	pintar_mapa_inicial(rutes_arr[num1].rutes[num2].fitxer);

}

function pintar_mapa_inicial(fitxer) {

	var vector = new VectorLayer({
		source: new VectorSource({
			url: './rutesgps/' + fitxer,
			format: new GPX(),
		}),
		style: function (feature) {
		return style[feature.getGeometry().getType()];
		},
	});
	
	layers.push(vector)

	map = new Map({
		controls: defaultControls().extend([new FullScreen()]),
		target: document.getElementById('map'),
		overlays: [overlay],
		layers: [layers[0], layers[4]], //per defecte OSM
		view: new View({
			center: fromLonLat([1.9858, 41.9176]), //per tal de què funcioni el fit, previ s'ha de pintar la ruta
			zoom: 12
		})
	});

	var padding = [50, 50, 50, 50]

	vector.getSource().on('addfeature', function(){
		map.getView().fit(
			vector.getSource().getExtent(),
			{
				size: map.getSize(),
				padding: padding,
			}
		);
	});

	pintar_relleu(fitxer);
}

function repintar_mapa(fitxer) {
	vector = new VectorLayer({
		source: new VectorSource({
			url: './rutesgps/' + fitxer,
			format: new GPX(),
		}),
		style: function (feature) {
		return style[feature.getGeometry().getType()];
		},
	});

	//treure l'anterior element (l'anterior ruta), i afegir el nou
	map.removeLayer(layers[4]); //esborrar la ruta antiga
	layers.pop();
	layers.push(vector);
	map.addLayer(layers[4]); //afegir la ruta nova

	var padding2 = [50, 50, 50, 50];

	vector.getSource().on('addfeature', function(){
		map.getView().fit(
			vector.getSource().getExtent(),
			{
				size: map.getSize(),
				padding: padding2,
			}
		);
	});

	pintar_relleu(fitxer);
}

function repintar_mapa_render(id_render,fitxer) {
	vector = new VectorLayer({
		source: new VectorSource({
			url: './rutesgps/' + fitxer,
			format: new GPX(),
		}),
		style: function (feature) {
		return style[feature.getGeometry().getType()];
		},
	});


	//elimino les dues capes que hi ha (el render i la ruta)
	//https://stackoverflow.com/questions/40862706/unable-to-remove-all-layers-from-a-map/41566755
	map.getLayers().forEach(function (layer) {
    	map.removeLayer(layer);
	});
	//for some crazy reason I need to do it twice.
	map.getLayers().forEach(function (layer) {
	    map.removeLayer(layer);
	});

	map.addLayer(layers[id_render]); //afegeixo el render

	layers.pop(); //trec la ruta i afegeixo la nova ruta
	layers.push(vector);
	map.addLayer(layers[4]); //afegir la ruta nova

	var padding2 = [50, 50, 50, 50];

	vector.getSource().on('addfeature', function(){
		map.getView().fit(
			vector.getSource().getExtent(),
			{
				size: map.getSize(),
				padding: padding2,
			}
		);
	});

	pintar_relleu(fitxer);
}

var style = {
  'Point': new Style({
    image: new CircleStyle({
      fill: new Fill({
        color: 'rgba(100,100,100,.8)',
      }),
      radius: 3,
      stroke: new Stroke({
        color: '#000000',
        width: 2,
      }),
    }),
  }),
  'LineString': new Style({
    stroke: new Stroke({
      color: '#f00',
      width: 3,
    }),
  }),
  'MultiLineString': new Style({
    stroke: new Stroke({
      color: '#000000',
      width: 3,
    }),
  }),
};

function changeDateFormat(inputDate){  // expects Y-m-d
    var splitDate = inputDate.split('-');
    if(splitDate.count == 0){
        return null;
    }

    var year = splitDate[0];
    var month = splitDate[1];
    var day = splitDate[2]; 

    return day + '/' + month + '/' + year;
}

map.on("pointermove", function(e) {
  var coordinate = e.coordinate;
  var features = [];
  map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
    //if (feature.values_.name != undefined) {
    if (feature.getGeometry().getType()=="Point") features.push(feature);

	if (features.length > 0) {
		var info = features[0].get('name');
		container.style.visibility="visible";
		content.innerHTML = info;
		map.getTarget().style.cursor = 'pointer';
		overlay.setPosition(coordinate);
		setTimeout(function(){ tancar_tooltip(); }, 500);

	} else {
		map.getTarget().style.cursor = '';	
	}

  })
});

function tancar_tooltip() {
  container.style.visibility = "hidden";
}

function pintar_relleu(fitxer) {

	//d3/exemple7.html
	//------------------------1. PREPARATION------------------------//
	//-----------------------------SVG------------------------------// 
	const width = 370;
	const height = 180;
	const margin = 0;
	const padding = 0;
	const adj = 35;

	//primer elimino els SVG que hi puguin haver
	d3.select("div#relleu").selectAll('*').remove()
	// we are appending SVG first
	const svg = d3.select("div#relleu").append("svg")
	    .attr("preserveAspectRatio", "xMinYMin meet")
	    .attr("viewBox", "-"
	          + adj + " -"
	          + adj + " "
	          + (width + 3*adj ) + " "
	          + (height + 3*adj))
	    .style("padding", padding)
	    .style("margin", margin)
	    .classed("svg-content", true);
	    //console.log(fitxer);
	    fitxer = "./rutesgps/" + fitxer.replace(".gpx",".json")

		const dataset2 = d3.json(fitxer).then(function(data) {
			//console.log(data);

		    //----------------------------SCALES----------------------------//
		    const xScale = d3.scaleLinear().rangeRound([0,width]);
		    const yScale = d3.scaleLinear().rangeRound([height, 0]);
		    xScale.domain(d3.extent(data, function(d){
		        return d.num}));

		    yScale.domain([
		        d3.min(data, function(c) {
		        return c.ele-20;
		        }), 
		        d3.max(data, function(c) {
		        return c.ele+20;
		        })
		    ]);


		    //-----------------------------AXES-----------------------------//
		    const yaxis = d3.axisLeft()
		        //.ticks((slices[0].values).length)
		        .ticks(10)
		        .scale(yScale);

		    const xaxis = d3.axisBottom()
		        //.ticks(d3.timeDay.every(1))
		        //.tickFormat(d3.timeFormat('%b %d'))
		        .ticks(5)
		        .scale(xScale);

		    //----------------------------LINES-----------------------------//
		    const line = d3.line()
		        .x(function(d) { return xScale(d.num); })
		        .y(function(d) { return yScale(d.ele); })
		        //.curve(d3.curveMonotoneX); // apply smoothing to the line

		    //-------------------------2. DRAWING---------------------------//
		    //-----------------------------AXES-----------------------------//
		    svg.append("g")
		        .attr("class", "axis")
		        .attr("transform", "translate(0," + height + ")")
		        .call(xaxis)
			    .append("text")
			    //.attr("transform", "rotate(-90)")
			    .attr("dy", "1.3em")
			    .attr("y", 2)
			    .attr("dx", "30em")
			    .style("text-anchor", "start")
			    .text("Km");

		    svg.append("g")
		        .attr("class", "axis")
		        .call(yaxis)

		    //----------------------------LINES-----------------------------//
		    const lines = svg.selectAll("lines")
		        .data(data)
		        .enter()
		        .append("g");

		        lines.append("path")
		        .attr("class", "line-0")
		        .attr("d", function(d) { return line(data); });

		});
}

function mostrar_perfil() {	
	if (document.getElementById("relleu").style.visibility == "hidden") {
		document.getElementById("relleu").style.visibility = "visible";
	} else {
		document.getElementById("relleu").style.visibility = "hidden";
	}
}

function canviar_render(tipus_render) {	
	console.log(tipus_render);
	//console.log(document.getElementById("OSM").getAttribute("class"))
	document.getElementById("0_OSM").setAttribute("class", "btn btn-sm btn-bd-light mb-2 mb-md-0")
	document.getElementById("1_ORTO").setAttribute("class", "btn btn-sm btn-bd-light mb-2 mb-md-0")
	document.getElementById("2_TOPOTRESC").setAttribute("class", "btn btn-sm btn-bd-light mb-2 mb-md-0")
	document.getElementById("3_ICGC").setAttribute("class", "btn btn-sm btn-bd-light mb-2 mb-md-0")

	document.getElementById(tipus_render).setAttribute("class", "btn btn-sm btn-bd-primary mb-2 mb-md-0")
	;
	//let fitxer = document.getElementById("download").href.replace("./rutesgps/", "");
	let cad = document.getElementById("download").href;
	let fitxer = cad.substring(cad.indexOf("rutesgps/")+9, cad.length);
	let id_render = parseInt(tipus_render.substr(0,1))
	repintar_mapa_render(id_render,fitxer);

}