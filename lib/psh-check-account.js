/*
    Function: check_account_no.js
    Purpose: checks if the input account number appears as a PShop account in Roster
    Status: complete
*/

module.exports = function(accnum){
    // some code to be able to use Roster API
    var client = null;
    var api = require('ext/Roster_v1_2_0/api'); //roster. todo make more general
    api.dataTableAttach('ExternalApis');
    var country = project.vars.country; 
    api.verbose = true;
    api.dataTableAttach('ExternalApis'); //todo: make more general

    require('./account-verify')(accnum); // run account number through core account verify function
    console.log(state.vars.client_district);
    if(state.vars.client_district === 'RRT P-Shops'){
        var client = api.getClient(accnum);
        state.vars.client_json = JSON.stringify(client);
        state.vars.TotalCredit = client.BalanceHistory[0].TotalCredit;
        state.vars.TotalRepay_Incl = client.BalanceHistory[0].TotalRepayment_IncludingOverpayments;
        state.vars.Balance = client.BalanceHistory[0].Balance;
        return true;
    }
    else{
        return false;
    }
}
