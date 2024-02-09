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

(async () => {
  const batchSize = 100;
  const batchGroupSize = 3;
  const deleyTimeEachBatch = 1000;

  const communityService = new CommunityService();
  const filePath = path.join(__dirname, `files/rm-user-list-from-community/${process.env.FILE_NAME}.json`)
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  try {
    console.log('Processing file:', `${filePath}`);
    const data = await readJsonFile(filePath);
    const userIds: string[] = [...new Set((data as IData[]).map(d => d.publicId))];
    const batches = splitArrayIntoBatches(userIds, batchSize, batchGroupSize);
    const batchFailed: any[] = [];

    for (const batch of batches) {
      await processBatch(batch, communityService, batchFailed, false);
      await delay(deleyTimeEachBatch);

      if (batchFailed.length) {
        console.log(`Has error total ${batchFailed.length} batches,  the failed batch will be running again...`);
        const errorLog: any[] = [];
        const batches = splitArrayIntoBatches(flatten(batchFailed), 1, batchGroupSize);

        for (const batch of batches) {
          await processBatch(batch, communityService, errorLog, true);
          await delay(deleyTimeEachBatch);
        }

        if(errorLog.length) {
          const currentDateTimeFormatted = dayjs().format('YYYY-MM-DD_HH-mm-ss');
          const logFailedBatchPath = path.resolve(__dirname, '../src/logs/failed-batches/');
          if (!fs.existsSync(logFailedBatchPath)) {
            fs.mkdirSync(logFailedBatchPath, { recursive: true });
          }

          const failedBatchFilePath = path.join(logFailedBatchPath, `${currentDateTimeFormatted}-failed.json`);
          fs.writeFileSync(failedBatchFilePath, JSON.stringify(errorLog, null, 2));
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
})();

async function processBatch(
  batch: string[][],
  communityService: CommunityService,
  batchFailed: any[],
  responseErrorLog?: boolean,
): Promise<void> {
  const processBatchAsync = async (communityId: string, userIds: string[]) => {
    try {
      await communityService.deleteUsersInCommunity(communityId, userIds);
    } catch (error: any) {
      if (responseErrorLog) {
        batchFailed.push({ communityId, userIds, error: error.message });
      } else {
        batchFailed.push(userIds);
      }
    } finally {
      console.log(`Processed batch for community ${communityId}, total: ${userIds.length}`);
    }
  };

  const batchPromises = batch.map((userIds) => {
    const communityId = process.env.COMMUNITY_ID as string;
    return processBatchAsync(communityId, userIds);
  });

  await Promise.all(batchPromises);
}
