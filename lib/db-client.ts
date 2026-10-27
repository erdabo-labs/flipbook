// Browser transport only. No database driver or server configuration belongs here.
import type * as DB from "./db";
export type { ClosedItemRow } from "./types";

async function request<T>(operation: string, args: unknown[]): Promise<T> {
 // JSON turns undefined array entries into null. Preserve optional trailing arguments.
 while (args.length && args[args.length - 1] === undefined) args.pop();
 const res = await fetch(`/api/data/${operation}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ args }), cache: "no-store" });
 const body = await res.json();
 if (!res.ok) {
   throw new Error(body.error || "Request failed");
 }
 return body.data as T;
}

export const getSummaryStats = (...args: Parameters<typeof DB.getSummaryStats>): ReturnType<typeof DB.getSummaryStats> => request("getSummaryStats", args);

export const getAcquisitionsPnl = (...args: Parameters<typeof DB.getAcquisitionsPnl>): ReturnType<typeof DB.getAcquisitionsPnl> => request("getAcquisitionsPnl", args);

export const getActiveAcquisitions = (...args: Parameters<typeof DB.getActiveAcquisitions>): ReturnType<typeof DB.getActiveAcquisitions> => request("getActiveAcquisitions", args);

export const getRecentTransactions = (...args: Parameters<typeof DB.getRecentTransactions>): ReturnType<typeof DB.getRecentTransactions> => request("getRecentTransactions", args);

export const createAcquisition = (...args: Parameters<typeof DB.createAcquisition>): ReturnType<typeof DB.createAcquisition> => request("createAcquisition", args);

export const createItems = (...args: Parameters<typeof DB.createItems>): ReturnType<typeof DB.createItems> => request("createItems", args);

export const updateAcquisition = (...args: Parameters<typeof DB.updateAcquisition>): ReturnType<typeof DB.updateAcquisition> => request("updateAcquisition", args);

export const splitItem = (...args: Parameters<typeof DB.splitItem>): ReturnType<typeof DB.splitItem> => request("splitItem", args);

export const getAcquisition = (...args: Parameters<typeof DB.getAcquisition>): ReturnType<typeof DB.getAcquisition> => request("getAcquisition", args);

export const getAcquisitionPnl = (...args: Parameters<typeof DB.getAcquisitionPnl>): ReturnType<typeof DB.getAcquisitionPnl> => request("getAcquisitionPnl", args);

export const getItemsForAcquisition = (...args: Parameters<typeof DB.getItemsForAcquisition>): ReturnType<typeof DB.getItemsForAcquisition> => request("getItemsForAcquisition", args);

export const getTransactionsForAcquisition = (...args: Parameters<typeof DB.getTransactionsForAcquisition>): ReturnType<typeof DB.getTransactionsForAcquisition> => request("getTransactionsForAcquisition", args);

export const updateItemStatus = (...args: Parameters<typeof DB.updateItemStatus>): ReturnType<typeof DB.updateItemStatus> => request("updateItemStatus", args);

export const markItemListed = (...args: Parameters<typeof DB.markItemListed>): ReturnType<typeof DB.markItemListed> => request("markItemListed", args);

export const markItemPending = (...args: Parameters<typeof DB.markItemPending>): ReturnType<typeof DB.markItemPending> => request("markItemPending", args);

export const createBundleListing = (...args: Parameters<typeof DB.createBundleListing>): ReturnType<typeof DB.createBundleListing> => request("createBundleListing", args);

export const getBundleMembers = (...args: Parameters<typeof DB.getBundleMembers>): ReturnType<typeof DB.getBundleMembers> => request("getBundleMembers", args);

export const setBundlePending = (...args: Parameters<typeof DB.setBundlePending>): ReturnType<typeof DB.setBundlePending> => request("setBundlePending", args);

export const undoBundlePending = (...args: Parameters<typeof DB.undoBundlePending>): ReturnType<typeof DB.undoBundlePending> => request("undoBundlePending", args);

export const removeFromBundle = (...args: Parameters<typeof DB.removeFromBundle>): ReturnType<typeof DB.removeFromBundle> => request("removeFromBundle", args);

export const getInventory = (...args: Parameters<typeof DB.getInventory>): ReturnType<typeof DB.getInventory> => request("getInventory", args);

export const getInventoryItems = (...args: Parameters<typeof DB.getInventoryItems>): ReturnType<typeof DB.getInventoryItems> => request("getInventoryItems", args);

export const getAcquisitionsLite = (...args: Parameters<typeof DB.getAcquisitionsLite>): ReturnType<typeof DB.getAcquisitionsLite> => request("getAcquisitionsLite", args);

export const createSaleOrBundleTransaction = (...args: Parameters<typeof DB.createSaleOrBundleTransaction>): ReturnType<typeof DB.createSaleOrBundleTransaction> => request("createSaleOrBundleTransaction", args);

export const createTradeTransaction = (...args: Parameters<typeof DB.createTradeTransaction>): ReturnType<typeof DB.createTradeTransaction> => request("createTradeTransaction", args);

export const markItemKept = (...args: Parameters<typeof DB.markItemKept>): ReturnType<typeof DB.markItemKept> => request("markItemKept", args);

export const updateTransaction = (...args: Parameters<typeof DB.updateTransaction>): ReturnType<typeof DB.updateTransaction> => request("updateTransaction", args);

export const deleteTransaction = (...args: Parameters<typeof DB.deleteTransaction>): ReturnType<typeof DB.deleteTransaction> => request("deleteTransaction", args);

export const getClosedItemRows = (...args: Parameters<typeof DB.getClosedItemRows>): ReturnType<typeof DB.getClosedItemRows> => request("getClosedItemRows", args);

export const updateItemDetails = (...args: Parameters<typeof DB.updateItemDetails>): ReturnType<typeof DB.updateItemDetails> => request("updateItemDetails", args);


export const getEvaluations = (...args: Parameters<typeof DB.getEvaluations>): ReturnType<typeof DB.getEvaluations> => request("getEvaluations", args);

export const getEvaluation = (...args: Parameters<typeof DB.getEvaluation>): ReturnType<typeof DB.getEvaluation> => request("getEvaluation", args);

export const updateEvaluationNotes = (...args: Parameters<typeof DB.updateEvaluationNotes>): ReturnType<typeof DB.updateEvaluationNotes> => request("updateEvaluationNotes", args);

export const deleteEvaluation = (...args: Parameters<typeof DB.deleteEvaluation>): ReturnType<typeof DB.deleteEvaluation> => request("deleteEvaluation", args);

export const getEvaluationMessages = (...args: Parameters<typeof DB.getEvaluationMessages>): ReturnType<typeof DB.getEvaluationMessages> => request("getEvaluationMessages", args);

export const getFlippyProfile = (...args: Parameters<typeof DB.getFlippyProfile>): ReturnType<typeof DB.getFlippyProfile> => request("getFlippyProfile", args);

export const saveFlippyProfile = (...args: Parameters<typeof DB.saveFlippyProfile>): ReturnType<typeof DB.saveFlippyProfile> => request("saveFlippyProfile", args);

export const deleteAcquisition = (...args: Parameters<typeof DB.deleteAcquisition>): ReturnType<typeof DB.deleteAcquisition> => request("deleteAcquisition", args);

export const createAcquisitionWithItems = (...args: Parameters<typeof DB.createAcquisitionWithItems>): ReturnType<typeof DB.createAcquisitionWithItems> => request("createAcquisitionWithItems", args);
