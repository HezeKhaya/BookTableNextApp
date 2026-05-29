# Record Keeping Guide

The **Record Keeping** module helps admins maintain external records such as Supplier Invoices and internal records like Stock Snapshots.

## Workflow: Supplier Invoices

```mermaid
flowchart LR
    A[Upload Invoice] --> B[Select Supplier]
    B --> C[Set Date & Amount]
    C --> D[Attach PDF/Image]
    D --> E[Submit]
    E --> F[Invoice Stored Securely]
```

## Step-by-step Instructions

### 1. Supplier Invoices
Keep track of the invoices received from book suppliers (e.g., GOOD NEIGHBOURS, PRIVATE).
- **View Invoices**: A table lists all uploaded invoices with details like Date, Supplier, and Amount. Click `View` to open the file.
- **Upload New**: 
    1. Click `Upload Invoice`.
    2. Select the Supplier from the dropdown.
    3. Enter the Invoice Date and Total Amount.
    4. Attach the invoice file (Max size: 1MB).
    5. Click `Upload`.
- **Delete**: Remove an invoice record by clicking the trash icon.

### 2. Stock Snapshots
- Switch to the **Stock Snapshots** tab.
- This section allows you to capture and view historical snapshots of your stock levels for auditing and reporting purposes.
