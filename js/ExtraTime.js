function ExtraTime(){
    var e = document.getElementById("screenshot-hidden-element");
    _pjscMeta.manualWait=true;
    var i = setInterval(function(){
        if( e.value!=null || e.value != undefined){
            _pjscMeta.manualWait=false;
            clearInterval(i);
        }
    },500);
}
