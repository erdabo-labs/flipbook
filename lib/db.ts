import "server-only";
import { getPool, inTransaction } from "./server/postgres";
import { Repository } from "./server/repository";
import { operationArgs, evaluation } from "./server/validation";
export type { ClosedItemRow } from "./types";

export async function getSummaryStats(...args: Parameters<Repository['getSummaryStats']>): Promise<Awaited<ReturnType<Repository['getSummaryStats']>>> {
 operationArgs.getSummaryStats.parse(args);
 return new Repository(getPool()).getSummaryStats(...args);
}
export async function getAcquisitionsPnl(...args: Parameters<Repository['getAcquisitionsPnl']>): Promise<Awaited<ReturnType<Repository['getAcquisitionsPnl']>>> {
 operationArgs.getAcquisitionsPnl.parse(args);
 return new Repository(getPool()).getAcquisitionsPnl(...args);
}
export async function getActiveAcquisitions(...args: Parameters<Repository['getActiveAcquisitions']>): Promise<Awaited<ReturnType<Repository['getActiveAcquisitions']>>> {
 operationArgs.getActiveAcquisitions.parse(args);
 return new Repository(getPool()).getActiveAcquisitions(...args);
}
export async function getRecentTransactions(...args: Parameters<Repository['getRecentTransactions']>): Promise<Awaited<ReturnType<Repository['getRecentTransactions']>>> {
 operationArgs.getRecentTransactions.parse(args);
 return new Repository(getPool()).getRecentTransactions(...args);
}
export async function createAcquisition(...args: Parameters<Repository['createAcquisition']>): Promise<Awaited<ReturnType<Repository['createAcquisition']>>> {
 operationArgs.createAcquisition.parse(args);
 return inTransaction(client => new Repository(client).createAcquisition(...args));
}
export async function createItems(...args: Parameters<Repository['createItems']>): Promise<Awaited<ReturnType<Repository['createItems']>>> {
 operationArgs.createItems.parse(args);
 return inTransaction(client => new Repository(client).createItems(...args));
}
export async function updateAcquisition(...args: Parameters<Repository['updateAcquisition']>): Promise<Awaited<ReturnType<Repository['updateAcquisition']>>> {
 operationArgs.updateAcquisition.parse(args);
 return inTransaction(client => new Repository(client).updateAcquisition(...args));
}
export async function splitItem(...args: Parameters<Repository['splitItem']>): Promise<Awaited<ReturnType<Repository['splitItem']>>> {
 operationArgs.splitItem.parse(args);
 return inTransaction(client => new Repository(client).splitItem(...args));
}
export async function getAcquisition(...args: Parameters<Repository['getAcquisition']>): Promise<Awaited<ReturnType<Repository['getAcquisition']>>> {
 operationArgs.getAcquisition.parse(args);
 return new Repository(getPool()).getAcquisition(...args);
}
export async function getAcquisitionPnl(...args: Parameters<Repository['getAcquisitionPnl']>): Promise<Awaited<ReturnType<Repository['getAcquisitionPnl']>>> {
 operationArgs.getAcquisitionPnl.parse(args);
 return new Repository(getPool()).getAcquisitionPnl(...args);
}
export async function getItemsForAcquisition(...args: Parameters<Repository['getItemsForAcquisition']>): Promise<Awaited<ReturnType<Repository['getItemsForAcquisition']>>> {
 operationArgs.getItemsForAcquisition.parse(args);
 return new Repository(getPool()).getItemsForAcquisition(...args);
}
export async function getTransactionsForAcquisition(...args: Parameters<Repository['getTransactionsForAcquisition']>): Promise<Awaited<ReturnType<Repository['getTransactionsForAcquisition']>>> {
 operationArgs.getTransactionsForAcquisition.parse(args);
 return new Repository(getPool()).getTransactionsForAcquisition(...args);
}
export async function updateItemStatus(...args: Parameters<Repository['updateItemStatus']>): Promise<Awaited<ReturnType<Repository['updateItemStatus']>>> {
 operationArgs.updateItemStatus.parse(args);
 return inTransaction(client => new Repository(client).updateItemStatus(...args));
}
export async function markItemListed(...args: Parameters<Repository['markItemListed']>): Promise<Awaited<ReturnType<Repository['markItemListed']>>> {
 operationArgs.markItemListed.parse(args);
 return inTransaction(client => new Repository(client).markItemListed(...args));
}
export async function markItemPending(...args: Parameters<Repository['markItemPending']>): Promise<Awaited<ReturnType<Repository['markItemPending']>>> {
 operationArgs.markItemPending.parse(args);
 return inTransaction(client => new Repository(client).markItemPending(...args));
}
export async function createBundleListing(...args: Parameters<Repository['createBundleListing']>): Promise<Awaited<ReturnType<Repository['createBundleListing']>>> {
 operationArgs.createBundleListing.parse(args);
 return inTransaction(client => new Repository(client).createBundleListing(...args));
}
export async function getBundleMembers(...args: Parameters<Repository['getBundleMembers']>): Promise<Awaited<ReturnType<Repository['getBundleMembers']>>> {
 operationArgs.getBundleMembers.parse(args);
 return new Repository(getPool()).getBundleMembers(...args);
}
export async function setBundlePending(...args: Parameters<Repository['setBundlePending']>): Promise<Awaited<ReturnType<Repository['setBundlePending']>>> {
 operationArgs.setBundlePending.parse(args);
 return inTransaction(client => new Repository(client).setBundlePending(...args));
}
export async function undoBundlePending(...args: Parameters<Repository['undoBundlePending']>): Promise<Awaited<ReturnType<Repository['undoBundlePending']>>> {
 operationArgs.undoBundlePending.parse(args);
 return inTransaction(client => new Repository(client).undoBundlePending(...args));
}
export async function removeFromBundle(...args: Parameters<Repository['removeFromBundle']>): Promise<Awaited<ReturnType<Repository['removeFromBundle']>>> {
 operationArgs.removeFromBundle.parse(args);
 return inTransaction(client => new Repository(client).removeFromBundle(...args));
}
export async function getInventory(...args: Parameters<Repository['getInventory']>): Promise<Awaited<ReturnType<Repository['getInventory']>>> {
 operationArgs.getInventory.parse(args);
 return new Repository(getPool()).getInventory(...args);
}
export async function getInventoryItems(...args: Parameters<Repository['getInventoryItems']>): Promise<Awaited<ReturnType<Repository['getInventoryItems']>>> {
 operationArgs.getInventoryItems.parse(args);
 return new Repository(getPool()).getInventoryItems(...args);
}
export async function getAcquisitionsLite(...args: Parameters<Repository['getAcquisitionsLite']>): Promise<Awaited<ReturnType<Repository['getAcquisitionsLite']>>> {
 operationArgs.getAcquisitionsLite.parse(args);
 return new Repository(getPool()).getAcquisitionsLite(...args);
}
export async function createSaleOrBundleTransaction(...args: Parameters<Repository['createSaleOrBundleTransaction']>): Promise<Awaited<ReturnType<Repository['createSaleOrBundleTransaction']>>> {
 operationArgs.createSaleOrBundleTransaction.parse(args);
 return inTransaction(client => new Repository(client).createSaleOrBundleTransaction(...args));
}
export async function createTradeTransaction(...args: Parameters<Repository['createTradeTransaction']>): Promise<Awaited<ReturnType<Repository['createTradeTransaction']>>> {
 operationArgs.createTradeTransaction.parse(args);
 return inTransaction(client => new Repository(client).createTradeTransaction(...args));
}
export async function markItemKept(...args: Parameters<Repository['markItemKept']>): Promise<Awaited<ReturnType<Repository['markItemKept']>>> {
 operationArgs.markItemKept.parse(args);
 return inTransaction(client => new Repository(client).markItemKept(...args));
}
export async function updateTransaction(...args: Parameters<Repository['updateTransaction']>): Promise<Awaited<ReturnType<Repository['updateTransaction']>>> {
 operationArgs.updateTransaction.parse(args);
 return inTransaction(client => new Repository(client).updateTransaction(...args));
}
export async function deleteTransaction(...args: Parameters<Repository['deleteTransaction']>): Promise<Awaited<ReturnType<Repository['deleteTransaction']>>> {
 operationArgs.deleteTransaction.parse(args);
 return inTransaction(client => new Repository(client).deleteTransaction(...args));
}
export async function getClosedItemRows(...args: Parameters<Repository['getClosedItemRows']>): Promise<Awaited<ReturnType<Repository['getClosedItemRows']>>> {
 operationArgs.getClosedItemRows.parse(args);
 return new Repository(getPool()).getClosedItemRows(...args);
}
export async function updateItemDetails(...args: Parameters<Repository['updateItemDetails']>): Promise<Awaited<ReturnType<Repository['updateItemDetails']>>> {
 operationArgs.updateItemDetails.parse(args);
 return inTransaction(client => new Repository(client).updateItemDetails(...args));
}
export async function getEvaluations(...args: Parameters<Repository['getEvaluations']>): Promise<Awaited<ReturnType<Repository['getEvaluations']>>> {
 operationArgs.getEvaluations.parse(args);
 return new Repository(getPool()).getEvaluations(...args);
}
export async function getEvaluation(...args: Parameters<Repository['getEvaluation']>): Promise<Awaited<ReturnType<Repository['getEvaluation']>>> {
 operationArgs.getEvaluation.parse(args);
 return new Repository(getPool()).getEvaluation(...args);
}
export async function updateEvaluationNotes(...args: Parameters<Repository['updateEvaluationNotes']>): Promise<Awaited<ReturnType<Repository['updateEvaluationNotes']>>> {
 operationArgs.updateEvaluationNotes.parse(args);
 return inTransaction(client => new Repository(client).updateEvaluationNotes(...args));
}
export async function deleteEvaluation(...args: Parameters<Repository['deleteEvaluation']>): Promise<Awaited<ReturnType<Repository['deleteEvaluation']>>> {
 operationArgs.deleteEvaluation.parse(args);
 return inTransaction(client => new Repository(client).deleteEvaluation(...args));
}
export async function getEvaluationMessages(...args: Parameters<Repository['getEvaluationMessages']>): Promise<Awaited<ReturnType<Repository['getEvaluationMessages']>>> {
 operationArgs.getEvaluationMessages.parse(args);
 return new Repository(getPool()).getEvaluationMessages(...args);
}
export async function getFlippyProfile(...args: Parameters<Repository['getFlippyProfile']>): Promise<Awaited<ReturnType<Repository['getFlippyProfile']>>> {
 operationArgs.getFlippyProfile.parse(args);
 return new Repository(getPool()).getFlippyProfile(...args);
}
export async function saveFlippyProfile(...args: Parameters<Repository['saveFlippyProfile']>): Promise<Awaited<ReturnType<Repository['saveFlippyProfile']>>> {
 operationArgs.saveFlippyProfile.parse(args);
 return inTransaction(client => new Repository(client).saveFlippyProfile(...args));
}
export async function deleteAcquisition(...args: Parameters<Repository['deleteAcquisition']>): Promise<Awaited<ReturnType<Repository['deleteAcquisition']>>> {
 operationArgs.deleteAcquisition.parse(args);
 return inTransaction(client => new Repository(client).deleteAcquisition(...args));
}

export async function createEvaluation(...args: Parameters<Repository["createEvaluation"]>) {
 const input = evaluation.parse(args[0]);
 return inTransaction(client => new Repository(client).createEvaluation(input));
}
export async function saveChat(...args: Parameters<Repository["saveChat"]>) {
 return inTransaction(client => new Repository(client).saveChat(...args));
}

export async function getItem(id: number) {
 return new Repository(getPool()).getItem(id);
}

export async function createAcquisitionWithItems(...args: Parameters<Repository['createAcquisitionWithItems']>) {
 operationArgs.createAcquisitionWithItems.parse(args);
 return inTransaction(client => new Repository(client).createAcquisitionWithItems(...args));
}
