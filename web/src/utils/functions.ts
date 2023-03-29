export function randomHex(size: number): string {
  let result = '0x';
  const characters = 'abcdef0123456789';
  const charactersLength = characters.length;

  for (let i = 0; i < size; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export function randomInt(min: number, max: number): number {
  if (min > max) {
    throw new Error('Invalid range: min must be less than or equal to max');
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomBigInt(min: bigint, max: bigint): bigint {
  if (min > max) {
    throw new Error('Invalid range: min must be less than or equal to max');
  }

  const range = max - min + BigInt(1);
  const bitsNeeded = range.toString(2).length;
  let result: bigint;

  do {
    const randomBytes = new Uint8Array(Math.ceil(bitsNeeded / 8));
    crypto.getRandomValues(randomBytes);

    let binaryString = '';
    for (let i = 0; i < randomBytes.length; i++) {
      binaryString += randomBytes[i].toString(2).padStart(8, '0');
    }

    result = BigInt(`0b${binaryString}`) % range;
  } while (result >= range); // Retry if the result is out of range (extremely unlikely)

  return min + result;
}
