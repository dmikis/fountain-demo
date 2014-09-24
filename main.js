require(['particles'], function (particles) {
    var running = true;

    function loop(time) {
        particles.update(time);

        particles.render();

        running && requestAnimationFrame(loop);
    }

    document.querySelector('button').onclick = function () {
        running = !running;
        if (running) {
            requestAnimationFrame(loop);
        }
    };

    requestAnimationFrame(loop);
});
