
// Some code needs to added that are common for the module

let sequence = 0;
let timestamp = 0;

const resetTimestamp = () => {
    timestamp = Math.floor(Math.random() * 1000);
}

module.exports = {
    init: function() {
        resetTimestamp();
        sequence = Math.floor(Math.random() * 1000);

        setInterval(() => {
            if (timestamp >= 2**32) {
                resetTimestamp();
            } else {
                timestamp++;
            }
        }, 10)
    },

    //--------------------------
    //getSequenceNumber: return the current sequence number + 1
    //--------------------------
    getSequenceNumber: function() {
        return sequence++;
    },

    //--------------------------
    //getTimestamp: return the current timer value
    //--------------------------
    getTimestamp: function() {
        return timestamp;
    }
};