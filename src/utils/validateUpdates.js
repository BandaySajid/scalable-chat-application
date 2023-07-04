const validate = function (requestedUpdates, availableUpdates) {

    const isValidUpdate = requestedUpdates.every((update) => {
        return availableUpdates.includes(update);
    });

    if (!isValidUpdate) {
        return false;
    }
    return true;
}

module.exports = validate;