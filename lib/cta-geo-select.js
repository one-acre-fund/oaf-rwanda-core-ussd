/*
main function for retrieving location during ad-response flow
pretty basic here - call with only selection argument to include full geography. specify geo_data to get more specific.
*/

module.exports = function(sel, branch){
    sel = parseInt(sel);
    if('fo_name' in branch){
        return branch;
    }
    else if(sel >= Object.keys(branch).length || sel < 0){
        throw 'ERROR: Geo selection not in keys';
    }
    else {
        console.log(sel + " : " + Object.keys(branch)[sel]);
        return branch[Object.keys(branch)[sel]];
    }
}
