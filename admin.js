// admin.js
// 管理者画面用のスクリプト（GASとの同期機能付き）

document.addEventListener('DOMContentLoaded', () => {
    
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbx-w_WPQ9jgmHhdnjOYOdiaQns08-zBra2sO1v0ZbSAMR2NlXR1HVVKmOhzNk-F8kg9/exec';

    // --- 要素の取得 ---
    const ticketAccordionContainer = document.getElementById('ticketAccordionContainer');
    const barAccordionContainer = document.getElementById('barAccordionContainer');
    const totalCountSpan = document.getElementById('totalCount');
    const barTotalCountSpan = document.getElementById('barTotalCount');
    const refreshBtn = document.getElementById('refreshBtn');

    const adminEventForm = document.getElementById('adminEventForm');
    const eventTableBody = document.getElementById('eventTableBody');

    // 時間の選択肢(30分ごと)を自動生成
    const eventTimeSelect = document.getElementById('eventTime');
    if (eventTimeSelect) {
        for (let i = 0; i < 24; i++) {
            const h = String(i).padStart(2, '0');
            eventTimeSelect.insertAdjacentHTML('beforeend', `<option value="${h}:00" style="color:#000;">${h}:00</option>`);
            eventTimeSelect.insertAdjacentHTML('beforeend', `<option value="${h}:30" style="color:#000;">${h}:30</option>`);
        }
    }

    // =====================================
    // GASとの通信・データ同期
    // =====================================
    async function fetchAllDataFromGAS() {
        if (refreshBtn) refreshBtn.textContent = '同期中...';
        try {
            const response = await fetch(GAS_URL);
            const data = await response.json();
            
            if (data.events) {
                localStorage.setItem('admin_events', JSON.stringify(data.events));
            }
            if (data.reservations) {
                // スプレッドシート側の予約データをローカルにキャッシュ
                const tickets = data.reservations.filter(r => r.type === 'ticket');
                const barRes = data.reservations.filter(r => r.type === 'bar');
                localStorage.setItem('lala_reservations', JSON.stringify(tickets));
                localStorage.setItem('lala_bar_reservations', JSON.stringify(barRes));
            }
            console.log("GAS Data synchronized successfully.");
        } catch (error) {
            console.error("GAS Sync Error:", error);
            // alert("データの同期に失敗しました。オフラインモードで表示します。");
        } finally {
            if (refreshBtn) refreshBtn.textContent = '↻ 全データを最新に更新';
            loadAllFromLocal();
        }
    }

    // =====================================
    // アコーディオン生成の共通関数
    // =====================================
    function buildAccordion(container, groupedData, renderRowFn, headersHTML) {
        if (!container) return;
        container.innerHTML = '';
        
        const keys = Object.keys(groupedData).sort((a, b) => b.localeCompare(a));
        
        keys.forEach(key => {
            const items = groupedData[key];
            const itemHTML = `
                <div class="accordion-item">
                    <div class="accordion-header" onclick="this.nextElementSibling.classList.toggle('active'); this.querySelector('.accordion-icon').classList.toggle('open');">
                        <span>${key} <span style="font-size:0.8rem; font-weight:normal;">(${items.length}件)</span></span>
                        <span class="accordion-icon">▼</span>
                    </div>
                    <div class="accordion-content">
                        <div class="table-responsive" style="margin-bottom:0;">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        ${headersHTML}
                                    </tr>
                                </thead>
                                <tbody>
                                    ${items.map(renderRowFn).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', itemHTML);
        });
    }

    // =====================================
    // 1. チケット予約データの表示
    // =====================================
    function loadTicketReservations() {
        const reservations = JSON.parse(localStorage.getItem('lala_reservations') || '[]');
        if (totalCountSpan) totalCountSpan.textContent = parseInt(reservations.length, 10);

        if (reservations.length === 0 && ticketAccordionContainer) {
            ticketAccordionContainer.innerHTML = `<div class="no-data">現在、チケットの申し込みはありません。</div>`;
            return;
        }

        const grouped = {};
        reservations.forEach(res => {
            const key = res.target || res.liveTitle || '不明なライブ';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(res);
        });

        const headers = `<th>申込日時</th><th>お名前</th><th>メールアドレス</th><th>人数</th><th>メッセージ</th>`;
        const renderRow = (res) => {
            const safeMsg = res.message ? res.message.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '-';
            const dateStr = res.submittedAt || res.date || '-';
            return `
                <tr>
                    <td style="font-size: 0.8rem; color: var(--text-muted);">${dateStr}</td>
                    <td>${res.name}</td>
                    <td>${res.email}</td>
                    <td>${res.count}名</td>
                    <td style="font-size: 0.85rem;">${safeMsg}</td>
                </tr>
            `;
        };

        buildAccordion(ticketAccordionContainer, grouped, renderRow, headers);
    }

    // =====================================
    // 2. BAR予約データの表示
    // =====================================
    function loadBarReservations() {
        const reservations = JSON.parse(localStorage.getItem('lala_bar_reservations') || '[]');
        if (barTotalCountSpan) barTotalCountSpan.textContent = parseInt(reservations.length, 10);

        if (reservations.length === 0 && barAccordionContainer) {
            barAccordionContainer.innerHTML = `<div class="no-data">現在、BARの予約はありません。</div>`;
            return;
        }

        const grouped = {};
        reservations.forEach(res => {
            const key = res.target || res.date || '不明な日付';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(res);
        });

        const headers = `<th>時間(2h)</th><th>申込日時</th><th>人数</th><th>お名前(Email)</th><th>メッセージ</th>`;
        const renderRow = (res) => {
            const safeMsg = res.message ? res.message.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '-';
            const dateStr = res.submittedAt || res.createdAt || '-';
            const timeStr = res.time || (res.target ? res.target.split(' ')[1] : '-');
            return `
                <tr>
                    <td>${timeStr}〜</td>
                    <td style="font-size: 0.8rem; color: var(--text-muted);">${dateStr}</td>
                    <td>${res.count}名</td>
                    <td>${res.name}<br><span style="font-size:0.8rem;color:var(--text-muted);">${res.email}</span></td>
                    <td style="font-size: 0.85rem;">${safeMsg}</td>
                </tr>
            `;
        };

        buildAccordion(barAccordionContainer, grouped, renderRow, headers);
    }

    // =====================================
    // 3. イベントデータの表示と登録
    // =====================================
    function loadEvents() {
        const events = JSON.parse(localStorage.getItem('admin_events') || '[]');
        if (eventTableBody) eventTableBody.innerHTML = ''; 

        if (events.length === 0 && eventTableBody) {
            eventTableBody.innerHTML = `<tr><td colspan="5" class="no-data" style="padding: 10px;">登録されていません</td></tr>`;
            return;
        }

        events.sort((a,b) => new Date(a.date) - new Date(b.date));

        events.forEach(ev => {
            if (!eventTableBody) return;
            const typeLabel = ev.type === 'NEWS' ? '<span style="color:#f39c12; font-size:0.8rem;">NEWS</span>' : '<span style="color:var(--primary-color); font-size:0.8rem;">LIVE</span>';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${ev.date}</td>
                <td>${ev.time || '-'}</td>
                <td>${typeLabel}</td>
                <td>${ev.title}</td>
                <td><button class="delete-btn" data-id="${ev.id}">削除</button></td>
            `;
            eventTableBody.appendChild(tr);
        });

        // 削除ボタンのイベントハンドラ
        document.querySelectorAll('.delete-btn[data-id]').forEach(btn => {
            btn.onclick = () => deleteEvent(btn.getAttribute('data-id'));
        });
    }

    if (adminEventForm) {
        adminEventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = adminEventForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = '保存中...';

            const date = document.getElementById('eventDate').value;
            const time = document.getElementById('eventTime') ? document.getElementById('eventTime').value : '';
            const category = document.getElementById('eventCategory') ? document.getElementById('eventCategory').value : 'LIVE';
            const title = document.getElementById('eventTitle').value;
            const id = Date.now();
            
            // GASへ保存
            const formData = new URLSearchParams();
            formData.append('type', 'event');
            formData.append('id', id);
            formData.append('date', date);
            formData.append('time', time);
            formData.append('event_type', category);
            formData.append('title', title);

            try {
                await fetch(GAS_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: formData.toString()
                });
                
                // 成功を想定してリロード
                adminEventForm.reset();
                fetchAllDataFromGAS();
            } catch (error) {
                console.error("Add Event Error:", error);
                alert("保存に失敗しました。");
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = '追加';
            }
        });
    }

    async function deleteEvent(id) {
        if (confirm("このイベントを削除しますか？")) {
            const formData = new URLSearchParams();
            formData.append('type', 'delete_event');
            formData.append('id', id);

            try {
                await fetch(GAS_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: formData.toString()
                });
                fetchAllDataFromGAS();
            } catch (error) {
                console.error("Delete Event Error:", error);
                alert("削除に失敗しました。");
            }
        }
    };

    // =====================================
    // 全体初期化
    // =====================================
    function loadAllFromLocal() {
        loadTicketReservations();
        loadBarReservations();
        loadEvents();
    }

    // 初回読み込み: ローカルを即表示してからGASと同期
    loadAllFromLocal();
    fetchAllDataFromGAS();

    // 更新ボタンの動作
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            fetchAllDataFromGAS();
        });
    }

    // エクスポート機能 (JSON出力)
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const data = {
                admin_events: JSON.parse(localStorage.getItem('admin_events') || '[]'),
                lala_reservations: JSON.parse(localStorage.getItem('lala_reservations') || '[]'),
                lala_bar_reservations: JSON.parse(localStorage.getItem('lala_bar_reservations') || '[]'),
                export_date: new Date().toLocaleString('ja-JP')
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lala_fansite_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }
});
