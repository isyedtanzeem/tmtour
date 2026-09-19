/**
 * Production-ready Google Apps Script (Code.gs)
 * Ready to copy & paste directly into Google Apps Script (Extensions > Apps Script in Google Sheets)
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * TRIPMYTOUR - GOOGLE APPS SCRIPT BACKEND & EMAIL ENGINE (Code.gs)
 * =========================================================================
 * 
 * FEATURES:
 * 1. Bi-directional database sync for Packages, Visas, Bookings & Applications
 * 2. Instant Lead Email Notifications to your team (HTML + Plain-Text)
 * 3. Instant Customer Confirmation Acknowledgements (Auto-Responder)
 * 4. 1-Click WhatsApp reply and direct phone call links in every lead email
 * 5. Built-in Test Function: testEmailNotification()
 * 
 * QUICK 3-STEP SETUP:
 * 1. Open your Google Sheet -> Click "Extensions" -> "Apps Script".
 * 2. Delete any existing code, paste this entire file, and click "Save" (Ctrl+S / Cmd+S).
 * 3. (Optional) Select function "testEmailNotification" from the top dropdown and click "Run"
 *    to authorize Google permissions and receive a test lead email in your inbox!
 * 4. Click "Deploy" (top right) -> "New deployment"
 *    - Select type: "Web app" (click gear icon if needed)
 *    - Description: "TripMyTour Web API with Email Integration"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (CRITICAL: allows the public app to submit leads & sync)
 *    - Click "Deploy", authorize access, and copy the generated "Web app URL" (ending in /exec).
 * 5. Paste that Web App URL into your TripMyTour Admin Portal -> Google Sheets Settings!
 */

// =========================================================================
// 1. CONFIGURATION & NOTIFICATION SETTINGS
// =========================================================================

// Fallback email address(es) if none are sent by the frontend (comma-separated):
var DEFAULT_NOTIFICATION_EMAILS = [
  "lead.tripmytour2026@gmail.com"
];

// Send instant confirmation email to customer when they submit an inquiry:
var SEND_CUSTOMER_CONFIRMATION = true;

// Business details for branding and outbound emails:
var COMPANY_NAME = "TripMyTour";
var COMPANY_TAGLINE = "Domestic Holidays, International Tours & Fast-Track Visas";
var COMPANY_PHONE = "+91 98803 71756";
var COMPANY_PHONE_RAW = "919880371756";
var COMPANY_EMAIL = "lead.tripmytour2026@gmail.com";
var COMPANY_ADDRESS = "Indiranagar / MG Road, Bengaluru, Karnataka 560001";
var COMPANY_WEBSITE = "https://tripmytour.com";

// Sheet tab names:
var SHEET_PACKAGES = "HolidayPackages";
var SHEET_VISAS = "VisaServices";
var SHEET_BOOKINGS = "Bookings";
var SHEET_APPLICATIONS = "VisaApplications";

