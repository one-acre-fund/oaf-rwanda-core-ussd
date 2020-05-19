/*
module for logging input orders for clients
*/

module.exports = function(client_account_number, an_table, bundle_name, input_quantity){
    console.log('bundle name : ' + bundle_name)
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
    bundle_name = bundle_name.replace(/ /g,"_");
    client.vars[bundle_name] = input_quantity;
    client.vars['rgo_placed_order'] = 1;
    client.save();
    return true;
}

// districtId siteId groupId accountNumber clientId isGroupLeader bundleQuantity bundleInputId