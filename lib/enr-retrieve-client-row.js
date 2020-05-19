/*
module for retrieving retrieving account number rows from database
takes account number, table name as arguements and returns an object representing the row
*/

module.exports = function(account_number, an_table, enrollment){
    enrollment = enrollment || false;
    var table = project.getOrCreateDataTable(an_table);
    var cursor = table.queryRows({'vars' : {'account_number' : account_number}});
    if(!cursor.hasNext()){
        //console.log('got a false hasNext')
        if(enrollment){
            var account_verify = require('./account-verify');
            if(account_verify(account_number)){
                client = table.createRow({'vars' : {'account_number' : account_number, 'via_api' : true}})
                client.vars.geo = state.vars.client_district;
                client.vars.registered = 1;
                if(state.vars.client_json){
                    var clientData = JSON.parse(state.vars.client_json);
                    client.vars.name1 = clientData.FirstName;
                    client.vars.name2 = clientData.LastName;
                }
                if(state.vars.current_step == 'entered_glvv'){
                    client.vars.geo = state.vars.glus_geo;
                }
                client.save();
                return client;
            }
            else{
                return null;
            }
        }
        return null;
    }
    var client = cursor.next();
    client.vars.registered = 1;
    if(cursor.hasNext() && account_number){
        var admin_alert = require('./admin-alert');
        admin_alert('Duplicate account number : ' + account_number)
    }
    return client;
};
