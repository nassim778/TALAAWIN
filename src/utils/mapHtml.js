export function getMapHtml() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#E8E4DC}
#map{width:100%;height:100%}
.leaflet-control-attribution{display:none!important}

.guess-marker{
  width:28px;height:28px;position:relative;
}
.guess-marker-inner{
  width:28px;height:28px;border-radius:50%;
  background:linear-gradient(135deg,#E63946,#FF6B78);
  border:3px solid #fff;
  box-shadow:0 2px 12px rgba(230,57,70,0.5),0 1px 4px rgba(0,0,0,0.2);
}
.guess-marker-inner::after{
  content:'';position:absolute;left:50%;top:100%;
  transform:translateX(-50%);
  width:0;height:0;
  border-left:6px solid transparent;
  border-right:6px solid transparent;
  border-top:8px solid #E63946;
  filter:drop-shadow(0 1px 2px rgba(0,0,0,0.2));
}

.actual-marker{
  width:28px;height:28px;position:relative;
}
.actual-marker-inner{
  width:28px;height:28px;border-radius:50%;
  background:linear-gradient(135deg,#38EDB8,#06D6A0);
  border:3px solid #fff;
  box-shadow:0 2px 12px rgba(6,214,160,0.5),0 1px 4px rgba(0,0,0,0.2);
  position:relative;z-index:2;
}
.actual-marker-inner::after{
  content:'';position:absolute;left:50%;top:100%;
  transform:translateX(-50%);
  width:0;height:0;
  border-left:6px solid transparent;
  border-right:6px solid transparent;
  border-top:8px solid #06D6A0;
  filter:drop-shadow(0 1px 2px rgba(0,0,0,0.2));
}
.actual-pulse{
  position:absolute;top:-6px;left:-6px;z-index:1;
  width:40px;height:40px;border-radius:50%;
  border:2px solid #06D6A0;opacity:0;
  animation:ping 2s ease-out infinite;
}
@keyframes ping{
  0%{transform:scale(0.6);opacity:0.7}
  100%{transform:scale(2.2);opacity:0}
}

.leaflet-container{
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
}
</style>
</head>
<body>
<div id="map"></div>
<script>
var map=L.map('map',{
  center:[25,10],zoom:2,
  zoomControl:false,
  attributionControl:false,
  minZoom:2,maxZoom:18,
  worldCopyJump:true
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{
  maxZoom:20,subdomains:'abcd'
}).addTo(map);

L.control.zoom({position:'bottomright'}).addTo(map);

var guessMarker=null,actualMarker=null,polyline=null,interactive=true;

var guessIcon=L.divIcon({
  className:'',
  html:'<div class="guess-marker"><div class="guess-marker-inner"></div></div>',
  iconSize:[28,36],iconAnchor:[14,36]
});
var actualIcon=L.divIcon({
  className:'',
  html:'<div class="actual-marker"><div class="actual-pulse"></div><div class="actual-marker-inner"></div></div>',
  iconSize:[28,36],iconAnchor:[14,36]
});

map.on('click',function(e){
  if(!interactive)return;
  if(guessMarker)map.removeLayer(guessMarker);
  guessMarker=L.marker(e.latlng,{icon:guessIcon}).addTo(map);
  try{
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'guess',lat:e.latlng.lat,lng:e.latlng.lng}));
  }catch(err){}
});

function handleMessage(data){
  if(data.type==='showResult'){
    interactive=false;
    actualMarker=L.marker([data.actual.lat,data.actual.lng],{icon:actualIcon}).addTo(map);
    polyline=L.polyline(
      [[data.guess.lat,data.guess.lng],[data.actual.lat,data.actual.lng]],
      {color:'#FFBA08',weight:3,dashArray:'12,8',opacity:0.9,lineCap:'round'}
    ).addTo(map);
    var bounds=L.latLngBounds(
      [[data.guess.lat,data.guess.lng],[data.actual.lat,data.actual.lng]]
    );
    map.fitBounds(bounds,{padding:[60,60],maxZoom:13,animate:true,duration:1.2});

  }else if(data.type==='reset'){
    interactive=true;
    if(guessMarker){map.removeLayer(guessMarker);guessMarker=null;}
    if(actualMarker){map.removeLayer(actualMarker);actualMarker=null;}
    if(polyline){map.removeLayer(polyline);polyline=null;}

    if(data.mode==='tunisia'){
      map.setView([34.5,9.5],6,{animate:true,duration:0.6});
    }else if(data.mode==='maghreb'){
      map.setView([28,10],4,{animate:true,duration:0.6});
    }else{
      map.setView([25,10],2,{animate:true,duration:0.6});
    }
  }
}

document.addEventListener('message',function(e){try{handleMessage(JSON.parse(e.data));}catch(err){}});
window.addEventListener('message',function(e){try{handleMessage(JSON.parse(e.data));}catch(err){}});
</script>
</body>
</html>`;
}
