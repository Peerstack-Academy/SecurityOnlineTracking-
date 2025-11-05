document.addEventListener('DOMContentLoaded',()=>{
  
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
  const pageSize = 7;
  let calendarMonth = new Date(); 

  const el = id=>document.getElementById(id);
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
  const inRole = el('filter-role');

  // Fetch data from API
  async function fetchData() {
    const ad = inName.value.trim();
    const soyad = inSurname.value.trim();
    const status = inRole.value;
    const date = selectedDate ? `${selectedDate.getMonth() + 1}/${selectedDate.getDate()}/${selectedDate.getFullYear()}` : '';
    const fin = inFin.value.trim();

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ad, soyad, status, date, fin })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const apiData = await response.json();
      
      // Transform API response to match internal format
      data.length = 0;
      apiData.forEach(item => {
        const nameParts = item.NAME.trim().split(' ');
        const name = nameParts[0] || '';
        const surname = nameParts.slice(1).join(' ') || '';
        data.push({
          name: name,
          surname: surname,
          fin: item.FIN,
          datetime: item.DATE,
          role: item.STATUS
        });
      });

      currentPage = 1;
      render();
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Məlumat yükləmə zamanı xəta baş verdi');
    }
  }

  el('btn-search').addEventListener('click', fetchData);
  el('btn-reset').addEventListener('click',()=>{ inName.value='';inSurname.value='';inFin.value='';inFrom.value='';inTo.value='';inRole.value=''; selectedDate=null; currentPage=1; fetchData(); renderCalendar(); });
  el('btn-today').addEventListener('click',()=>{ selectedDate=new Date(); calendarMonth=new Date(); currentPage=1; fetchData(); renderCalendar(); });
  el('cal-prev').addEventListener('click',()=>{ if(!selectedDate) selectedDate=new Date(); selectedDate.setDate(selectedDate.getDate()-1); calendarMonth=new Date(selectedDate); currentPage=1; fetchData(); renderCalendar(); });
  el('cal-next').addEventListener('click',()=>{ if(!selectedDate) selectedDate=new Date(); selectedDate.setDate(selectedDate.getDate()+1); calendarMonth=new Date(selectedDate); currentPage=1; fetchData(); renderCalendar(); });
  el('month-prev').addEventListener('click',()=>{ calendarMonth.setMonth(calendarMonth.getMonth()-1); renderCalendar(); });
  el('month-next').addEventListener('click',()=>{ calendarMonth.setMonth(calendarMonth.getMonth()+1); renderCalendar(); });

  function formatDateTime(dt){
    // dt comes in format "month/day/year time" e.g., "11/5/2025 0:00:00"
    try {
      const [dateStr, timeStr] = dt.split(' ');
      const [month, day, year] = dateStr.split('/');
      return `${day}/${month}/${year} ${timeStr}`;
    } catch (e) {
      return dt;
    }
  }

  function sameDay(a,b){
    return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
  }

  function applyFilters(){
    let out = data.slice();
    const name = inName.value.trim().toLowerCase();
    const surname = inSurname.value.trim().toLowerCase();
    const fin = inFin.value.trim().toLowerCase();
    const role = inRole.value;
    const from = inFrom.value? new Date(inFrom.value+ 'T00:00'):null;
    const to = inTo.value? new Date(inTo.value+ 'T23:59'):null;

    if(name) out = out.filter(r=>r.name.toLowerCase().includes(name));
    if(surname) out = out.filter(r=>r.surname.toLowerCase().includes(surname));
    if(fin) out = out.filter(r=>r.fin.toLowerCase().includes(fin));
    if(role) out = out.filter(r=>r.role===role);
    if(from) out = out.filter(r=> {
      try {
        const dateStr = r.datetime.split(' ')[0]; // Get "11/5/2025" part
        const [month, day, year] = dateStr.split('/');
        const itemDate = new Date(year, month - 1, day);
        return itemDate >= from;
      } catch (e) { return true; }
    });
    if(to) out = out.filter(r=> {
      try {
        const dateStr = r.datetime.split(' ')[0]; // Get "11/5/2025" part
        const [month, day, year] = dateStr.split('/');
        const itemDate = new Date(year, month - 1, day);
        return itemDate <= to;
      } catch (e) { return true; }
    });
    if(selectedDate){
      out = out.filter(r=> {
        try {
          const dateStr = r.datetime.split(' ')[0]; // Get "11/5/2025" part
          const [month, day, year] = dateStr.split('/');
          const itemDate = new Date(year, month - 1, day);
          return sameDay(itemDate, selectedDate);
        } catch (e) { return false; }
      });
    }
    return out;
  }

  function render(){
    const filtered = applyFilters();

    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total/pageSize));
    if(currentPage>pages) currentPage = pages;
    const start = (currentPage-1)*pageSize;
    const pageItems = filtered.slice(start, start+pageSize);

    tableBody.innerHTML='';
    if(pageItems.length===0){
      noData.style.display='block';
    } else {
      noData.style.display='none';
      for(const r of pageItems){
        const row = document.createElement('div');
        row.className='row';
        row.innerHTML = `<div>${r.name} ${r.surname}</div><div>${r.fin}</div><div>${formatDateTime(r.datetime)}</div><div>${r.role}</div>`;
        tableBody.appendChild(row);
      }
    }

    pagination.innerHTML = '';
    if(pages>1){
      const prevBtn = document.createElement('button');
      prevBtn.textContent = '‹';
      prevBtn.style.cssText = 'margin:0 4px;padding:4px 8px;border-radius:4px;border:1px solid #ccc;background:#fff;cursor:pointer;';
      prevBtn.disabled = currentPage===1;
      prevBtn.onclick = ()=>{ if(currentPage>1){ currentPage--; render(); } };
      pagination.appendChild(prevBtn);

      const info = document.createElement('span');
      info.textContent = ` Səhifə ${currentPage} / ${pages} `;
      info.style.cssText = 'margin:0 6px;';
      pagination.appendChild(info);

      const nextBtn = document.createElement('button');
      nextBtn.textContent = '›';
      nextBtn.style.cssText = 'margin:0 4px;padding:4px 8px;border-radius:4px;border:1px solid #ccc;background:#fff;cursor:pointer;';
      nextBtn.disabled = currentPage===pages;
      nextBtn.onclick = ()=>{ if(currentPage<pages){ currentPage++; render(); } };
      pagination.appendChild(nextBtn);
    } else {
      pagination.innerHTML = `Səhifə 1 / 1`;
    }

    selectedDateEl.textContent = selectedDate? selectedDate.toLocaleDateString() : '—';
  }

  function renderCalendar(){
    calendarEl.innerHTML='';
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const monthNames = ['Yanvar','Fevral','Mart','Aprel','May','İyun','İyul','Avqust','Sentyabr','Oktyabr','Noyabr','Dekabr'];
    monthLabel.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year,month,1).getDay();
    const daysInMonth = new Date(year,month+1,0).getDate();

    const blanks = firstDay;
    for(let i=0;i<blanks;i++){
      const el = document.createElement('div');
      calendarEl.appendChild(el);
    }

    for(let d=1; d<=daysInMonth; d++){
      const cell = document.createElement('div');
      cell.className='cal-day';
      const cellDate = new Date(year,month,d);
      cell.textContent = d;
      if(selectedDate && sameDay(cellDate, selectedDate)) cell.classList.add('selected');
      cell.addEventListener('click',()=>{ selectedDate = new Date(year,month,d); currentPage=1; render(); renderCalendar(); });
      calendarEl.appendChild(cell);
    }
  }

  selectedDate = new Date(); 
  calendarMonth = new Date(); 
  renderCalendar();
  fetchData();

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Çıxış etmək istədiyinizdən əminsiniz?')) {
        fetch('/api/logout', { method: 'GET' })
          .then(() => {
            window.location.href = 'login.html';
          })
          .catch(error => {
            console.error('Logout error:', error);
            window.location.href = 'login.html';
          });
      }
    });
  }
});
