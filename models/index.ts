/**
 * Central Model Registry
 * 
 * Turbopack aggressively tree-shakes imports that aren't directly
 * referenced in the function body. When an API route does:
 *   import Client from '@/models/Client';
 * but never calls `Client.xxx()` directly (relying on it only for
 * `.populate('clientId')`), Turbopack may eliminate the import,
 * leaving the Mongoose model unregistered.
 *
 * This file imports every model and re-exports them. Calling
 * `registerModels()` inside `dbConnect()` guarantees all schemas
 * are registered before any query runs.
 */

import User from './User';
import Role from './Role';
import Client from './Client';
import Project from './Project';
import Task from './Task';
import ContentItem from './ContentItem';
import Lead from './Lead';
import Notification from './Notification';
import FinanceSettings from './FinanceSettings';
import Quotation from './Quotation';
import Invoice from './Invoice';
import Payment from './Payment';
import Expense from './Expense';
import Vendor from './Vendor';
import VendorBill from './VendorBill';
import ClientPortalUser from './ClientPortalUser';

// Force side-effects: Mongoose registers models on import.
// Re-exporting keeps Turbopack from eliminating them.
export {
  User,
  Role,
  Client,
  Project,
  Task,
  ContentItem,
  Lead,
  Notification,
  FinanceSettings,
  Quotation,
  Invoice,
  Payment,
  Expense,
  Vendor,
  VendorBill,
  ClientPortalUser,
};

/**
 * Call this function to guarantee every model is registered.
 * The function body references every model, which prevents
 * tree-shaking from removing the imports above.
 */
export function registerModels() {
  // Referencing each model forces Turbopack to retain the imports.
  return {
    User,
    Role,
    Client,
    Project,
    Task,
    ContentItem,
    Lead,
    Notification,
    FinanceSettings,
    Quotation,
    Invoice,
    Payment,
    Expense,
    Vendor,
    VendorBill,
    ClientPortalUser,
  };
}

