/*
function for returning menu options from a given option menu
*/

const districtBundles = require('../dat/district-bundles');

module.exports = function (menu_option, menu_table, districtId) {
    if (!menu_option) {
        return null;
    }
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
};
