let lastScrollY = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > lastScrollY && currentScrollY > window.innerHeight / 2) {
        // Cuộn xuống và vượt quá 1 màn hình, ẩn header
        header.classList.add('hidden');
    } else {
        // Cuộn lên, hiện header
        header.classList.remove('hidden');
    }

    lastScrollY = currentScrollY;
});

//Show alert
const showAlert = document.querySelector('[show-alert]');
if (showAlert) {
    const timeOut = parseInt(showAlert.getAttribute('data-time'), 10) || 5000;
    const closeAlert = showAlert.querySelector('.close-alert');

    setTimeout(() => {
        showAlert.classList.add('alert-hidden');
    }, timeOut);

    if (closeAlert) {
        closeAlert.addEventListener('click', () => {
            showAlert.classList.add('alert-hidden');
        });
    }
}