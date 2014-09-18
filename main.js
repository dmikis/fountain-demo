require(['particles'], function (particles) {

    function loop(time) {
        particles.update(time);

        particles.render();

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
});
