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
 * 管理用パスワード（ご自身で自由に変更してください）
 */
var ADMIN_PASSWORD = "lala_secret_pass";

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var eventSheet = getOrCreateSheet(ss, "Events", ["id", "date", "time", "type", "title", "description", "imageUrl", "capacity"]);
    var reservationSheet = getOrCreateSheet(ss, "Reservations", ["submittedAt", "type", "target", "name", "email", "count", "message", "paid"]);

    var events = getRowsAsJson(eventSheet);
    var reservations = getRowsAsJson(reservationSheet);

    var isAuth = (e.parameter.password === ADMIN_PASSWORD);

    // 一般公開用のデータサニタイズ（個人情報を隠す）
    if (!isAuth) {
      // 予約データから個人情報を削除
      var sanitizedReservations = reservations.map(function(r) {
        var targetStr = r.target ? r.target.toString() : '';
        return {
          date: targetStr.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})/) ? targetStr.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})/)[1] : '', // targetから日付を抽出 (簡易)
          time: targetStr.match(/([0-9]{2}:[0-9]{2})/) ? targetStr.match(/([0-9]{2}:[0-9]{2})/)[1] : '',
          count: r.count,
          type: r.type,
          resType: targetStr.indexOf('[スタジオ予約]') > -1 ? 'studio' : 'bar',
          target: r.type === 'ticket' ? r.target : '',
          duration: targetStr.match(/\(([0-9]+)時間\)/) ? targetStr.match(/\(([0-9]+)時間\)/)[1] : '2' // 簡易抽出
        };
      });
      
      // GASの仕様上、doGetは一般ユーザーからもアクセスされる
      var data = { auth: isAuth,
        events: events,
        reservations: sanitizedReservations
      };
      
      return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 管理者用のフルデータ
    var data = { auth: isAuth,
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
    
    // JSON形式で送信された場合のフォールバック処理
    var params = e.parameter;
    if (e.postData && e.postData.contents) {
      try {
        var parsed = JSON.parse(e.postData.contents);
        if (parsed.type) {
          params = parsed;
        }
      } catch (err) {
        // パース失敗時はそのまま e.parameter を使用
      }
    }
    
    var type = params.type;

    // 1. スケジュール(イベント)の管理
    if (type === 'event' || type === 'edit_event' || type === 'delete_event') {
      var cache = CacheService.getScriptCache();
      var lockoutKey = "admin_lockout";
      var attemptKey = "admin_auth_attempts";

      if (cache.get(lockoutKey)) {
        return createJsonResponse({ "result": "error", "message": "Too many failed attempts. Locked out for 10 minutes." });
      }

      if (params.password !== ADMIN_PASSWORD) {
        var attempts = parseInt(cache.get(attemptKey) || '0', 10);
        attempts++;
        if (attempts >= 5) {
          cache.put(lockoutKey, 'true', 600); // 10分ロック
          cache.remove(attemptKey);
        } else {
          cache.put(attemptKey, attempts.toString(), 600);
        }
        return createJsonResponse({ "result": "error", "message": "Unauthorized" });
      } else {
        cache.remove(attemptKey); // 成功したらリセット
      }
    }

    if (type === 'event') {
      var eventSheet = getOrCreateSheet(ss, "Events", ["id", "date", "time", "type", "title", "description", "imageUrl", "capacity"]);
      eventSheet.appendRow([
        params.id || Date.now(),
        params.date,
        params.time,
        params.event_type, // 'LIVE' or 'NEWS'
        params.title,
        params.description || '',
        params.imageUrl || '',
        params.capacity || '50'
      ]);
      SpreadsheetApp.flush(); // 即座に変更を反映
      return createJsonResponse({ "result": "success" });
    }

    if (type === 'edit_event') {
      var eventSheet = ss.getSheetByName("Events");
      if (eventSheet) {
        var id = params.id;
        var data = eventSheet.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) {
          if (data[i][0].toString() === id.toString()) {
            // Update row (Adding 1 to i because arrays are 0-indexed and rows are 1-indexed, but getValues returns 0-indexed. Actually sheet row is i+1.
            var rowNum = i + 1;
            eventSheet.getRange(rowNum, 2).setValue(params.date);
            eventSheet.getRange(rowNum, 3).setValue(params.time);
            eventSheet.getRange(rowNum, 4).setValue(params.event_type);
            eventSheet.getRange(rowNum, 5).setValue(params.title);
            eventSheet.getRange(rowNum, 6).setValue(params.description || '');
            eventSheet.getRange(rowNum, 7).setValue(params.imageUrl || '');
            eventSheet.getRange(rowNum, 8).setValue(params.capacity || '50');
            SpreadsheetApp.flush(); // 即座に変更を反映
            break;
          }
        }
      }
      return createJsonResponse({ "result": "success" });
    }

    if (type === 'delete_event') {
      var eventSheet = ss.getSheetByName("Events");
      if (eventSheet) {
        var id = params.id;
        var data = eventSheet.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) {
          if (data[i][0].toString() === id.toString()) {
            eventSheet.deleteRow(i + 1);
            SpreadsheetApp.flush(); // 即座に変更を反映
            break;
          }
        }
      }
      return createJsonResponse({ "result": "success" });
    }

    if (type === 'toggle_paid') {
      if (params.password !== ADMIN_PASSWORD) {
        return createJsonResponse({ "result": "error", "message": "Unauthorized" });
      }
      var resSheet = ss.getSheetByName("Reservations");
      if (resSheet) {
        var data = resSheet.getDataRange().getValues();
        // Match by submittedAt and email since there is no ID
        for (var i = 1; i < data.length; i++) {
          if (data[i][0].toString() === params.submittedAt.toString() && data[i][4].toString() === params.email.toString()) {
            var rowNum = i + 1;
            resSheet.getRange(rowNum, 8).setValue(params.paid); // 8th column is 'paid'
            SpreadsheetApp.flush();
            break;
          }
        }
      }
      return createJsonResponse({ "result": "success" });
    }

    // 2. 予約の管理 (既存の機能)
    if (type === 'ticket' || type === 'bar') {
      // 簡易スパム防止（全体で1分間に10回までの予約に制限）
      var cache = CacheService.getScriptCache();
      var resCountKey = "global_res_count";
      var resCount = parseInt(cache.get(resCountKey) || '0', 10);
      if (resCount >= 10) {
        return createJsonResponse({ "result": "error", "message": "ただいまアクセスが集中しています。しばらく待ってから再度お試しください。" });
      }
      cache.put(resCountKey, (resCount + 1).toString(), 60);

      var resSheet = getOrCreateSheet(ss, "Reservations", ["submittedAt", "type", "target", "name", "email", "count", "message", "paid"]);
      var submittedDate = new Date();
      var name = e.parameter.name || '名称未設定';
      var email = e.parameter.email || '';
      var count = e.parameter.count || '0';
      var message = e.parameter.message || '';
      var targetName = '';
      if (type === 'bar') {
          if (e.parameter.resType === 'studio') {
              targetName = "[スタジオ予約] " + e.parameter.date + " " + e.parameter.time + " (" + e.parameter.duration + "時間)";
          } else {
              targetName = "[BAR予約] " + e.parameter.date + " " + e.parameter.time;
          }
      } else {
          targetName = e.parameter.liveTitle;
      }

      resSheet.appendRow([submittedDate, type, targetName, name, email, count, message, false]);

      // 自動返信メール送信
      sendConfirmationEmail(type, name, email, count, message, e.parameter.date, e.parameter.time, e.parameter.liveTitle, e.parameter.resType, e.parameter.duration);

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
  } else {
    // 既存のシートの見出しを強制的に上書きして、空のキーを防ぐ
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}