// =========================================================================
// 2. HTTP REQUEST HANDLERS (GET / POST)
// =========================================================================

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var lock = LockService.getScriptLock();
  var lockAcquired = lock.tryLock(20000);
  
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
        // Raw string or form data fallback
      }
    }
    
    // Support GET query parameters or URL-encoded inputs
    if (params.data && !postData.data) {
      try {
        postData.data = typeof params.data === "string" ? JSON.parse(params.data) : params.data;
      } catch (parseErr) {
        postData.data = params.data;
      }
    }
    if (params.payload && !postData.data) {
      try {
        var parsedPayload = typeof params.payload === "string" ? JSON.parse(params.payload) : params.payload;
        if (parsedPayload.data) postData.data = parsedPayload.data;
        if (parsedPayload.id) postData.id = parsedPayload.id;
        if (parsedPayload.action && !action) action = parsedPayload.action;
      } catch (e) {}
    }
    if (params.id && !postData.id) {
      postData.id = params.id;
    }
    if (params.status && !postData.status) {
      postData.status = params.status;
    }
    if (params.notificationEmails && !postData.notificationEmails) {
      try {
        postData.notificationEmails = typeof params.notificationEmails === "string" 
          ? JSON.parse(params.notificationEmails) 
          : params.notificationEmails;
      } catch(e) {}
    }
    
    var response = { 
      success: true, 
      timestamp: new Date().toISOString(),
      quotaRemaining: MailApp.getRemainingDailyQuota()
    };
    
    // ----------------- PING / HEALTH CHECK -----------------
    if (action === "ping") {
      response.message = "Google Apps Script connected successfully with Email Integration active!";
      response.sheetName = ss.getName();
      response.sheetId = ss.getId();
      response.url = ss.getUrl();
      response.emailQuota = MailApp.getRemainingDailyQuota();
    }
    
    // ----------------- GET ALL DATA -----------------
    else if (action === "getAllData" || action === "getData") {
      response.packages = getSheetRecords(ss.getSheetByName(SHEET_PACKAGES));
      response.visas = getSheetRecords(ss.getSheetByName(SHEET_VISAS));
      response.bookings = getSheetRecords(ss.getSheetByName(SHEET_BOOKINGS));
      response.applications = getSheetRecords(ss.getSheetByName(SHEET_APPLICATIONS));
    }
    
    // ----------------- PACKAGES CRUD -----------------
    else if (action === "savePackage") {
      response.item = upsertRecord(ss.getSheetByName(SHEET_PACKAGES), postData.data);
      response.packages = getSheetRecords(ss.getSheetByName(SHEET_PACKAGES));
    }
    else if (action === "deletePackage") {
      var idToDelete = postData.id || params.id;
      response.deleted = deleteRecordById(ss.getSheetByName(SHEET_PACKAGES), idToDelete);
      response.packages = getSheetRecords(ss.getSheetByName(SHEET_PACKAGES));
    }
    
    // ----------------- VISAS CRUD -----------------
    else if (action === "saveVisa") {
      response.item = upsertRecord(ss.getSheetByName(SHEET_VISAS), postData.data);
      response.visas = getSheetRecords(ss.getSheetByName(SHEET_VISAS));
    }
    else if (action === "deleteVisa") {
      var idToDeleteVisa = postData.id || params.id;
      response.deleted = deleteRecordById(ss.getSheetByName(SHEET_VISAS), idToDeleteVisa);
      response.visas = getSheetRecords(ss.getSheetByName(SHEET_VISAS));
    }
    
    // ----------------- BOOKING INQUIRY + EMAIL ALERT -----------------
    else if (action === "createBooking") {
      response.item = appendRecord(ss.getSheetByName(SHEET_BOOKINGS), postData.data);
      response.bookings = getSheetRecords(ss.getSheetByName(SHEET_BOOKINGS));
      
      // Determine recipient list (merge client configured recipients with fallback)
      var recipients = resolveRecipients(postData.notificationEmails);
      
      // Dispatch Lead Email to Team
      var emailSent = sendHolidayLeadNotification(recipients, postData.data, ss.getUrl());
      response.emailDispatched = emailSent;
      
      // Dispatch Customer Confirmation Email (if enabled and customer provided email)
      if (SEND_CUSTOMER_CONFIRMATION && postData.data && postData.data.customerEmail) {
        sendCustomerHolidayConfirmation(postData.data);
      }
    }
    
    // ----------------- VISA APPLICATION + EMAIL ALERT -----------------
    else if (action === "createVisaApplication") {
      response.item = appendRecord(ss.getSheetByName(SHEET_APPLICATIONS), postData.data);
      response.applications = getSheetRecords(ss.getSheetByName(SHEET_APPLICATIONS));
      
      // Determine recipient list
      var recipientsVisa = resolveRecipients(postData.notificationEmails);
      
      // Dispatch Lead Email to Team
      var emailSentVisa = sendVisaLeadNotification(recipientsVisa, postData.data, ss.getUrl());
      response.emailDispatched = emailSentVisa;
      
      // Dispatch Applicant Confirmation Email
      if (SEND_CUSTOMER_CONFIRMATION && postData.data && postData.data.applicantEmail) {
        sendCustomerVisaConfirmation(postData.data);
      }
    }
    
    // ----------------- STATUS UPDATES -----------------
    else if (action === "updateBookingStatus") {
      response.updated = updateRecordField(ss.getSheetByName(SHEET_BOOKINGS), postData.id, "status", postData.status);
      response.bookings = getSheetRecords(ss.getSheetByName(SHEET_BOOKINGS));
    }
    else if (action === "updateApplicationStatus") {
      response.updated = updateRecordField(ss.getSheetByName(SHEET_APPLICATIONS), postData.id, "status", postData.status);
      response.applications = getSheetRecords(ss.getSheetByName(SHEET_APPLICATIONS));
    }
    
    // ----------------- TEST EMAIL TRIGGER -----------------
    else if (action === "testEmail") {
      var testRecipients = resolveRecipients(postData.notificationEmails);
      sendTestNotification(testRecipients, ss.getUrl());
      response.message = "Test lead alert sent to: " + testRecipients.join(", ");
    }
    
    // ----------------- INITIALIZE DATABASE -----------------
    else if (action === "initializeSeedData") {
      initializeDatabase();
      response.message = "Database sheets initialized with headers and custom styling!";
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

// =========================================================================
// 3. EMAIL DISPATCH & NOTIFICATION TEMPLATES
// =========================================================================

function resolveRecipients(customRecipients) {
  var list = [];
  if (customRecipients && Array.isArray(customRecipients)) {
    list = customRecipients.filter(function(e) { return e && typeof e === "string" && e.indexOf("@") > 0; });
  }
  if (!list.length) {
    list = DEFAULT_NOTIFICATION_EMAILS;
  }
  return list;
}

/**
 * Sends a high-priority Lead Alert to the travel team for holiday package inquiries.
 */
function sendHolidayLeadNotification(recipients, data, sheetUrl) {
  if (!recipients || !recipients.length || !data) return false;
  
  try {
    var customerName = data.customerName || "Customer";
    var customerPhone = cleanPhoneNumber(data.customerPhone || "");
    var customerEmail = data.customerEmail || "N/A";
    var packageTitle = data.packageTitle || "Holiday Package";
    var travelDate = data.travelDate || "Flexible / Not specified";
    var adults = data.travelersAdults || 1;
    var children = data.travelersChildren || 0;
    var totalPrice = data.totalPrice ? "₹" + Number(data.totalPrice).toLocaleString("en-IN") : "To be quoted";
    var notes = data.specialRequests || "None provided";
    var refId = data.id || "INQ-" + new Date().getTime();
    var waUrl = customerPhone ? "https://wa.me/" + customerPhone.replace(/[^0-9]/g, "") + "?text=" + encodeURIComponent("Hello " + customerName + "! Thank you for contacting " + COMPANY_NAME + " regarding the " + packageTitle + ". We are happy to assist you.") : "";

    var subject = "[TripMyTour Lead] 🌴 New Holiday Inquiry: " + customerName + " (" + packageTitle + ")";
    
    var htmlBody = ""
      + "<div style='font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);'>"
      + "  <div style='background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%);padding:28px 24px;color:#ffffff;text-align:left;'>"
      + "    <div style='display:inline-block;background:rgba(255,255,255,0.15);padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;color:#93c5fd;'>★ NEW HOLIDAY INQUIRY</div>"
      + "    <h1 style='margin:0;font-size:22px;font-weight:800;color:#ffffff;line-height:1.3;'>" + customerName + "</h1>"
      + "    <p style='margin:6px 0 0 0;font-size:13px;color:#cbd5e1;'>Target: <strong>" + packageTitle + "</strong></p>"
      + "  </div>"
      + "  <div style='padding:24px;background:#ffffff;'>"
      + "    <div style='background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;'>"
      + "      <div>"
      + "        <div style='font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;'>Direct Quick Actions</div>"
      + "        <div style='font-size:13px;color:#1e293b;margin-top:2px;'>Phone: <strong>" + (data.customerPhone || "N/A") + "</strong></div>"
      + "      </div>"
      + "    </div>"
      + "    <div style='margin-bottom:20px;text-align:center;'>"
      + (waUrl ? "      <a href='" + waUrl + "' style='display:inline-block;background:#16a34a;color:#ffffff;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;margin-right:8px;box-shadow:0 2px 6px rgba(22,163,74,0.3);'>💬 Chat on WhatsApp</a>" : "")
      + (data.customerPhone ? "      <a href='tel:" + data.customerPhone + "' style='display:inline-block;background:#0f172a;color:#ffffff;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;'>📞 Call Customer</a>" : "")
      + "    </div>"
      + "    <table style='width:100%;border-collapse:collapse;margin-top:10px;font-size:13px;color:#334155;'>"
      + "      <tr style='border-bottom:1px solid #f1f5f9;'><td style='padding:10px 6px;font-weight:600;color:#64748b;width:38%;'>Inquiry ID / Ref</td><td style='padding:10px 6px;font-weight:700;font-family:monospace;color:#0f172a;'>" + refId + "</td></tr>"
      + "      <tr style='border-bottom:1px solid #f1f5f9;'><td style='padding:10px 6px;font-weight:600;color:#64748b;'>Customer Name</td><td style='padding:10px 6px;font-weight:700;color:#0f172a;'>" + customerName + "</td></tr>"
      + "      <tr style='border-bottom:1px solid #f1f5f9;'><td style='padding:10px 6px;font-weight:600;color:#64748b;'>Contact Phone</td><td style='padding:10px 6px;font-weight:700;color:#0284c7;'><a href='tel:" + data.customerPhone + "' style='color:#0284c7;text-decoration:none;'>" + data.customerPhone + "</a></td></tr>"
      + "      <tr style='border-bottom:1px solid #f1f5f9;'><td style='padding:10px 6px;font-weight:600;color:#64748b;'>Email Address</td><td style='padding:10px 6px;font-weight:700;color:#0284c7;'><a href='mailto:" + customerEmail + "' style='color:#0284c7;text-decoration:none;'>" + customerEmail + "</a></td></tr>"
      + "      <tr style='border-bottom:1px solid #f1f5f9;'><td style='padding:10px 6px;font-weight:600;color:#64748b;'>Package / Destination</td><td style='padding:10px 6px;font-weight:700;color:#0f172a;'>" + packageTitle + "</td></tr>"
      + "      <tr style='border-bottom:1px solid #f1f5f9;'><td style='padding:10px 6px;font-weight:600;color:#64748b;'>Travel Date</td><td style='padding:10px 6px;color:#0f172a;'>" + travelDate + "</td></tr>"
      + "      <tr style='border-bottom:1px solid #f1f5f9;'><td style='padding:10px 6px;font-weight:600;color:#64748b;'>Passengers</td><td style='padding:10px 6px;color:#0f172a;'>" + adults + " Adult(s), " + children + " Child(ren)</td></tr>"
      + "      <tr style='border-bottom:1px solid #f1f5f9;'><td style='padding:10px 6px;font-weight:600;color:#64748b;'>Estimated Total</td><td style='padding:10px 6px;font-weight:800;color:#16a34a;font-size:15px;'>" + totalPrice + "</td></tr>"
      + "      <tr><td style='padding:10px 6px;font-weight:600;color:#64748b;vertical-align:top;'>Special Requests</td><td style='padding:10px 6px;color:#334155;background:#f8fafc;border-radius:6px;font-style:italic;'>" + notes + "</td></tr>"
      + "    </table>"
      + "  </div>"
      + "  <div style='background:#f1f5f9;padding:16px 24px;text-align:center;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;'>"
      + (sheetUrl ? "    <div style='margin-bottom:8px;'><a href='" + sheetUrl + "' style='color:#2563eb;font-weight:600;text-decoration:none;'>📊 View Full Records in Google Sheets →</a></div>" : "")
      + "    <div>Generated securely by " + COMPANY_NAME + " Cloud Lead Engine • " + new Date().toLocaleString() + "</div>"
      + "  </div>"
      + "</div>";

    var plainBody = "=== TRIPMYTOUR NEW HOLIDAY LEAD ===\\n\\n"
      + "Ref ID: " + refId + "\\n"
      + "Customer: " + customerName + "\\n"
      + "Phone: " + (data.customerPhone || "N/A") + "\\n"
      + "Email: " + customerEmail + "\\n"
      + "Package: " + packageTitle + "\\n"
      + "Travel Date: " + travelDate + "\\n"
      + "Travelers: " + adults + " Adults, " + children + " Children\\n"
      + "Total: " + totalPrice + "\\n"
      + "Requests: " + notes + "\\n\\n"
      + (waUrl ? "WhatsApp Customer: " + waUrl + "\\n\\n" : "")
      + "Google Sheet: " + (sheetUrl || "N/A");

    MailApp.sendEmail({
      to: recipients.join(","),
      subject: subject,
      body: plainBody,
      htmlBody: htmlBody,
      name: COMPANY_NAME + " Holiday Leads",
      replyTo: COMPANY_EMAIL
    });
    
    return true;
  } catch (err) {
    Logger.log("sendHolidayLeadNotification error: " + err.toString());
    return false;
  }
}

/**
 * Sends a high-priority Lead Alert to the visa processing desk for visa applications.
 */
function sendVisaLeadNotification(recipients, data, sheetUrl) {
  if (!recipients || !recipients.length || !data) return false;
  
  try {
    var applicantName = data.applicantName || "Applicant";
    var applicantPhone = cleanPhoneNumber(data.applicantPhone || "");
    var applicantEmail = data.applicantEmail || "N/A";
    var country = data.country || "Destination Country";
    var visaType = data.visaType || "Tourist Visa";
    var passportNumber = data.passportNumber || "Not provided";
    var travelDate = data.travelDate || "Flexible / Not specified";
    var isExpress = data.expressProcessing ? "⚡ YES (Express Fast-Track)" : "Standard Processing";
    var totalAmount = data.totalAmount ? "₹" + Number(data.totalAmount).toLocaleString("en-IN") : "Standard Fee";
    var refNumber = data.referenceNumber || data.id || "VISA-" + new Date().getTime();
    var waUrl = applicantPhone ? "https://wa.me/" + applicantPhone.replace(/[^0-9]/g, "") + "?text=" + encodeURIComponent("Hello " + applicantName + "! Thank you for choosing " + COMPANY_NAME + " for your " + country + " visa assistance. We have received your application Ref #" + refNumber + ".") : "";

    var subject = "[TripMyTour Lead] 🛂 New Visa Application: " + applicantName + " (" + country + " " + visaType + ")";
    
    var htmlBody = ""
      + "<div style='font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);'>"
      + "  <div style='background:linear-gradient(135deg,#064e3b 0%,#047857 100%);padding:28px 24px;color:#ffffff;text-align:left;'>"
      + "    <div style='display:inline-block;background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;color:#a7f3d0;'>★ NEW VISA APPLICATION</div>"
      + "    <h1 style='margin:0;font-size:22px;font-weight:800;color:#ffffff;line-height:1.3;'>" + applicantName + "</h1>"
      + "    <p style='margin:6px 0 0 0;font-size:13px;color:#d1fae5;'>Destination: <strong>" + country + " – " + visaType + "</strong></p>"
      + "  </div>"
      + "  <div style='padding:24px;background:#ffffff;'>"
      + "    <div style='margin-bottom:20px;text-align:center;'>"
      + (waUrl ? "      <a href='" + waUrl + "' style='display:inline-block;background:#16a34a;color:#ffffff;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;margin-right:8px;box-shadow:0 2px 6px rgba(22,163,74,0.3);'>💬 Chat on WhatsApp</a>" : "")
      + (data.applicantPhone ? "      <a href='tel:" + data.applicantPhone + "' style='display:inline-block;background:#0f172a;color:#ffffff;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;'>📞 Call Applicant</a>" : "")
      + "    </div>"
      + "    <table style='width:100%;border-collapse:collapse;margin-top:10px;font-size:13px;color:#334155;'>"
      + "      <tr style='border-bottom:1px solid #f1f5f9;'><td style='padding:10px 6px;font-weight:600;color:#64748b;width:38%;'>Application Ref</td><td style='padding:10px 6px;font-weight:700;font-family:monospace;color:#064e3b;'>" + refNumber + "</td></tr>"
      + "      <tr style='border-bottom:1px solid #f1f5f9;'><td style='padding:10px 6px;font-weight:600;color:#64748b;'>Applicant Name</td><td style='padding:10px 6px;font-weight:700;color:#0f172a;'>" + applicantName + "</td></tr>"
      + "      <tr style='border-bottom:1px solid #f1f5f9;'><td style='padding:10px 6px;font-weight:600;color:#64748b;'>Contact Phone</td><td style='padding:10px 6px;font-weight:700;color:#0284c7;'><a href='tel:" + data.applicantPhone + "' style='color:#0284c7;text-decoration:none;'>" + data.applicantPhone + "</a></td></tr>"
      + "      <tr style='border-bottom:1px solid #f1f5f9;'><td style='padding:10px 6px;font-weight:600;color:#64748b;'>Email Address</td><td style='padding:10px 6px;font-weight:700;color:#0284c7;'><a href='mailto:" + applicantEmail + "' style='color:#0284c7;text-decoration:none;'>" + applicantEmail + "</a></td></tr>"
      + "      <tr style='border-bottom:1px solid #f1f5f9;'><td style='padding:10px 6px;font-weight:600;color:#64748b;'>Country / Category</td><td style='padding:10px 6px;font-weight:700;color:#0f172a;'>" + country + " (" + visaType + ")</td></tr>"
      + "      <tr style='border-bottom:1px solid #f1f5f9;'><td style='padding:10px 6px;font-weight:600;color:#64748b;'>Passport Number</td><td style='padding:10px 6px;font-family:monospace;color:#0f172a;'>" + passportNumber + "</td></tr>"
      + "      <tr style='border-bottom:1px solid #f1f5f9;'><td style='padding:10px 6px;font-weight:600;color:#64748b;'>Travel Date</td><td style='padding:10px 6px;color:#0f172a;'>" + travelDate + "</td></tr>"
      + "      <tr style='border-bottom:1px solid #f1f5f9;'><td style='padding:10px 6px;font-weight:600;color:#64748b;'>Processing Mode</td><td style='padding:10px 6px;font-weight:700;color:" + (data.expressProcessing ? "#b45309" : "#047857") + ";'>" + isExpress + "</td></tr>"
      + "      <tr style='border-bottom:1px solid #f1f5f9;'><td style='padding:10px 6px;font-weight:600;color:#64748b;'>Total Fee</td><td style='padding:10px 6px;font-weight:800;color:#047857;font-size:15px;'>" + totalAmount + "</td></tr>"
      + "      <tr><td style='padding:10px 6px;font-weight:600;color:#64748b;vertical-align:top;'>Special Notes</td><td style='padding:10px 6px;color:#334155;background:#f8fafc;border-radius:6px;font-style:italic;'>" + (data.notes || "None") + "</td></tr>"
      + "    </table>"
      + "  </div>"
      + "  <div style='background:#f1f5f9;padding:16px 24px;text-align:center;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;'>"
      + (sheetUrl ? "    <div style='margin-bottom:8px;'><a href='" + sheetUrl + "' style='color:#059669;font-weight:600;text-decoration:none;'>📊 View Applications in Google Sheets →</a></div>" : "")
      + "    <div>Generated securely by " + COMPANY_NAME + " Visa Desk • " + new Date().toLocaleString() + "</div>"
      + "  </div>"
      + "</div>";

    var plainBody = "=== TRIPMYTOUR NEW VISA APPLICATION ===\\n\\n"
      + "Ref ID: " + refNumber + "\\n"
      + "Applicant: " + applicantName + "\\n"
      + "Phone: " + (data.applicantPhone || "N/A") + "\\n"
      + "Email: " + applicantEmail + "\\n"
      + "Country: " + country + "\\n"
      + "Type: " + visaType + "\\n"
      + "Passport: " + passportNumber + "\\n"
      + "Travel Date: " + travelDate + "\\n"
      + "Mode: " + isExpress + "\\n"
      + "Total Fee: " + totalAmount + "\\n\\n"
      + (waUrl ? "WhatsApp Applicant: " + waUrl + "\\n\\n" : "")
      + "Google Sheet: " + (sheetUrl || "N/A");

    MailApp.sendEmail({
      to: recipients.join(","),
      subject: subject,
      body: plainBody,
      htmlBody: htmlBody,
      name: COMPANY_NAME + " Visa Leads",
      replyTo: COMPANY_EMAIL
    });
    
    return true;
  } catch (err) {
    Logger.log("sendVisaLeadNotification error: " + err.toString());
    return false;
  }
}

/**
 * Sends a reassuring confirmation email to the customer who submitted an inquiry.
 */
function sendCustomerHolidayConfirmation(data) {
  if (!data || !data.customerEmail) return;
  try {
    var subject = "Thank you for contacting " + COMPANY_NAME + " - Request Received [Ref: " + (data.id || "") + "]";
    var htmlBody = ""
      + "<div style='font-family:Arial,Helvetica,sans-serif;max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;'>"
      + "  <div style='background:#0f172a;padding:24px;color:#ffffff;text-align:center;'>"
      + "    <h2 style='margin:0;font-size:20px;font-weight:800;color:#ffffff;'>" + COMPANY_NAME + "</h2>"
      + "    <p style='margin:4px 0 0 0;font-size:12px;color:#94a3b8;'>" + COMPANY_TAGLINE + "</p>"
      + "  </div>"
      + "  <div style='padding:24px;color:#334155;font-size:14px;line-height:1.6;'>"
      + "    <p>Dear <strong>" + (data.customerName || "Traveler") + "</strong>,</p>"
      + "    <p>Thank you for choosing <strong>" + COMPANY_NAME + "</strong>! We have received your inquiry for <strong>" + (data.packageTitle || "Holiday Package") + "</strong>.</p>"
      + "    <div style='background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:20px 0;'>"
      + "      <div style='font-size:12px;color:#64748b;'>Reference ID: <strong>" + (data.id || "Pending") + "</strong></div>"
      + "      <div style='font-size:12px;color:#64748b;margin-top:4px;'>Destination / Package: <strong>" + (data.packageTitle || "N/A") + "</strong></div>"
      + "      <div style='font-size:12px;color:#64748b;margin-top:4px;'>Travel Date: <strong>" + (data.travelDate || "To be confirmed") + "</strong></div>"
      + "    </div>"
      + "    <p>Our travel specialist is reviewing your itinerary requirements and will get in touch with you via WhatsApp or phone shortly with customized hotel options and day-wise details.</p>"
      + "    <p>If you need urgent assistance, you can reach our 24/7 booking desk directly:</p>"
      + "    <div style='text-align:center;margin:24px 0;'>"
      + "      <a href='https://wa.me/" + COMPANY_PHONE_RAW + "?text=" + encodeURIComponent("Hello! I submitted inquiry #" + (data.id || "") + " on TripMyTour.") + "' style='display:inline-block;background:#16a34a;color:#ffffff;padding:12px 24px;border-radius:10px;font-size:13px;font-weight:700;text-decoration:none;'>💬 Direct WhatsApp Desk</a>"
      + "    </div>"
      + "    <p style='font-size:12px;color:#64748b;margin-top:24px;'>Warm regards,<br><strong>" + COMPANY_NAME + " Travel Desk</strong><br>📞 " + COMPANY_PHONE + "<br>✉️ " + COMPANY_EMAIL + "</p>"
      + "  </div>"
      + "</div>";

    MailApp.sendEmail({
      to: data.customerEmail,
      subject: subject,
      body: "Hello " + (data.customerName || "Traveler") + ", thank you for inquiring about " + (data.packageTitle || "Holiday Package") + " with " + COMPANY_NAME + ". We have received your request (Ref: " + (data.id || "") + ") and our itinerary specialist will connect with you shortly on WhatsApp / phone.",
      htmlBody: htmlBody,
      name: COMPANY_NAME + " Travel Desk",
      replyTo: COMPANY_EMAIL
    });
  } catch (e) {
    Logger.log("sendCustomerHolidayConfirmation note: " + e.toString());
  }
}

/**
 * Sends a confirmation email to visa applicants.
 */
function sendCustomerVisaConfirmation(data) {
  if (!data || !data.applicantEmail) return;
  try {
    var subject = "Visa Application Received - " + (data.country || "Visa") + " [Ref: " + (data.referenceNumber || data.id || "") + "]";
    var htmlBody = ""
      + "<div style='font-family:Arial,Helvetica,sans-serif;max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;'>"
      + "  <div style='background:#064e3b;padding:24px;color:#ffffff;text-align:center;'>"
      + "    <h2 style='margin:0;font-size:20px;font-weight:800;color:#ffffff;'>" + COMPANY_NAME + " Visa Desk</h2>"
      + "    <p style='margin:4px 0 0 0;font-size:12px;color:#a7f3d0;'>Verified Embassy Filing & Document Review</p>"
      + "  </div>"
      + "  <div style='padding:24px;color:#334155;font-size:14px;line-height:1.6;'>"
      + "    <p>Dear <strong>" + (data.applicantName || "Applicant") + "</strong>,</p>"
      + "    <p>We have successfully received your visa assistance request for <strong>" + (data.country || "Visa") + " (" + (data.visaType || "Tourist Visa") + ")</strong>.</p>"
      + "    <div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin:20px 0;'>"
      + "      <div style='font-size:12px;color:#166534;'>Application Ref: <strong>" + (data.referenceNumber || data.id || "Pending") + "</strong></div>"
      + "      <div style='font-size:12px;color:#166534;margin-top:4px;'>Country: <strong>" + (data.country || "N/A") + "</strong></div>"
      + "      <div style='font-size:12px;color:#166534;margin-top:4px;'>Processing: <strong>" + (data.expressProcessing ? "Express Fast-Track" : "Standard") + "</strong></div>"
      + "    </div>"
      + "    <p>Our authorized visa officer will review your preliminary details and reach out via WhatsApp/Email to verify your passport copies and photos before filing with the embassy.</p>"
      + "    <div style='text-align:center;margin:24px 0;'>"
      + "      <a href='https://wa.me/" + COMPANY_PHONE_RAW + "?text=" + encodeURIComponent("Hello! Inquiring about Visa Application Ref #" + (data.referenceNumber || data.id || "")) + "' style='display:inline-block;background:#16a34a;color:#ffffff;padding:12px 24px;border-radius:10px;font-size:13px;font-weight:700;text-decoration:none;'>💬 Connect with Visa Officer</a>"
      + "    </div>"
      + "    <p style='font-size:12px;color:#64748b;margin-top:24px;'>Best regards,<br><strong>" + COMPANY_NAME + " Visa Services</strong><br>📞 " + COMPANY_PHONE + "<br>✉️ " + COMPANY_EMAIL + "</p>"
      + "  </div>"
      + "</div>";

    MailApp.sendEmail({
      to: data.applicantEmail,
      subject: subject,
      body: "Hello " + (data.applicantName || "Applicant") + ", thank you for choosing " + COMPANY_NAME + " for your " + (data.country || "") + " visa application. Your reference number is " + (data.referenceNumber || data.id || "") + ". Our visa officer will review your documents shortly.",
      htmlBody: htmlBody,
      name: COMPANY_NAME + " Visa Services",
      replyTo: COMPANY_EMAIL
    });
  } catch (e) {
    Logger.log("sendCustomerVisaConfirmation note: " + e.toString());
  }
}

/**
 * Test function that can be executed directly inside Apps Script editor or via Web App.
 */
function sendTestNotification(recipients, sheetUrl) {
  var sampleData = {
    id: "TEST-" + Math.floor(100000 + Math.random() * 900000),
    customerName: "Rahul Sharma (Test Lead)",
    customerPhone: "+91 98803 71756",
    customerEmail: "traveler.test@tripmytour.com",
    packageTitle: "Kashmir Paradise - Dal Lake Houseboat & Gulmarg Snow Trail",
    travelDate: "15 Oct 2026",
    travelersAdults: 2,
    travelersChildren: 1,
    totalPrice: 56999,
    specialRequests: "This is an automated test verifying Google Apps Script email dispatch integration."
  };
  return sendHolidayLeadNotification(recipients, sampleData, sheetUrl);
}

/**
 * RUN THIS IN APPS SCRIPT EDITOR TO VERIFY PERMISSIONS AND INBOX DELIVERY!
 */
function testEmailNotification() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var recipients = DEFAULT_NOTIFICATION_EMAILS;
  Logger.log("Dispatching test lead email to: " + recipients.join(", "));
  var ok = sendTestNotification(recipients, ss.getUrl());
  Logger.log("Email dispatch status: " + (ok ? "SUCCESS! Check your inbox." : "FAILED. Check logs."));
}

