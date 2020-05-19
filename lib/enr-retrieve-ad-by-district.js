/*
This module retrieve an add destined to a certain district
*/

module.exports = function(district_id, lang){
    var table = project.getOrCreateDataTable('21A_sms_ads');
    var cursor = table.queryRows({'vars' : {'district_id' : district_id}});
    var ad = ' ';
    var column = 'sms_ad_' + lang;

    if(cursor.hasNext()){
        row = cursor.next();
        ad = row.vars[column];
    }
    return ad;
}
