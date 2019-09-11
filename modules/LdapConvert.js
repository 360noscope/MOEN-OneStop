const crypto = require("crypto");
module.exports = {
  GUIDtoUUID: objectGUID => {
    const hex = Buffer.from(objectGUID, "binary").toString("hex");

    const p1 =
      hex.substr(-26, 2) +
      hex.substr(-28, 2) +
      hex.substr(-30, 2) +
      hex.substr(-32, 2);

    const p2 = hex.substr(-22, 2) + hex.substr(-24, 2);
    const p3 = hex.substr(-18, 2) + hex.substr(-20, 2);
    const p4 = hex.substr(-16, 4);
    const p5 = hex.substr(-12, 12);

    return [p1, p2, p3, p4, p5].join("-");
  },

  GUIDEncrypt: (guid, key) => {
    const algorithm = "aes-256-cbc";
    const readyKey = crypto
      .createHash("sha256")
      .update(String(key))
      .digest("base64")
      .substr(0, 32);
    const iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(readyKey), iv);
    let encrypted = cipher.update(guid);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return [encrypted.toString("hex"), iv.toString("hex")].join(":");
  },

  GUIDDecrypt: (cryptedGuid, key) => {
    const cryptedData = cryptedGuid.split(":");
    let iv = Buffer.from(cryptedData[1], "hex");
    const readyKey = crypto
      .createHash("sha256")
      .update(String(key))
      .digest("base64")
      .substr(0, 32);
    let encryptedText = Buffer.from(cryptedData[0], "hex");
    let decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(readyKey),
      iv
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
};
