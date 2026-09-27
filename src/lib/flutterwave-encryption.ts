function randomNonce() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  let output = "";
  for (const byte of bytes) output += alphabet[byte % alphabet.length];
  return output;
}

function decodeBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function encryptWithNonce(value: string, keyValue: string, nonce: string) {
  if (!globalThis.crypto?.subtle)
    throw new Error("Secure card encryption is not supported by this browser.");
  const keyBytes = decodeBase64(keyValue);
  if (keyBytes.byteLength !== 32) throw new Error("Flutterwave AES-256 encryption key is invalid.");
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, [
    "encrypt",
  ]);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: new TextEncoder().encode(nonce), tagLength: 128 },
    key,
    new TextEncoder().encode(value),
  );
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

export async function encryptCardDetails(
  card: { number: string; expiryMonth: string; expiryYear: string; cvv: string },
  encryptionKey: string,
) {
  const nonce = randomNonce();
  const cardNumber = card.number.replace(/[\s-]/g, "");
  const expiryMonth = card.expiryMonth.trim();
  const expiryYear = card.expiryYear.trim();
  const cvv = card.cvv.trim();
  if (!/^\d{12,19}$/.test(cardNumber)) throw new Error("Enter a valid card number.");
  if (!/^\d{2}$/.test(expiryMonth) || Number(expiryMonth) < 1 || Number(expiryMonth) > 12)
    throw new Error("Enter a valid expiry month.");
  if (!/^\d{2,4}$/.test(expiryYear)) throw new Error("Enter a valid expiry year.");
  if (!/^\d{3,4}$/.test(cvv)) throw new Error("Enter a valid security code.");
  const [encrypted_card_number, encrypted_expiry_month, encrypted_expiry_year, encrypted_cvv] =
    await Promise.all([
      encryptWithNonce(cardNumber, encryptionKey, nonce),
      encryptWithNonce(expiryMonth, encryptionKey, nonce),
      encryptWithNonce(expiryYear, encryptionKey, nonce),
      encryptWithNonce(cvv, encryptionKey, nonce),
    ]);
  return {
    nonce,
    encrypted_card_number,
    encrypted_expiry_month,
    encrypted_expiry_year,
    encrypted_cvv,
  };
}

export async function encryptPin(pin: string, encryptionKey: string) {
  const value = pin.trim();
  if (!/^\d{4,6}$/.test(value)) throw new Error("Enter a valid card PIN.");
  const nonce = randomNonce();
  return { nonce, encryptedPin: await encryptWithNonce(value, encryptionKey, nonce) };
}
