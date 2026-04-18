// =========================================================================
// lala Fan Site - Google Apps Script (GAS) バックエンドコード (高度な同期版)
//
// 【使い方】
// 1. Googleスプレッドシートを開き、「拡張機能」＞「Apps Script」をクリック。
// 2. 以下のコードをすべて上書きして保存。
// 3. 「デプロイ」＞「新しいデプロイ」で「種類の選択: ウェブアプリ」として公開。
// 4. 「アクセスできるユーザー: 全員」に設定してデプロイ。
// =========================================================================

/**
 * データの取得 (GETリクエスト)
 * スケジュール情報などをブラウザに返します
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var eventSheet = getOrCreateSheet(ss, "Events", ["id", "date", "time", "type", "title"]);
    var reservationSheet = getOrCreateSheet(ss, "Reservations", ["submittedAt", "type", "target", "name", "email", "count", "message"]);

    var events = getRowsAsJson(eventSheet);
    var reservations = getRowsAsJson(reservationSheet);

    var data = {
      events: events,
      reservations: reservations
    };

    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * データの登録・削除 (POSTリクエスト)
 */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var type = e.parameter.type;

    // 1. スケジュール(イベント)の管理
    if (type === 'event') {
      var eventSheet = getOrCreateSheet(ss, "Events", ["id", "date", "time", "type", "title"]);
      eventSheet.appendRow([
        e.parameter.id || Date.now(),
        e.parameter.date,
        e.parameter.time,
        e.parameter.event_type, // 'LIVE' or 'NEWS'
        e.parameter.title
      ]);
      return createJsonResponse({ "result": "success" });
    }

    if (type === 'delete_event') {
      var eventSheet = ss.getSheetByName("Events");
      if (eventSheet) {
        var id = e.parameter.id;
        var data = eventSheet.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) {
          if (data[i][0].toString() === id.toString()) {
            eventSheet.deleteRow(i + 1);
            break;
          }
        }
      }
      return createJsonResponse({ "result": "success" });
    }

    // 2. 予約の管理 (既存の機能)
    if (type === 'ticket' || type === 'bar') {
      var resSheet = getOrCreateSheet(ss, "Reservations", ["submittedAt", "type", "target", "name", "email", "count", "message"]);
      var submittedDate = new Date();
      var name = e.parameter.name || '名称未設定';
      var email = e.parameter.email || '';
      var count = e.parameter.count || '0';
      var message = e.parameter.message || '';
      var targetName = (type === 'bar') ? (e.parameter.date + " " + e.parameter.time) : e.parameter.liveTitle;

      resSheet.appendRow([submittedDate, type, targetName, name, email, count, message]);

      // 自動返信メール送信
      sendConfirmationEmail(type, name, email, count, message, e.parameter.date, e.parameter.time, e.parameter.liveTitle);

      return createJsonResponse({ "result": "success" });
    }

    return createJsonResponse({ "result": "error", "message": "Unknown type" });

  } catch (error) {
    return createJsonResponse({ "result": "error", "error": error.message });
  }
}

// --- 補助関数 ---

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

function getRowsAsJson(sheet) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    rows.push(obj);
  }
  return rows;
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendConfirmationEmail(type, name, email, count, message, resDate, resTime, liveTitle) {
  if (!email) return;
  
  var subject = "";
  var body = name + " 様\n\n";

  if (type === 'bar') {
    subject = "【lala Live Bar】ご予約完了のお知らせ";
    body += "この度は、lala Live Bar のお席をご予約いただき誠にありがとうございます。\n"
         + "以下の内容で予約を承りました。\n\n"
         + "--------------------------------------------------\n"
         + "【ご予約日】 " + resDate + "\n"
         + "【お時間】 " + resTime + " ～ (2時間制)\n"
         + "【ご予約人数】 " + count + " 名\n"
         + "【メッセージ】\n" + message + "\n"
         + "--------------------------------------------------\n\n"
         + "ご来店を心よりお待ち申し上げております。\n\n";
  } else {
    subject = "【lala Official】ライブチケットご予約完了のお知らせ";
    body += "この度は、ライブチケットのご予約ありがとうございます。\n"
         + "以下の内容で予約を承りました。\n\n"
         + "--------------------------------------------------\n"
         + "【公演名】 " + liveTitle + "\n"
         + "【ご予約人数】 " + count + " 名\n"
         + "【メッセージ】\n" + message + "\n"
         + "--------------------------------------------------\n\n"
         + "当日は会場でお会いできるのを心より楽しみにしております！\n\n";
  }

  body += "※このメールは送信専用アドレスから自動送信されています。\n"
       + "lala Official Web Site";

  try {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: body,
      name: "lala Official / Live Bar"
    });
  } catch(e) {
    console.log("Email error: " + e.message);
  }
}
