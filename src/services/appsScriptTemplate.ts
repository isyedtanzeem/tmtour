/**
 * Production-ready Google Apps Script (Code.gs)
 * Ready to copy & paste directly into Google Apps Script (Extensions > Apps Script in Google Sheets)
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * TRAVEL & VISA PORTAL - GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * =========================================================================
 * 
 * QUICK 3-STEP SETUP:
 * 1. Open your Google Sheet -> Click "Extensions" -> "Apps Script".
 * 2. Delete any default code, paste this entire file, and click "Save" (disk icon).
 * 3. Click "Deploy" (top right) -> "New deployment"
 *    - Select type: "Web app"
 *    - Description: "Travel & Visa API"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (CRITICAL: this allows the app to fetch & save data)
 *    - Click "Deploy" and Copy the generated "Web app URL".
 * 4. Paste that Web app URL into the Admin Dashboard -> "Google Sheets Settings" in your app!
 * 
 * Optional: Run function "initializeDatabase()" once inside Apps Script to pre-populate tabs & headers!
 */

var SHEET_PACKAGES = "HolidayPackages";
var SHEET_VISAS = "VisaServices";
var SHEET_BOOKINGS = "Bookings";
var SHEET_APPLICATIONS = "VisaApplications";

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var lock = LockService.getScriptLock();
  var lockAcquired = lock.tryLock(15000);
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureTabsExist(ss);
    
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action || "getAllData";
    
    // Parse POST body if present
    var postData = {};
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
        if (postData.action) action = postData.action;
      } catch (parseErr) {
        // Fallback for form-encoded or raw strings
      }
    }
    
    var response = { success: true, timestamp: new Date().toISOString() };
    
    if (action === "ping") {
      response.message = "Google Apps Script connection active!";
      response.sheetName = ss.getName();
      response.sheetId = ss.getId();
      response.url = ss.getUrl();
    }
    else if (action === "getAllData" || action === "getData") {
      response.packages = getSheetRecords(ss.getSheetByName(SHEET_PACKAGES));
      response.visas = getSheetRecords(ss.getSheetByName(SHEET_VISAS));
      response.bookings = getSheetRecords(ss.getSheetByName(SHEET_BOOKINGS));
      response.applications = getSheetRecords(ss.getSheetByName(SHEET_APPLICATIONS));
    }
    else if (action === "savePackage") {
      response.item = upsertRecord(ss.getSheetByName(SHEET_PACKAGES), postData.data);
    }
    else if (action === "deletePackage") {
      var idToDelete = postData.id || params.id;
      response.deleted = deleteRecordById(ss.getSheetByName(SHEET_PACKAGES), idToDelete);
    }
    else if (action === "saveVisa") {
      response.item = upsertRecord(ss.getSheetByName(SHEET_VISAS), postData.data);
    }
    else if (action === "deleteVisa") {
      var idToDeleteVisa = postData.id || params.id;
      response.deleted = deleteRecordById(ss.getSheetByName(SHEET_VISAS), idToDeleteVisa);
    }
    else if (action === "createBooking") {
      response.item = appendRecord(ss.getSheetByName(SHEET_BOOKINGS), postData.data);
    }
    else if (action === "createVisaApplication") {
      response.item = appendRecord(ss.getSheetByName(SHEET_APPLICATIONS), postData.data);
    }
    else if (action === "updateBookingStatus") {
      response.updated = updateRecordField(ss.getSheetByName(SHEET_BOOKINGS), postData.id, "status", postData.status);
    }
    else if (action === "updateApplicationStatus") {
      response.updated = updateRecordField(ss.getSheetByName(SHEET_APPLICATIONS), postData.id, "status", postData.status);
    }
    else if (action === "initializeSeedData") {
      initializeDatabase();
      response.message = "Database sheets initialized with headers!";
    }
    else {
      response.success = false;
      response.error = "Unrecognized action: " + action;
    }
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString(),
      stack: error.stack
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    if (lockAcquired) {
      lock.releaseLock();
    }
  }
}

// -------------------------------------------------------------
// SHEET OPERATIONS HELPERS
// -------------------------------------------------------------

function getSheetRecords(sheet) {
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  
  var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = data[0];
  var records = [];
  
  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    var obj = {};
    var hasData = false;
    
    for (var c = 0; c < headers.length; c++) {
      var key = headers[c];
      if (!key) continue;
      var val = row[c];
      
      // Auto-parse JSON strings (arrays or objects like inclusions, itinerary, etc.)
      if (typeof val === "string" && ((val.charAt(0) === "[" && val.charAt(val.length - 1) === "]") || 
          (val.charAt(0) === "{" && val.charAt(val.length - 1) === "}"))) {
        try {
          val = JSON.parse(val);
        } catch (e) {
          // keep as string
        }
      }
      
      obj[key] = val;
      if (val !== "" && val !== null && val !== undefined) hasData = true;
    }
    
    if (hasData && obj.id) {
      records.push(obj);
    }
  }
  return records;
}

