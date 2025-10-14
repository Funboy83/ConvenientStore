export const SAMPLE_SALES_DATA = JSON.stringify([
  {"transaction_id": "TXN001", "employee_id": "E001", "timestamp": "2023-10-26T10:00:00Z", "amount": 55.0, "items": [{"item": "ItemA", "quantity": 1, "price": 55.0}], "type": "sale"},
  {"transaction_id": "TXN002", "employee_id": "E002", "timestamp": "2023-10-26T10:05:00Z", "amount": 120.0, "items": [{"item": "ItemB", "quantity": 2, "price": 60.0}], "type": "sale"},
  {"transaction_id": "TXN003", "employee_id": "E001", "timestamp": "2023-10-26T10:10:00Z", "amount": -55.0, "items": [{"item": "ItemA", "quantity": 1, "price": 55.0}], "type": "return"},
  {"transaction_id": "TXN004", "employee_id": "E003", "timestamp": "2023-10-26T10:15:00Z", "amount": 0, "items": [], "type": "void"},
  {"transaction_id": "TXN005", "employee_id": "E001", "timestamp": "2023-10-26T22:00:00Z", "amount": 250.0, "items": [{"item": "ItemC", "quantity": 1, "price": 250.0}], "type": "sale", "discount": 0}
], null, 2);

export const SAMPLE_INVENTORY_DATA = JSON.stringify([
  {"item_id": "ItemA", "name": "Premium Widget", "stock_level": 99, "last_updated": "2023-10-26T10:10:00Z"},
  {"item_id": "ItemB", "name": "Standard Gadget", "stock_level": 200, "last_updated": "2023-10-26T09:00:00Z"},
  {"item_id": "ItemD", "name": "Extra Component", "stock_level": 50, "last_updated": "2023-10-26T08:00:00Z", "discrepancy_log": [{"date": "2023-10-25", "change": -5, "reason": "Unknown"}]}
], null, 2);

export const SAMPLE_EMPLOYEE_ACTIVITY_DATA = JSON.stringify([
  {"employee_id": "E001", "name": "John Doe", "logins": ["2023-10-26T08:55:00Z", "2023-10-26T21:55:00Z"], "actions": ["sale", "return", "sale_after_hours"]},
  {"employee_id": "E002", "name": "Jane Smith", "logins": ["2023-10-26T09:00:00Z"], "actions": ["sale"]},
  {"employee_id": "E003", "name": "Robert Brown", "logins": ["2023-10-26T09:00:00Z"], "actions": ["void_transaction", "discount_override"]}
], null, 2);

export const SAMPLE_SYSTEM_LOGS = JSON.stringify([
  {"log_id": "L001", "timestamp": "2023-10-26T08:55:00Z", "user_id": "E001", "action": "login", "status": "success"},
  {"log_id": "L002", "timestamp": "2023-10-26T10:15:00Z", "user_id": "E003", "action": "void_transaction", "target_id": "TXN004", "requires_approval": true, "approved_by": "MGR01"},
  {"log_id": "L003", "timestamp": "2023-10-26T21:00:00Z", "user_id": "UNKNOWN", "action": "login_attempt", "status": "failed"},
  {"log_id": "L004", "timestamp": "2023-10-26T22:00:00Z", "user_id": "E001", "action": "sale", "details": "Transaction processed outside of standard business hours."}
], null, 2);
