/*
module for logging input orders for clients
*/

module.exports = function(client_account_number, an_table, input_name, input_quantity){
    console.log('input name : ' + input_name)
    console.log('input quantity : ' + input_quantity)
    var table = project.getOrCreateDataTable(an_table);
    var cursor = table.queryRows({'vars' : {'account_number' : client_account_number}});
    if(!cursor.hasNext()){
        var admin_alert = require('./admin-alert');
        admin_alert('Missing account number : ' + client_account_number)
        throw 'ERROR : unrecognized account number passed to input log';
    }
    var client = cursor.next();
    if(cursor.hasNext()){
        var admin_alert = require('./admin-alert');
        admin_alert('Duplicate account number : ' + client_account_number)
    }
    client.vars[input_name] = input_quantity;
    client.vars['rgo_placed_order'] = 1;
    client.save();
    return true;
}