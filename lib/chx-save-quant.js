/*
saves chx quant
*/

module.exports = function(account_number, chx_quant, chx_table_loc){
    var chx_table = project.getOrCreateDataTable(chx_table_loc);
    var cursor = chx_table.queryRows({'vars' : {'account_number' : account_number}});
    if(cursor.hasNext()){
        var client_row = cursor.next();
        if(cursor.hasNext()){
            admin_alert = require('./admin-alert');
            admin_alert('Duplicate AN in chx db ' + account_number);
        }
        client_row.vars.confirmed_chickens = chx_quant;
        client_row.save();
        return client_row.vars.confirmation_code;
    }
    else{
        throw 'Invalid account number ' + account_number
    }
};
