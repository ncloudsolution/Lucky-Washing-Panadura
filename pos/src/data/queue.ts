import { BasicDataFetch } from "@/utils/common";
import { IQueue } from ".";
import { cachedb, updateLastEbillId } from "./dbcache";

interface QueueItem {
  id: string;
  edit: boolean;
  payload: any;
  createdAt: string;
  retryCount?: number;
}

export async function addToQueue({ id, payload, edit, createdAt }: IQueue) {
  const data = { id, payload, edit, createdAt };
  await cachedb.queue.put(data);
}

let isProcessingQueue = false;

export async function processOrderQueue() {
  if (isProcessingQueue) return; // 🚫 prevent parallel runs
  isProcessingQueue = true;

  try {
    while (true) {
      console.log("upper que executing");
      const nextItem = await getNextQueueItem(); // ⬅️ Dexie / IndexedDB

      if (!nextItem) break; // ✅ queue empty → stop

      console.log("lower que executing");

      const result = await sendWithRetry(nextItem);

      if (result.success) {
        await removeFromQueue(nextItem.id); // ✅ remove item
        if (result.serverId !== "edited") {
          await updateLastEbillId(result.serverId as string);
        }
      } else {
        // ❌ failed after retries → skip item
        // await markAsFailed(nextItem.id);
        break;
      }
    }
  } finally {
    isProcessingQueue = false;
  }
}

async function sendWithRetry(
  item: QueueItem,
): Promise<{ success: boolean; serverId?: string }> {
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await BasicDataFetch({
        method: item.edit ? "PUT" : "POST",
        endpoint: "/api/orders",
        data: item.payload,
      });

      const serverId = response?.data?.baseData?.id ?? "edited";

      if (!serverId && item.edit) {
        throw new Error("Invalid response: baseData.id missing");
      }

      return {
        success: true,
        serverId,
      };
    } catch (err) {
      console.error(`Queue item ${item.id} failed (attempt ${attempt})`, err);

      if (attempt === MAX_RETRIES) {
        return { success: false };
      }

      // exponential-ish backoff
      await delay(1000 * attempt);
    }
  }

  return { success: false };
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function getNextQueueItem(): Promise<QueueItem | undefined> {
  return cachedb.queue.orderBy("createdAt").first();
}

async function removeFromQueue(id: string) {
  await cachedb.queue.delete(id);
}

// async function markAsFailed(id: string) {
//   await cachedb.queue.update(id, {
//     failed: true,
//     failedAt: new Date().toISOString(),
//   });
// }
