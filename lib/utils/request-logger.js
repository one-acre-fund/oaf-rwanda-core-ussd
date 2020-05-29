module.exports = function (url, response) {
    try {
        var logs_table = project.getOrCreateDataTable('http_response_logs');
        var row = logs_table.createRow({
            vars: {
                'url': url,
                'status': response.status,
                'content': response.content
            }
        });
        row.save()
    } catch (error) {

    }
}