/*
function for returning menu options from a given option menu
*/

module.exports = function(menu_option, menu_table){
    if(menu_option === NaN){
        return null;
    }
    var table = project.getOrCreateDataTable(menu_table);
    var cursor = table.queryRows({'vars' : {'option_number' : menu_option}});
    if((!cursor.hasNext())){
        return null;
    }
    var option = cursor.next();
    if(cursor.hasNext()){
        admin_alert = require('./admin-alert');
        admin_alert('Error in retrieving menu option - duplicate options\nTable name : ' + menu_table + '\nOption number : ' + menu_option);
        //throw 'ERROR: Duplicate options - Table name : ' + menu_table + ' - Option number : ' + menu_option;
    }
    var outstr = option.vars.option_name || option.vars.input_name;
    return outstr;
};
