document.querySelectorAll(".class-button").forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".class-card");
    const detailsUrl = new URL("ClassPage.html", window.location.href);

    detailsUrl.searchParams.set(
      "title",
      card.querySelector(".class-title").textContent.trim()
    );
    detailsUrl.searchParams.set(
      "category",
      card.querySelector(".class-category").textContent.trim()
    );
    detailsUrl.searchParams.set(
      "time",
      card.querySelector(".class-time").textContent.trim()
    );
    detailsUrl.searchParams.set(
      "studio",
      card.querySelector(".class-studio").textContent.trim()
    );


    window.location.href = detailsUrl.href;
  });
});


const detailFields = ["title", "category", "time", "studio"];
const detailParams = new URLSearchParams(window.location.search);


detailFields.forEach((field) => {
  const value = detailParams.get(field);
  const element = document.querySelector(`[data-detail-field="${field}"]`);


  if (value !== null && element) {
    element.textContent = value;
  }
});

