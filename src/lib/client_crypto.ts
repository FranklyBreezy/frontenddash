// src/lib/client_crypto.ts

function strToUtf8Bytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function utf8BytesToStr(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function bitShiftLeftBytes(byteArray: Uint8Array): Uint8Array {
  const out = new Uint8Array(byteArray.length);
  for (let i = 0; i < byteArray.length; i++) {
    out[i] = (byteArray[i] << 1) & 0xff;
  }
  return out;
}

function bitShiftRightBytes(byteArray: Uint8Array): Uint8Array {
  const out = new Uint8Array(byteArray.length);
  for (let i = 0; i < byteArray.length; i++) {
    out[i] = (byteArray[i] >> 1) & 0xff;
  }
  return out;
}

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  base = base % mod;
  let result = 1n;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    base = (base * base) % mod;
    exp >>= 1n;
  }
  return result;
}

function rsaEncryptBytes(byteArray: Uint8Array, publicKey: { e: string, n: string }): string[] {
  const e = BigInt(publicKey.e);
  const n = BigInt(publicKey.n);
  const ciphertext: string[] = [];
  for (let i = 0; i < byteArray.length; i++) {
    const m = BigInt(byteArray[i]);
    const c = modPow(m, e, n);
    ciphertext.push(c.toString());
  }
  return ciphertext;
}

function rsaDecryptInts(ciphertextArray: string[], privateKey: { d: string, n: string }): Uint8Array {
  const d = BigInt(privateKey.d);
  const n = BigInt(privateKey.n);
  const bytes = new Uint8Array(ciphertextArray.length);
  for (let i = 0; i < ciphertextArray.length; i++) {
    const c = BigInt(ciphertextArray[i]);
    const m = modPow(c, d, n);
    const mb = Number(m % 256n);
    bytes[i] = mb;
  }
  return bytes;
}

function customEncryptString(plaintext: string, publicKey: { e: string, n: string }): string[] {
  const bytes = strToUtf8Bytes(plaintext);
  const shifted = bitShiftLeftBytes(bytes);
  const ciphertext = rsaEncryptBytes(shifted, publicKey);
  return ciphertext;
}

function customDecryptToString(ciphertextArray: string[], privateKey: { d: string, n: string }): string {
  const decryptedShifted = rsaDecryptInts(ciphertextArray, privateKey);
  const unshifted = bitShiftRightBytes(decryptedShifted);
  return utf8BytesToStr(unshifted);
}

function egcd(a: bigint, b: bigint): [bigint, bigint, bigint] {
  if (b === 0n) return [a, 1n, 0n];
  const [g, x1, y1] = egcd(b, a % b);
  return [g, y1, x1 - (a / b) * y1];
}

// Single default export for all functions and types
export default {
  strToUtf8Bytes,
  utf8BytesToStr,
  bitShiftLeftBytes,
  bitShiftRightBytes,
  modPow,
  rsaEncryptBytes,
  rsaDecryptInts,
  customEncryptString,
  customDecryptToString,
  egcd
};