/* Beginner-friendly JavaScript for Auto Showroom */
document.addEventListener('DOMContentLoaded', function () {
    // 1. DARK / LIGHT MODE: saved in this browser using localStorage.
    var savedTheme = localStorage.getItem('showroomTheme') || 'light';
    document.body.classList.toggle('dark-mode', savedTheme === 'dark');
    var header = document.querySelector('.header');
    if (header) {
        var themeButton = document.createElement('button');
        themeButton.type = 'button';
        themeButton.className = 'theme-toggle';
        themeButton.textContent = savedTheme === 'dark' ? ' Light Mode' : ' Dark Mode';
        themeButton.setAttribute('aria-label', 'Switch dark or light mode');
        header.appendChild(themeButton);
        themeButton.addEventListener('click', function () {
            document.body.classList.toggle('dark-mode');
            var isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('showroomTheme', isDark ? 'dark' : 'light');
            themeButton.textContent = isDark ? ' Light Mode' : ' Dark Mode';
        });
    }

    // 2. SEARCH AND FILTER: works on the Cars and Bikes pages.
    var vehicleCards = Array.from(document.querySelectorAll('.vehicle-card'));
    if (vehicleCards.length > 0) {
        var controls = document.createElement('div');
        controls.className = 'vehicle-filters';
        controls.innerHTML = '<input id="vehicleSearch" type="search" placeholder="Search by vehicle name or details..." aria-label="Search vehicles">' +
            '<select id="priceFilter" aria-label="Filter by price"><option value="all">All prices</option><option value="under5">Under ₹5 lakh</option><option value="5to15">₹5–15 lakh</option><option value="over15">Above ₹15 lakh</option></select>' +
            '<p id="searchCount" aria-live="polite"></p>';
        var firstSection = document.querySelector('.section-title');
        if (firstSection) firstSection.parentNode.insertBefore(controls, firstSection);
        var searchInput = document.getElementById('vehicleSearch');
        var priceFilter = document.getElementById('priceFilter');
        function filterVehicles() {
            var term = searchInput.value.toLowerCase().trim();
            var range = priceFilter.value;
            var visible = 0;
            vehicleCards.forEach(function (card) {
                var text = card.innerText.toLowerCase();
                var priceText = (card.querySelector('.price-tag') || {}).innerText || '';
                var price = Number(priceText.replace(/[^0-9]/g, ''));
                var matchesText = text.includes(term);
                var matchesPrice = range === 'all' ||
                    (range === 'under5' && price < 500000) ||
                    (range === '5to15' && price >= 500000 && price <= 1500000) ||
                    (range === 'over15' && price > 1500000);
                card.style.display = matchesText && matchesPrice ? '' : 'none';
                if (matchesText && matchesPrice) visible++;
            });
            document.getElementById('searchCount').textContent = visible + ' vehicle(s) found';
        }
        searchInput.addEventListener('input', filterVehicles);
        priceFilter.addEventListener('change', filterVehicles);
        filterVehicles();
    }

    // 3. TEST DRIVE BOOKING: form on prices.html.
    if (location.pathname.toLowerCase().endsWith('prices.html')) {
        var bookingForm = document.querySelector('.form-box form');
        if (bookingForm) {
            var fields = bookingForm.querySelectorAll('input, textarea');
            if (fields[0]) fields[0].setAttribute('name', 'customerName');
            if (fields[1]) { fields[1].setAttribute('name', 'mobile'); fields[1].setAttribute('type', 'tel'); fields[1].setAttribute('pattern', '[0-9]{10}'); fields[1].setAttribute('title', 'Enter a 10-digit mobile number'); }
            if (fields[2]) fields[2].setAttribute('name', 'message');
            var button = bookingForm.querySelector('button[type="submit"]');
            var extraFields = document.createElement('div');
            extraFields.innerHTML = '<div class="input-group"><label for="testDriveVehicle">Vehicle for test drive</label><select id="testDriveVehicle" required><option value="">Choose a vehicle</option><option>City Sedan X</option><option>Urban SUV Z</option><option>E-Drive Compact</option><option>E-Cruiser Pro</option><option>SportRider 200</option><option>Street Cruiser 150</option><option>City Glide 125</option><option>E-Scooter Pro</option></select></div>' +
                '<div class="input-group"><label for="testDriveDate">Preferred date</label><input id="testDriveDate" type="date" required></div>' +
                '<div class="input-group"><label for="testDriveTime">Preferred time</label><select id="testDriveTime" required><option value="">Choose a time</option><option>10:00 AM</option><option>12:00 PM</option><option>2:00 PM</option><option>4:00 PM</option><option>6:00 PM</option></select></div>';
            if (button) bookingForm.insertBefore(extraFields, button);
            var dateInput = document.getElementById('testDriveDate');
            if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];
            bookingForm.addEventListener('submit', function (event) {
                event.preventDefault();
                if (!bookingForm.reportValidity()) return;
                var booking = {
                    name: fields[0].value.trim(), mobile: fields[1].value.trim(),
                    message: fields[2].value.trim(), vehicle: document.getElementById('testDriveVehicle').value,
                    date: dateInput.value, time: document.getElementById('testDriveTime').value
                };
                var bookings = JSON.parse(localStorage.getItem('testDriveBookings') || '[]');
                bookings.push(booking);
                localStorage.setItem('testDriveBookings', JSON.stringify(bookings));
                alert('Test drive request saved! Vehicle: ' + booking.vehicle + '\nDate: ' + booking.date + '\nTime: ' + booking.time + '\nNote: This demo saves requests only in this browser.');
                bookingForm.reset();
            });
            if (button) button.textContent = 'Book Test Drive';
        }
    }

    // 4. ADMIN INVENTORY: add, edit, delete and save listings in this browser.
    if (location.pathname.toLowerCase().endsWith('inventory.html')) {
        var table = document.querySelector('.data-table');
        var inventoryForm = document.querySelector('.form-box form');
        if (table && inventoryForm) {
            var originalRows = Array.from(table.querySelectorAll('.table-row')).map(function (row) {
                var cells = row.querySelectorAll('.col-a, .col-b, .col-c, .col-d');
                return { name: cells[0] ? cells[0].innerText.split('\n')[0].trim() : '', category: cells[1] ? cells[1].innerText.trim() : '', specs: cells[0] ? cells[0].innerText.split('\n').slice(1).join(' ').trim() : '', stock: cells[2] ? parseInt(cells[2].innerText, 10) || 0 : 0, price: cells[3] ? cells[3].innerText.replace(/[^0-9]/g, '') : '0' };
            });
            var inventory = JSON.parse(localStorage.getItem('showroomInventory') || 'null') || originalRows;
            var editingIndex = -1;
            var inputs = inventoryForm.querySelectorAll('input, select, textarea');
            var nameInput = inputs[0], categoryInput = inputs[1], specsInput = inputs[2], priceInput = inputs[3], stockInput = inputs[4], imageInput = inputs[5], descriptionInput = inputs[6];
            priceInput.type = 'number'; priceInput.min = '0'; priceInput.step = '1';
            var managementNote = document.createElement('p');
            managementNote.className = 'management-note';
            managementNote.textContent = 'Changes are saved in this browser only. This demo does not update a shared online database.';
            table.parentNode.insertBefore(managementNote, table);
            function saveInventory() { localStorage.setItem('showroomInventory', JSON.stringify(inventory)); }
            function renderInventory() {
                table.querySelectorAll('.table-row').forEach(function (row) { row.remove(); });
                inventory.forEach(function (item, index) {
                    var row = document.createElement('div'); row.className = 'table-row';
                    var category = document.createElement('div'); category.className = 'col-b'; category.textContent = item.category;
                    var name = document.createElement('div'); name.className = 'col-a';
                    var strong = document.createElement('b'); strong.textContent = item.name; name.appendChild(strong);
                    var br = document.createElement('br'); name.appendChild(br);
                    var small = document.createElement('span'); small.className = 'small-text'; small.textContent = item.specs || ''; name.appendChild(small);
                    var stock = document.createElement('div'); stock.className = 'col-c'; stock.textContent = item.stock;
                    var price = document.createElement('div'); price.className = 'col-d price-val'; price.textContent = '₹' + Number(item.price || 0).toLocaleString('en-IN');
                    var status = document.createElement('div'); status.className = 'col-e';
                    var tag = document.createElement('span'); tag.className = 'tag ' + (item.stock < 5 ? 'tag-low' : 'tag-instock'); tag.textContent = item.stock < 5 ? 'LOW STOCK' : 'IN STOCK'; status.appendChild(tag);
                    var actions = document.createElement('div'); actions.className = 'col-f';
                    var edit = document.createElement('button'); edit.type = 'button'; edit.className = 'btn btn-small'; edit.textContent = 'Edit';
                    edit.addEventListener('click', function () { editingIndex = index; nameInput.value = item.name; categoryInput.value = item.category.toLowerCase().replaceAll(' ', '-').replace('electric-car-(ev)', 'ev-car'); specsInput.value = item.specs; priceInput.value = item.price; stockInput.value = item.stock; if (descriptionInput) descriptionInput.value = item.description || ''; document.getElementById('add-listing').scrollIntoView({ behavior: 'smooth' }); inventoryForm.querySelector('button[type="submit"]').textContent = 'Update Listing'; });
                    var del = document.createElement('button'); del.type = 'button'; del.className = 'btn btn-small delete-button'; del.textContent = 'Delete';
                    del.addEventListener('click', function () { if (confirm('Delete ' + item.name + ' from inventory?')) { inventory.splice(index, 1); saveInventory(); renderInventory(); } });
                    actions.appendChild(edit); actions.appendChild(del);
                    [name, category, stock, price, status, actions].forEach(function (cell) { row.appendChild(cell); }); table.appendChild(row);
                });
                saveInventory();
            }
            inventoryForm.addEventListener('submit', function (event) {
                event.preventDefault();
                var item = { name: nameInput.value.trim(), category: categoryInput.options[categoryInput.selectedIndex].text, specs: specsInput.value.trim(), price: priceInput.value, stock: Number(stockInput.value), image: imageInput ? imageInput.value.trim() : '', description: descriptionInput ? descriptionInput.value.trim() : '' };
                if (!item.name || !item.category || !item.specs || item.price === '' || item.stock < 0) { alert('Please complete all required fields.'); return; }
                if (editingIndex >= 0) { inventory[editingIndex] = item; editingIndex = -1; inventoryForm.querySelector('button[type="submit"]').textContent = 'Publish New Listing'; }
                else inventory.push(item);
                saveInventory(); renderInventory(); inventoryForm.reset(); alert('Inventory saved successfully.');
            });
            renderInventory();
        }
    }
});
