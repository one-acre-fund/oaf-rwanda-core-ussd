/*
    Function: cor-serial-verify.js
    Purpose: check if the input serial number is valid; if valid, update table and store the PAYG code.
    Status: complete
*/

module.exports = function(serial_no){
    // load in relevant modules and tables
    var admin_alert = require('./admin-alert');
    var serial_table = project.getOrCreateDataTable('Valid_Serial_Number');

    // save API cursor pointing to row from the serial table where the entered serial number matches
    if(state.vars.acc_empty){
        var serial_pointer = serial_table.queryRows({
            vars: {'serial_number' : serial_no, 'account_number' : {exists : 0}}
        });
    }
    else{
        var serial_pointer = serial_table.queryRows({
            vars: {'serial_number' : serial_no, 'account_number' : state.vars.account_number}
        });
    }

    // if one client row exists, return true and save payg code as a state variable
    if(serial_pointer.count() === 1){
        var serial_row = serial_pointer.next(); // save the row that has client's serial number
        serial_row.vars.account_number = state.vars.account_number;
        serial_row.save();
        state.vars.payg_code = serial_row.vars.payg_codes;
        return true;
    }
    else if(serial_pointer.count() === 0){ // if no rows match the input serial number, return false
        state.vars.serial_status = true;
        return false;
    }
    else{ // if the serial number shows up multiple times, send an alert
        state.vars.serial_status = false;
        admin_alert('duplicate rows in valid serial numbers for serial number: ' + serial_no, 'Duplicate Serial Numbers in valid serial numbers', 'marisa');
        return false;
    }
}