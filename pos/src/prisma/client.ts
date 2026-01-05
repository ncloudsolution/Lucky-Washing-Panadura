// import { PrismaClient } from "@prisma/client";

// const globalForPrisma = global as unknown as { prisma: PrismaClient };

// export const prisma = globalForPrisma.prisma || new PrismaClient();

// if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

//db wrapper

// async function withRetry<T>(fn: () => Promise<T>, retries = 3) {
//   let lastError: any;
//   for (let i = 0; i < retries; i++) {
//     try {
//       return await fn();
//     } catch (err) {
//       lastError = err;
//       if (err.code === "ECONNREFUSED" || err.message.includes("Can't reach database")) {
//         await new Promise(res => setTimeout(res, 500)); // wait before retry
//       } else {
//         throw err;
//       }
//     }
//   }
//   throw lastError;
// }

// const user = await withRetry(() => prisma.staff.findUnique({ where: { id } }));
