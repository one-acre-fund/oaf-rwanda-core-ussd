/*
    Script: chx-check-order.js
    Description: returns the number of chickens a client has ordered
    Status: in progress
*/


module.exports = function(account_number){ 
    // retrieve client's order information
    var chx_table = project.getOrCreateDataTable('20b_chicken_table');
    var chx_cursor = chx_table.queryRows({'vars' : {'account_number' : account_number}});

    // check if has next
    if(chx_cursor.hasNext()){
        var chx_row = chx_cursor.next();
        var order = chx_row.vars.ordered_chickens;
    }
    else{
        var admin_alert = require('./admin-alert');
        admin_alert('Account number ' + account_number + ' not found in 20b_chicken_table');
        var order = 0;
    }
    return order;
};
