export function splitArrayIntoBatches<T>(
  array: T[],
  batchSize: number,
  batchGroupSize: number
): T[][][] {
  const batchGroups: T[][][] = [];

  for (let i = 0; i < array.length; i += batchSize * batchGroupSize) {
    const batchGroup: T[][] = [];

    for (let j = i; j < i + batchSize * batchGroupSize; j += batchSize) {
      const data = array.slice(j, j + batchSize);
      if (!data.length) break;

      batchGroup.push(data);
    }

    batchGroups.push(batchGroup);
  }

  return batchGroups;
}
