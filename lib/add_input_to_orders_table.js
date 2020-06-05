
module.exports = function (accountNumber,bundleId,bundleInputId,quantity) {
    console.log('##### accountNumber: '+ accountNumber);
    console.log('##### bundleId: '+ bundleId);
    console.log('##### bundleInputId: '+ bundleInputId);
    
    var table = project.initDataTableById(service.vars.client_enrollment_table_id);
    var row = table.createRow({vars:{
        'accountNumber':accountNumber,
        'bundleId':bundleId,
        'quantity': quantity,
        'bundleInputId':bundleInputId}
    });
    row.save();
}