/*
 * jQuery sortScroll V1.2.0
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
        cssEasing: "ease-in-out",// easing type for the animation
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
                event.preventDefault();
                var button = $(this),
                    elementCollection = self.container.find("." + self.elementClass),
                    initialOrder = elementCollection.index(button.closest("." + self.elementClass)),
                    sortDirection;

                sortDirection = button.hasClass(self.buttonUpClass) ? -1 : 1;
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


            //don't move if element is at one end of the list
            if (destinationOrder < 0 || destinationOrder > maxOrder) {
                return false;
            }

            //if method is called again before animation end, we wait and we call it again on animation end
            if (self._sorting) {
                self.container.one("sortScroll.sortEnd", function (event, element, initialOrder, destinationOrder) {
                    self.sortElement(destinationOrder, sortDirection, keepStill);
                });
                return false;
            }

            elementCollection.each(function(){
                $(this).css("top", 0);
            });

            var element = elementCollection.eq(initialOrder),
                elementHeight = element.outerHeight(true),
                initialElementY = element.offset().top,
                otherElement = elementCollection.eq(destinationOrder),
                otherElementHeight = otherElement.outerHeight(true),
                initialOtherElementY = otherElement.offset().top,
                finalElementY = otherElement.offset().top,
                finalOtherElementY = initialOtherElementY + elementHeight,
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
                duration = self.settings.animationDuration,
                cssEasing = self.settings.cssEasing,
                body = $("body"),
                initialElementStyleAttr = element.attr("style") || '',
                initialOtherElementStyleAttr = otherElement.attr("style") || '',
                initialBodyStyleAttr = body.attr("style") || '',
                initialCssZIndex = element.css("z-index"),
                elementDfd = $.Deferred(),
                otherElementDfd = $.Deferred(),
                bodyDfd = $.Deferred(),
                transitionEndEvent = "transitionend webkitTransitionEnd msTransitionEnd oTransitionEnd",
                sortingZIndex;


            sortingZIndex = (initialCssZIndex === "auto") ? 2 : initialCssZIndex + 1;

            //animating
            self.container.trigger("sortScroll.sortStart", [element, initialOrder, destinationOrder]);
            self._sorting = true;
            element.add(otherElement).css({
                "position" : "relative",
                "transition" : duration+"ms "+cssEasing
            })
            element.addClass(self.sortingClass).css({
                "z-index": sortingZIndex,
                "top": relativeElementY+"px",
            });
            otherElement.css({
                "top": relativeOtherElementY+"px",
            });
            if(keepStill) {
                var initialScroll = $(window).scrollTop(),
                    finalScroll = initialScroll + relativeElementY,
                    maxScroll = Math.max(0, document.documentElement.scrollHeight - document.documentElement.clientHeight);

                finalScroll = Math.min(finalScroll, maxScroll);
                finalScroll = Math.max(finalScroll, 0);

                body.css({
                    "transition" : duration+"ms "+cssEasing,
                    "margin-top": ( initialScroll - finalScroll ) + "px"
                });
            }

            //after animation
            element.on(transitionEndEvent, function () {
                elementDfd.resolve();
            })
            otherElement.on(transitionEndEvent, function () {
                otherElementDfd.resolve();
            })
            body.on(transitionEndEvent, function () {
                bodyDfd.resolve();
            })
            $.when(elementDfd, otherElementDfd, bodyDfd).done(function () {
                //back to initial style
                element.attr("style",initialElementStyleAttr);
                otherElement.attr("style",initialOtherElementStyleAttr);
                body.attr("style",initialBodyStyleAttr);
                if(keepStill) {
                    $("html, body").scrollTop(finalScroll + ($(window).scrollTop() - initialScroll));
                }
                element.removeClass(self.sortingClass);

                //modifiyng dom
                if(sortDirection > 0){
                    otherElement.after(element);
                }else{
                    otherElement.before(element);
                }

                self._sorting = false;
                self.container.trigger("sortScroll.sortEnd", [element, initialOrder, destinationOrder]);
                return;
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
