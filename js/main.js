function initialize(){
    var $splashCloseButton = $('#splash-close-btn');
    var $splash = $('#splash');
    var $headerDropdownMenu = $('#header-dropdown-menu');
    var $headerDropdownButton = $('#header-button');
    var $aboutMenuItem = $('#about-menu-item');
    var $dataMenuItem = $('#data-menu-item');
    var $dataSplash = $('.data-page-splash');
    var $dataCloseButton = $('#data-close-btn');
    
/*    var $firesCheckbox = $('#fires_toggle');
    
        $acc.click(function () {
        if (this.checked) {
            d3.selectAll(".fire-polygons").attr("opacity", 1);
            console.log("fires should be visible");
            } else {
        d3.selectAll(".fire-polygons").attr("opacity", 0);
        console.log("fires should be invisible");
            }
        });*/

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
        
        $dataSplash.fadeIn('slow');
    });

    $headerDropdownButton.click(function () {
        $headerDropdownMenu.slideToggle();
    });


    var accHead = document.getElementsByClassName("accordionTopHeader");
    var i;

    for (i = 0; i < accHead.length; i++) {
        accHead[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var panel = this.nextElementSibling;
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
                
                
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px";
                
                
            }
        });
}

    var acc1 = document.getElementsByClassName("accordionSection1");
    var i;

    for (i = 0; i < acc1.length; i++) {
        acc1[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var panel = this.nextElementSibling;
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
                d3.selectAll(".selectStates").attr("opacity", 0);
                
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px";
                d3.selectAll(".selectStates").attr("opacity", 1);
                
            }
        });
}


    var acc2 = document.getElementsByClassName("accordionSection2");
    var j;

    for (j = 0; j < acc2.length; j++) {
        acc2[j].addEventListener("click", function() {
            this.classList.toggle("active");
            var panel = this.nextElementSibling;
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
                d3.selectAll(".firePolygons").attr("opacity", 0);
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px";
                d3.selectAll(".firePolygons").attr("opacity", 1);
            }
        });
}};

$(document).ready(initialize);
