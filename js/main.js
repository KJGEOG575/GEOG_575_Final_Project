function initialize(){
    var $splashCloseButton = $('#splash-close-btn');
    var $splash = $('#splash');
    var $headerDropdownMenu = $('#header-dropdown-menu');
    var $headerDropdownButton = $('#header-button');
    var $aboutMenuItem = $('#about-menu-item');
    var $dataMenuItem = $('#data-menu-item');
    var $dataSplash = $('.data-page-splash');
    var $dataCloseButton = $('#data-close-btn');
    
    var $firesCheckbox = $('#fires_toggle');
    
        $firesCheckbox.click(function () {
        if (this.checked) {
            d3.selectAll(".fire-polygons").attr("opacity", 1);
            console.log("fires should be visible");
            } else {
        d3.selectAll(".fire-polygons").attr("opacity", 0);
        console.log("fires should be invisible");
            }
        });

    $splashCloseButton.click(function () {
        $splash.fadeOut('slow');
    });

    $dataCloseButton.click(function () {
        $dataSplash.fadeOut('slow');
    });

    $aboutMenuItem.click(function() {
        $splash.fadeIn('slow');
    });

    $dataMenuItem.click(function() {
        $()
        $dataSplash.fadeIn('slow');
    });

    $headerDropdownButton.click(function () {
        $headerDropdownMenu.slideToggle();
    });

    var acc = document.getElementsByClassName("accordion");
    var i;

    for (i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var panel = this.nextElementSibling;
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px";
            }
        });
}};

$(document).ready(initialize);
