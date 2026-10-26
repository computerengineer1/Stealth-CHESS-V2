var exec = cordova.require('cordova/exec');
module.exports = {
    getHwid: function (success, error) { exec(success, error, 'StealthDevice', 'getHwid', []); }
};
