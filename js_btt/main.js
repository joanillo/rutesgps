import 'ol/ol.css';
import {Map, View} from 'ol';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {fromLonLat} from 'ol/proj';
import OSM from 'ol/source/OSM';
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

function init() {
	
	carregar_modalitats();
	carregar_modalitat_i_rutes(); //omple la matriu modalitats_actives
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
		x.addEventListener("change", function () { carregar_modalitat_i_rutes(); }, false);
	}
}

function carregar_rutes() {
	let rutes_arr = llista_rutes();
	let rutes_ul = document.getElementById("rutes");

	console.log(modalitats_actives);
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

		ele_li.appendChild(ele_div);

		rutes_ul.appendChild(ele_li);
	}

	//hem d'eliminar les zones que no tenen rutes
	for (let i=rutes_ul.childNodes.length-1;i>=0;i--) {
		if (rutes_ul.childNodes[i].getElementsByTagName("LI").length == 0) rutes_ul.removeChild(rutes_ul.childNodes[i])
	}
}

function carregar_modalitat_i_rutes() {
	//while (modalitats_actives.length) { modalitats_actives.pop(); } //també modalitats_actives = []
	modalitats_actives = []
	let modalitats_div = document.getElementById("modalitats");
	let inputs = modalitats_div.getElementsByTagName("INPUT");
	for (let i=0; i<inputs.length;i++) {
		if (inputs[i].checked==true) modalitats_actives.push(inputs[i].value);
	}

	carregar_rutes();
}

function carregar_ruta(ruta, fitxer, desc) {
	//console.log(ruta);
	let titol_ruta = document.getElementById("titol_ruta");
	let desc_ruta = document.getElementById("desc_ruta");
	titol_ruta.innerHTML = ruta;
	var desc_ruta_arr = desc.split('*');
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

	repintar_mapa(fitxer)
}

function carregar_ruta_inicial() {
	let rutes_arr = llista_rutes();
	let num1 = Math.floor(Math.random() * rutes_arr.length);
	let num2 = Math.floor(Math.random()*rutes_arr[num1].rutes.length);
	//console.log(rutes_arr[num1].rutes[num2].ruta);
	let titol_ruta = document.getElementById("titol_ruta");
	let desc_ruta = document.getElementById("desc_ruta");
	titol_ruta.innerHTML = rutes_arr[num1].rutes[num2].ruta;
	desc_ruta.innerHTML = rutes_arr[num1].rutes[num2].desc;

	var desc_ruta_arr = rutes_arr[num1].rutes[num2].desc.split('*');
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
		controls: defaultControls().extend([new FullScreen()]),
		target: document.getElementById('map'),
		overlays: [overlay],
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
