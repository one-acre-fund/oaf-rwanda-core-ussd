/*
module for formatting input messages
*/

module.exports = function(input_quantity, input_details, lang){
    if(!(lang in input_details)){
        throw 'ERROR : lang not found';
    }
    else{
        var tot_price = parseInt(input_quantity) * parseInt(input_details.price);
        return {'$TOTAL_PRICE' : tot_price,
                '$NAME'        : input_details[lang],
                '$QUANTITY'    : input_quantity,
                '$UNIT'        : input_details.unit}
    }
}