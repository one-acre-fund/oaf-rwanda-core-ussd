/*
function for formatting product options for use in USSD
*/

module.exports = function(prod_options, lang){
    if(!(lang in prod_options)){
        throw 'ERROR: Selected lang not in product options';
    }
    else{
        return {'$NAME'      : prod_options[lang],
                '$PRICE'     : prod_options.price,
                '$INCREMENT' : prod_options.increment,
                '$UNIT'      : prod_options.unit,}
    }
};
