/* Constantes */
var delta = 0.05;
var max_factor = 3.0;
var min_factor = 0.05;

/* Nome do pais, quantidade medida
 */
var countries = [];


/* Vetor contendo as coordenadas dos paises (caso ja tenha sido calculado) */
var coordinates = new Array();
/* Vetor de booleanos para dizer se o endereco ja foi calculado */
var geocoded = new Array();
var order = new Array();
var radius = new Array();
var signal = new Array();
var depth = new Array();
var number_geocoded = 0;
var image_size = 130;
var query_location = new google.maps.LatLng(0, 0);
var not_found = ""
var geocoder;
var map;
var markersFillArray = new Array();
var markersStrokeArray = new Array();
var visible = new Array();
var coordinates = new Array();
var ncities = 0;
var population = new Array();
var maxcities = 0;
var fator = 0.5;

var filter_active;
var filtered = new Array();

function LoadFile(lat, lng, q){
    coordinates[ncities] = new google.maps.LatLng(lat, lng);
    population[ncities] = q;
    ncities += 1;
    document.getElementById("maxcities").value=ncities;
    return true;
}

function pausecomp(millis){
    var date = new Date();
    var curDate = null;

    do { curDate = new Date(); } 
    while(curDate-date < millis);
}

function FirstInit(first_scale){

    /* Calcula o vetor de intensidades normalizadas */
    var max_val = 0;
    for (var i = 0; i < population.length; i++)
	max_val = Math.max(max_val, population[i])

    for (var i = 0; i < population.length; i++)
	radius[i] = Math.sqrt(population[i]/max_val)
    
    /* Ordena os paises por intensidade */
    order = new Array();
    for (var i = 0; i < population.length; i++)
	order.push([1.0 -radius[i], i])
    order.sort()

    /* Atualiza o vetor de paises */
    for (var i=0; i < population.length; i++)
	depth[ order[i][1] ] = i

    filter_active = 0;

    /* Habilita todos os botoes de ação */
    document.getElementById("polygon_button").disabled=false;
    document.getElementById("filter_button").disabled=false;


    initialize();
}

function initialize() {

    var myOptions = {
	zoom: 2,
	center: new google.maps.LatLng(0, 0),
	mapTypeId: google.maps.MapTypeId.ROADMAP,
	disableDoubleClickZoom: true,
        //		navigationControl: false,
	scrollwheel: false,
    }
    map = new google.maps.Map(document.getElementById("map_canvas"),
		              myOptions);

    Update(); 
}
function Update(){

    /* Le o numero maximo de cidades M e só imprime as M primeiras */
    maxcities = document.getElementById("maxcities").value;		
    for(var i=0; i<ncities; i++)
	visible[i] = 0;

    document.getElementById("limit_exceeded").innerHTML = "";
    for(var i=0, j = 0; j<maxcities && i<ncities; i++){
	if(!filter_active || (filter_active && filtered[i] == 0)){
	    j++;	
	    visible[i] = 1;
	}
	if (i+1 == ncities && j < maxcities){						
	    document.getElementById("limit_exceeded").innerHTML = "(Exibindo apenas " + j + " discos).";
	}
    }
    /* Le o fator de escala atual */
    fator = document.getElementById("propfactor").value;

    setMarkers(map);
}

function IncreaseRadius(){

    var tmp = parseFloat(document.getElementById("propfactor").value)
    document.getElementById("propfactor").value = Math.min(tmp + delta, max_factor).toFixed(2);
    Update()
}
function DecreaseRadius(){
    
    var tmp = parseFloat(document.getElementById("propfactor").value)
    document.getElementById("propfactor").value = Math.max(tmp - delta, min_factor).toFixed(2);
    Update()
}

function ClearMarkers(myArray){
    if (myArray) {
	for (i in myArray) {
	    myArray[i].setMap(null);
	}
    }
}

