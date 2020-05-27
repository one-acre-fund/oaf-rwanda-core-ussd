function fetchRegistrationState(phoneNumber) {
    var reg_sessions = project.getOrCreateDataTable(service.vars.RegistrationSessions);
    var cursor = reg_sessions.queryRows({ 'vars': { 'phone_number': phoneNumber } });
    if (!cursor.hasNext()) {
        return null
    }
    var row = cursor.next();
    const nowUnixTimeStamp = new Date().getTime() / 1000;
    const sessionTimeout = 60 * 60;
    return {
        sessionInfo: JSON.parse(row.vars.sessionInfo),
        isExpired: row.time_updated + sessionTimeout < nowUnixTimeStamp,
        remove: function () {
            row.delete();
        }
    }
}
/**
 * 
 * @param {string} phoneNumber 
 * @param {object} handlers 
 */
function resumeRegistration(phoneNumber, handlers) {
    var registrationState = fetchRegistrationState(phoneNumber);
    if (registrationState == null) {
        return false;
    }
    if (registrationState.isExpired) {
        registrationState.remove()
        return false;
    }
    const savedState = registrationState.sessionInfo.state;
    console.log('### fetched state: '+JSON.stringify(savedState));
    
    for (key in savedState) {
        if (savedState.hasOwnProperty(key)) {
            state.vars[key] = savedState[key];
        }
    }
    // TODO: call handler with input
    const handler = registrationState.sessionInfo.handler;
    const input = registrationState.sessionInfo.input;
    if (handlers[handler]) {
        console.log('#### Found hander');
        handlers[handler](input);
        return true;
    }
    console.log('#### Found no hander');
    
    return false;
};

function clearRegistrationSession(phoneNumber) {
    var reg_sessions = project.getOrCreateDataTable(service.vars.RegistrationSessions);
    var cursor = reg_sessions.queryRows({ 'vars': { 'phone_number': phoneNumber } });
    if (!cursor.hasNext()) {
        return
    }
    var row = cursor.next();
    row.delete();
}

/**
 * 
 * @param {string} phoneNumber 
 * @param {object} state 
 * @param {string} handlerName 
 * @param {string} input 
 */
function saveRegistrationSession(phoneNumber, stateVars, handlerName, input) {
    const sessionInfo = {
        state: stateVars,
        handler: handlerName,
        input: input
    }
    var reg_sessions = project.getOrCreateDataTable(service.vars.RegistrationSessions);
    var cursor = reg_sessions.queryRows({ 'vars': { 'phone_number': phoneNumber } });
    var row;
    if (cursor.hasNext()) {
        row = cursor.next();
    } else {
        row = reg_sessions.createRow({
            from_number: phoneNumber,
            vars: {}
        });
        console.log('created row');
    }
    console.log(sessionInfo);

    row.vars.sessionInfo = JSON.stringify(sessionInfo);
    row.vars.phone_number = phoneNumber
    row.vars.handler = handlerName;
    row.vars.input = input;
    row.save()
}
module.exports = {
    resume: resumeRegistration,
    clear: clearRegistrationSession,
    save: saveRegistrationSession
}