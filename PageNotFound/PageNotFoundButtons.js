document.addEventListener("click", (event) => {
	const button = event.target.closest("button");
	if (button?.matches(".find-button")) {
		window.location.href = "file:///C:/git/healoneworld/Upcoming%20Classes%20Practice/Header%20&%20Section.html";
	} else if (button?.matches(".homepage")) {
		window.location.href = "file:///C:/git/healoneworld/public/home.html#main-content";
	}
});