function upsertRecord(sheet, record) {
  if (!sheet || !record || !record.id) return null;
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 1) ensureHeaders(sheet, record);
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var idColIdx = headers.indexOf("id") + 1;
  if (idColIdx <= 0) return null;
  
  var rowIndexToUpdate = -1;
  if (lastRow > 1) {
    var idValues = sheet.getRange(2, idColIdx, lastRow - 1, 1).getValues();
    for (var i = 0; i < idValues.length; i++) {
      if (String(idValues[i][0]) === String(record.id)) {
        rowIndexToUpdate = i + 2;
        break;
      }
    }
  }
  
  var rowValues = [];
  for (var c = 0; c < headers.length; c++) {
    var h = headers[c];
    var v = record[h];
    if (v === undefined) v = "";
    if (typeof v === "object" && v !== null) {
      v = JSON.stringify(v);
    }
    rowValues.push(v);
  }
  
  if (rowIndexToUpdate > 0) {
    sheet.getRange(rowIndexToUpdate, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  return record;
}

function appendRecord(sheet, record) {
  if (!sheet || !record) return null;
  if (!record.id) record.id = Utilities.getUuid();
  if (!record.createdAt && !record.submittedAt) record.createdAt = new Date().toISOString();
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowValues = [];
  
  for (var c = 0; c < headers.length; c++) {
    var h = headers[c];
    var v = record[h];
    if (v === undefined) v = "";
    if (typeof v === "object" && v !== null) {
      v = JSON.stringify(v);
    }
    rowValues.push(v);
  }
  sheet.appendRow(rowValues);
  return record;
}

function deleteRecordById(sheet, id) {
  if (!sheet || !id) return false;
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var idColIdx = headers.indexOf("id") + 1;
  if (idColIdx <= 0) return false;
  
  var idValues = sheet.getRange(2, idColIdx, lastRow - 1, 1).getValues();
  for (var i = 0; i < idValues.length; i++) {
    if (String(idValues[i][0]) === String(id)) {
      sheet.deleteRow(i + 2);
      return true;
    }
  }
  return false;
}

function updateRecordField(sheet, id, fieldName, value) {
  if (!sheet || !id || !fieldName) return false;
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var idColIdx = headers.indexOf("id") + 1;
  var targetColIdx = headers.indexOf(fieldName) + 1;
  if (idColIdx <= 0 || targetColIdx <= 0) return false;
  
  var idValues = sheet.getRange(2, idColIdx, lastRow - 1, 1).getValues();
  for (var i = 0; i < idValues.length; i++) {
    if (String(idValues[i][0]) === String(id)) {
      sheet.getRange(i + 2, targetColIdx).setValue(value);
      return true;
    }
  }
  return false;
}

function ensureTabsExist(ss) {
  var required = [
    { name: SHEET_PACKAGES, headers: ["id", "title", "destination", "country", "duration", "days", "nights", "price", "originalPrice", "discountPercent", "rating", "reviewCount", "featured", "category", "imageUrl", "galleryImages", "overview", "inclusions", "exclusions", "itinerary", "hotelName", "hotelRating", "nextDepartureDate"] },
    { name: SHEET_VISAS, headers: ["id", "country", "countryCode", "flagEmoji", "visaType", "category", "processingTime", "validity", "stayDuration", "entryType", "embassyFee", "serviceFee", "totalFee", "expressAvailable", "expressFee", "expressProcessingTime", "documentsRequired", "popular", "description"] },
    { name: SHEET_BOOKINGS, headers: ["id", "packageId", "packageTitle", "customerName", "customerEmail", "customerPhone", "travelDate", "travelersAdults", "travelersChildren", "totalPrice", "specialRequests", "status", "createdAt"] },
    { name: SHEET_APPLICATIONS, headers: ["id", "referenceNumber", "visaId", "country", "visaType", "applicantName", "applicantEmail", "applicantPhone", "passportNumber", "nationality", "travelDate", "expressProcessing", "totalAmount", "uploadedDocuments", "status", "submittedAt", "notes"] }
  ];
  
  for (var i = 0; i < required.length; i++) {
    var req = required[i];
    var sheet = ss.getSheetByName(req.name);
    if (!sheet) {
      sheet = ss.insertSheet(req.name);
      sheet.getRange(1, 1, 1, req.headers.length).setValues([req.headers]);
      sheet.getRange(1, 1, 1, req.headers.length).setFontWeight("bold").setBackground("#e8f0fe");
      sheet.setFrozenRows(1);
    }
  }
}

function initializeDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureTabsExist(ss);
}
`;
