/*
small function for checking for duplicate nids
returns true if the nid is already registered
returns false if the nid is not registered
*/

module.exports = function(nid, table_name){

    var table_id = service.vars['21a_client_data_id'];
    var data_table = project.initDataTableById(table_id);
    console.log(data_table);
    var cursor = data_table.queryRows({'vars' : {'nid' : nid}});
    console.log(cursor);
    if(nid === null){
        throw 'ERROR: null nid';
    }
    else if(cursor.hasNext()){
        return true;
    }
    else{
        return false;
    }
};