function SetMarker(map, id, location){

    var size = radius[id]*image_size*fator;

    var img_path;
    img_path = 'img/circle_gray.png';
    var image = new google.maps.MarkerImage(img_path,
		                            /* Tamanho da imagem original */
		                            new google.maps.Size(image_size, image_size),
       		                            /* The origin for this image is 0,0. */
		                            new google.maps.Point(0,0),
		                            /* Centro da imagem */
		                            new google.maps.Point(size/2, size/2),
		                            /* Tamanho da imagem no mapa */
		                            new google.maps.Size(size, size)
	                                   );
    var border = new google.maps.MarkerImage('img/circle_black.png',
		                             new google.maps.Size(image_size, image_size),
       		                             /* The origin for this image is 0,0. */
		                             new google.maps.Point(0,0),
		                             /* Centro da imagem */
		                             new google.maps.Point(size/2 + 1, size/2 + 1),
		                             /* Tamanho da imagem no mapa */
		                             new google.maps.Size(size + 2, size + 2)	
	                                    );
    var marker = new google.maps.Marker({
	map: map, 
     	position: location,
	icon: image,
	/* Profundidade do circulo */
	zIndex: depth[id]*2,
	clickable: false,
    });
    markersFillArray.push(marker);
    var marker = new google.maps.Marker({
	map: map, 
     	position: location,
	icon: border,
	/* Profundidade do circulo */
	zIndex: depth[id]*2 - 1,
	clickable: false,
    });
    markersStrokeArray.push(marker);
}

function setMarkers(map) {
    ClearMarkers(markersFillArray);
    ClearMarkers(markersStrokeArray);

    for (var i = 0; i < coordinates.length; i++) {
	if(visible[i] == 1){
	    SetMarker(map, i, coordinates[i])
	}
    }
}

/*****************************************************************************
 * Dados relacionados ao traçador de poligonos
 ****************************************************************************/

var polygon_coordinates = new Array();
var polygon_pixel_coordinates = new Array();
var polygon_size;
var polygon;
var eps = 1e-8;

function AllowPolygon(){

    polygon_size = 0
    document.getElementById("polygon_button").disabled=true;

    /* Inicializa poligono */	
    polygon = new google.maps.Polygon({
	map: map,
	strokeWeight: 1,
	fillColor: "#FFD700",
	strokeColor: "#FFD700",
    });
    /* Adiciona os listeners */
    google.maps.event.addListener(map, 'click', function(event) {
      	polygon_coordinates[polygon_size++] = event.latLng;
	Draw()
    });
    google.maps.event.addListener(polygon, 'click', function(event) {
      	polygon_coordinates[polygon_size++] = event.latLng;
	Draw()
    });
    /* Evento para 'fechar' o polígono */
    google.maps.event.addListener(polygon, 'rightclick', function(event) {
	/* Limpa todos os listeners */
	google.maps.event.clearListeners(map, "mousemove");
	google.maps.event.clearListeners(map, "click");
	google.maps.event.clearListeners(polygon, "click");
	google.maps.event.clearListeners(map, "rightclick");
	google.maps.event.clearListeners(polygon, "rightclick");

	/* Converte as coordenadas do polígono para coordenadas de pixel */
	ConvertPolygonCoordinates();
    });
    google.maps.event.addListener(map, 'rightclick', function(event) {
	/* Limpa todos os listeners */
	google.maps.event.clearListeners(map, "mousemove");
	google.maps.event.clearListeners(map, "click");
	google.maps.event.clearListeners(polygon, "click");
	google.maps.event.clearListeners(map, "rightclick");
	google.maps.event.clearListeners(polygon, "rightclick");

	/* Converte as coordenadas do polígono para coordenadas de pixel */
	ConvertPolygonCoordinates();
    });
    google.maps.event.addListener(map, 'mousemove', function(event) {
      	polygon_coordinates[polygon_size] = event.latLng;
	Draw()
    });
}
/* Atualiza o desenho do poligono no mapa */
function Draw(){
    polygon.setPath(polygon_coordinates);
}
/* Converte coordenadas dos vértices do polígono de (lat,lng) para pixel (x,y) */
function ConvertPolygonCoordinates(){
    for (var i=0; i<polygon_coordinates.length; i++){
	polygon_pixel_coordinates[i] = GetPixelCoordinates(polygon_coordinates[i]);
    }
}
/* Verifica a orientacao do vetor(b-a) em relacao ao vetor (c-a) 
   ccw = 1, cw = -1, colinear = 0
*/
function Ccw(a, b, c){
    var aux1 = new google.maps.Point(b.x - a.x, b.y - a.y); //b-a
    var aux2 = new google.maps.Point(c.x - a.x, c.y - a.y); //c-a
    var res = aux1.x * aux2.y - aux1.y * aux2.x;
    return res > eps ? 1 : res < -eps ? -1 : 0;
}
/* Decide se o ponto q esta entre os pontos a e b */
function Between(q, a, b){
    var dot = (a.x - q.x)*(b.x - q.x) + (a.y - q.y)*(b.y - q.y);
    return (Ccw(q, a, b) == 0 && dot <= -eps);
}
/* Decide se o ponto esta dentro do poligono simples */
function PointInsidePolygon(p){
    var n = polygon_pixel_coordinates.length
    var cross = 0
    for (var i=1; i<=n; i++){
	var q = polygon_pixel_coordinates[i-1];
	var r = polygon_pixel_coordinates[i%n];
	//alert(r + ', q: ' + q + ', p: ' + p)
	if (Between(p, q, r)){
	    alert('between')
	    return 1;
	}
	if (q.y > r.y){
	    var tmp = q;
	    q = r;
	    r = tmp;
	}
	if (q.y < p.y && r.y >= p.y && Ccw(p, q, r) > 0) cross++;
    }
    return cross % 2;
}
/* Remove os markers que estão fora do polígono */
function FilterRegion(){
    var inside = 0
    var outside = 0
    filter_active = 1;
    for (var i=0; i<coordinates.length; i++){		
	if (PointInsidePolygon(GetPixelCoordinates(coordinates[i]))){
	    inside++;
	    filtered[i] = 0;
	}
	else {
	    /* Remove o simbolo do mapa */
	    outside++;
	    filtered[i] = 1;			
	}
    }	
    Update();
}

