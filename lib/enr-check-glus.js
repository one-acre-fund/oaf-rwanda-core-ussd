/*
module for checking glus ids vs the database
*/

module.exports = function(input, glus_table){
    console.log('entered id is' + input);
    glus_table = glus_table || 'glus_ids_20B'
    var datatable = project.getOrCreateDataTable(glus_table);
    var cursor = datatable.queryRows({'vars': {'glus_id' : input}});
    if(cursor.hasNext()){
        var glus_id = cursor.next();
        if(cursor.hasNext()){
            var admin_alert = require('./admin-alert');
            admin_alert('Duplicate glus id in database : ' + glus_id, 'TR: DUPLICATE GLUS ID');
        }
        state.vars.glus_geo = glus_id.vars.geo;
        return glus_id.vars.geo;
    }
    else{
        return null;
    }
};
