
module.exports = function (accountNumber,bundleId,bundleInputId) {
    console.log('##### accountNumber: '+ accountNumber);
    console.log('##### bundleId: '+ bundleId);
    console.log('##### bundleInputId: '+ bundleInputId);
    
    var table = project.getOrCreateDataTable('client_enrollment_data');
    var row = table.createRow({vars:{
        'accountNumber':accountNumber,
        'bundleId':bundleId,
        'bundleInputId':bundleInputId}
    });
    row.save();
}