var MERCATOR_RANGE = 256;

/* Código obtido de:
   view-source:http://code.google.com/apis/maps/documentation/javascript/examples/map-coordinates.html
*/
function bound(value, opt_min, opt_max) {
    if (opt_min != null) value = Math.max(value, opt_min);
    if (opt_max != null) value = Math.min(value, opt_max);
    return value;
}

function degreesToRadians(deg) {
    return deg * (Math.PI / 180);
}

function radiansToDegrees(rad) {
    return rad / (Math.PI / 180);
}

function MercatorProjection() {
    this.pixelOrigin_ = new google.maps.Point(
	MERCATOR_RANGE / 2, MERCATOR_RANGE / 2);
    this.pixelsPerLonDegree_ = MERCATOR_RANGE / 360;
    this.pixelsPerLonRadian_ = MERCATOR_RANGE / (2 * Math.PI);
};

MercatorProjection.prototype.fromLatLngToPoint = function(latLng, opt_point) {
    var me = this;

    var point = opt_point || new google.maps.Point(0, 0);
    
    var origin = me.pixelOrigin_;
    point.x = origin.x + latLng.lng() * me.pixelsPerLonDegree_;
    // NOTE(appleton): Truncating to 0.9999 effectively limits latitude to
    // 89.189.  This is about a third of a tile past the edge of the world tile.
    var siny = bound(Math.sin(degreesToRadians(latLng.lat())), -0.9999, 0.9999);
    point.y = origin.y + 0.5 * Math.log((1 + siny) / (1 - siny)) * -me.pixelsPerLonRadian_;
    return point;
};

MercatorProjection.prototype.fromPointToLatLng = function(point) {
    var me = this;
    
    var origin = me.pixelOrigin_;
    var lng = (point.x - origin.x) / me.pixelsPerLonDegree_;
    var latRadians = (point.y - origin.y) / -me.pixelsPerLonRadian_;
    var lat = radiansToDegrees(2 * Math.atan(Math.exp(latRadians)) - Math.PI / 2);
    return new google.maps.LatLng(lat, lng);
};

function OutputDiscs(){

    maxcities = document.getElementById("maxcities").value;		
    var str_output = "x; y; radius; id;<br />"
    for (var i = 0, j = 0; i < population.length && j<maxcities; i++){
	/* Gerar coordenadas em pixels */
	if(!filter_active || (filter_active && filtered[i] == 0)){
	    var pixelCoordinate = GetPixelCoordinates(coordinates[i]);
	    str_output += pixelCoordinate.x.toFixed(2) + "; " + pixelCoordinate.y.toFixed(2) + "; " + (radius[i]*image_size*fator/2.0).toFixed(2) + "; <br />"
	    j++;
	}
    }
    javascript_output = str_output.replace(/<br \/>/gi, "\n")
    document.getElementById('output').innerHTML = str_output
    document.getElementById('hidden_content').style.visibility = 'visible';
    StartClipboard(javascript_output);
}

function GetPixelCoordinates(latLng){
    var projection = new MercatorProjection();
    var worldCoordinate = projection.fromLatLngToPoint(latLng);
    var pixelCoordinate = new google.maps.Point(worldCoordinate.x * Math.pow(2, map.getZoom()), -worldCoordinate.y * Math.pow(2, map.getZoom()));
    return pixelCoordinate;
}
