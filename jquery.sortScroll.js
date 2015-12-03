/*
 * jQuery sortScroll V1.1.4
 * Sorting without moving !
 * The element being sorted will stay still while the rest of the page will scroll behind it.
 * https://github.com/jadus/jquery-sortScroll
 * lucas.menant@gmail.com
 * Licensed under the MIT license
 */
;
(function ($, window, document, undefined) {

    "use strict";
    var defaults = {
        animationDuration: 1000,// duration of the animation in ms
        easing: "swing",// easing type for the animation
        keepStill: true// if false the page doesn't scroll to follow the element
    };

    function SortScroll(container, options) {

        this.container = $(container);
        this.settings = $.extend({}, defaults, options, this.container.data());
        this._sorting = false;
        this.elementClass = "sort-scroll-element";
        this.sortingClass = "sort-scroll-sorting";
        this.buttonUpClass = "sort-scroll-button-up";
        this.buttonDownClass = "sort-scroll-button-down";
        this.init();
    }

    $.extend(SortScroll.prototype, {
        init: function () {
            var self = this;
            //auto initialization
            self.container.on("click", "." + self.buttonUpClass + ", ." + self.buttonDownClass, function (event) {
                var button = $(this),
                    elementCollection = self.container.find("." + self.elementClass),
                    initialOrder = elementCollection.index(button.closest("." + self.elementClass)),
                    sortDirection;

                sortDirection = button.hasClass(self.buttonUpClass) ? -1 : 1;
                event.preventDefault();
                self.sortElement(initialOrder, sortDirection, self.settings.keepStill);
            })
        },
        sortElement: function (initialOrder, sortDirection, keepStill) {
            sortDirection = sortDirection === -1 ? sortDirection : 1;
            keepStill = !keepStill ? false : this.settings.keepStill;

            var self = this,
                elementCollection = self.container.find("." + self.elementClass),
                maxOrder = elementCollection.length - 1,
                destinationOrder = initialOrder + sortDirection;


            if (destinationOrder < 0 || destinationOrder > maxOrder) {
                return false;
            }

            var element = elementCollection.eq(initialOrder);

            //if method is called again before animation end, we wait and we call it again on animation end
            if (self._sorting) {
                self.container.one("sortScroll.sortEnd", function (event, element, initialOrder, destinationOrder) {
                    self.sortElement(destinationOrder, sortDirection, keepStill);
                });
                return false;
            }

            self.container.trigger("sortScroll.sortStart", [element, initialOrder, destinationOrder]);
            self._sorting = true;

            var elementHeight = element.outerHeight(true),
                initialElementY = element.offset().top,
                otherElement = elementCollection.eq(destinationOrder),
                otherElementHeight = otherElement.outerHeight(true),
                initialOtherElementY = otherElement.offset().top,
                finalElementY = otherElement.offset().top,
                finalOtherElementY = initialOtherElementY + elementHeight,
                maxScroll = Math.max(0, document.documentElement.scrollHeight - document.documentElement.clientHeight),
                initialScroll = $(window).scrollTop(),
                modifyElementRelative = 0,
                modifyOtherElementRelative = parseInt(otherElement.css("margin-top"),10);

            if (sortDirection > 0) {
                finalElementY = initialElementY + otherElementHeight;
                finalOtherElementY = initialElementY;
                modifyElementRelative = parseInt(element.css("margin-top"),10);
                modifyOtherElementRelative = 0;
            }

            var relativeElementY = finalElementY - initialElementY - modifyElementRelative,
                relativeOtherElementY = finalOtherElementY - initialOtherElementY - modifyOtherElementRelative,
                finalScroll = initialScroll + relativeElementY;

            finalScroll = Math.min(finalScroll, maxScroll);
            finalScroll = Math.max(finalScroll, 0);

            var duration = self.settings.animationDuration,
                easing = self.settings.easing,
                initialCssPosition = element.css("position"),
                initialCssZIndex = element.css("z-index"),
                sortingZIndex;

            sortingZIndex = (initialCssZIndex === "auto") ? 2 : initialCssZIndex + 1;

            //modifying elements to animate them
            element.addClass(self.sortingClass);
            element.css({
                "position": "relative",
                "z-index": sortingZIndex
            });
            otherElement.css({
                "position": "relative",
            });

            //animating
            element.animate({
                top: relativeElementY+"px"
            }, duration, easing);
            otherElement.animate({
                top: relativeOtherElementY+"px"
            }, duration, easing);
            if(keepStill){
                $("html, body").animate({scrollTop: finalScroll + "px"}, duration, easing);
            }

            //after animation
            elementCollection.add($("html, body")).promise().done(function () {
                //elements back to normal
                element.removeClass(self.sortingClass);
                element.css({
                    "position": initialCssPosition,
                    "z-index": initialCssZIndex
                });
                otherElement.css({
                    "position": initialCssPosition,
                });

                //modifiyng dom
                if(sortDirection > 0){
                    otherElement.after(element);
                }else{
                    otherElement.before(element);
                }

                element.css("top", 0);
                otherElement.css("top", 0);

                self._sorting = false;
                self.container.trigger("sortScroll.sortEnd", [element, initialOrder, destinationOrder]);
            });

        }
    });

    $.fn.sortScroll = function (opt) {
        var args = Array.prototype.slice.call(arguments, 1);
        return this.each(function () {
            var item = $(this), instance = item.data("sortScroll");
            if (!instance) {
                item.data("sortScroll", new SortScroll(this, opt));
            } else {
                if (typeof opt === "string") {
                    instance[opt].apply(instance, args);
                }
            }
        });
    };

    $(".sort-scroll-container").each(function () {
        $(this).sortScroll();
    });
})(jQuery, window, document);

