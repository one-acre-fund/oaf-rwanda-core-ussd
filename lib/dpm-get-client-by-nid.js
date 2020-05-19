/*
module for getting client by nid
*/

module.exports = function(nid, table_name){
    var data_table = project.getOrCreateDataTable(table_name);
    var cursor = data_table.queryRows({'vars' : {'nid' : nid}})
    if(nid === null){
        throw 'ERROR: null nid';
    }
    if(cursor.hasNext()){
        var client = cursor.next()
        var account_num = client.vars.account_number;
        var oafid = client.vars.oafid;
        var name1 = client.vars.name1;
        var name2 = client.vars.name2;
        //if(cursor.hasNext()){ //truncating for sanity
            //var admin_alert = require('./admin-alert');
            //admin_alert('duplicate nids : ' + nid + '\ntable : ' + table_name, 'Dupicate NIDS')
        //}
        return {'account_number' : account_num, 'oafid' : oafid, 'name1' : name1, 'name2' : name2}
    }
    else{
        return null;
    }
}