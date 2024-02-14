import * as fs from 'fs';
import path from 'path';
import dotenv from "dotenv";
import { splitArrayIntoBatches, } from './utils/util';
import { CommunityService } from './services/community.service';
import { flatten } from 'lodash';
import dayjs from 'dayjs';
import { readJsonFile } from './utils/file';
import { IData } from './interfaces/file-json.interface';

dotenv.config();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const batchSize = 100;
const batchGroupSize = 3;
const deleyTimeEachBatch = 1000;
const communityService = new CommunityService();

(async () => {
  const filePath = path.join(__dirname, `files/rm-user-list-from-community/${process.env.FILE_NAME}.json`)
  try {
    console.log('Processing file:', `${filePath}`);
    const data = await readJsonFile(filePath);
    const userIds: string[] = [...new Set((data as IData[]).map(d => d.publicId))];
    const batches = splitArrayIntoBatches(userIds, batchSize, batchGroupSize);

    await executeBatchesWithRetry(batches);
  } catch (error) {
    console.error(error);
  }
})();

async function executeBatchesWithRetry(batches: string[][][]) {
  const failedBatches: any[] = [];
  for (const batch of batches) {
    const batchFailed = await processBatch(batch, false);
    await delay(deleyTimeEachBatch);

    if (batchFailed && batchFailed.length) {
      failedBatches.push(...batchFailed);
    }
  }

  if (failedBatches.length) {
    console.log(`Has error total ${failedBatches.length} batches,  the failed batch will be running again...`);
    const batches = splitArrayIntoBatches(flatten(failedBatches), 1, batchGroupSize);
    await executeBatchesWithLogs(batches);
  }
}

async function executeBatchesWithLogs(batches: string[][][]) {
  const errorLogs: any[] = [];
  for (const batch of batches) {
    const batchFailed = await processBatch(batch, true);
    await delay(deleyTimeEachBatch);

    if (batchFailed && batchFailed.length) {
      errorLogs.push(...batchFailed);
    }
  }

  if (errorLogs.length) {
    writeLogs(errorLogs);
  }
}

async function processBatch(
  batch: string[][],
  responseErrorLog?: boolean,
): Promise<any> {
  const processBatchAsync = async (communityId: string, userIds: string[]) => {
  try {
    await communityService.deleteUsersInCommunity(communityId, userIds);
  } catch (error: any) {
    if (responseErrorLog) {
      return { communityId, userIds, error: error.message }
    } else {
      return userIds;
    }
  } finally {
    console.log(`Processed batch for community ${communityId}, total: ${userIds.length}`);
  }
};

  const batchPromises = batch.map((userIds) => {
    const communityId = process.env.COMMUNITY_ID as string;
    return processBatchAsync(communityId, userIds);
  });

  const promises = await Promise.all(batchPromises)
  return promises.filter((p) => p);
}

function writeLogs(errorLogs: any[]) {
  const currentDateTimeFormatted = dayjs().format('YYYY-MM-DD_HH-mm-ss');
  const logFailedBatchPath = path.resolve(__dirname, '../src/logs/failed-batches/');
  if (!fs.existsSync(logFailedBatchPath)) {
    fs.mkdirSync(logFailedBatchPath, { recursive: true });
  }

  const failedBatchFilePath = path.join(logFailedBatchPath, `${currentDateTimeFormatted}-failed.json`);
  fs.writeFileSync(failedBatchFilePath, JSON.stringify(errorLogs, null, 2));
}
