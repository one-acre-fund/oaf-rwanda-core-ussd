/*
    Function: cor-payg-balance.js
    Purpose: returns true if the client's balance is sufficient to provide a new PAYG code
    Status: complete
*/

module.exports = function(client){
    // load data tables and functions
    var admin_alert = require('./admin-alert');
    var get_balance = require('./cor-get-balance');
    var repayment_table = project.getOrCreateDataTable('repayment_schedule');
    var settings_table = project.getOrCreateDataTable('ussd_settings');

    // initialize constants and variables
    const lang = settings_table.queryRows({'vars' : {'settings' : 'cor_lang'}}).next().vars.value;
    const arrayLength = client.BalanceHistory.length;
    var cutoff = 0;
    var repayment = 0;
    var balance = 0;
    var credit = 0;

    // retrieve the cutoff repayment percentage for the current month
    var current_month = new Date().getMonth();
    var repayment_cursor = repayment_table.queryRows({'vars' : {'month_number' : current_month}});
    cutoff = repayment_cursor.next().vars.percent_repaid;

    // retrieve relevant balance and credit numbers for current year if we're in April-August
    if(current_month > 3 && current_month < 8){
        var object = get_balance(JSON.parse(state.vars.client_json), lang);
        balance = object["$BALANCE"];
        credit = object["$CREDIT"];
    }
    else if(arrayLength > 1){
        // retrieve balance and credit for previous season if September-May and multiple seasons available
        const index = arrayLength - 1;
        balance = client.BalanceHistory[index].Balance;
        credit = client.BalanceHistory[index].TotalCredit;
    }
    else{ // if this is the client's first season, no check required; they can get a code
        return true;
    }
    
    // return true if repayment exceeds the cutoff amount
    repayment = (credit - balance) / credit * 100;
    if(repayment >= cutoff){
        return true;
    }
    else{
        return false;
    }
};
