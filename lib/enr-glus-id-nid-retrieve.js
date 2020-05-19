/*
module for retrieving glus by nid for enr
*/

module.exports = function(nid, glus_table){
    var table = project.getOrCreateDataTable(glus_table);
    var cursor = table.queryRows({'vars' : {'nid' : nid}});
    if(cursor.hasNext()){
        var glus_row = cursor.next();
        console.log(JSON.stringify(glus_row));
        console.log(glus_row.vars.glus_id);
        if(cursor.hasNext()){
            var admin_alert = require('./admin-alert');
            admin_alert('duplicate nid on glus id table : ' + nid);
        }
        return glus_row.vars.glus_id;
    }
    else{
        return null;
    }
}