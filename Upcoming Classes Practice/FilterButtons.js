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

	const buttons = [...document.querySelectorAll(
		'[data-filter], .filter-button, .filter-btn, .format-button, .category-button, .week-button'
	)];
	const search = document.querySelector(
		'input[type="search"], input[placeholder*="search" i], input[aria-label*="search" i]'
	);

	let activeFilter = 'all';
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
			const modality = normalize(
				card.dataset.modality || card.dataset.format || card.dataset.type ||
				card.querySelector('.class-category')?.textContent
			);
			// Search the rendered card content so custom elements like .class-title are searchable too.
			const searchableText = normalize(card.textContent);
			const date = card.dataset.date || card.dataset.startDate ||
				card.querySelector('time[datetime]')?.dateTime;

			// Date-only filters should not also require the card to match a modality.
			const matchesModality = !['in person', 'hybrid', 'online'].includes(activeFilter) ||
				(activeFilter === 'in person' && /in[ -]?person/.test(modality)) ||
				(activeFilter === 'hybrid' && modality.includes('hybrid')) ||
				(activeFilter === 'online' && modality.includes('online'));
			const matchesWeek = activeFilter !== 'this week' || isInCurrentWeek(date);
			const matchesSearch = !searchTerm || searchableText.includes(searchTerm);
			card.hidden = !(matchesModality && matchesWeek && matchesSearch);
			if (!card.hidden) visibleCount++;
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
			activeFilter = filter;
			update();
		});
	});

	search?.addEventListener('input', () => {
		searchTerm = normalize(search.value);
		update();
	});

	update();
})();
