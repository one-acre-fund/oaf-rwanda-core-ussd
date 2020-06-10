/*
function for returning menu options from a given option menu
*/

const districtBundles = require('../dat/district-bundles');

module.exports = function(menu_option, menu_table,districtId){

    // If the user is a group leader and chooses market access from the menu
    if(state.vars.group_leader == 'yes' && state.vars.market_access_option_num == menu_option){
        return 'cor_market_access';
    }
    if(!menu_option){
        return null;
    }
    if(menu_table === state.vars.product_menu_table_name){
        var selections = districtBundles.filter(function (row) {
            return row.option_number == menu_option
        })
        if ((selections.length === 0)) {
            return null;
        }
        var option = selections[0];
        if (districtId) {
            if (option['d' + districtId] !== 1) {
                return null;
            }
        }
        if (selections.length > 1) {
            admin_alert = require('./admin-alert');
            admin_alert('Error in retrieving menu option - duplicate options\n' + '\nOption number : ' + menu_option);
            //throw 'ERROR: Duplicate options - Table name : ' + menu_table + ' - Option number : ' + menu_option;
        }
        var outstr = option.option_name || option.bundle_name || option.input_name;
        return outstr;
        
    }else {

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
        var outstr = option.vars.option_name || option.vars.bundle_name || option.vars.input_name;
        return outstr;
    }
};
