/*
    Function: cor-payg-retrieve.js
    Purpose: if the input account # has a registered serial number, retrieve the relevant PAYG code.
    Status: complete
*/

module.exports = function(accnum){
    // load in relevant modules and data tables
    var serial_table = project.getOrCreateDataTable('Valid_Serial_Number');

    // save api cursor pointing to rows from the serial table where the entered serial number matches
    var client_pointer = serial_table.queryRows({'vars' : {'account_number' : accnum}});

    // if one client row exists, return true and save payg code as a state variable
    if(client_pointer.count() === 1){
        var client_row = client_pointer.next(); // save the row that has client's account number
        state.vars.payg_code = client_row.vars.payg_codes;
        return true;
    }
    else if(client_pointer.count() === 0){ // if no rows match the account number, set boolean as true (indicates no error w/ accnum) and return false
        var empty = true;
    }
    else{ // if multiple rows match, set boolean as false (indicates an error), alert admin, and return false
        var empty = false;
    }
    state.vars.acc_empty = empty;
    return false;
}