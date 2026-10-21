# Google Sheets & Chat Integration Setup Guide

## 1. Overview
The Anmol Enterprises platform includes:
1. **Real-Time Customer Chat**: Live customer support with unread badges, instant admin replying, and order context linking.
2. **Google Sheets Log**: Autonomous, fault-tolerant mirroring of all customer queries, admin replies, and broadcast announcements directly into a dedicated Google Sheet.
3. **Admin Inbox (`/admin/messages`)**: 2-pane Command Center interface with online presence tracking, phone dialing (`tel:`), order linking, and status filters.
4. **Broadcast Messaging (`/admin/broadcasts`)**: Targeted mass communication to All, B2B wholesale, or Retail customers with delivered status receipts.

---

## 2. Google Cloud Service Account Setup (For Google Sheets Sync)

To enable live mirroring of messages to Google Sheets:

### Step 1: Create Google Cloud Project & Enable Sheets API
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or select an existing one), e.g., `Anmol-Enterprises-Prod`.
3. In the search bar, search for **Google Sheets API** and click **Enable**.

### Step 2: Create a Service Account & Download Key
1. Go to **IAM & Admin** > **Service Accounts**.
2. Click **Create Service Account**.
   - Name: `anmol-sheets-sync`
   - Role: Not required (leave blank or select Project Viewer).
3. Click on the created service account email (e.g. `anmol-sheets-sync@anmol-enterprises.iam.gserviceaccount.com`).
4. Switch to the **Keys** tab > click **Add Key** > **Create new key** > select **JSON**.
5. Save the downloaded JSON file securely. It contains:
   - `client_email`
   - `private_key`

### Step 3: Create the Google Sheet & Grant Access
1. Open [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet.
2. Name it: `Anmol Enterprises - Customer Chat & Broadcast Logs`.
3. Click the green **Share** button in the top right.
4. Paste your service account email (`anmol-sheets-sync@...gserviceaccount.com`) and assign role **Editor**.
5. Copy the **Spreadsheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/`**`1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`**`/edit`

---

## 3. Environment Variables Configuration

Add the following variables to your local `.env` and Render dashboard:

```env
# Google Sheets Sync Configuration
GOOGLE_SHEET_ID="your_spreadsheet_id_here"
GOOGLE_SERVICE_ACCOUNT_EMAIL="anmol-sheets-sync@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

> **Note on Private Key in Render / .env**:
> Keep the quotes around `GOOGLE_PRIVATE_KEY` and ensure `\n` characters are preserved. The backend automatically parses escaped newlines (`\\n` to `\n`).

---

## 4. Automatic Header Generation & Structure

Once configured, the background sync worker automatically ensures two sheet tabs exist:
1. **`Chat Log`**:
   - `Timestamp (IST)` | `Message ID` | `Conversation ID` | `Customer Name` | `Customer Phone` | `Customer Type` | `Sender Direction` | `Message / Query` | `Admin Replied By` | `Order ID Context`
2. **`Broadcasts`**:
   - `Timestamp (IST)` | `Broadcast ID` | `Title` | `Audience` | `Recipient Count` | `Created By Admin` | `Message Content`

### Security Safeguards
- **Anti-Formula Injection**: All incoming messages and names starting with dangerous characters (`=`, `+`, `-`, `@`, tab) are automatically escaped with `'`.
- **Unicode Preservation**: Full Marathi (मराठी), Hindi (हिंदी), and emoji characters are preserved intact without question mark `???` corruption.
- **Fault-Tolerant Asynchronous Sync**: Messages are saved in PostgreSQL first. If Google Sheets API is temporarily slow or down, chat continues seamlessly without user interruption.
