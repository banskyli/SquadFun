import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Starting token cleanup script...');

  // Define the cutoff date: May 3, 2026
  const cutoffDate = new Date('2026-05-03T00:00:00Z');
  
  console.log(`📅 Deleting tokens created BEFORE: ${cutoffDate.toISOString()}`);

  // 1. Find tokens to delete
  const tokensToDelete = await prisma.token.findMany({
    where: {
      createdAt: {
        lt: cutoffDate
      }
    },
    select: {
      contractAddress: true,
      symbol: true,
      name: true
    }
  });

  const count = tokensToDelete.length;
  if (count === 0) {
    console.log('✅ No tokens found created before last week.');
    return;
  }

  console.log(`🔍 Found ${count} tokens to delete.`);
  const tokenAddresses = tokensToDelete.map(t => t.contractAddress);

  try {
    // 2. Delete related records first (Trades and Comments)
    console.log('📉 Deleting related trades...');
    const deletedTrades = await prisma.trade.deleteMany({
      where: {
        tokenAddress: {
          in: tokenAddresses
        }
      }
    });
    console.log(`   - Deleted ${deletedTrades.count} trades.`);

    console.log('💬 Deleting related comments...');
    const deletedComments = await prisma.comment.deleteMany({
      where: {
        tokenAddress: {
          in: tokenAddresses
        }
      }
    });
    console.log(`   - Deleted ${deletedComments.count} comments.`);

    // 3. Delete the tokens
    console.log('🪙 Deleting tokens...');
    const deletedTokens = await prisma.token.deleteMany({
      where: {
        contractAddress: {
          in: tokenAddresses
        }
      }
    });
    console.log(`✅ Successfully deleted ${deletedTokens.count} tokens.`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
