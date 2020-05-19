/*
small function for checking for duplicate nids
returns true if the nid is already registered
returns false if the nid is not registered
*/

module.exports = function(nid, table_name){
    var data_table = project.getOrCreateDataTable(table_name);
    var cursor = data_table.queryRows({'vars' : {'nid' : nid}})
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
