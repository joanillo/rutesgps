import 'ol/ol.css';
import {Map, View} from 'ol';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {fromLonLat} from 'ol/proj';
import OSM from 'ol/source/OSM';
import GPX from 'ol/format/GPX';
import VectorSource from 'ol/source/Vector';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import {FullScreen, defaults as defaultControls} from 'ol/control';

//importació
import llista_modalitats from './llista_modalitats.js';
import llista_rutes from './llista_rutes.js';

var body = document.getElementsByTagName("body")[0];
body.addEventListener("load", init(), false);

var map;
var layers;
var vector

function init() {
	carregar_modalitats();
	carregar_rutes();
	carregar_ruta_inicial();
};

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
		x.addEventListener("change", function () { carregar_modalitat(modalitats_arr[i].value,this.checked); }, false);
	}
}

function carregar_rutes() {
	let rutes_arr = llista_rutes();
	let rutes_ul = document.getElementById("rutes");

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
			var ele_ul = document.createElement("UL");
			ele_ul.setAttribute("class", "list-unstyled fw-normal pb-1 small");
			var ele_li2 = document.createElement("LI");
			//ele_li2.innerHTML = "<a href=\"./rutesgps/" + rutes_arr[i].rutes[j].fitxer + "\" class=\"d-inline-flex align-items-center rounded\">" + rutes_arr[i].rutes[j].ruta  + "</a>";
			ele_li2.innerHTML = "<a href=\"#\" class=\"d-inline-flex align-items-center rounded\">" + rutes_arr[i].rutes[j].ruta  + "</a>";
			//ele_li2.addEventListener("click", function () { return confirm(rutes_arr[i].rutes[j].fitxer); }, false);
			ele_li2.addEventListener("click", function () { carregar_ruta(rutes_arr[i].rutes[j].ruta, rutes_arr[i].rutes[j].fitxer); }, false);
			ele_ul.appendChild(ele_li2);
			ele_div.appendChild(ele_ul);
		}

		ele_li.appendChild(ele_div);

		rutes_ul.appendChild(ele_li);
	}
}

function carregar_modalitat(modalitat, valor) {
	console.log(modalitat);
	console.log(valor);
}

function carregar_ruta(ruta, fitxer) {
	//console.log(ruta);
	let titol = document.getElementById("titol_ruta");
	titol.innerHTML = ruta;
	repintar_mapa(fitxer)
}

function carregar_ruta_inicial() {
	let rutes_arr = llista_rutes();
	let num1 = Math.floor(Math.random() * rutes_arr.length);
	let num2 = Math.floor(Math.random()*rutes_arr[num1].rutes.length);
	//console.log(rutes_arr[num1].rutes[num2].ruta);
	let titol = document.getElementById("titol_ruta");
	titol.innerHTML = rutes_arr[num1].rutes[num2].ruta;
	//console.log(rutes_arr[num1].rutes[num2].fitxer);

	pintar_mapa_inicial(rutes_arr[num1].rutes[num2].fitxer);

}

function pintar_mapa_inicial(fitxer) {
	vector = new VectorLayer({
		source: new VectorSource({
			url: './rutesgps/' + fitxer,
			format: new GPX(),
		}),
		style: function (feature) {
		return style[feature.getGeometry().getType()];
		},
	});

	var raster = new TileLayer({
	  source: new OSM()
	})

	layers = [raster];
	layers.push(vector)

	map = new Map({
	  target: 'map',
	  layers: layers,
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
	map.removeLayer(layers[1]); //esborrar la ruta antiga
	layers.pop();
	layers.push(vector);
	map.addLayer(layers[1]); //afegir la ruta nova

	var padding = [50, 50, 50, 50];

	vector.getSource().on('addfeature', function(){
		map.getView().fit(
			vector.getSource().getExtent(),
			{
				size: map.getSize(),
				padding: padding,
			}
		);
	});
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
