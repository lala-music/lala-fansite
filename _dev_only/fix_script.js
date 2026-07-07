const fs = require('fs');
let code = fs.readFileSync('c:/Users/user/.gemini/antigravity/scratch/lala-fansite/script.js', 'utf8');

const oldDetails =             // 確認画面へ渡すデータの定義
            const details = [
                { label: 'イベント', value: liveNameInput.value },
                { label: 'お名前', value: document.getElementById('userName').value },
                { label: 'Email', value: document.getElementById('userEmail').value },
                { label: '予約人数', value: document.getElementById('ticketCount').value + ' 名' },
                { label: 'メッセージ', value: document.getElementById('userMessage').value }
            ];;

const newDetails =             // 確認画面へ渡すデータの定義
            const details = [
                { label: 'イベント', value: liveNameInput.value },
                { label: 'お名前', value: document.getElementById('userName').value },
                { label: 'Email', value: document.getElementById('userEmail').value },
                { label: '予約人数', value: document.getElementById('ticketCount').value + ' 名' }
            ];
            const timeEl = document.getElementById('reservationTime');
            if (timeEl && timeEl.value) {
                details.push({ label: '来店時間', value: timeEl.value });
            }
            details.push({ label: 'メッセージ', value: document.getElementById('userMessage').value });;

code = code.replace(oldDetails, newDetails);

const oldFormData =                 const formData = new URLSearchParams();
                formData.append('type', 'ticket'); // GASでチケット予約だと伝達
                formData.append('liveTitle', liveNameInput.value);
                formData.append('name', document.getElementById('userName').value);
                formData.append('email', document.getElementById('userEmail').value);
                formData.append('count', document.getElementById('ticketCount').value);
                formData.append('message', document.getElementById('userMessage').value);;

const newFormData =                 const formData = new URLSearchParams();
                formData.append('type', 'ticket'); // GASでチケット予約だと伝達
                formData.append('liveTitle', liveNameInput.value);
                formData.append('name', document.getElementById('userName').value);
                formData.append('email', document.getElementById('userEmail').value);
                formData.append('count', document.getElementById('ticketCount').value);
                if (timeEl && timeEl.value) {
                    formData.append('time', timeEl.value);
                }
                formData.append('message', document.getElementById('userMessage').value);;

code = code.replace(oldFormData, newFormData);

const oldLocalStorage =                 const reservationData = {
                    id: Date.now(),
                    liveTitle: liveNameInput.value,
                    name: document.getElementById('userName').value,
                    email: document.getElementById('userEmail').value,
                    count: document.getElementById('ticketCount').value,
                    message: document.getElementById('userMessage').value,
                    date: new Date().toISOString()
                };;

const newLocalStorage =                 const reservationData = {
                    id: Date.now(),
                    liveTitle: liveNameInput.value,
                    name: document.getElementById('userName').value,
                    email: document.getElementById('userEmail').value,
                    count: document.getElementById('ticketCount').value,
                    time: (timeEl && timeEl.value) ? timeEl.value : '',
                    message: document.getElementById('userMessage').value,
                    date: new Date().toISOString()
                };;

code = code.replace(oldLocalStorage, newLocalStorage);

fs.writeFileSync('c:/Users/user/.gemini/antigravity/scratch/lala-fansite/script.js', code);
