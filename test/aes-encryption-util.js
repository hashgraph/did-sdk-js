const crypto = require('crypto');

const encrypt = function (plainText, key, outputEncoding = "base64") {
    const cipher = crypto.createCipheriv("aes-128-ecb", crypto.createHash('sha256').update(String(key)).digest('base64').substr(0, 16), null);
    return Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]).toString(outputEncoding);
}

const decrypt = function (cipherText, key, outputEncoding = "utf8") {
    const cipher = crypto.createDecipheriv("aes-128-ecb", crypto.createHash('sha256').update(String(key)).digest('base64').substr(0, 16), null);
    return Buffer.concat([cipher.update(cipherText, 'base64'), cipher.final()]).toString(outputEncoding);

}

exports.encrypt = encrypt;
exports.decrypt = decrypt;