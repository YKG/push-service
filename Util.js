
const Util = {
    fromJson: function(str) {
        try {
            return JSON.parse(str);
        } catch (e) {
            console.log(e);
            return {};
        }
    },
    toJson: function(obj) {
        try {
            return JSON.stringify(obj);
        } catch (e) {
            console.log(e);
            return "(JSON.stringify ERROR)";
        }
    },
    hash: function(userId) {
        if (userId === 'anonymous') return 'anonymous';
        if (Number.isInteger(userId % 2)) return '' + userId % 2;
        return 'anonymous';
    }
}

module.exports = Util;
