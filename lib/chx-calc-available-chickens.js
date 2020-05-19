/*
    Script: chx-calc-available-chickens.js
    Description: based on a client's repayment, returns the number of chickens they're eligible for
    Status: mid-update
*/

var admin_alert = require('./admin-alert');

module.exports = function(account_number, client, chx_client_table_loc){ //client should be an object
    // retrieve client's balance information
    var get_balance = require('./cor-get-balance');
    var balance_info = get_balance(client);
    var paid = balance_info.$PAID;
    console.log('paid: ' + paid)

    // load the client's row in the chicken client table
    var chx_client_table = project.getOrCreateDataTable(chx_client_table_loc);
    var cursor = chx_client_table.queryRows({'vars' : {'account_number' : account_number}});

    // temporary addition for post-season Rutsiro clients
    const arrayLength = client.BalanceHistory.length;
    if(arrayLength > 1){
        const index = arrayLength - 1;
        var balance = client.BalanceHistory[index].Balance;
        var credit = client.BalanceHistory[index].TotalCredit;
        var paid = credit - balance;
    }

    // UPDATE COMMENT
    if(cursor.hasNext()){
        var client_row = cursor.next();
        var ordered_chickens = parseInt(client_row.vars.ordered_chickens);
        if(ordered_chickens > 15){
            ordered_chickens = 15;
        }
        if(client_row.vars.confirmed_chickens > 0){
            return {'$NAME' : balance_info.$CLIENT_NAME, '$CHX_NUM' : 0}
        }
        var prep_check = 0;
        if(client_row.vars.chicken_only === 1){
            if((paid / 500) >= ordered_chickens){
                prep_check = ordered_chickens;
            }
            else{
                prep_check = Math.floor(paid / 500);
            }
        }
        else{
            try{
                var req_prep = client_row.vars.required_prepayment || 0; //dealing with possible data inconsistency
                prep_check = Math.max(Math.floor((paid - parseInt(req_prep)) / 500), 0);
            }
            catch(error){
                console.log(error);
                admin_alert('failure on chicken math. error is : ' + error, 'Telerivet chicken error')
                var req_prep = 0;
                prep_check = Math.max(Math.floor((paid - parseInt(req_prep)) / 500), 0);
            }
            
        }
        if(prep_check === NaN){
            admin_alert('prep_check is NaN for AN: ' + account_number);
            throw 'Prep_check is NaN';
        }
        var chx_num = (prep_check >= ordered_chickens) ? ordered_chickens : prep_check; 
        console.log('prep check: ' + prep_check + ', ordered_chx: ' + ordered_chickens + 'chxnum: ' + chx_num);
        return {'$NAME' : balance_info.$CLIENT_NAME, '$CHX_NUM' : chx_num}
    }
    else{
        return {'$NAME' : balance_info.$CLIENT_NAME, '$CHX_NUM' : 0}; // returning 0 should signify that the client is not a chicken client
    }
};
