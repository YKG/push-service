
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
    }
}

module.exports = Util;
