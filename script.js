// script.js
// サイトのアニメーションや動作を制御するスクリプト

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 共通: 予約確認モーダルの生成と表示機能
    // ==========================================
    function showConfirmModal(details, onConfirmCallback) {
        let confirmModal = document.getElementById('confirmModal');
        if (!confirmModal) {
            confirmModal = document.createElement('div');
            confirmModal.id = 'confirmModal';
            confirmModal.className = 'modal-overlay';
            confirmModal.innerHTML = `
                <div class="modal-content" style="max-width: 450px;">
                    <span class="modal-close" id="closeConfirmBtn">&times;</span>
                    <h2 style="font-family: var(--font-heading); color: var(--primary-color); margin-bottom: 20px; text-align: center;">ご予約内容の確認</h2>
                    <div id="confirmDetails" style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; margin-bottom: 25px; line-height: 1.8; font-size: 0.95rem; border: var(--glass-border);">
                    </div>
                    <div style="display: flex; gap: 15px; margin-top: 10px;">
                        <button type="button" id="cancelConfirmBtn" class="btn outline-btn" style="flex: 1;">修正する</button>
                        <button type="button" id="executeConfirmBtn" class="btn primary-btn" style="flex: 1;">確定する</button>
                    </div>
                </div>
            `;
            document.body.appendChild(confirmModal);

            document.getElementById('closeConfirmBtn').addEventListener('click', () => confirmModal.style.display = 'none');
            document.getElementById('cancelConfirmBtn').addEventListener('click', () => confirmModal.style.display = 'none');
            confirmModal.addEventListener('click', (e) => {
                if (e.target === confirmModal) confirmModal.style.display = 'none';
            });
        }

        const detailsDiv = document.getElementById('confirmDetails');
        detailsDiv.innerHTML = details.map(d => `<div style="display: flex; border-bottom: 1px solid rgba(255,255,255,0.05); padding: 5px 0;"><span style="color:var(--text-muted); width: 100px; flex-shrink: 0;">${d.label}:</span> <strong style="color:#fff; word-break: break-all;">${d.value || '-'}</strong></div>`).join('');

        confirmModal.style.display = 'flex';

        const executeBtn = document.getElementById('executeConfirmBtn');
        const newExecuteBtn = executeBtn.cloneNode(true);
        executeBtn.parentNode.replaceChild(newExecuteBtn, executeBtn);
        
        newExecuteBtn.addEventListener('click', () => {
            newExecuteBtn.textContent = '処理中...';
            newExecuteBtn.disabled = true;
            onConfirmCallback(() => {
                confirmModal.style.display = 'none';
                newExecuteBtn.textContent = '確定する';
                newExecuteBtn.disabled = false;
            });
        });
    }

    // 1. スクロール時のヘッダー背景変更
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 2. フェードインアニメーション（スクロールしたらふわっと表示）
    // appearクラスを付与するためのObserverを設定
    const faders = document.querySelectorAll('.fade-in, .fade-in-up');
    
    const appearOptions = {
        threshold: 0.15, // 要素が15%見えたら発火
        rootMargin: "0px 0px -50px 0px"
    };

    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('appear');
                observer.unobserve(entry.target); // 一度表示されたら監視をやめる
            }
        });
    }, appearOptions);

    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });

    // 3. モバイルメニューボタン（ハンバーガーアイコン）の簡易セットアップ
    // 初心者の方が後でカスタマイズしやすいよう、クリック時の簡単なアラートまたはトグルのみ実装
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            // モバイルメニューの表示切り替え（必要に応じてCSSを追加してください）
            if (navLinks.style.display === 'flex') {
                navLinks.style.display = 'none';
            } else {
                navLinks.style.display = 'flex';
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '70px';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.background = 'rgba(11, 17, 22, 0.95)';
                navLinks.style.padding = '20px';
            }
        });
    }

    // 4. チケット申し込みモーダルの処理（ローカルストレージ保存付きデモ）
    const ticketModal = document.getElementById('ticketModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const openModalBtns = document.querySelectorAll('.open-ticket-modal');
    const modalLiveTitle = document.getElementById('modalLiveTitle');
    const liveNameInput = document.getElementById('liveNameInput');
    const ticketForm = document.getElementById('ticketForm');
    const formSuccessMessage = document.getElementById('formSuccessMessage');

    if (ticketModal) {
        // モーダルを開く (イベントデリゲーション: 動的生成された要素にも対応)
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.open-ticket-modal');
            if (btn) {
                e.preventDefault();
                const liveTitle = btn.getAttribute('data-title');
                modalLiveTitle.textContent = liveTitle;
                liveNameInput.value = liveTitle;
                ticketModal.style.display = 'flex';
                // 成功メッセージなどをリセット
                formSuccessMessage.style.display = 'none';
                ticketForm.style.display = 'block';
                ticketForm.reset();
            }
        });

        // モーダルを閉じる（✕ボタン）
        closeModalBtn.addEventListener('click', () => {
            ticketModal.style.display = 'none';
        });

        // モーダルを閉じる（枠外クリック）
        window.addEventListener('click', (e) => {
            if (e.target === ticketModal) {
                ticketModal.style.display = 'none';
            }
        });

        // フォーム送信アクション
        ticketForm.addEventListener('submit', (e) => {
            e.preventDefault(); // 画面遷移を防ぐ
            
            const submitBtn = ticketForm.querySelector('button[type="submit"]');
            
            // 確認画面へ渡すデータの整形
            const details = [
                { label: 'ライブ名', value: liveNameInput.value },
                { label: 'お名前', value: document.getElementById('userName').value },
                { label: 'Email', value: document.getElementById('userEmail').value },
                { label: '予約人数', value: document.getElementById('ticketCount').value + ' 名' },
                { label: 'メッセージ', value: document.getElementById('userMessage').value }
            ];

            // 確認モーダルを表示
            showConfirmModal(details, (onComplete) => {
                const GAS_URL = 'https://script.google.com/macros/s/AKfycby35VmqgOb5QOsJWzJTUGov940TGB3nLYut06xRp48dapz12WXuiPQXTvoY_q1JoZIm/exec';
                
                const formData = new URLSearchParams();
                formData.append('type', 'ticket'); // GAS側にチケット予約だと伝える
                formData.append('liveTitle', liveNameInput.value);
                formData.append('name', document.getElementById('userName').value);
                formData.append('email', document.getElementById('userEmail').value);
                formData.append('count', document.getElementById('ticketCount').value);
                formData.append('message', document.getElementById('userMessage').value);

                if (GAS_URL === 'ここに発行されたURLを貼り付けます') {
                    saveToLocalStorage(liveNameInput.value, submitBtn);
                    onComplete();
                } else {
                    fetch(GAS_URL, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: formData.toString()
                    }).then(() => {
                        saveToLocalStorage(liveNameInput.value, submitBtn);
                        onComplete();
                    }).catch(error => {
                        console.error('GAS URL CORS Redirect Error (Safe to ignore):', error.message);
                        saveToLocalStorage(liveNameInput.value, submitBtn);
                        onComplete();
                    });
                }
            });
        });

            // --- ローカルストレージ（管理者画面用）への保存処理を関数化 ---
            function saveToLocalStorage(liveNameText, submitBtn) {
                const reservationData = {
                    id: Date.now(),
                    date: new Date().toLocaleString('ja-JP'),
                    liveTitle: liveNameText,
                    name: document.getElementById('userName').value,
                    email: document.getElementById('userEmail').value,
                    count: document.getElementById('ticketCount').value,
                    message: document.getElementById('userMessage').value
                };
                let reservations = JSON.parse(localStorage.getItem('lala_reservations') || '[]');
                reservations.push(reservationData);
                localStorage.setItem('lala_reservations', JSON.stringify(reservations));
                
                // 成功としてUIを切り替え
                ticketForm.style.display = 'none';
                formSuccessMessage.style.display = 'block';
                
                // ボタンの表示をリセット
                if (submitBtn) {
                    submitBtn.textContent = '予約を申し込む';
                    submitBtn.disabled = false;
                }
            }
    }

    // ==========================================
    // 4.5 ニュースとスケジュールの動的表示 (index.html)
    // ==========================================
    const dynamicNewsList = document.getElementById('dynamicNewsList');
    const dynamicLiveList = document.getElementById('dynamicLiveList');
    const GAS_URL = 'https://script.google.com/macros/s/AKfycby35VmqgOb5QOsJWzJTUGov940TGB3nLYut06xRp48dapz12WXuiPQXTvoY_q1JoZIm/exec';

    async function updateDynamicUI() {
        if (!dynamicNewsList || !dynamicLiveList) return;

        try {
            const response = await fetch(GAS_URL);
            const data = await response.json();
            const events = data.events || [];
            const reservations = data.reservations || [];
            
            // ローカルキャッシュも更新
            localStorage.setItem('admin_events', JSON.stringify(events));
            localStorage.setItem('lala_bar_reservations', JSON.stringify(reservations));

            renderEventsUI(events);
        } catch (e) {
            console.warn("GAS Fetch failed, using local cache:", e);
            const events = JSON.parse(localStorage.getItem('admin_events') || '[]');
            renderEventsUI(events);
        }
    }

    function renderEventsUI(events) {
        // 日付の新しい順（降順）にソート
        events.sort((a,b) => new Date(b.date) - new Date(a.date));

        const newsEvents = events.filter(e => e.type === 'NEWS');
        const liveEvents = events.filter(e => e.type === 'LIVE' || !e.type); 

        // NEWSレンダリング
        if (newsEvents.length > 0) {
            dynamicNewsList.innerHTML = newsEvents.map(ev => `
                <div class="news-item" style="border-left: 3px solid #f39c12; cursor: pointer;" class="open-event-detail" data-id="${ev.id}">
                    <div class="news-date" style="color: #f39c12;">${String(ev.date).replace(/-/g, '.').split('T')[0]} ${ev.time || ''}</div>
                    <div class="news-category tag-info" style="border-color:#f39c12; color:#f39c12;">NEWS</div>
                    <div class="news-title" style="text-decoration: underline;">
                        ${ev.title}
                    </div>
                </div>
            `).join('');
        }

        // LIVEレンダリング
        if (liveEvents.length > 0) {
            dynamicLiveList.innerHTML = liveEvents.map(ev => `
                <div class="news-item" style="cursor: pointer;" class="open-event-detail" data-id="${ev.id}">
                    <div class="news-date">${String(ev.date).replace(/-/g, '.').split('T')[0]} ${ev.time || ''}</div>
                    <div class="news-category tag-live">LIVE</div>
                    <div class="news-title" style="text-decoration: underline;">
                        ${ev.title} <span style="font-size: 0.8rem; color: var(--primary-color);">[予約・詳細]</span>
                    </div>
                </div>
            `).join('');
        }

        // Add event listeners for the items
        document.querySelectorAll('#dynamicNewsList .news-item, #dynamicLiveList .news-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const id = item.getAttribute('data-id');
                const ev = events.find(e => e.id.toString() === id.toString());
                if (ev) {
                    openEventDetailModal(ev);
                }
            });
        });
    }

    function openEventDetailModal(ev) {
        const modal = document.getElementById('eventDetailModal');
        if (!modal) return;
        
        document.getElementById('detailCategory').textContent = ev.type === 'NEWS' ? 'NEWS' : 'LIVE';
        document.getElementById('detailCategory').style.color = ev.type === 'NEWS' ? '#f39c12' : 'var(--primary-color)';
        document.getElementById('detailCategory').style.borderColor = ev.type === 'NEWS' ? '#f39c12' : 'var(--primary-color)';
        
        document.getElementById('detailTitle').textContent = ev.title;
        document.getElementById('detailDate').textContent = `${String(ev.date).replace(/-/g, '.').split('T')[0]} ${ev.time || ''}`;
        
        const imgContainer = document.getElementById('detailImageContainer');
        const img = document.getElementById('detailImage');
        if (ev.imageUrl) {
            img.src = ev.imageUrl;
            imgContainer.style.display = 'block';
        } else {
            imgContainer.style.display = 'none';
        }
        
        const desc = document.getElementById('detailDescription');
        if (ev.description) {
            desc.textContent = ev.description;
            desc.style.display = 'block';
        } else {
            desc.style.display = 'none';
        }
        
        const actionContainer = document.getElementById('detailActionContainer');
        if (ev.type === 'LIVE' || !ev.type) {
            actionContainer.style.display = 'block';
            const reserveBtn = document.getElementById('detailReserveBtn');
            reserveBtn.onclick = () => {
                modal.style.display = 'none';
                // Trigger the ticket modal
                const ticketModal = document.getElementById('ticketModal');
                if (ticketModal) {
                    document.getElementById('modalLiveTitle').textContent = ev.title;
                    document.getElementById('liveNameInput').value = ev.title;
                    ticketModal.style.display = 'flex';
                    document.getElementById('formSuccessMessage').style.display = 'none';
                    document.getElementById('ticketForm').style.display = 'block';
                    document.getElementById('ticketForm').reset();
                }
            };
        } else {
            actionContainer.style.display = 'none';
        }

        modal.style.display = 'flex';
    }

    const closeEventDetailBtn = document.getElementById('closeEventDetailBtn');
    if (closeEventDetailBtn) {
        closeEventDetailBtn.addEventListener('click', () => {
            document.getElementById('eventDetailModal').style.display = 'none';
        });
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('eventDetailModal')) {
                document.getElementById('eventDetailModal').style.display = 'none';
            }
        });
    }

    if (dynamicNewsList && dynamicLiveList) {
        updateDynamicUI();
    }

    // ==========================================
    // 5. カレンダー描画ロジック (index.html)
    // ==========================================
    const calendarDays = document.getElementById('calendarDays');
    const calendarMonthYear = document.getElementById('calendarMonthYear');
    if (calendarMonthYear && calendarDays) {
        let currentDate = new Date();
        // 今月のカレンダーを描画
        renderCalendar(currentDate);

        document.getElementById('prevMonth').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar(currentDate);
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar(currentDate);
        });
    }

    function renderCalendar(date) {
        if (!calendarDays) return;
        calendarDays.innerHTML = '';
        
        const year = date.getFullYear();
        const month = date.getMonth();
        calendarMonthYear.textContent = `${year}.${String(month + 1).padStart(2, '0')}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Admin側のイベントデータを取得 (LocalStorageから、またはGASから既に同期済みを想定)
        const adminEvents = JSON.parse(localStorage.getItem('admin_events') || '[]');
        
        // 空白の追加（月の最初の曜日の前）
        for (let i = 0; i < firstDay; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'cal-day empty';
            calendarDays.appendChild(emptyDiv);
        }

        const today = new Date();
        today.setHours(0,0,0,0);

        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('a');
            dayDiv.className = 'cal-day';
            
            // 日付文字列を YYYY-MM-DD 形式で作成
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const thisDate = new Date(year, month, i);
            
            // クリックでタイムテーブルモーダルを開く
            dayDiv.href = '#';
            if (thisDate >= today) {
                dayDiv.addEventListener('click', (e) => {
                    e.preventDefault();
                    openTimetableModal(dateStr, adminEvents);
                });
            } else {
                dayDiv.addEventListener('click', (e) => e.preventDefault());
            }

            // 日付表示
            const dateSpan = document.createElement('span');
            dateSpan.className = 'cal-date';
            dateSpan.textContent = i;
            dayDiv.appendChild(dateSpan);

            if (thisDate.getDay() === 0) dayDiv.classList.add('sunday');
            if (thisDate.getDay() === 6) dayDiv.classList.add('saturday');

            // 過去日はグレー（予約不可）
            if (thisDate < today) {
                dayDiv.style.opacity = '0.5';
                dayDiv.style.pointerEvents = 'none';
            }

            // イベントがあれば表示
            const eventsForDay = adminEvents.filter(e => {
                const eDate = String(e.date).split('T')[0];
                return eDate === dateStr;
            });
            eventsForDay.forEach(ev => {
                const evDiv = document.createElement('div');
                evDiv.className = 'cal-event';
                evDiv.textContent = ev.title;
                dayDiv.appendChild(evDiv);
            });

            // 予約の混雑度計算
            if (thisDate >= today) {
                const statusInfo = checkDayAvailability(dateStr);
                const statusIndicator = document.createElement('div');
                statusIndicator.className = `cal-status ${statusInfo.className}`;
                dayDiv.appendChild(statusIndicator);
            } else {
                const statusIndicator = document.createElement('div');
                statusIndicator.className = `cal-status status-closed`;
                dayDiv.appendChild(statusIndicator);
            }

            calendarDays.appendChild(dayDiv);
        }
    }

    // 1日の予約状況を計算する関数（2時間制、30分枠、MAX20席）
    function checkDayAvailability(dateStr) {
        // イベント(LIVE等)がある日はBAR予約不可とする
        const adminEvents = JSON.parse(localStorage.getItem('admin_events') || '[]');
        const isEventDay = adminEvents.some(e => {
            const eDate = String(e.date).split('T')[0];
            return eDate === dateStr && e.type !== 'NEWS';
        });
        if (isEventDay) {
            return { className: 'status-closed', text: '休' };
        }

        const barRes = JSON.parse(localStorage.getItem('lala_bar_reservations') || '[]');
        const dayRes = barRes.filter(r => r.date === dateStr);
        
        if (dayRes.length === 0) {
            return { className: 'status-available', text: '〇' }; // 予約なし
        }

        // 10:00〜23:30 までの各30分枠のアクティブ人数をカウント
        const timeSlots = ["10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30","22:00","22:30","23:00","23:30"];
        let maxConcurrent = 0;
        let fullSlots = 0;

        timeSlots.forEach(slot => {
            let currentCount = 0;
            // この時間枠にかぶっている予約を加算
            dayRes.forEach(r => {
                const startIdx = timeSlots.indexOf(r.time);
                // 予約タイプによって長さを変える (BAR=4枠(2h), STUDIO=duration*2枠)
                const slotsCount = r.resType === 'studio' ? parseInt(r.duration || 1, 10) * 2 : 4;
                const endIdx = startIdx + slotsCount; 
                const slotIdx = timeSlots.indexOf(slot);
                if (slotIdx >= startIdx && slotIdx < endIdx) {
                    currentCount += parseInt(r.count, 10);
                }
            });
            if (currentCount > maxConcurrent) maxConcurrent = currentCount;
            if (currentCount >= 20) fullSlots++;
        });

        // 判定
        if (fullSlots >= 10) { 
            // 10枠以上(5時間分以上)満席なら「満席」扱いとする
            return { className: 'status-full', text: '×' };
        } else if (maxConcurrent >= 15) {
            // いずれかの時間に15席以上の予約があれば「残りわずか」
            return { className: 'status-few', text: '△' };
        } else {
            return { className: 'status-available', text: '〇' };
        }
    }

    // ==========================================
    // 5.5 タイムテーブルモーダル処理
    // ==========================================
    const timetableModal = document.getElementById('timetableModal');
    const closeTimetableModalBtn = document.getElementById('closeTimetableModalBtn');
    const modalTimetableTitle = document.getElementById('modalTimetableTitle');
    const timetableContent = document.getElementById('timetableContent');
    const timetableReserveBtn = document.getElementById('timetableReserveBtn');

    if (timetableModal) {
        closeTimetableModalBtn.addEventListener('click', () => timetableModal.style.display = 'none');
        window.addEventListener('click', (e) => {
            if (e.target === timetableModal) timetableModal.style.display = 'none';
        });
        
        timetableReserveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            timetableModal.style.display = 'none';
            // Scroll to reservation if we are on livebar.html
            if (window.location.pathname.includes('livebar.html')) {
                const resSection = document.getElementById('reservation');
                if (resSection) {
                    document.getElementById('resDate').value = timetableModal.getAttribute('data-date');
                    resSection.scrollIntoView({behavior: 'smooth'});
                }
            } else {
                window.location.href = `livebar.html?date=${timetableModal.getAttribute('data-date')}#reservation`;
            }
        });
    }

    function openTimetableModal(dateStr, adminEvents) {
        if (!timetableModal) return;
        
        modalTimetableTitle.textContent = dateStr.replace(/-/g, '.');
        timetableModal.setAttribute('data-date', dateStr);
        
        // イベントチェック
        const isEventDay = adminEvents.some(e => String(e.date).split('T')[0] === dateStr && e.type !== 'NEWS');
        if (isEventDay) {
            timetableContent.innerHTML = `<div style="text-align:center; padding:20px; color:#e74c3c; font-weight:bold;">この日はイベント開催日のため、通常予約はできません。</div>`;
            timetableModal.style.display = 'flex';
            timetableReserveBtn.style.display = 'none';
            return;
        }
        
        timetableReserveBtn.style.display = 'inline-block';
        
        // 予約データを取得
        const barRes = JSON.parse(localStorage.getItem('lala_bar_reservations') || '[]');
        const dayRes = barRes.filter(r => r.date === dateStr);
        
        // 全時間枠 (10:00〜23:30)
        const timeSlots = ["10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30","22:00","22:30","23:00","23:30"];
        
        let html = '';
        timeSlots.forEach(slot => {
            let currentCount = 0;
            dayRes.forEach(r => {
                const rStartIdx = timeSlots.indexOf(r.time);
                const slotsCount = r.resType === 'studio' ? parseInt(r.duration || 1, 10) * 2 : 4;
                const rEndIdx = rStartIdx + slotsCount;
                const slotIdx = timeSlots.indexOf(slot);
                if (slotIdx >= rStartIdx && slotIdx < rEndIdx) {
                    currentCount += parseInt(r.count, 10);
                }
            });
            
            let status = '〇 空き';
            let color = '#2ecc71';
            if (currentCount >= 20) {
                status = '× 満席';
                color = '#e74c3c';
            } else if (currentCount >= 15) {
                status = '△ 残りわずか';
                color = '#f39c12';
            }
            
            // 区切り線（スタジオとBARの間）
            if (slot === "18:00") {
                html += `<div style="border-top:1px dashed rgba(255,255,255,0.2); margin:10px 0; padding-top:10px; color:var(--primary-color); font-size:0.8rem;">BAR TIME</div>`;
            } else if (slot === "10:00") {
                html += `<div style="color:var(--primary-color); font-size:0.8rem; margin-bottom:5px;">STUDIO TIME</div>`;
            }

            html += `
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding:8px 0;">
                    <span>${slot}</span>
                    <span style="color:${color}; font-weight:bold;">${status}</span>
                </div>
            `;
        });
        
        timetableContent.innerHTML = html;
        timetableModal.style.display = 'flex';
    }

    // ==========================================
    // 6. BAR予約フォーム処理 (livebar.html)
    // ==========================================
    const barReservationForm = document.getElementById('barReservationForm');
    if (barReservationForm) {
        // カレンダーから遷移してきた場合、URLパラメータから日付をセット
        const urlParams = new URLSearchParams(window.location.search);
        const dateParam = urlParams.get('date');
        if (dateParam) {
            document.getElementById('resDate').value = dateParam;
        }
        // 予約タイプの切り替え処理
        const resTypeSelect = document.getElementById('resType');
        const resDurationGroup = document.getElementById('resDurationGroup');
        const resTimeSelect = document.getElementById('resTime');
        
        resTypeSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            // 一旦すべてのオプションを非表示
            Array.from(resTimeSelect.options).forEach(opt => opt.style.display = 'none');
            resTimeSelect.options[0].style.display = ''; // 「選択してください」は表示
            resTimeSelect.value = "";

            if (val === 'studio') {
                resDurationGroup.style.display = 'block';
                // スタジオは10:00〜17:00
                Array.from(resTimeSelect.options).forEach(opt => {
                    if (opt.value >= "10:00" && opt.value <= "17:00") {
                        opt.style.display = '';
                    }
                });
            } else {
                resDurationGroup.style.display = 'none';
                // BARは18:00〜22:00
                Array.from(resTimeSelect.options).forEach(opt => {
                    if (opt.value >= "18:00" && opt.value <= "22:00") {
                        opt.style.display = '';
                    }
                });
            }
        });
        // 初期状態をトリガー
        resTypeSelect.dispatchEvent(new Event('change'));

        barReservationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const resType = document.getElementById('resType').value;
            const duration = resType === 'studio' ? document.getElementById('resDuration').value : 2;
            const date = document.getElementById('resDate').value;
            const time = document.getElementById('resTime').value;
            const count = parseInt(document.getElementById('resCount').value, 10);
            const name = document.getElementById('resName').value;
            const email = document.getElementById('resEmail').value;
            const message = document.getElementById('resMessage').value;
            const errorDiv = document.getElementById('resError');

            // --- イベント日の予約ブロック ---
            const adminEvents = JSON.parse(localStorage.getItem('admin_events') || '[]');
            const isEventDay = adminEvents.some(e => {
                const eDate = String(e.date).split('T')[0];
                return eDate === date && e.type !== 'NEWS';
            });
            if (isEventDay) {
                errorDiv.innerHTML = '申し訳ございません。ご選択されたお日にちはご予約で埋まっている（イベント開催）ためご予約いただけません。';
                errorDiv.style.display = 'block';
                return;
            }

            // --- 重複予約・席数チェック ---
            const barRes = JSON.parse(localStorage.getItem('lala_bar_reservations') || '[]');
            const dayRes = barRes.filter(r => r.date === date);
            
            const timeSlots = ["10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30","22:00","22:30","23:00","23:30"];
            const startIdx = timeSlots.indexOf(time);
            const endIdx = startIdx + (resType === 'studio' ? duration * 2 : 4);

            let isOverBooked = false;
            
            // 予約希望時間の各スロットが20席を超えないかチェック
            for (let i = startIdx; i < endIdx && i < timeSlots.length; i++) {
                const currentSlot = timeSlots[i];
                let currentSlotCount = 0;
                
                dayRes.forEach(r => {
                    const rStartIdx = timeSlots.indexOf(r.time);
                    const rEndIdx = rStartIdx + 4;
                    if (i >= rStartIdx && i < rEndIdx) {
                        currentSlotCount += parseInt(r.count, 10);
                    }
                });

                if (currentSlotCount + count > 20) {
                    isOverBooked = true;
                    break;
                }
            }

            if (isOverBooked) {
                // エラー表示
                errorDiv.innerHTML = '指定された日時は満席のためご予約いただけません。';
                errorDiv.style.display = 'block';
                return;
            }
            
            // エラーを消す
            errorDiv.style.display = 'none';

            // 確認画面へ渡すデータの整形
            const typeLabel = resType === 'studio' ? '貸しスタジオ予約' : 'BAR テーブル予約';
            const timeLabel = resType === 'studio' ? `${time} 〜 (${duration}時間)` : `${time} 〜 (2時間制)`;
            
            const details = [
                { label: 'ご予約種類', value: typeLabel },
                { label: 'ご予約日', value: date },
                { label: 'お時間', value: timeLabel },
                { label: 'お名前', value: name },
                { label: 'Email', value: email },
                { label: '予約人数', value: count + ' 名' },
                { label: 'メッセージ', value: message }
            ];

            showConfirmModal(details, (onComplete) => {
                const reservationData = {
                    id: Date.now(),
                    resType: resType,
                    duration: duration,
                    date: date,
                    time: time,
                    count: count,
                    name: name,
                    email: email,
                    message: message,
                    createdAt: new Date().toLocaleString('ja-JP')
                };

                const GAS_URL = 'https://script.google.com/macros/s/AKfycby35VmqgOb5QOsJWzJTUGov940TGB3nLYut06xRp48dapz12WXuiPQXTvoY_q1JoZIm/exec';
                const formData = new URLSearchParams();
                formData.append('type', 'bar'); // GAS側にまとめて予約だと伝えるが、後でgas_backendで判別する
                formData.append('resType', resType); // 'bar' or 'studio'
                formData.append('duration', duration);
                formData.append('date', date);
                formData.append('time', time);
                formData.append('name', name);
                formData.append('email', email);
                formData.append('count', count);
                formData.append('message', message);

                const showSuccess = () => {
                    barRes.push(reservationData);
                    localStorage.setItem('lala_bar_reservations', JSON.stringify(barRes));
                    barReservationForm.style.display = 'none';
                    
                    if (resType === 'studio') {
                        const price = count * duration * 550;
                        document.getElementById('resSuccessMessage').innerHTML = `
                            <h3 style="color: var(--primary-color); margin-bottom: 15px;">ご予約完了しました！</h3>
                            <p style="color: var(--text-muted); font-size: 0.9rem;">
                                ご予約ありがとうございます。<br>
                                <strong>事前決済でお得！(50円引き)</strong><br>
                                下記のボタンからお支払い手続きをお願いいたします。<br>
                                <span style="display:inline-block; margin-top:10px; color:#fff;">お支払い金額: ¥${price}</span>
                            </p>
                            <a href="https://square.link/YOUR_LINK_HERE" target="_blank" class="btn outline-btn" style="margin-top: 20px; width: 100%; border-color: #fff; color: #fff;">Squareで決済する</a>
                        `;
                    }
                    
                    document.getElementById('resSuccessMessage').style.display = 'block';
                    onComplete();
                };

                if (GAS_URL === 'ここに発行されたURLを貼り付けます') {
                    showSuccess();
                } else {
                    fetch(GAS_URL, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: formData.toString()
                    }).then(() => {
                        showSuccess();
                    }).catch(error => {
                        console.error('GAS URL CORS Redirect Error (Safe to ignore):', error.message);
                        showSuccess();
                    });
                }
            });
        });
    }

    // ==========================================
    // 6. 共有ボタン (Web Share API)
    // ==========================================
    const shareBtn = document.getElementById('floatingShareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            const shareData = {
                title: document.title,
                text: 'lala Official Site をチェック！',
                url: window.location.href
            };

            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    console.log('Share canceled or failed', err);
                }
            } else {
                // Web Share API非対応の場合はクリップボードにコピー
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    showToast('URLをコピーしました！');
                } catch (err) {
                    console.error('Failed to copy: ', err);
                }
            }
        });
    }

    function showToast(message) {
        let toast = document.getElementById('toastNotification');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toastNotification';
            toast.className = 'toast-notification';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
});
