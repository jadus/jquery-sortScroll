;
(function ($, window, document, undefined) {

    "use strict";
    var defaults = {
        animationDuration: 1000,
        easing: "swing"
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
            self.container.on("click", "." + self.buttonUpClass + ", ." + self.buttonDownClass, function (event) {
                var button = $(this),
                    elementCollection = self.container.find("." + self.elementClass),
                    initialOrder = elementCollection.index(button.closest("." + self.elementClass)),
                    orderModify = 1;
                if (button.hasClass(self.buttonUpClass)) {
                    orderModify = -1;
                }
                event.preventDefault();
                self.sortElement(initialOrder, orderModify);
            })
        },
        sortElement: function (initialOrder, orderModify) {
            var self = this,
                elementCollection = self.container.find('.' + self.elementClass),
                maxOrder = elementCollection.length - 1,
                destinationOrder = initialOrder + orderModify;

            if (destinationOrder < 0 || destinationOrder > maxOrder) {
                return false;
            }

            var element = elementCollection.eq(initialOrder);

            if (self._sorting) {
                self.container.one("sortScroll.sortEnd", function (event, element, initialOrder, destinationOrder) {
                    self.sortElement(destinationOrder, orderModify);
                });
                return false;
            }

            self.container.trigger("sortScroll.sortStart", [element, initialOrder, destinationOrder]);
            self._sorting = true;

            var marginTop = parseInt(element.css('margin-top'), 10),
                height = element.outerHeight(true),
                overflow = element.css('overflow'),
                destinationElement,
                removeDestination = false;

            if (destinationOrder === maxOrder) {
                destinationElement = $("<div/>").addClass(self.elementClass);
                elementCollection.last().after(destinationElement);
                removeDestination = true;
            }
            else {
                var destinationElementOrder = destinationOrder;
                if (destinationElementOrder > initialOrder) {
                    destinationElementOrder = destinationElementOrder + 1;
                }
                destinationElement = elementCollection.eq(destinationElementOrder);
            }

            var finalY = destinationElement.offset().top,
                maxScroll = Math.max(0, document.documentElement.scrollHeight - document.documentElement.clientHeight),
                initialScroll = $(window).scrollTop(),
                initialY = element.offset().top;

            if (removeDestination) {
                destinationElement.hide();
            }

            if (finalY > initialY) {
                finalY -= element.outerHeight(true);
            }

            var relativeY = finalY - initialY,
                finalScroll = initialScroll + relativeY,
                move = 0;

            if (finalScroll > maxScroll) {
                move = finalScroll - maxScroll;
                finalScroll = maxScroll;
            }

            if (finalScroll < 0) {
                move = finalScroll;
                finalScroll = 0;
            }

            var initialGhost = $('<div/>').css({
                    height: height,
                    visibility: "hidden"
                }).insertAfter(element),
                finalGhost = $('<div/>').css({
                    height: 0
                }).insertBefore(destinationElement),
                fixedY = initialY - initialScroll - marginTop,
                duration = self.settings.animationDuration,
                easing = self.settings.easing;

            element.css({
                top: fixedY + "px"
            });
            element.addClass(self.sortingClass);

            initialGhost.animate({
                height: 0
            }, duration, easing);
            finalGhost.animate({
                height: height + "px"
            }, duration, easing);
            $("html, body").animate({scrollTop: finalScroll + "px"}, duration, easing);
            if (move != 0) {
                element.animate({top: fixedY + move}, duration, easing)
            }

            elementCollection.add($("html, body")).promise().done(function () {
                initialGhost.remove();
                finalGhost.remove();
                element.removeClass(self.sortingClass);
                element.css({
                    top: 0
                });
                destinationElement.before(element);
                if (removeDestination) {
                    destinationElement.remove();
                }
                self._sorting = false;
                self.container.trigger("sortScroll.sortEnd", [element, initialOrder, destinationOrder]);
            });

        }
    });

    $.fn.sortScroll = function (opt) {
        var args = Array.prototype.slice.call(arguments, 1);
        return this.each(function () {
            var item = $(this), instance = item.data('sortScroll');
            if (!instance) {
                item.data('sortScroll', new SortScroll(this, opt));
            } else {
                if (typeof opt === 'string') {
                    instance[opt].apply(instance, args);
                }
            }
        });
    }

})(jQuery, window, document);

$(".sort-scroll-container").each(function () {
    $(this).sortScroll();
});