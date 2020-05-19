/*
    Script: chx-check-eligibility.js
    Description: returns the number of chickens a client is eligible for
    Status: complete
*/

module.exports = function(client){ 
    // retrieve client's balance information
    var get_balance = require('./cor-get-balance');
    var balance_info = get_balance(client);
    var paid = balance_info.$PAID;
    //editing the credit check here - need to account for b-season credit in the get-client api now. my code is pretty janky - clean up when possible [zv]
    var chx_table = project.getOrCreateDataTable('20b_chicken_table');
    var chx_cursor = chx_table.queryRows({'vars' : {'account_number' : state.vars.account_number}}).next();
    var credit = parseFloat(chx_cursor.vars['20a_credit']);
    //took out the below line to fix 20b issue [zv]
    //var credit = Math.max(balance_info.$CREDIT, -balance_info.$CREDIT); // account for credit reporting as negative

    // save a few constants; abstract eventually
    const req_percent = 0.6;
    const chx_price = 500; 

    // if client has not met 60% of A season credit, they are eligible for 0 chickens
    var amount_over = paid - req_percent * credit;
    var chx_num = Math.floor(amount_over / chx_price);
    console.log('amount over: ' + amount_over + ' paid: ' + paid + ' credit: ' + credit + ' chx_num: ' + chx_num);

    // make sure that the max number stays within bounds
    if(chx_num < 2){
        chx_num = 0;
    }
    else{
        if(chx_num > 5){
            chx_num = 5;
        }
    }
    return chx_num; 
};
