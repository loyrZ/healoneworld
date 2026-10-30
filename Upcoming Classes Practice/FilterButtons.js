(() => {
	const cards = [...document.querySelectorAll(
		'[data-class-card], .class-card, .class-item'
	)];
	const classList = document.querySelector('#class-list');
	const emptyMessage = document.createElement('p');
	emptyMessage.className = 'no-classes-message';
	emptyMessage.setAttribute('role', 'status');
	emptyMessage.textContent = 'No classes match your filters';
	emptyMessage.hidden = true;
	classList?.appendChild(emptyMessage);

	const buttons = [...document.querySelectorAll('[data-filter], .filter-button, .filter-btn, .format-button, .category-button, .week-button')];
	const search = document.querySelector('input[type="search"], input[placeholder*="search" i], input[aria-label*="search" i]');
	let activeModality = 'all';
	let isWeekActive = false;
	let searchTerm = '';
	const normalize = value => String(value || '').trim().toLowerCase();

	function isInCurrentWeek(value) {
		// Treat date-only values as local dates so timezone offsets cannot shift the week.
		const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
			? new Date(`${value}T00:00:00`)
			: new Date(value);
		if (!value || Number.isNaN(date.getTime())) return false;
		const start = new Date();
		start.setHours(0, 0, 0, 0);
		start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
		const end = new Date(start);
		end.setDate(end.getDate() + 7);
		return date >= start && date < end;
	}

	function update() {
		let visibleCount = 0;
		cards.forEach(card => {
			const modality = normalize(card.dataset.modality || card.dataset.format || card.dataset.type || card.querySelector('.class-category')?.textContent);
			// Search the rendered card content so custom elements like .class-title are searchable too.
			const searchableText = normalize(card.textContent);
			const date = card.dataset.date || card.dataset.startDate ||
				card.querySelector('time[datetime]')?.dateTime;

			const matchesModality = activeModality === 'all' ||
				(activeModality === 'in person' && /in[ -]?person/.test(modality)) ||
				(activeModality === 'hybrid' && modality.includes('hybrid')) ||
				(activeModality === 'online' && modality.includes('online'));
			const matchesWeek = !isWeekActive || isInCurrentWeek(date);
			const matchesSearch = !searchTerm || searchableText.includes(searchTerm);
			card.hidden = !(matchesModality && matchesWeek && matchesSearch);
			if (!card.hidden) visibleCount++;
		});
		buttons.forEach(button => {
			const label = normalize(button.dataset.filter || button.textContent);
			const filter = /^in[ -]?person$/.test(label) ? 'in person' :
				['hybrid', 'online'].includes(label) ? label :
				/^this week$/.test(label) ? 'this week' :
				/^all(?: classes| formats)?$/.test(label) ? 'all' : null;
			if (!filter) return;
			const isPressed = filter === 'this week'
				? isWeekActive
				: filter === 'all'
					? activeModality === 'all'
					: activeModality === filter;
			button.setAttribute('aria-pressed', String(isPressed));
		});
		// Show the status message only when the current controls leave no visible classes.
		emptyMessage.hidden = visibleCount > 0;
	}

	buttons.forEach(button => {
		const label = normalize(button.dataset.filter || button.textContent);
		const filter = /^in[ -]?person$/.test(label) ? 'in person' :
			['hybrid', 'online'].includes(label) ? label :
			/^this week$/.test(label) ? 'this week' :
			/^all(?: classes| formats)?$/.test(label) ? 'all' : null;
		if (!filter) return;
		button.addEventListener('click', () => {
			if (filter === 'this week') {
				isWeekActive = !isWeekActive;
			} else if (filter === 'all') {
				activeModality = 'all';
			} else {
				activeModality = activeModality === filter ? 'all' : filter;
			}
			update();
		});
	});

	search?.addEventListener('input', () => {
		searchTerm = normalize(search.value);
		update();
	});

	update();
})();
