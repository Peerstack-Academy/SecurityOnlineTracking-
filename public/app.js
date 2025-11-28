document.addEventListener('DOMContentLoaded', () => {

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  const session_id = getCookie('session_id');
  if (!session_id) {
    window.location.href = 'login.html';
    return;
  }

  const data = [];

  let selectedDate = null;
  let currentPage = 1;
  const pageSize = 25;
  let calendarMonth = new Date();
  let currentRoleFilter = '';

  const el = id => document.getElementById(id);
  const tableBody = el('table-body');
  const noData = el('no-data');
  const pagination = el('pagination');
  const calendarEl = el('calendar');
  const selectedDateEl = el('selected-date');
  const monthLabel = el('month-label');

  const inName = el('filter-name');
  const inSurname = el('filter-surname');
  const inFin = el('filter-fin');
  const inFrom = el('filter-from');
  const inTo = el('filter-to');
  const inCar = el('filter-car');

  // Format car number input as user types (00-AA-000)
  function formatCarNumber(value) {
    // Remove all non-alphanumeric characters
    let cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    // Format as 00-AA-000
    let formatted = '';
    if (cleaned.length > 0) {
      formatted = cleaned.substring(0, 2);
    }
    if (cleaned.length > 2) {
      formatted += '-' + cleaned.substring(2, 4);
    }
    if (cleaned.length > 4) {
      formatted += '-' + cleaned.substring(4, 7);
    }
    return formatted;
  }

  if (inCar) {
    inCar.addEventListener('input', (e) => {
      const cursorPos = e.target.selectionStart;
      const oldValue = e.target.value;
      const newValue = formatCarNumber(oldValue);
      e.target.value = newValue;
      
      // Adjust cursor position
      const diff = newValue.length - oldValue.length;
      e.target.setSelectionRange(cursorPos + diff, cursorPos + diff);
    });
  }

  async function fetchData() {
    const ad = inName.value.trim();
    const soyad = inSurname.value.trim();
    const carNumber = inCar ? inCar.value.trim() : '';

    let fromDate = '';
    let toDate = '';

    if (inFrom.value) {
      const fromParts = inFrom.value.split('-');
      fromDate = `${parseInt(fromParts[1])}/${parseInt(fromParts[2])}/${fromParts[0]}`;
    }

    if (inTo.value) {
      const toParts = inTo.value.split('-');
      toDate = `${parseInt(toParts[1])}/${parseInt(toParts[2])}/${toParts[0]}`;
    }

    const date = (fromDate || toDate) ? '' : (selectedDate ? `${selectedDate.getMonth() + 1}/${selectedDate.getDate()}/${selectedDate.getFullYear()}` : '');
    const fin = inFin.value.trim();

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ ad, soyad, carNumber, date, fin, fromDate, toDate })
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Only redirect on authentication failure
          document.cookie = "session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          window.location.href = 'login.html';
          return;
        }
        throw new Error('Failed to fetch data');
      }

      const apiData = await response.json();

      data.length = 0;
      apiData.forEach(item => {
        const nameParts = item.NAME.trim().split(' ');
        const name = nameParts[0] || '';
        const surname = nameParts.slice(1).join(' ') || '';
        data.push({
          name: name,
          surname: surname,
          fin: item.FIN,
          carNumber: item.CARNUMBER || '',
          datetime: item.DATE,
          role: item.STATUS
        });
      });

      currentPage = 1;
      data.reverse();
      render();
    } catch (error) {
      console.error('Fetch error:', error);
      // Only show error message, don't logout on network errors
      alert('Məlumatları yükləyərkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
    }
  }

  el('btn-search').addEventListener('click', () => { selectedDate = null; currentRoleFilter = ''; currentPage = 1; fetchData(); renderCalendar(); });
  el('btn-reset').addEventListener('click', () => { inName.value = ''; inSurname.value = ''; inFin.value = ''; inFrom.value = ''; inTo.value = ''; if (inCar) inCar.value = ''; selectedDate = null; currentRoleFilter = ''; currentPage = 1; fetchData(); renderCalendar(); });
  el('btn-today').addEventListener('click', () => { inFrom.value = ''; inTo.value = ''; selectedDate = new Date(); calendarMonth = new Date(); currentRoleFilter = ''; currentPage = 1; fetchData(); renderCalendar(); });
  el('cal-prev').addEventListener('click', () => { inFrom.value = ''; inTo.value = ''; if (!selectedDate) selectedDate = new Date(); selectedDate.setDate(selectedDate.getDate() - 1); calendarMonth = new Date(selectedDate); currentPage = 1; fetchData(); renderCalendar(); });
  el('cal-next').addEventListener('click', () => { inFrom.value = ''; inTo.value = ''; if (!selectedDate) selectedDate = new Date(); selectedDate.setDate(selectedDate.getDate() + 1); calendarMonth = new Date(selectedDate); currentPage = 1; fetchData(); renderCalendar(); });
  el('month-prev').addEventListener('click', () => { calendarMonth.setMonth(calendarMonth.getMonth() - 1); renderCalendar(); });
  el('month-next').addEventListener('click', () => { calendarMonth.setMonth(calendarMonth.getMonth() + 1); renderCalendar(); });

  function formatDateTime(dt) {
    try {
      const [dateStr, timeStr = ''] = dt.split(' ');
      const [month, day, year] = dateStr.split('/');
      const formatted = `${day}/${month}/${year}`;
      return timeStr ? `${formatted} ${timeStr}` : formatted;
    } catch (e) {
      return dt;
    }
  }


  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function applyFilters() {
    let out = data.slice();
    const name = inName.value.trim().toLowerCase();
    const surname = inSurname.value.trim().toLowerCase();
    const fin = inFin.value.trim().toLowerCase();
    const carNumber = inCar ? inCar.value.trim().toLowerCase() : '';
    const from = inFrom.value ? new Date(inFrom.value + 'T00:00') : null;
    const to = inTo.value ? new Date(inTo.value + 'T23:59') : null;

    if (name) out = out.filter(r => r.name.toLowerCase().includes(name));
    if (surname) out = out.filter(r => r.surname.toLowerCase().includes(surname));
    if (fin) out = out.filter(r => r.fin.toLowerCase().includes(fin));
    if (carNumber) out = out.filter(r => r.carNumber.toLowerCase().replace(/-/g, '').includes(carNumber.replace(/-/g, '')));
    if (from) out = out.filter(r => {
      try {
        const dateStr = r.datetime.split(' ')[0];
        const [month, day, year] = dateStr.split('/');
        const itemDate = new Date(year, month - 1, day);
        return itemDate >= from;
      } catch (e) { return true; }
    });
    if (to) out = out.filter(r => {
      try {
        const dateStr = r.datetime.split(' ')[0];
        const [month, day, year] = dateStr.split('/');
        const itemDate = new Date(year, month - 1, day);
        return itemDate <= to;
      } catch (e) { return true; }
    });
    if (selectedDate && !from && !to) {
      out = out.filter(r => {
        try {
          const dateStr = r.datetime.split(' ')[0];
          const [month, day, year] = dateStr.split('/');
          const itemDate = new Date(year, month - 1, day);
          return sameDay(itemDate, selectedDate);
        } catch (e) { return false; }
      });
    }
    if (currentRoleFilter) out = out.filter(r => r.role === currentRoleFilter);
    return out;
  }

  function render() {
    const filtered = applyFilters();

    filtered.sort((a, b) => {
      try {
        const [dateStrA, timeStrA] = a.datetime.split(' ');
        const [monthA, dayA, yearA] = dateStrA.split('/');
        const dateA = new Date(yearA, monthA - 1, dayA);
        if (timeStrA) {
          const [hourA, minA, secA] = timeStrA.split(':');
          dateA.setHours(hourA || 0, minA || 0, secA || 0);
        }

        const [dateStrB, timeStrB] = b.datetime.split(' ');
        const [monthB, dayB, yearB] = dateStrB.split('/');
        const dateB = new Date(yearB, monthB - 1, dayB);
        if (timeStrB) {
          const [hourB, minB, secB] = timeStrB.split(':');
          dateB.setHours(hourB, minB, secB || 0);
        }

        return dateA - dateB;
      } catch (e) {
        return 0;
      }
    });

    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage > pages) currentPage = pages;
    const start = (currentPage - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);

    tableBody.innerHTML = '';
    if (pageItems.length === 0) {
      noData.style.display = 'block';
    } else {
      noData.style.display = 'none';
      for (const r of pageItems) {
        const row = document.createElement('div');
        row.className = 'row';
        row.innerHTML = `<div>${r.name} ${r.surname}</div><div>${r.fin}</div><div>${r.carNumber}</div><div>${formatDateTime(r.datetime)}</div><div>${r.role}</div>`;
        tableBody.appendChild(row);
      }
    }

    pagination.innerHTML = '';
    if (pages > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.textContent = '‹';
      prevBtn.style.cssText = 'margin:0 4px;padding:4px 8px;border-radius:4px;border:1px solid #ccc;background:#fff;cursor:pointer;';
      prevBtn.disabled = currentPage === 1;
      prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; render(); } };
      pagination.appendChild(prevBtn);

      const info = document.createElement('span');
      info.textContent = ` Səhifə ${currentPage} / ${pages} `;
      info.style.cssText = 'margin:0 6px;';
      pagination.appendChild(info);

      const nextBtn = document.createElement('button');
      nextBtn.textContent = '›';
      nextBtn.style.cssText = 'margin:0 4px;padding:4px 8px;border-radius:4px;border:1px solid #ccc;background:#fff;cursor:pointer;';
      nextBtn.disabled = currentPage === pages;
      nextBtn.onclick = () => { if (currentPage < pages) { currentPage++; render(); } };
      pagination.appendChild(nextBtn);
    } else {
      pagination.innerHTML = `Səhifə 1 / 1`;
    }

    selectedDateEl.textContent = selectedDate ? selectedDate.toLocaleDateString() : '—';

    updateStatusCounts();
  }

  function renderCalendar() {
    calendarEl.innerHTML = '';
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
    monthLabel.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const blanks = firstDay;
    for (let i = 0; i < blanks; i++) {
      const el = document.createElement('div');
      calendarEl.appendChild(el);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day';
      const cellDate = new Date(year, month, d);
      cell.textContent = d;
      if (selectedDate && sameDay(cellDate, selectedDate)) cell.classList.add('selected');
      cell.addEventListener('click', () => {
        selectedDate = new Date(year, month, d);
        inFrom.value = '';
        inTo.value = '';
        currentPage = 1;
        fetchData();
        renderCalendar();
      });
      calendarEl.appendChild(cell);
    }
  }

  function updateStatusCounts() {
    const filtered = applyFilters();

    const telebeCount = filtered.filter(r => r.role === 'Tələbə').length;
    const isciCount = filtered.filter(r => r.role === 'İşçi').length;
    const qonaqCount = filtered.filter(r => r.role === 'Qonaq').length;

    const telebeBtn = document.getElementById('count-telebe');
    const isciBtn = document.getElementById('count-isci');
    const qonaqBtn = document.getElementById('count-qonaq');

    if (telebeBtn) telebeBtn.innerHTML = `Tələbə: <span>${telebeCount}</span>`;
    if (isciBtn) isciBtn.innerHTML = `İşçi: <span>${isciCount}</span>`;
    if (qonaqBtn) qonaqBtn.innerHTML = `Qonaq: <span>${qonaqCount}</span>`;
  }

  selectedDate = new Date();
  calendarMonth = new Date();
  renderCalendar();
  fetchData();

  const telebeBtn = document.getElementById('count-telebe');
  const isciBtn = document.getElementById('count-isci');
  const qonaqBtn = document.getElementById('count-qonaq');

  if (telebeBtn) {
    telebeBtn.addEventListener('click', () => {
      currentRoleFilter = 'Tələbə';
      render();
    });
  }

  if (isciBtn) {
    isciBtn.addEventListener('click', () => {
      currentRoleFilter = 'İşçi';
      render();
    });
  }

  if (qonaqBtn) {
    qonaqBtn.addEventListener('click', () => {
      currentRoleFilter = 'Qonaq';
      render();
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  const logoutModal = document.getElementById('logoutModal');
  const cancelLogoutBtn = document.getElementById('cancelLogout');
  const confirmLogoutBtn = document.getElementById('confirmLogout');
  const modalOverlay = document.getElementById('modalOverlay');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logoutModal.classList.remove('hidden');
    });
  }

  if (cancelLogoutBtn) {
    cancelLogoutBtn.addEventListener('click', () => {
      logoutModal.classList.add('hidden');
    });
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', () => {
      logoutModal.classList.add('hidden');
    });
  }

  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener('click', () => {
      fetch('/api/logout', {
        method: 'GET',
        credentials: 'same-origin'
      })
        .then(() => {
          window.location.href = 'login.html';
        })
        .catch(error => {
          console.error('Logout error:', error);
          window.location.href = 'login.html';
        });
    });
  }
});
