import crypto from "crypto"
const hash = crypto.createHash("sha256").update("hotel123").digest("hex")
console.log("SHA-256 of 'hotel123':", hash)
