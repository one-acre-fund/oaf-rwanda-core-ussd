
module.exports = function (accountNumber,bundleId,bundleInputId,quantity) {
    console.log('##### accountNumber: '+ accountNumber);
    console.log('##### bundleId: '+ bundleId);
    console.log('##### bundleInputId: '+ bundleInputId);
    
    var table = project.getOrCreateDataTable(service.vars.client_enrollment_table);
    var row = table.createRow({vars:{
        'accountNumber':accountNumber,
        'bundleId':bundleId,
        'quantity': quantity,
        'bundleInputId':bundleInputId}
    });
    row.save();
}