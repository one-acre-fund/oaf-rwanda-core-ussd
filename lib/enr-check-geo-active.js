/*
module that checks whether a geography is still taking inputs
*/

module.exports = function(geo, geo_menu_map_name){
    var geo_menu_map = project.getOrCreateDataTable(geo_menu_map_name);
    var cursor = geo_menu_map.queryRows({'vars' : {'geo' : geo}});
    if(cursor.hasNext()){
        var val = cursor.next();
        if(val.vars.live === 'live'){
            return true;
        }
        else if(val.vars.live === 'dead'){
            return false;
        }
        else if(val.vars.live === undefined || val.vars.live === null){
            throw 'ERROR: geo mapping is null in table ' + geo_menu_map_name;
        }
        else{
            var admin_alert = require('./admin-alert');
            admin_alert(geo + ' has no defined live flag. defaulted to dead', 'TR ERROR: ' + geo);
            return false;
        }
    }
    else{
        var admin_alert = require('./admin-alert');
        admin_alert(geo + ' not found in geo-menu-map during live check. defaulted to dead', 'TR ERROR: ' + geo);
        return false;
    }
};