function getRowsAsJson(sheet) {
  var data = sheet.getDataRange().getDisplayValues();
  if (data.length < 2) return [];
  var isEventSheet = (sheet.getName() === 'Events');
  var headers = isEventSheet ? ["id", "date", "time", "type", "title", "description", "imageUrl", "capacity"] : data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j] !== undefined ? data[i][j] : '';
    }
    rows.push(obj);
  }
  return rows;
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendConfirmationEmail(type, name, email, count, message, resDate, resTime, liveTitle, resType, duration) {
  if (!email) return;
  
  var subject = "";
  var body = name + " 様\n\n";

  if (type === 'bar' && resType === 'studio') {
    var price = parseInt(count, 10) * parseInt(duration, 10) * 550;
    subject = "【lala Studio】貸しスタジオご予約完了のお知らせ";
    body += "この度は、lala 貸しスタジオ をご予約いただき誠にありがとうございます。\n"
         + "以下の内容で予約を承りました。\n\n"
         + "--------------------------------------------------\n"
         + "【ご予約日】 " + resDate + "\n"
         + "【お時間】 " + resTime + " ～ (" + duration + "時間)\n"
         + "【ご利用人数】 " + count + " 名\n"
         + "【事前決済お支払い金額】 " + price + "円 (事前決済50円引き適用)\n"
         + "【メッセージ】\n" + message + "\n"
         + "--------------------------------------------------\n\n"
         + "★事前決済でお得！★\n"
         + "お手数ですが、以下の決済リンク(決済に進む)よりお支払いをお願いいたします。\n"
         + "https://決済に進む.link/YOUR_LINK_HERE\n\n"
         + "ご利用を心よりお待ち申し上げております。\n\n";
  } else if (type === 'bar') {
    subject = "【Live Bar Visca】ご予約完了のお知らせ";
    body += "この度は、Live Bar Visca のお席をご予約いただき誠にありがとうございます。\n"
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

  body += "==================================================\n"
       + "【キャンセル・ご予約内容の変更について】\n"
       + "ご予約のキャンセル・変更はこちらにお問い合わせください。\n"
       + "（※電話番号につきましては現在準備中です）\n"
       + "==================================================\n\n"
       + "※このメールは送信専用アドレスから自動送信されています。\n"
       + "lala Official Web Site";

  try {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: body,
      name: "lala Official / Live Bar Visca",
      replyTo: "livebarvisca@anthemys.jp"
    });
  } catch(e) {
    console.log("Email error: " + e.message);
  }
}