function cleanPhoneNumber(phone) {
  if (!phone) return "";
  var str = String(phone).trim();
  // If 10 digits without country code, prepend 91 for India WhatsApp
  var digits = str.replace(/[^0-9]/g, "");
  if (digits.length === 10) {
    return "91" + digits;
  }
  return digits;
}

// =========================================================================
// 4. GOOGLE SHEETS TAB INITIALIZATION & CRUD HELPERS
// =========================================================================

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
  if (lastRow < 1) return null;
  
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
    { 
      name: SHEET_PACKAGES, 
      headers: ["id", "title", "destination", "country", "duration", "days", "nights", "price", "originalPrice", "discountPercent", "rating", "reviewCount", "featured", "category", "imageUrl", "galleryImages", "overview", "inclusions", "exclusions", "itinerary", "hotelName", "hotelRating", "nextDepartureDate"],
      color: "#dbeafe"
    },
    { 
      name: SHEET_VISAS, 
      headers: ["id", "country", "countryCode", "flagEmoji", "visaType", "category", "processingTime", "validity", "stayDuration", "entryType", "embassyFee", "serviceFee", "totalFee", "expressAvailable", "expressFee", "expressProcessingTime", "documentsRequired", "popular", "description"],
      color: "#d1fae5"
    },
    { 
      name: SHEET_BOOKINGS, 
      headers: ["id", "packageId", "packageTitle", "customerName", "customerEmail", "customerPhone", "travelDate", "travelersAdults", "travelersChildren", "totalPrice", "specialRequests", "status", "createdAt"],
      color: "#fef3c7"
    },
    { 
      name: SHEET_APPLICATIONS, 
      headers: ["id", "referenceNumber", "visaId", "country", "visaType", "applicantName", "applicantEmail", "applicantPhone", "passportNumber", "nationality", "travelDate", "expressProcessing", "totalAmount", "uploadedDocuments", "status", "submittedAt", "notes"],
      color: "#ede9fe"
    }
  ];
  
  for (var i = 0; i < required.length; i++) {
    var req = required[i];
    var sheet = ss.getSheetByName(req.name);
    if (!sheet) {
      sheet = ss.insertSheet(req.name);
      sheet.getRange(1, 1, 1, req.headers.length).setValues([req.headers]);
      sheet.getRange(1, 1, 1, req.headers.length).setFontWeight("bold").setBackground(req.color);
      sheet.setFrozenRows(1);
    }
  }
}

function initializeDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureTabsExist(ss);
}
`;
